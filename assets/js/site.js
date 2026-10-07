(() => {
  'use strict';

  const normalize = (value) => (value || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Búsqueda instantánea; el texto se lee como texto y nunca se inserta como HTML.
  const searchInput = document.querySelector('#post-search');
  if (searchInput) {
    const cards = [...document.querySelectorAll('#post-cards .card')];
    const status = document.querySelector('#search-status');
    const empty = document.querySelector('#no-search-results');
    const clear = document.querySelector('#clear-search');
    const filter = () => {
      const query = normalize(searchInput.value);
      let visible = 0;
      cards.forEach((card) => {
        const matches = !query || normalize(card.dataset.search).includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      if (status) status.textContent = query ? `${visible} publicación${visible === 1 ? '' : 'es'} encontrada${visible === 1 ? '' : 's'}.` : '';
      if (empty) empty.hidden = visible > 0;
      if (clear) clear.hidden = !searchInput.value;
    };
    searchInput.addEventListener('input', filter);
    if (clear) clear.addEventListener('click', () => { searchInput.value = ''; filter(); searchInput.focus(); });
  }

  // Construye solo enlaces de publicación del mismo origen. El contenido no elige protocolo/dominio.
  const safeShareUrl = (button) => {
    try {
      const url = new URL(button.dataset.url || window.location.pathname, window.location.origin);
      if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  };

  // Compartir: API nativa primero; de lo contrario, enlaces conocidos con rel=noopener.
  const shareDialog = document.querySelector('#share-dialog');
  let activeShare = null;
  const closeShare = () => { if (shareDialog) shareDialog.hidden = true; activeShare = null; };
  document.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const url = safeShareUrl(button);
      if (!url) return;
      const title = button.dataset.title || document.title;
      if (navigator.share) {
        try { await navigator.share({ title, text: title, url }); return; }
        catch (error) { if (error && error.name === 'AbortError') return; }
      }
      if (!shareDialog) return;
      activeShare = { url, title };
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(title);
      shareDialog.querySelector('[data-share-x]').href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
      shareDialog.querySelector('[data-share-whatsapp]').href = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      shareDialog.querySelector('[data-share-linkedin]').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      shareDialog.querySelector('.share-feedback').textContent = '';
      shareDialog.hidden = false;
      shareDialog.querySelector('.share-close').focus();
    });
  });
  if (shareDialog) {
    shareDialog.querySelector('.share-close').addEventListener('click', closeShare);
    shareDialog.addEventListener('click', (event) => { if (event.target === shareDialog) closeShare(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !shareDialog.hidden) closeShare(); });
    shareDialog.querySelector('[data-copy-link]').addEventListener('click', async () => {
      if (!activeShare) return;
      const feedback = shareDialog.querySelector('.share-feedback');
      try {
        await navigator.clipboard.writeText(activeShare.url);
        feedback.textContent = 'Enlace copiado.';
      } catch (_) {
        feedback.textContent = 'No se pudo copiar automáticamente. Copia el enlace desde la barra del navegador.';
      }
    });
  }

  // Imprimir solo se usa para producir el PDF localmente; no se envía el artículo a un tercero.
  const pdfButton = document.querySelector('[data-download-pdf]');
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      const originalTitle = document.title;
      const articleTitle = document.querySelector('#article-content h1')?.textContent?.trim() || originalTitle;
      const safeName = articleTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'writeup';
      document.title = `${safeName}-anonimo501`;
      const restoreTitle = () => { document.title = originalTitle; window.removeEventListener('afterprint', restoreTitle); };
      window.addEventListener('afterprint', restoreTitle);
      window.print();
      window.setTimeout(restoreTitle, 30000);
    });
  }

  // Configuración expuesta: solo una publishable/anon key y el hostname de Supabase son válidos.
  const config = window.POCVAULT_CONFIG || {};
  const isPublicKey = (key) => {
    if (typeof key !== 'string' || !key || key.startsWith('sb_secret_')) return false;
    if (key.startsWith('sb_publishable_')) return true;
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'anon';
    } catch (_) {
      return false;
    }
  };
  const validProjectUrl = (() => {
    try {
      const url = new URL(config.supabaseUrl);
      return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) && url.pathname === '/' && !url.search && !url.hash;
    } catch (_) { return false; }
  })();
  const sdkReady = Boolean(window.supabase && typeof window.supabase.createClient === 'function');
  const configured = validProjectUrl && isPublicKey(config.supabaseAnonKey) && sdkReady;
  const likeButtons = [...document.querySelectorAll('[data-like]')];
  const setStatus = (button, text) => {
    const card = button.closest('.card');
    const status = (card || document).querySelector('[data-like-status]');
    if (status) status.textContent = text;
    button.title = text;
  };

  if (!likeButtons.length) return;
  if (!configured) {
    likeButtons.forEach((button) => {
      button.disabled = true;
      setStatus(button, 'Likes no activados o configuración pública inválida.');
    });
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  const turnstileGate = document.querySelector('#turnstile-gate');
  const sitekey = typeof config.cloudflareTurnstileSiteKey === 'string' ? config.cloudflareTurnstileSiteKey.trim() : '';
  let turnstileScriptPromise = null;
  let turnstileWidgetId = null;
  let pendingCaptcha = null;
  let captchaCancelHandler = null;

  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve();
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => window.turnstile ? resolve() : reject(new Error('CAPTCHA no disponible'));
      script.onerror = () => reject(new Error('No se pudo cargar el CAPTCHA'));
      document.head.appendChild(script);
    });
    return turnstileScriptPromise;
  };

  const settleCaptcha = (kind, value) => {
    if (!pendingCaptcha) return;
    const pending = pendingCaptcha;
    pendingCaptcha = null;
    if (captchaCancelHandler && turnstileGate) {
      turnstileGate.querySelector('.turnstile-cancel').removeEventListener('click', captchaCancelHandler);
      captchaCancelHandler = null;
    }
    if (turnstileGate) turnstileGate.hidden = true;
    if (turnstileWidgetId !== null && window.turnstile) window.turnstile.reset(turnstileWidgetId);
    if (kind === 'resolve') pending.resolve(value);
    else pending.reject(value);
  };

  const requestCaptchaToken = async () => {
    if (!sitekey) return '';
    if (!turnstileGate || !document.querySelector('#turnstile-widget')) throw new Error('Falta el contenedor de verificación.');
    await loadTurnstile();
    const container = document.querySelector('#turnstile-widget');
    const feedback = turnstileGate.querySelector('.turnstile-status');
    if (feedback) feedback.textContent = '';
    turnstileGate.hidden = false;
    return new Promise((resolve, reject) => {
      pendingCaptcha = { resolve, reject };
      const cancelButton = turnstileGate.querySelector('.turnstile-cancel');
      captchaCancelHandler = () => settleCaptcha('reject', new Error('Verificación cancelada.'));
      cancelButton.addEventListener('click', captchaCancelHandler, { once: true });
      try {
        if (turnstileWidgetId === null) {
          turnstileWidgetId = window.turnstile.render(container, {
            sitekey,
            callback: (token) => settleCaptcha('resolve', token),
            'error-callback': () => settleCaptcha('reject', new Error('No se completó la verificación.')),
            'expired-callback': () => settleCaptcha('reject', new Error('La verificación expiró; intenta de nuevo.'))
          });
        } else {
          window.turnstile.reset(turnstileWidgetId);
        }
      } catch (_) {
        settleCaptcha('reject', new Error('No se pudo mostrar la verificación.'));
      }
    });
  };

  const updateCount = async (button, slug) => {
    const { data, error } = await client.rpc('get_post_likes', { p_slug: slug });
    if (error) throw error;
    const count = Number(data);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Respuesta de conteo inválida.');
    const node = button.querySelector('[data-like-count]');
    if (node) node.textContent = String(count);
  };

  // El path debe pertenecer a un slug simple de writeup; la lista real también se valida en SQL.
  const validSlug = (slug) => typeof slug === 'string' && slug.length <= 180 && /^\/writeups\/[a-z0-9][a-z0-9/_-]*\/$/.test(slug) && !slug.includes('//') && !slug.includes('..');
  const ensureAnonymousSession = async () => {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data?.session) return;
    const captchaToken = await requestCaptchaToken();
    const options = captchaToken ? { options: { captchaToken } } : undefined;
    const result = await client.auth.signInAnonymously(options);
    if (result.error) throw result.error;
  };

  // Solo el conteo agregado es público; la escritura exige sesión autenticada y slug en allowlist.
  likeButtons.forEach((button) => {
    const slug = button.dataset.slug || '';
    if (!validSlug(slug)) {
      button.disabled = true;
      setStatus(button, 'Esta ruta no cumple el formato permitido.');
      return;
    }
    updateCount(button, slug).catch(() => setStatus(button, 'No se pudo consultar el contador de likes.'));
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      setStatus(button, 'Verificando y guardando…');
      try {
        await ensureAnonymousSession();
        const likedResult = await client.rpc('has_liked_post', { p_slug: slug });
        if (likedResult.error) throw likedResult.error;
        if (likedResult.data === true) {
          button.classList.add('is-liked');
          button.setAttribute('aria-pressed', 'true');
          setStatus(button, 'Ya diste Me gusta a este writeup.');
          return;
        }
        const result = await client.rpc('like_post', { p_slug: slug });
        if (result.error) throw result.error;
        const row = Array.isArray(result.data) ? result.data[0] : result.data;
        const count = Number(row?.like_count);
        if (!Number.isSafeInteger(count) || count < 0) throw new Error('Respuesta inválida.');
        const countNode = button.querySelector('[data-like-count]');
        if (countNode) countNode.textContent = String(count);
        button.classList.add('is-liked');
        button.setAttribute('aria-pressed', 'true');
        setStatus(button, '¡Gracias por tu Me gusta!');
      } catch (_) {
        button.disabled = false;
        setStatus(button, 'No se pudo guardar. Revisa tu conexión o inténtalo de nuevo.');
      }
    });
  });
})();
