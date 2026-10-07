/*
 * Configuración intencionalmente pública del frontend.
 * SOLO usar la URL del proyecto y la publishable key o legacy anon key.
 * Nunca pegar service_role, sb_secret, contraseñas ni tokens privados.
 */
window.POCVAULT_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabaseAnonKey: "",
  cloudflareTurnstileSiteKey: ""
});
