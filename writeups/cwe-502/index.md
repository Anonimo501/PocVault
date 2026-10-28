---
layout: writeup
title: "CWE-502 — React2Shell: RCE en React Server Components (Next.js)"
date: 2025-12-03
category: "CWE · WEB"
description: "Análisis de CVE-2025-55182, una vulnerabilidad crítica de ejecución remota de código (RCE) no autenticada en el protocolo Flight de React Server Components (RSC), que afecta a React 19 y a frameworks como Next.js por una deserialización insegura de datos controlados por el atacante."
image: "/writeups/cve-2025-55182/portada.jpg"
---

## Resumen

CVE-2025-55182, conocida públicamente como **"React2Shell"**, es una vulnerabilidad crítica (CVSS 10.0) que permite a un atacante no autenticado ejecutar código arbitrario en el servidor. La causa raíz es una deserialización insegura en el protocolo **"Flight"** de React Server Components (RSC), usado para transmitir el árbol de componentes y las referencias a funciones del servidor entre cliente y servidor.

El investigador Lachlan Davidson reportó la falla al programa de recompensas de Meta el 29 de noviembre de 2025. El equipo de React la divulgó públicamente y publicó parches el 3 de diciembre de 2025. CISA la añadió a su catálogo KEV el 5 de diciembre de 2025, tras observarse explotación activa por parte de varios grupos de amenazas (incluyendo actores vinculados a China como Earth Lamia y Jackpot Panda) pocas horas después de la divulgación.

## Componentes y versiones afectadas

Afecta a los paquetes `react-server-dom-webpack`, `react-server-dom-parcel` y `react-server-dom-turbopack` en las versiones **19.0.0, 19.1.0, 19.1.1 y 19.2.0**. Cualquier framework que integre estos paquetes es potencialmente vulnerable: Next.js (rastreada también como CVE-2025-66478), el plugin RSC de Vite, el plugin RSC de Parcel, la vista previa RSC de React Router, RedwoodSDK y Waku.

Las versiones corregidas son **19.0.1, 19.1.2 y 19.2.1**. (Nota: posteriormente se publicaron CVE-2025-55183, relacionada con fuga de información, corregida en 19.2.2, y CVE-2025-55184 / CVE-2025-67779, relacionadas con denegación de servicio, corregidas en 19.2.3.)

## Descripción técnica

React implementa, dentro del handler de respuestas del servidor, un mecanismo que reconstruye objetos a partir de referencias serializadas del tipo `$1:propiedad`, usadas por ejemplo al procesar los argumentos de una Server Function. El fallo está en que, al resolver una ruta de propiedades, el código no valida si la propiedad accedida es propia del objeto o heredada a través de la cadena de prototipos de JavaScript.

Esto habilita una variante de **Prototype Pollution del lado del servidor**: un atacante puede dirigir la resolución hacia propiedades como `__proto__` o `constructor` hasta alcanzar el constructor global `Function`. El mecanismo de re-entrada se apoya además en que el runtime de JavaScript resuelve automáticamente cualquier objeto con un método `.then` como si fuera una promesa, lo que permite al atacante "plantar" un objeto falso que el parser de React vuelve a procesar con privilegios elevados sobre la deserialización. El resultado final es la posibilidad de invocar `Function` con una cadena arbitraria, es decir, ejecución de código en el proceso Node.js del servidor.

El parche oficial de React corrige esto introduciendo comprobaciones de propiedad propia (`hasOwnProperty`) antes de resolver dinámicamente rutas de propiedades provenientes de datos no confiables, en la función `requireModule` y en la resolución de modelos.

## Por qué es tan grave

- **No requiere autenticación ni interacción del usuario**: basta una solicitud HTTP a un endpoint que procese payloads RSC (`Content-Type: text/x-component` o cabecera `Next-Action`).
- **Superficie amplia**: cualquier aplicación Next.js con App Router que use Server Actions, incluso proyectos generados con `create-next-app` por defecto, es vulnerable.
- **Explotación masiva observada**: según Cloudflare, se registraron más de 580 millones de intentos de explotación en la semana posterior a la divulgación; Wiz Research reportó que ~39% de los entornos cloud analizados tenían instancias vulnerables.

## Impacto

La explotación exitosa permite:

- Ejecución Remota de Código (RCE) no autenticada: compromiso total del servidor.
- Robo de datos y secretos: variables de entorno, bases de datos, credenciales cloud (tokens IAM).
- Movimiento lateral hacia redes internas o servicios cloud.
- Despliegue de malware: backdoors, ransomware, mineros de criptomonedas.
- Persistencia: modificación de código o de pipelines CI/CD.

## Mitigación

**Actualización inmediata (la única mitigación completa):**
- React: actualizar `react-server-dom-*` a 19.0.1, 19.1.2 o 19.2.1 (o 19.2.2/19.2.3 si también aplican las CVE relacionadas).
- Next.js: actualizar a la última versión parcheada de la línea correspondiente (por ejemplo 15.0.7, 15.1.11, 15.2.8, 15.3.8, 15.4.10, 15.5.9, 16.0.7 o superiores).

**Mitigaciones temporales (si no se puede parchear de inmediato):**
- WAF: reglas para bloquear payloads Flight malformados o sospechosos dirigidos a endpoints RSC (varios proveedores cloud desplegaron reglas globales, sin garantía total).
- Deshabilitar temporalmente React Server Components / Server Actions si la aplicación no los necesita.
- Restringir el acceso a los endpoints afectados mediante ACLs de red o firewalls.

## Monitoreo y detección

Se recomienda vigilar:
- Solicitudes anómalas a endpoints RSC con payloads inusualmente grandes o malformados.
- Procesos inesperados iniciados por el proceso Node.js.
- Conexiones salientes no autorizadas desde servidores web.
- Modificaciones no planificadas en archivos de configuración o código del servidor.

## Referencias

- React — Critical Security Vulnerability in React Server Components
- Vercel — React2Shell Security Bulletin
- Next.js — Security Update, diciembre de 2025
- Google Cloud Threat Intelligence — Multiple Threat Actors Exploit React2Shell (CVE-2025-55182)
- Datadog Security Labs — CVE-2025-55182 (React2Shell): análisis técnico
- AWS Security Blog — China-nexus cyber threat groups rapidly exploit React2Shell
- OPSWAT — React2Shell (CVE-2025-55182) Analysis
