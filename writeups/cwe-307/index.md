---
layout: writeup
title: "CWE-307 — Batching Attack: Múltiples credenciales en una petición"
date: 2006-07-19
category: "WEB · AUTHENTICATION"
description: "Análisis y demostración de un ataque de batching (múltiples credenciales en una sola petición) para evadir mecanismos de protección contra fuerza bruta en formularios de autenticación."
image: "/writeups/cwe-307/portada.jpg"
---

## Resumen

El presente análisis demuestra el uso de una técnica de **batching attack** para evadir mecanismos de protección contra fuerza bruta en formularios de autenticación.

Un batching attack consiste en enviar múltiples credenciales candidatas dentro de una **única petición HTTP**, aprovechando que el backend de la aplicación procesa internamente un array de valores en lugar de un único string. El mecanismo de rate limiting de la aplicación, al contar peticiones HTTP en lugar de intentos de autenticación individuales, no detecta el ataque como fuerza bruta convencional.

En un escenario vulnerable, la aplicación acepta un array JSON donde espera un string (por ejemplo, `"password": ["pass1", "pass2", ...]`), itera sobre los valores internamente y compara cada uno contra la contraseña almacenada. Si cualquiera coincide, la autenticación es exitosa, y todo el intento se contabiliza como **una sola petición**, evadiendo así el contador de intentos del servidor.

La vulnerabilidad reside en la aplicación objetivo cuando esta no valida estrictamente el tipo de los datos de entrada y su mecanismo de control de intentos se basa únicamente en el número de solicitudes HTTP.

## Identificación

- **Técnica utilizada:** Batching Attack / Múltiples credenciales por solicitud
- **Herramienta:** Burp Suite (Repeater)
- **Tipo:** Evasión de control de intentos de autenticación
- **CWE:** CWE-307 — Restricción inadecuada de intentos de autenticación excesivos
- **Objetivo:** Evadir protección contra fuerza bruta en endpoints de autenticación
- **Vector:** HTTP Request Body (JSON)
- **Elemento afectado:** Parámetro de contraseña en petición de login
- **Dirección:** Cliente → Servidor

## Descripción

CWE-307 describe la debilidad en la que el producto no implementa medidas suficientes para prevenir múltiples intentos de autenticación fallidos dentro de un corto período de tiempo. Los mecanismos comunes de protección incluyen:

- Bloqueo de cuenta tras varios intentos fallidos
- Rate limiting por dirección IP
- Retrasos progresivos entre intentos
- CAPTCHA tras múltiples fallos

Un batching attack explota una **implementación inconsistente** de estas protecciones. En lugar de realizar múltiples peticiones HTTP (cada una contabilizada por el rate limiter), el atacante envía una sola petición que contiene todas las credenciales candidatas en un array.

### Ejemplo de petición vulnerable

    POST /login HTTP/2
    Content-Type: application/json

    {"username":"carlos","password":["123456","password","qwerty","dragon",...]}

Si el backend:

1. Acepta el array donde espera un string (validación de tipo insuficiente)
2. Itera sobre los elementos del array para comparar contra la contraseña almacenada
3. Cuenta **solo la petición HTTP** como un intento de autenticación

Entonces el atacante puede probar cientos de contraseñas en una sola petición sin activar el rate limiting.

## Entorno

- **Aplicación/servicio:** Laboratorio de PortSwigger (Broken brute-force protection, multiple credentials per request)
- **Herramienta:** Burp Suite
- **Componente utilizado:** Repeater (modificación manual del body)
- **Infraestructura:** Laboratorio controlado (PortSwigger Web Security Academy)
- **Objetivo:** Evaluar la resistencia del mecanismo de autenticación frente a múltiples credenciales por petición

## Explotación

Ingresamos cualquier credencial para ingresar en el login.

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_1.png' | relative_url }})

