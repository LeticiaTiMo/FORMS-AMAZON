# Cómo instalar el formulario

Se hace una sola vez, desde la computadora. Toma unos 15 minutos.

No hay que instalar ningún programa: todo pasa dentro de Google.

> **Los títulos de los pasos describen qué se logra, no son nombres de botones.** Lo que hay
> que buscar en pantalla va **en negritas** dentro de cada paso.

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

El contenido sale de la carpeta **`apps-script/`** de este proyecto, la que tienes abierta en
VSCode. Vuelve al ícono de **Editor** (`<>`) en la barra izquierda de Apps Script. Vas a dejar
estos cuatro archivos:

| Archivo en el editor | De dónde se copia |
|---|---|
| `appsscript.json` | `apps-script/appsscript.json` |
| `Config.gs` | `apps-script/Config.gs` |
| `FormularioRuta.gs` | `apps-script/FormularioRuta.gs` |
| `Formulario.html` | `apps-script/Formulario.html` |

Los tres últimos son **archivos nuevos**. Ninguno reemplaza algo que ya exista.

**Cómo copiar cada uno:** ábrelo en VSCode, `Ctrl + A` para seleccionar todo, `Ctrl + C` para
copiar. En el editor de Apps Script, `Ctrl + A` para seleccionar lo que haya y `Ctrl + V` para
pegar encima.

`Formulario.html` pasa de las 700 líneas. `Ctrl + A` lo toma completo aunque no quepa en
pantalla — no hace falta bajarle con el ratón.

> ### No borres nada de lo que ya esté ahí
>
> La hoja puede traer automatizaciones que alguien escribió antes. Esta traía
> **`enviarR_SEMANAL`**, que usa Google Drive y depende de una función `crearMenu()` que vivía
> en `Código.gs`.
>
> **`Código.gs` se deja tal cual.** Por eso el archivo de este repositorio se llama
> `FormularioRuta.gs` y no `Codigo.gs`: `Código.gs` es el nombre que Google crea por defecto,
> así que ahí casi siempre hay algo. Vaciarlo rompe lo que dependía de sus funciones, y el
> síntoma aparece después, en otro archivo:
>
> ```
> ReferenceError: crearMenu is not defined
> ```

Cómo crear cada uno:

- **`appsscript.json`** ya existe. Es el único que se reemplaza. Copia su contenido a un lado
  antes, y revisa el apartado *Si el proyecto ya tenía código* más abajo.
- **`Config.gs`**: botón **+** junto a *Archivos* → **Secuencia de comandos** → nómbralo
  `Config` (el editor le pone la terminación `.gs` solo).
- **`FormularioRuta.gs`**: botón **+** → **Secuencia de comandos** → nómbralo
  `FormularioRuta`.
- **`Formulario.html`**: botón **+** → **HTML** → nómbralo `Formulario`.

Guarda con el ícono del disquete.

### Si el proyecto ya tenía código

El `appsscript.json` de este repositorio **no declara permisos** a propósito. Sin esa lista,
Apps Script los deduce solo, revisando todos los archivos del proyecto: los que necesita el
formulario y los que necesitan las automatizaciones que ya estaban.

Si en vez de eso se declara una lista fija, los permisos que no aparezcan ahí se revocan, y las
automatizaciones viejas empiezan a fallar con mensajes como:

```
Los permisos especificados no son suficientes para llamar a DriveApp.getFolderById
```

Revisa también la **zona horaria**. La de este archivo es `America/Monterrey`. Si el proyecto
traía otra, las fechas de las automatizaciones existentes se recorren.

> El nombre de cada archivo importa: el código los busca por nombre.

---

## Paso 4 · Decirle cuál es la hoja

El código no trae escrito el identificador de la hoja, porque el repositorio es público y
cualquiera podría verlo. Se guarda aparte:

1. Engrane (**Configuración del proyecto**) → hasta abajo, **Propiedades del script**.
2. Botón **Agregar propiedad de secuencia** (en algunas pantallas aparece como *Agregar
   propiedad del script* — es el mismo).
3. En *Propiedad* escribe: `ID_HOJA`
4. En *Valor* pega el identificador de tu hoja. Es el pedazo largo que va en medio de la
   dirección:

   ```
   docs.google.com/spreadsheets/d/AQUI_VA_EL_IDENTIFICADOR/edit
   ```

5. Guarda.

> El nombre tiene que ser `ID_HOJA` tal cual, en mayúsculas y con guion bajo. Escrito distinto,
> el formulario abre pero falla al leer la hoja.

> Google traduce *script* unas veces como "secuencia de comandos" y otras como "script", así
> que los textos de los botones varían entre pantallas. Si uno no coincide con esta guía, busca
> el que se le parezca.

---

## Paso 5 · Publicar la pantalla

1. Busca el **botón azul de la esquina superior derecha** del editor, junto a *Ejecutar* y
   *Depurar*. Dice **Implementar** (a veces *Desplegar*). Haz clic y elige
   **Nueva implementación**.
2. En la ventana que se abre, haz clic en el **engrane** de la izquierda, junto a *Seleccionar
   tipo*, y elige **Aplicación web**.
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
| `Los permisos especificados no son suficientes para llamar a DriveApp...` | El `appsscript.json` declara una lista fija de permisos que no cubre a las automatizaciones que ya existían. Quítale el bloque `oauthScopes` para que Apps Script los deduzca solo |
| `ReferenceError: <algo> is not defined` | Se borró código que ya estaba, casi siempre el de `Código.gs`. Recupéralo del Apps Script de la hoja original, o con **Archivo → Ver historial de versiones** |
