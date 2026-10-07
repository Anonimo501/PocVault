---
layout: writeup
title: "cwe-915 — Mass Assignment Attack"
date: 2008-09-21
category: "CWE · WEB"
description: "Análisis y demostración de una vulnerabilidad de Mass Assignment, clasificada como CWE-915, que permite modificar atributos internos de objetos mediante parámetros controlados por el atacante cuando la aplicación no restringe adecuadamente las propiedades que pueden ser actualizadas."
image: "/writeups/cwe-915/portada.jpg"
---
 
## Resumen
 
El presente análisis evalúa una vulnerabilidad de Mass Assignment, clasificada por MITRE como CWE-915 — Improperly Controlled Modification of Dynamically-Determined Object Attributes ('Mass Assignment'). La debilidad consiste en permitir que atributos proporcionados por el usuario sean utilizados directamente para inicializar o modificar objetos internos sin controlar adecuadamente cuáles propiedades pueden ser modificadas.

El concepto de Mass Assignment en aplicaciones Ruby on Rails se encuentra documentado desde 2008, incluyendo una referencia histórica de Michael Hartl fechada el 21 de septiembre de 2008, posteriormente incorporada por MITRE como referencia para CWE-915.

Posteriormente, en marzo de 2012, la vulnerabilidad adquirió especial notoriedad tras la demostración pública realizada por Egor Homakov contra GitHub, donde se aprovechó el comportamiento de Mass Assignment de Ruby on Rails para modificar atributos que no deberían haber estado bajo control del usuario.

Durante la explotación, un atacante puede identificar propiedades sensibles como role, isAdmin, permissions, user_id o similares e incluirlas dentro de una solicitud HTTP legítima. Si el servidor realiza una asignación automática de los parámetros recibidos, dichas propiedades pueden ser modificadas sin la autorización correspondiente.

Dependiendo de los atributos expuestos, la explotación puede provocar modificación no autorizada de información, escalada de privilegios, modificación de permisos o acceso a funcionalidades administrativas.

## Descripcion

Mass Assignment ocurre cuando una aplicación acepta múltiples atributos enviados por el cliente y los asigna automáticamente a un objeto interno sin restringir adecuadamente las propiedades que pueden ser modificadas.

Por ejemplo, una aplicación puede permitir que un usuario modifique legítimamente su nombre:

```
{
  "name": "Usuario"
}
```

Sin embargo, un atacante podría intentar agregar un atributo privilegiado:

```
{
  "name": "Usuario",
  "role": "admin"
}
```

Si el backend asigna automáticamente todos los parámetros recibidos y no verifica que el usuario esté autorizado para modificar role, podría producirse una escalada de privilegios.

MITRE define CWE-915 precisamente como la modificación incorrectamente controlada de atributos determinados dinámicamente.

## Entorno
 
- Aplicación/servicio: Aplicación web vulnerable utilizada para reproducir un escenario de Mass Assignment.
- Sistema: [Descarga el lab](https://bblabs.es/recursos/laboratorio-asi-los-hackers-consiguen-premium-gratis).
- Infraestructura: Laboratorio local aislado destinado exclusivamente a pruebas de seguridad.
- Alcance: Las pruebas se limitaron exclusivamente en una máquina virtual controlada por el evaluador.
 
## Paso 1: Validar suscriptiones

### Pasar de una suscripción básica a una premium

Iniciamos viendo los planes de suscripción:

![Captura del análisis]({{ '/writeups/cwe-915/Imagen1.png' | relative_url }})

## Paso 2: Enviar la peticion al Repeater
 
Entramos a nuestra cuenta y dentro de esta al cambiar el nombre y presionar en guardar, capturamos esta peticion y lo enviamos al repeater.

![Captura del análisis]({{ '/writeups/cwe-915/Imagen2.png' | relative_url }})

## Paso 3: Capturar la respuesta del servidor

Cogemos de la respuesta del servidor plan:free para usarlo en una nueva consulta

![Captura del análisis]({{ '/writeups/cwe-915/Imagen3.png' | relative_url }})

## Paso 4: Modificación de la peticion

Agregamos plan:free y lo cambiamos a plan:premium y enviamos la peticion nuevamente.

![Captura del análisis]({{ '/writeups/cwe-915/Imagen4.png' | relative_url }})

## Paso 5: Validación de cuenta premium

Como podemos ver al enviar esta peticion modificada y recargar la pagina veremos que tendremos el plan premium.

![Captura del análisis]({{ '/writeups/cwe-915/Imagen5.png' | relative_url }})

## Maquina de lab

- [Descarga laboratorio](https://bblabs.es/recursos/laboratorio-asi-los-hackers-consiguen-premium-gratis)

## Impacto

La explotación puede permitir:

- Escalada de privilegios.
- Modificación de roles.
- Alteración de permisos.
- Modificación de información de otros usuarios.
- Manipulación de identificadores.
- Cambio de estados internos de cuentas.
- Acceso a funcionalidades administrativas.

El impacto final depende de los atributos que la aplicación exponga mediante el mecanismo de asignación automática.

## Mitigación y aprendizajes
 
### Allowlist de atributos

La aplicación debe definir explícitamente qué propiedades puede modificar cada usuario, en lugar de aceptar todos los atributos proporcionados por el cliente.

### DTOs

Se recomienda utilizar Data Transfer Objects (DTOs) para separar los datos controlados por el usuario de los modelos internos de la aplicación.

### Autorización del lado del servidor

Los atributos sensibles deben validarse mediante controles de autorización en el backend. Las restricciones implementadas únicamente en el frontend no son suficientes.

### Validación de entrada

Se deben validar el nombre, tipo y valor de cada atributo recibido, rechazando propiedades que no formen parte del conjunto autorizado.

### Monitoreo

Se recomienda registrar modificaciones de atributos sensibles como:

- Roles.
- Permisos.
- Estados de cuentas.
- Identificadores de propietario.
- Privilegios administrativos.
 
## Referencias
 
- [MITRE CWE-915 — Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [OWASP — Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [Ruby on Rails — Strong Parameters](https://rubyonrails.org/2012/3/21/strong-parameters)
- [GitHub — Public Key Security Vulnerability and Mitigation](https://github.blog/2012-03-04-public-key-security-vulnerability-and-mitigation/)