Generamos el array con la herramienta o script a continuación: [JsonArrayPass.py](https://github.com/Anonimo501/JsonArray.py/tree/main)

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_2.png' | relative_url }})

Podemos ver el resultado del Json Array generado por la herramienta.

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_3.png' | relative_url }})

Así que llevamos este Json Array al parámetro `password`.

En lugar de enviar peticiones individuales con cada contraseña, modificamos la petición para convertir el parámetro `password` de string a array JSON, incluyendo todas las credenciales candidatas:

    {"username":"carlos","password":["123456","password","12345678","qwerty","123456789","12345","1234","111111","1234567","dragon",...]}

Al enviar la petición modificada, el servidor procesa el array internamente. Si alguna de las contraseñas en el array coincide con la almacenada, la autenticación es exitosa y el servidor responde con un `302` (redirección al panel de usuario).

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_4.png' | relative_url }})

Damos clic derecho y copiamos la URL.

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_5.png' | relative_url }})

La pegamos en el navegador y hacemos clic sobre "My account"

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_6.png' | relative_url }})

Al ingresar veremos la cuenta del usuario carlos.

![Captura del análisis]({{ '/writeups/cwe-307/Screenshot_7.png' | relative_url }})

El ataque completo se contabiliza como **una sola petición HTTP**, por lo que el mecanismo de rate limiting nunca se activa, sin importar cuántas contraseñas se incluyan en el array.

## Impacto

El impacto depende directamente del mecanismo de autenticación vulnerable.

Una explotación exitosa puede permitir:

- **Bypass completo de protección contra fuerza bruta**
- **Compromiso de cuentas de usuario** mediante adivinación de contraseñas
- **Credential stuffing** a gran escala sin detección
- **Password spraying** evadiendo rate limiting
- **Ataques de diccionario** en una sola petición

La capacidad de probar cientos o miles de contraseñas en una sola petición convierte un ataque que normalmente requeriría horas o días (y sería detectado) en un ataque que se completa en segundos y pasa desapercibido para los mecanismos de defensa basados en conteo de peticiones.

## Mitigación y aprendizajes

### Validación estricta de tipos

La aplicación debe validar que los parámetros de entrada tengan el tipo esperado. Si `password` debe ser un string, cualquier valor que no sea string debe ser rechazado antes de procesarse.

    # Ejemplo de validación en Python
    if not isinstance(password, str):
        return {"error": "Invalid parameter type"}, 400

### Contabilizar intentos de autenticación, no peticiones

El mecanismo de rate limiting debe contar **intentos individuales de autenticación**, no peticiones HTTP. Si un array de 100 contraseñas se procesa en una petición, debe contarse como 100 intentos.

### Límites en el tamaño de arrays

Si la aplicación legítimamente espera arrays en algún parámetro, debe imponer límites estrictos al número de elementos y validar que el contenido sea del tipo esperado.

### Bloqueo proactivo

Implementar bloqueo de cuenta después de un número reducido de intentos fallidos (típicamente 3-5), independientemente de cómo se contabilicen las peticiones.

### Monitoreo y detección

Detectar patrones anómalos como:

- Peticiones con arrays donde se esperan strings
- Tamaños de body inusualmente grandes en endpoints de login
- Múltiples respuestas de autenticación en una sola petición

## Clasificación

Es importante aclarar que **el batching attack no constituye una vulnerabilidad por sí mismo**.

La clasificación CWE debe seleccionarse según el fallo encontrado en la aplicación:

- **CWE-307:** Improper Restriction of Excessive Authentication Attempts — cuando la aplicación no limita adecuadamente los intentos de autenticación
- **CWE-799:** Improper Control of Interaction Frequency — cuando la aplicación no controla la frecuencia de interacciones (categoría padre de CWE-307)

Para el laboratorio de PortSwigger específico analizado, el mapeo correcto es **CWE-307**, ya que la debilidad fundamental es que el endpoint de login no restringe adecuadamente los intentos de autenticación, permitiendo que múltiples credenciales sean probadas en una sola petición.

## Referencias

- [MITRE CWE-307](https://cwe.mitre.org/data/definitions/307.html)
- [PortSwigger: Broken brute-force protection, multiple credentials per request](https://portswigger.net/web-security/authentication/password-based/lab-broken-bruteforce-protection-ip-block)
- [OWASP: Blocking Brute Force Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [MITRE CWE-799](https://cwe.mitre.org/data/definitions/799.html)
