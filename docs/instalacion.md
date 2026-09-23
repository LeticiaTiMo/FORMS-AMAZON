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

## Paso 2 · Agregar los cuatro archivos

El contenido sale de la carpeta **`apps-script/`** de este proyecto, la que tienes abierta en
VSCode. Son **cuatro archivos nuevos**, y ninguno reemplaza nada de lo que ya exista:

| Archivo que vas a crear | Para qué sirve |
|---|---|
| `Config.gs` | Los ajustes: pestañas, catálogos y a qué columna va cada dato |
| `FormularioRuta.gs` | La pantalla que usan los choferes y el guardado |
| `EspejoControl.gs` | Pasar los reportes a `BD_AMAZON` |
| `Formulario.html` | El diseño de la pantalla |

> **`appsscript.json` no se toca.** Ese archivo declara los permisos de *todo* el proyecto, y
> reemplazarlo revoca los que necesitaban las automatizaciones que ya estaban. No hace falta:
> los ajustes del formulario (*Ejecutar como* y *Quién tiene acceso*) se eligen en la ventana
> de implementación del Paso 5.
>
> El `apps-script/appsscript.json` de este repositorio queda solo como referencia, por si
> alguna vez se monta el formulario en un proyecto vacío.

### Cómo crear cada uno

Para los cuatro es el mismo movimiento, con el botón **+** que está junto a la palabra
*Archivos*, arriba en la lista de la izquierda:

| Archivo | Tipo que eliges en el **+** | Nombre que le pones |
|---|---|---|
| `Config.gs` | Secuencia de comandos | `Config` |
| `FormularioRuta.gs` | Secuencia de comandos | `FormularioRuta` |
| `EspejoControl.gs` | Secuencia de comandos | `EspejoControl` |
| `Formulario.html` | HTML | `Formulario` |

**Escribe el nombre sin la terminación**: el editor le agrega `.gs` o `.html` solo. Si escribes
`EspejoControl.gs`, el archivo termina llamándose `EspejoControl.gs.gs`. No rompe nada, pero se
ve raro.

El nombre de `Formulario` sí importa: el código lo busca por nombre, así que un dedazo ahí lo
rompe.

Ya creado el archivo, ábrelo en VSCode, `Ctrl + A`, `Ctrl + C`, y pégalo en el archivo vacío
que acabas de crear en Apps Script.

`Formulario.html` pasa de las 700 líneas. `Ctrl + A` lo toma completo aunque no quepa en
pantalla — no hace falta bajarle con el ratón. Ojo: el archivo nuevo ya trae unas líneas de
ejemplo; bórralas antes de pegar.

Guarda con el ícono del disquete.

> ### No borres nada de lo que ya estaba
>
> **`Código.gs` se deja tal cual, aunque parezca que sobra.** Esta hoja traía ahí una función
> `crearMenu()` de la que dependía `enviarR_SEMANAL`.
>
> Vaciarlo rompe lo que usaba sus funciones, y lo peor es que el síntoma no aparece donde lo
> causaste, sino después y en otro archivo:
>
> ```
> ReferenceError: crearMenu is not defined
> ```
>
> Por eso el archivo de este repositorio se llama `FormularioRuta.gs` y no `Codigo.gs`:
> `Código.gs` es el nombre que Google crea por defecto, así que ahí casi siempre hay algo.

---

## Paso 3 · Decirle cuál es la hoja

El código no trae escrito el identificador de la hoja, porque el repositorio es público y
cualquiera podría verlo. Se guarda aparte:

1. Engrane (**Configuración del proyecto**) → hasta abajo, **Propiedades del script**.
2. Botón **Agregar propiedad de secuencia** (en algunas pantallas aparece como *Agregar
   propiedad del script* — es el mismo).
3. En *Propiedad* escribe: `ID_HOJA`
4. En *Valor* va el identificador de la hoja. Para sacarlo, cámbiate a la pestaña del navegador
   donde tienes **la hoja de cálculo** y mira su dirección:

   ```
   https://docs.google.com/spreadsheets/d/1ABCdef456GHI789jkl/edit#gid=0
                                          └────────────────┘
                                           solo este pedazo
   ```

   Copia únicamente lo que va **entre `/d/` y `/edit`**.

