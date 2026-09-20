# Cómo instalar el formulario

Se hace una sola vez, desde la computadora. Toma unos 15 minutos.

No hay que instalar ningún programa: todo pasa dentro de Google.

---

## Antes de empezar

En la pestaña `OPERADORES` de la hoja de control, agrega una columna:

- Va en la **columna D** (está libre; E y F ya tienen el ID de ruta y la zona).
- El encabezado, en la fila 1, debe decir exactamente: **`ESTATUS`**
- En cada chofer escribe **`ACTIVO`** o **`BAJA`**.

Solo los que digan `ACTIVO` aparecerán en la lista del formulario. Mientras esa columna no
exista, el formulario muestra a todos, así que no se rompe nada si se te olvida — nada más no
filtra.

---

## Paso 1 · Abrir el editor

1. Abre la hoja **CONTROL AMAZON 2026** en Google Sheets.
2. En el menú de arriba: **Extensiones → Apps Script**.
3. Se abre una pestaña nueva. Arriba a la izquierda dice *Proyecto sin título* — haz clic ahí
   y ponle **Formulario de ruta**.

---

## Paso 2 · Mostrar el archivo de configuración

1. En la barra de la izquierda, haz clic en el engrane (**Configuración del proyecto**).
2. Marca la casilla **Mostrar el archivo de manifiesto "appsscript.json" en el editor**.

---

## Paso 3 · Copiar los archivos

Vuelve al ícono de **Editor** (`<>`) en la barra izquierda. Vas a dejar estos cuatro archivos:

| Archivo en el editor | De dónde se copia |
|---|---|
| `appsscript.json` | `apps-script/appsscript.json` |
| `Config.gs` | `apps-script/Config.gs` |
| `Codigo.gs` | `apps-script/Codigo.gs` |
| `Formulario.html` | `apps-script/Formulario.html` |

Para cada uno:

- **`appsscript.json`** ya existe. Ábrelo, borra todo lo que tenga y pega el contenido nuevo.
- **`Codigo.gs`** ya existe con el nombre `Código.gs`. Ábrelo, borra todo y pega el contenido.
- **`Config.gs`**: botón **+** junto a *Archivos* → **Secuencia de comandos** → nómbralo
  `Config` (el editor le pone la terminación `.gs` solo).
- **`Formulario.html`**: botón **+** → **HTML** → nómbralo `Formulario`.

Guarda con el ícono del disquete.

> El nombre de cada archivo importa: el código los busca por nombre.

---

## Paso 4 · Decirle cuál es la hoja

El código no trae escrito el identificador de la hoja, porque el repositorio es público y
cualquiera podría verlo. Se guarda aparte:

1. Engrane (**Configuración del proyecto**) → hasta abajo, **Propiedades del script**.
2. **Agregar propiedad del script**.
3. En *Propiedad* escribe: `ID_HOJA`
4. En *Valor* pega el identificador de tu hoja. Es el pedazo largo que va en medio de la
   dirección:

   ```
   docs.google.com/spreadsheets/d/AQUI_VA_EL_IDENTIFICADOR/edit
   ```

5. **Guardar secuencia de comandos**.

---

## Paso 5 · Publicar la pantalla

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engrane junto a *Seleccionar tipo*, elige **Aplicación web**.
3. Llena así:
   - *Descripción*: `Version 1 - envio inicial`
   - *Ejecutar como*: **Yo** (tu correo)
   - *Quién tiene acceso*: **Cualquier usuario**
4. **Implementar**.
5. Google te va a pedir permiso. Sale una pantalla que dice *Google no ha verificado esta
   aplicación* — es normal, porque la aplicación es tuya. Haz clic en **Configuración
   avanzada** y luego en **Ir a Formulario de ruta (no seguro)**. Acepta los permisos.
6. Al final te da una **dirección de la aplicación web**. Cópiala: esa es la liga que se les
   manda a los choferes.

> *Ejecutar como: Yo* es lo que permite que los choferes escriban en tu hoja sin tener cuenta
> de Google ni acceso al archivo. El formulario escribe por ti.

---

## Paso 6 · Probarlo

1. Abre la liga en tu celular.
2. Llena el formulario y envíalo.
3. Revisa la hoja: debe haber aparecido una pestaña nueva llamada **`Respuestas_Form`** con tu
   renglón.

Prueba también que **no** te deje enviar:

- Deja un campo vacío.
- Pon `Entregados` mayor que `SPR`.
- Pon la hora de salida antes que la de llegada.

En los tres casos la pantalla debe marcarte el error y no enviar nada.

---

## Paso 7 · Ponerlo en el celular del chofer

Que abra la liga en el navegador del teléfono y:

- **Android (Chrome)**: menú de tres puntos → *Agregar a pantalla principal*.
- **iPhone (Safari)**: botón de compartir → *Agregar a pantalla de inicio*.

Queda como un ícono más, igual que cualquier aplicación.

---

## Cuando haya cambios en el código

No se crea una implementación nueva. Se actualiza la que ya existe, para que la liga de los
choferes siga siendo la misma:

**Implementar → Administrar implementaciones →** ícono de lápiz **→** en *Versión* elige
**Nueva versión → Implementar**.

---

## Si algo falla

| Lo que ves | Qué revisar |
|---|---|
| `Falta configurar ID_HOJA` | El paso 4 quedó incompleto o el nombre tiene un error de dedo |
| `No existe la pestania "OPERADORES"` | El nombre de la pestaña cambió |
| `OPERADORES no tiene la columna...` | Falta el encabezado `NOMBRE DEL DRIVER` en la fila 1 |
| La lista de drivers sale vacía | Ningún renglón dice `ACTIVO` en la columna `ESTATUS` |
| Los choferes ven una pantalla de inicio de sesión | En el paso 5, *Quién tiene acceso* no quedó en **Cualquier usuario** |
