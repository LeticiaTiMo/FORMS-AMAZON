# Cómo instalar el formulario

Se hace una sola vez, desde la computadora. Toma unos 15 minutos.

No hay que instalar ningún programa: todo pasa dentro de Google.

---

## Antes de empezar

Nada: la pestaña `OPERADORES` ya tiene la columna **`STATUS`** en la columna D, con `ACTIVO` o
`BAJA` en cada chofer. De 84 operadores, **23 están activos**, y solo esos aparecen en la lista
del formulario.

Si algún día cambia el nombre de ese encabezado, hay que ajustarlo en `Config.gs`, en
`OPERADORES.encabezadoEstatus`. Mientras la columna no exista, el formulario muestra a todos:
no se rompe, nada más deja de filtrar.

---

## Paso 1 · Abrir el editor

1. Abre la hoja **CONTROL AMAZON 2026** en Google Sheets.
2. En el menú de arriba: **Extensiones → Apps Script**.

Se abre una pestaña nueva. Sabes que estás en el lugar correcto si ves una **barra lateral
izquierda con íconos** (`<>` de Editor, un engrane de Configuración, un reloj) y una lista de
archivos donde aparece **`Código.gs`**.

> **Ponerle nombre al proyecto es opcional.** Si arriba a la izquierda dice *Proyecto sin
> título*, puedes hacer clic y cambiarlo por `Formulario de ruta`. Si dice otra cosa o no lo
> encuentras, déjalo así: el nombre no afecta en nada el funcionamiento.

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
   - *Descripción*: `Version 1 - envio inicial y final`
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
2. Elige un nombre de la lista. Como esa persona no ha mandado nada hoy, te debe salir el
   **envío inicial**.
3. Llénalo y envíalo.
4. Revisa la hoja: debe haber aparecido una pestaña nueva llamada **`Respuestas_Form`** con tu
   renglón.
5. Vuelve a abrir la liga y elige **el mismo nombre**. Ahora te debe salir el **envío final**,
   mostrando arriba el SPR y el KM inicial que capturaste.
6. Llénalo y envíalo. El renglón se completa: no se crea uno nuevo.
7. Abre la liga una tercera vez con ese nombre. Debe decir que ya estás al corriente.

Prueba también que **no** te deje enviar:

| Prueba | Qué debe pasar |
|---|---|
| Dejar un campo vacío | Lo marca en rojo y no envía |
| Hora de salida antes que la de llegada | Marca que las horas no van en orden |
| `Entregados` + `Devoluciones` distinto del SPR | Te dice cuánto suman y cuánto deberían |
| `No visitado` + `Visitado` distinto de las devoluciones | Marca el descuadre |
| `KM final` menor que el inicial | No lo acepta |

En el envío final, las cuentas se van calculando mientras escribes: aparece en verde cuando
cuadra y en naranja cuando no, sin tener que intentar enviar.

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
| La lista de drivers sale vacía | Ningún renglón dice `ACTIVO` en la columna `STATUS` |
| Los choferes ven una pantalla de inicio de sesión | En el paso 5, *Quién tiene acceso* no quedó en **Cualquier usuario** |