5. Guarda.

> ### No confundas esta dirección con la del script
>
> El editor de Apps Script también tiene un código largo en su dirección, y **no sirve**:
>
> | | |
> |---|---|
> | ❌ No es | `script.google.com/u/0/home/projects/1Xzsox.../settings` |
> | ✅ Sí es | el pedazo entre `/d/` y `/edit` de `docs.google.com/spreadsheets/d/...` |
>
> Si te equivocas, el formulario abre pero al cargar dice:
>
> ```
> Illegal spreadsheet id or key
> ```
>
> Se arregla corrigiendo el valor y guardando. No hay que volver a implementar: las propiedades
> del script se leen en el momento.

> El nombre tiene que ser `ID_HOJA` tal cual, en mayúsculas y con guion bajo. Escrito distinto,
> el formulario abre pero falla al leer la hoja.

> Google traduce *script* unas veces como "secuencia de comandos" y otras como "script", así
> que los textos de los botones varían entre pantallas. Si uno no coincide con esta guía, busca
> el que se le parezca.

---

## Paso 4 · Poner el menú para vaciar al control

El formulario escribe en `Respuestas_Form`. De ahí a `BD_AMAZON` pasa cuando tú lo decides,
desde un menú de la hoja. Para que ese menú aparezca:

1. Barra lateral izquierda → ícono de **reloj** (*Activadores*).
2. Abajo a la derecha: **Agregar activador**.
3. Llénalo así:
   - *Función que se ejecutará*: **`crearMenuFormulario`**
   - *Implementación*: **Head**
   - *Origen del evento*: **Desde hoja de cálculo**
   - *Tipo de evento*: **Al abrir**
4. **Guardar**. Puede pedirte autorizar de nuevo; acepta.

Recarga la hoja de cálculo. Junto a *Ayuda* debe aparecer el menú **Formulario de ruta**.

> Se usa un activador en lugar de agregar una línea al `Código.gs` que ya existe, porque un
> proyecto no admite dos funciones `onOpen`: la segunda pisa a la primera y el menú que ya
> estaba deja de salir. El activador convive con lo que haya.

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

**Guardar no basta.** La liga de los choferes sirve una *versión congelada* del proyecto, no lo
que está guardado en el editor. Mientras no publiques una versión nueva, ellos siguen viendo la
anterior aunque tú ya veas el cambio en el código.

No se crea una implementación nueva, se actualiza la que ya existe, para que la liga no cambie:

1. **Implementar → Administrar implementaciones**
2. Ícono de **lápiz** (editar)
3. En el desplegable **Versión**, elige **Nueva versión** ← este es el paso que se salta fácil
4. **Implementar**

Si dejas *Versión* en la que ya estaba, el botón funciona pero no publica nada nuevo.

---

## Si algo falla

| Lo que ves | Qué revisar |
|---|---|
| `Falta configurar ID_HOJA` | El paso 4 quedó incompleto o el nombre tiene un error de dedo |
| `No existe la pestania "OPERADORES"` | El nombre de la pestaña cambió |
| `OPERADORES no tiene la columna...` | Falta el encabezado `NOMBRE DEL DRIVER` en la fila 1 |
| La lista de drivers sale vacía | Ningún renglón dice `ACTIVO` en la columna `STATUS` |
| Los choferes ven una pantalla de inicio de sesión | En el Paso 5, *Quién tiene acceso* no quedó en **Cualquier usuario** |
| `Illegal spreadsheet id or key` | `ID_HOJA` trae la dirección del proyecto de Apps Script, no la de la hoja. Ver Paso 3 |
| `Los permisos especificados no son suficientes para llamar a DriveApp...` | El `appsscript.json` declara una lista fija de permisos que no cubre a las automatizaciones que ya existían. Quítale el bloque `oauthScopes` para que Apps Script los deduzca solo |
| `ReferenceError: <algo> is not defined` | Se borró código que ya estaba, casi siempre el de `Código.gs`. Recupéralo del Apps Script de la hoja original, o con **Archivo → Ver historial de versiones** |
| Guardaste un cambio y la liga sigue igual | Falta publicar una versión nueva. Guardar no basta: la liga sirve una versión congelada. Ver *Cuando haya cambios en el código* |
