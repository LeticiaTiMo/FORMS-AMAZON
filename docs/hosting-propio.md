# Alojar la pantalla en hosting propio

Cómo servir el formulario desde el hosting de la empresa, igual que la Torre de Control, en vez
de desde la liga de Google.

Cambia **solo dónde vive la pantalla**. Los datos siguen cayendo en la misma hoja de Google, la
validación sigue en Apps Script y el botón de WhatsApp funciona igual.

```
Celular del chofer ──► tu hosting (Formulario.html)
                            │  fetch POST
                            ▼
                       Apps Script (doPost) ──► Google Sheets
```

**Requisito:** que Apps Script ya esté instalado y publicado según
[instalacion.md](instalacion.md). La pantalla del hosting usa esa misma implementación.

---

## Paso 1 · Actualizar el código en Apps Script

`FormularioRuta.gs` trae una función nueva, `doPost`, que es por donde entra la pantalla del
hosting. Copia el archivo completo sobre el que ya tienes en el editor, igual que
`Formulario.html`.

> **Revisa antes que ningún otro archivo del proyecto tenga su propio `doPost`.** Busca
> `function doPost` en cada archivo. Si ya hay uno, por ejemplo de otra pantalla, los dos chocan
> y solo funciona el último que Apps Script carga. En ese caso detente y avisa.

Luego **publica versión nueva sobre la implementación existente**: *Implementar → Administrar
implementaciones → lápiz → Versión: Nueva versión → Implementar*. Guardar no basta.

Confirma en esa misma ventana que *Quién tiene acceso* diga **Cualquier usuario**. Si no, el
hosting recibe la pantalla de inicio de sesión de Google en lugar de los datos.

Copia la **URL de la aplicación web**, la que termina en `/exec`.

---

## Paso 2 · Preparar la copia para el hosting

1. Haz una copia de `apps-script/Formulario.html` **fuera del repositorio**, por ejemplo
   `reporte-ruta.html` en tu escritorio.
2. Ábrela con el Bloc de notas y busca esta línea:

   ```js
   var URL_API = '';
   ```

3. Pega la liga `/exec` entre las comillas:

   ```js
   var URL_API = 'https://script.google.com/macros/s/AKfy.../exec';
   ```

4. Guarda.

> **No pegues la liga en el archivo del repositorio.** El repositorio es público. La liga va
> solo en la copia que subes.

---

## Paso 3 · Subirla al hosting

Súbela como cualquier otra página, por el administrador de archivos de cPanel o por FileZilla,
a la carpeta del sitio (por ejemplo `public_html/bdbcompany.com/`).

La liga para los choferes queda así: `https://bdbcompany.com/reporte-ruta.html`.

Tiene que ser **https**. Con http el navegador del celular bloquea la conexión con Google.

---

## Paso 4 · Probarla

Ábrela en el celular, sin haber iniciado sesión en Google:

1. Aparece la lista de choferes → la conexión funciona.
2. Manda un reporte inicial de prueba → aparece en `Respuestas_Form`.
3. En la confirmación, el botón de WhatsApp abre el mensaje ya escrito.

Borra el renglón de prueba al terminar.

---

## Paso 5 · Mantener la carga rápida

Abrir la hoja en frío tarda más de 20 segundos. Para que el primer chofer de la mañana no los
pague, un activador la mantiene abierta y la lista de choferes en memoria.

En el editor de Apps Script: ⏰ **Activadores → Agregar activador**.

- Función: **`precargar`**
- Fuente del evento: **Según tiempo**
- Tipo: **Temporizador por minutos**, **cada 10 minutos**

Sin el activador el formulario funciona igual, solo que más lento la primera vez del día.

Además, la pantalla guarda en el celular la lista de choferes y el nombre del último chofer.
Desde la segunda vez abre al instante, con el nombre ya elegido.

**Al dar de alta o de baja a un chofer**, el cambio tarda hasta 10 minutos en verse con el
activador, o hasta 30 sin él.

---

## Respuestas_Form fuera del archivo principal

`Respuestas_Form` puede vivir en la hoja vinculada al proyecto, por ejemplo "FORMULARIO AMAZON",
en vez de en el archivo principal. `OPERADORES` y `BD_AMAZON` se quedan en el principal, y el
vaciado sigue escribiendo ahí.

Desde la hoja vinculada: **Formulario de ruta → Mover Respuestas_Form a este archivo…**

La opción copia la pestaña, compara la copia celda por celda y solo entonces la borra del
principal. Si algo no cuadra, no borra nada. Hasta que la mudanza termina, los reportes siguen
llegando al principal, así que nunca quedan partidos entre los dos archivos.

Si la hoja vinculada ya tiene su propio `Respuestas_Form` con renglones, la opción se detiene:
hay que revisar cuál sirve y quitar la otra antes de volver a intentar.

---

## Cuando cambie el código

| Qué cambió | Qué hacer |
|---|---|
| Un archivo `.gs` | Copiarlo a Apps Script y publicar versión nueva. La página del hosting no se toca |
| `Formulario.html` | Hacer otra vez el Paso 2 y volver a subir la copia |

Publicando sobre la misma implementación, la liga `/exec` no cambia y `URL_API` sigue sirviendo.

---

## Si algo falla

| Mensaje en la pantalla | Qué pasa |
|---|---|
| *Falta pegar la liga de Apps Script en URL_API* | Se subió el archivo sin hacer el Paso 2 |
| *El servidor no contestó con datos…* | *Quién tiene acceso* no es **Cualquier usuario**, o la liga no es la `/exec` |
| *Petición no reconocida* | Apps Script tiene un `FormularioRuta.gs` viejo, sin `doPost`, o no se publicó versión nueva |
| *Sin conexión con el servidor* | El celular no tiene señal, o la página se abrió con http en vez de https |

---

## Sobre la seguridad

La liga `/exec` queda visible para quien vea el código de la página, igual que en la Torre de
Control. No se le puso contraseña porque también quedaría visible en la página y no protegería
nada.

Lo que sí protege: `doPost` solo deja llamar a las cuatro funciones del formulario, y cada envío
se vuelve a validar en Apps Script. Un envío con un chofer que no está activo en `OPERADORES`, o
con cuentas que no cuadran, se rechaza aunque no venga de la pantalla.
