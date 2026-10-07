# Montaje de PocVault reforzado

## Qué protege esta versión

La web sigue siendo estática y pública. Esta actualización reduce riesgos de la capa web y de likes, pero **no puede impedir que alguien copie el sitio, haga solicitudes automatizadas, abuse de una cuenta con permisos de escritura o ataque la disponibilidad**. Para eso se deben proteger también las cuentas de GitHub y Supabase.

- CSP estricta compatible con GitHub Pages, con scripts locales y dominios externos limitados.
- Metadatos de Jekyll escapados al insertarse en atributos y textos del listado/plantillas.
- SDK de Supabase empaquetado localmente en versión fija y con su licencia, no desde un CDN flotante.
- Las funciones SQL no aceptan likes para rutas arbitrarias: solo posts registrados en `allowed_writeups`.
- Un voto por usuario anónimo de Supabase y por publicación mediante clave primaria, incluso en solicitudes simultáneas.
- Las tablas tienen RLS activado y no conceden lecturas ni escrituras directas a los roles del navegador; las funciones RPC limitadas son la única vía.
- Si se configura Turnstile en Cloudflare y Supabase, el navegador presenta el CAPTCHA al crear una sesión anónima.

Un usuario que pueda escribir/combinar cambios en el repositorio puede cambiar la web; por eso la protección de cuenta y revisión de cambios también es esencial.

## A. Instalar el ZIP sin perder artículos existentes

1. Descarga y guarda una copia de respaldo del ZIP/repositorio actual antes de reemplazar archivos.
2. Descomprime la versión reforzada.
3. Si vas a copiarla sobre una carpeta de trabajo que ya tiene writeups, **combina/sobrescribe los archivos base**, pero conserva las carpetas personales dentro de `writeups/` y sus imágenes. No borres tus artículos.
4. Comprueba que `baseurl: "/PocVault"` siga igual porque el repositorio se llama `PocVault`.
5. Sube los cambios a la rama que publica GitHub Pages. En **Settings → Pages**, verifica que el origen siga siendo la rama principal y la raíz del repositorio.
6. Tras el despliegue, abre el sitio en una ventana privada y prueba: búsqueda, publicación, imágenes, compartir y la opción de guardar PDF.

Los likes indicarán que no están configurados hasta completar la sección B. No es un error: no se ha puesto ninguna clave de tu cuenta en el ZIP.

## B. Configurar Supabase y los likes

### Crear y proteger el proyecto

