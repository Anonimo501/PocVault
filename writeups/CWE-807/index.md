---
layout: writeup
title: "cwe-807 - Match and Replace — Manipulación de Solicitudes HTTP"
date: 2010-01-18
category: "WEB · ACCESS CONTROL"
description: "Análisis y demostración de la manipulación de solicitudes HTTP mediante Match and Replace de Burp Suite para modificar parámetros y cabeceras utilizados por una aplicación vulnerable para implementar controles de acceso."
image: "/writeups/cwe-807/portada.jpg"
---

## Resumen

El presente análisis demuestra el uso de la funcionalidad **Match and Replace** de Burp Suite para modificar automáticamente respuestas HTTP del servidor.

Match and Replace permite definir reglas que buscan determinados valores dentro de las solicitudes o respuestas HTTP y los sustituyen automáticamente por otros valores. Esta funcionalidad puede utilizarse durante pruebas de seguridad para evaluar el comportamiento de mecanismos de autenticación, autorización, controles de acceso, parámetros, cabeceras y otros elementos de las comunicaciones HTTP.

En un escenario vulnerable, una aplicación puede confiar incorrectamente en información proporcionada por el cliente, como una cabecera HTTP, un parámetro o un valor booleano, para determinar si un usuario posee privilegios administrativos o acceso a determinados recursos.

Por ejemplo, una aplicación podría utilizar un parámetro o cabecera como `role=user`, `isAdmin=false` o `X-Custom-IP-Authorization` para determinar el nivel de acceso del usuario. Mediante una regla de Match and Replace, dicho valor puede ser modificado automáticamente a `role=admin`, `isAdmin=true` o una dirección IP autorizada.

La vulnerabilidad reside en la aplicación objetivo cuando esta confía en valores controlados por el cliente.

## Identificación

- **Técnica utilizada:** Burp Suite → Proxy → Match and Replace
- **Herramienta:** Burp Suite
- **Tipo:** Manipulación de solicitudes HTTP
- **CWE:** Depende de la vulnerabilidad identificada
- **Objetivo:** Evaluar controles de autenticación y autorización
- **Vector:** HTTP Response
- **Elemento afectado:** Respuesta HTTP del servidor
- **Dirección:** Servidor → Cliente

## Descripción

Burp Suite permite configurar reglas de Match and Replace para modificar automáticamente solicitudes y respuestas HTTP.

Las reglas pueden utilizarse para modificar:

- Cabeceras HTTP.
- Parámetros.
- Valores de parámetros.
- Cuerpo de las solicitudes.
- Primera línea de la solicitud.
- Respuestas HTTP.
- Mensajes WebSocket.

Una regla puede buscar un valor determinado y sustituirlo por otro.

Por ejemplo:

    Valor original:

    isAdmin=false

    Valor modificado:

    isAdmin=true

Si la aplicación utiliza directamente `isAdmin` para determinar los privilegios del usuario y no realiza una validación adecuada en el servidor, la manipulación podría permitir acceder a funcionalidades que deberían estar restringidas.

## Entorno

- **[Aplicación/servicio](https://bblabs.es/recursos/laboratorio-asi-los-hackers-consiguen-premium-gratis):** .
- **Herramienta:** Burp Suite.
- **Componente utilizado:** Proxy > Match and Replace.
- **Infraestructura:** Laboratorio local controlado.
- **Objetivo:** Evaluar la resistencia de los mecanismos de autenticación y autorización frente a la manipulación de solicitudes HTTP.

## Explotación

Inicialmente se captura una solicitud HTTP legítima utilizando Burp Suite.

Posteriormente se identifica un parámetro o cabecera que pueda estar relacionado con el mecanismo de autorización de la aplicación.

Ejemplo de solicitud original:

    GET /admin HTTP/1.1
    Host: objetivo.local
    X-Custom-IP-Authorization: 192.168.1.100

Mediante Match and Replace se configura una regla para modificar automáticamente el valor:

    Match:

    X-Custom-IP-Authorization: 192.168.1.100

    Replace:

    X-Custom-IP-Authorization: 127.0.0.1

La solicitud enviada al servidor será entonces:

    GET /admin HTTP/1.1
    Host: objetivo.local
    X-Custom-IP-Authorization: 127.0.0.1

Si el servidor confía incorrectamente en esta cabecera para determinar si la solicitud procede de un usuario autorizado, podría permitir el acceso a la funcionalidad administrativa.

## Impacto

El impacto depende directamente del mecanismo de seguridad vulnerable.

Una explotación exitosa puede permitir:

- Bypass de controles de acceso.
- Acceso a funcionalidades administrativas.
- Manipulación de parámetros de autorización.
- Elevación de privilegios.
- Acceso a recursos restringidos.
- Bypass de restricciones basadas en IP.
- Alteración de parámetros utilizados por mecanismos de seguridad.

Cuando la aplicación utiliza parámetros o cabeceras controladas por el cliente como mecanismo de autorización, estos valores no deben considerarse confiables.

## Mitigación y aprendizajes

### Validación del lado del servidor

Los mecanismos de autenticación y autorización deben implementarse exclusivamente en el servidor.

La aplicación no debe confiar en valores enviados por el cliente para determinar directamente sus privilegios.

### No confiar en cabeceras controladas por el cliente

Las cabeceras HTTP como `X-Forwarded-For` u otras cabeceras personalizadas pueden ser manipuladas por el cliente.

Cuando una aplicación necesite conocer la IP real del cliente, debe obtener esta información desde una infraestructura de proxy o balanceador de confianza y validar correctamente la cadena de proxies.

### Controles de autorización

Cada solicitud a un recurso protegido debe validar:

- Identidad del usuario.
- Sesión autenticada.
- Rol.
- Permisos.
- Recurso solicitado.
- Acción solicitada.

### Validación de parámetros

Los parámetros utilizados para determinar privilegios no deben aceptarse directamente desde el cliente.

Por ejemplo, no se debe confiar únicamente en:

    role=admin

    isAdmin=true

    authenticated=true

    access=granted

### Pruebas de seguridad

Se recomienda realizar pruebas utilizando herramientas como Burp Suite para comprobar si la modificación de:

- Parámetros.
- Cabeceras.
- Cookies.
- Tokens.
- Valores booleanos.
- Identificadores.

puede alterar el comportamiento de los mecanismos de seguridad.

## Clasificación

Es importante aclarar que **Match and Replace no constituye una vulnerabilidad por sí mismo**.

La clasificación CWE debe seleccionarse según el fallo encontrado en la aplicación.

Por ejemplo:

- **CWE-287:** Improper Authentication, cuando la autenticación puede ser evadida.
- **CWE-285:** Improper Authorization, cuando la aplicación no aplica correctamente los controles de autorización.
- **CWE-639:** Authorization Bypass Through User-Controlled Key, cuando la manipulación de un identificador permite acceder a recursos de otro usuario.
- **CWE-807:** Reliance on Untrusted Inputs in a Security Decision, cuando una decisión de seguridad depende de información controlada por el usuario.

## Referencias

- https://portswigger.net/burp/documentation/desktop/tools/proxy/match-and-replace
- https://portswigger.net/burp/documentation/desktop/testing-workflow/vulnerabilities/access-controls/using-match-and-replace
- https://portswigger.net/burp/documentation/desktop/testing-workflow/vulnerabilities/access-controls/param-based-access-control
- https://cwe.mitre.org/data/definitions/285.html
- https://cwe.mitre.org/data/definitions/807.html
