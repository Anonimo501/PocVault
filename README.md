# PocVault

Sitio de writeups técnicos estático con GitHub Pages y Jekyll.

## Funciones

- Búsqueda instantánea.
- Compartir por menú nativo, X, WhatsApp, LinkedIn o enlace.
- Guardar artículos completos como PDF mediante impresión del navegador, con la atribución “Desarrollado por Anonimo501”.
- Contador opcional con GoatCounter.
- Likes opcionales en Supabase, con allowlist de rutas, identidad anónima y RLS/permisos mínimos.
- CSP restrictiva y SDK de Supabase vendorizado con versión fija.
- CAPTCHA opcional con Cloudflare Turnstile para frenar altas automatizadas.

## Instalación y seguridad

Sigue [CONFIGURAR-FUNCIONES.md](CONFIGURAR-FUNCIONES.md) antes de conectar servicios o publicar.

- Ejecuta [supabase-likes.sql](supabase-likes.sql) en Supabase.
- Configura solo la clave publicable de Supabase en `assets/js/site-config.js`.
- No subas claves `service_role` / `sb_secret`, contraseñas ni tokens privados.
- Mantén las imágenes y writeups actuales en `writeups/`.

GitHub Pages es un host estático público: estas medidas reducen el abuso de la funcionalidad, pero no sustituyen la protección de las cuentas, permisos de escritura, disponibilidad o revisión de cambios.