1. Crea un proyecto propio en [Supabase](https://supabase.com/).
2. En **Authentication → Sign In / Providers** (el menú puede cambiar), habilita **Anonymous Sign-Ins**.
3. En **Project Settings → API**, copia la URL del proyecto y la **publishable key** (o `anon` heredada). Se espera `https://<project-ref>.supabase.co`.
4. Abre **SQL Editor → New query** y ejecuta completo el archivo `supabase-likes.sql`.
5. El SQL registra inicialmente estas publicaciones:
   - `/writeups/cve-2026-63030/`
   - `/writeups/cve-2026-xxxx/`

### Conectar el navegador con clave pública

Edita `assets/js/site-config.js` con los valores públicos de tu propio proyecto:

```js
window.POCVAULT_CONFIG = Object.freeze({
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_PUBLISHABLE_KEY_O_ANON_PUBLICA",
  cloudflareTurnstileSiteKey: ""
});
```

La clave `publishable`/`anon` está diseñada para usarse en el navegador. **Nunca copies `service_role`, `sb_secret`, una contraseña ni un token privado a `site-config.js`, HTML, JavaScript, Markdown o al repositorio.** La comprobación del frontend rechaza `sb_secret` y los JWT legacy que no indiquen rol `anon`; no es una excusa para publicar secretos.

### Agregar una publicación nueva a la lista segura

Después de crear `writeups/slug-nuevo/index.md`, ejecuta en Supabase SQL Editor:

```sql
insert into public.allowed_writeups (slug)
values ('/writeups/slug-nuevo/');
```

Usa el valor de `page.url` (ruta del sitio **sin** `/PocVault` al principio), en minúsculas, con guiones y barra final. La nueva ruta aparecerá en la portada, pero el endpoint de likes no la aceptará hasta que se añada a la allowlist.

Si ejecutaste el SQL de la versión previa, vuelve a ejecutar este archivo actualizado. Añade la FK como `NOT VALID` para preservar datos antiguos y hacer que las nuevas filas sí deban pertenecer a la allowlist. Las filas históricas fuera de la lista no se cuentan por las funciones actuales.

## C. Activar defensa anti-bots con Turnstile (recomendado)

El CAPTCHA reduce altas automatizadas de usuarios anónimos. Supabase recomienda proteger los inicios de sesión anónimos con CAPTCHA; activa esta función cuando ya tengas emparejadas las tres configuraciones:

1. En [Cloudflare Turnstile](https://dash.cloudflare.com/), crea un widget y añade como dominio permitido `anonimo501.github.io` (o tu dominio real).
2. Copia la **Site Key** pública y la **Secret Key** privada.
3. En Supabase, ve a **Authentication → Bot and Abuse Protection / CAPTCHA**, activa la protección, selecciona **Cloudflare Turnstile**, pega allí la **Secret Key** privada y guarda.
4. En `assets/js/site-config.js`, define `cloudflareTurnstileSiteKey` con la **Site Key pública**.
5. En `_config.yml`, define `turnstile_sitekey` con la misma **Site Key pública** para que la política CSP habilite solo el origen del widget.
6. Publica y prueba en un navegador no autenticado. El CAPTCHA aparece cuando se intenta votar y crear una sesión anónima.

No actives CAPTCHA en Supabase hasta agregar la site key en ambos archivos. Si el proyecto empieza a rechazar todos los likes, revisa que la Site Key de Cloudflare, la Secret Key registrada en Supabase y la Site Key del sitio sean del mismo widget.

## D. Métricas de visitas con GoatCounter

1. Crea tu sitio en [GoatCounter](https://www.goatcounter.com/) y sigue [su guía de inicio](https://goatcounter.com/help/start).
2. Copia el endpoint del contador, con formato `https://TU-CODIGO.goatcounter.com/count`.
3. En `_config.yml`, reemplaza `goatcounter_url: ""` por la URL completa. El endpoint es visible al público; no pegues una contraseña.
4. Publica y revisa el panel. Los bloqueadores de anuncios pueden impedir que se registre alguna visita.

La CSP ya permite el servicio GoatCounter alojado bajo `*.goatcounter.com` y `gc.zgo.at`. Si configuras un dominio personalizado para el endpoint, debes agregar ese dominio también a `connect-src` en el `meta` de CSP de `_layouts/default.html`.

## E. Qué hacer al publicar cambios

- Artículo nuevo: crea su carpeta, actualiza `index.md`, añade sus capturas y agrega su slug a Supabase.
- Archivo PDF: en el artículo, usa **Descargar PDF** y elige **Guardar como PDF** en el navegador. Es una generación local; no envía el writeup a un conversor externo. La impresión incluye “Desarrollado por Anonimo501”.
- Antes de publicar, abre una vista previa de tu rama, revisa el contenido y las imágenes y solo entonces intégrala a `main`.

## F. Protección de cuentas y del repositorio

1. Activa autenticación de dos factores o passkey en GitHub y en la cuenta del administrador de Supabase.
2. Mantén pocos colaboradores con permiso de escritura. No compartas tokens ni contraseñas por chat o en archivos del repositorio.
3. En GitHub, configura reglas para `main`: impedir force-push y borrado, exigir pull request/revisión si es posible en el plan, y no permitir que cualquier colaborador publique directamente.
4. Deja **Enforce HTTPS** activado en **Settings → Pages**.
5. Revisa cambios de código antes de combinarlos. El contenido Markdown debe venir de colaboradores de confianza; CSP limita scripts/iframes, pero no convierte contenido hostil en confiable.
6. Si alguien logra subir archivos al repositorio o acceder a una cuenta administradora, una web estática no puede bloquearlo: revoca sesiones/tokens comprometidos, restaura desde un commit confiable y vuelve a desplegar.

## Pruebas después de configurar

- La consola no debe mostrar errores de CSP al cargar la portada.
- La búsqueda filtra resultados mientras escribes.
- Compartir ofrece el menú nativo o enlaces externos conocidos; un `data-url` con otro dominio se rechaza.
- El PDF contiene el título y la línea “Desarrollado por Anonimo501”.
- El conteo de likes aparece incluso sin sesión; al votar, el total cambia y el usuario no puede votar otra vez desde esa identidad Supabase.
- Una ruta que no se agregó a `allowed_writeups` no acepta votos.
- Con CAPTCHA configurado, aparece antes de crear la sesión anónima.
- En GoatCounter aparecen visitas de prueba después de la carga.

## Referencias oficiales

- [Supabase: usuarios anónimos](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase: CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase: funciones de base de datos y seguridad](https://supabase.com/docs/guides/database/functions)
- [GitHub: ramas protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GoatCounter: instalación](https://goatcounter.com/help/start)
