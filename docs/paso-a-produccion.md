# Paso a producción

Lo que hay que hacer para pasar el formulario de la copia de pruebas a la hoja real.

Todo lo que sigue ya se probó en la copia. Esta guía no repite lo que explica
[instalacion.md](instalacion.md), sino que la ordena para el caso específico de producción y
marca los puntos donde algo puede salir mal.

**Calcula una hora.** No lo hagas con prisa ni el día que corre el reporte semanal.

---

## Antes de tocar nada

### 1. Escoge el momento

La hoja real tiene `enviarR_SEMANAL` corriendo. Instalar no lo afecta si no tocas lo que no
debes, pero **no lo hagas el día que toca el envío semanal**: si algo sale mal, no querrás
estar arreglando dos cosas a la vez.

Lo ideal es un día de baja operación, después de que los choferes terminen sus rutas.

### 2. Agrega la columna `STATUS` a `OPERADORES`

**Esto la hoja real todavía no lo tiene.** La columna la creaste en la copia, no en el
original.

- Va en la **columna D** de la pestaña `OPERADORES`
- Encabezado en la fila 1: **`STATUS`**
- En cada chofer: **`ACTIVO`** o **`BAJA`**

Sin esta columna el formulario no se rompe, pero muestra los 84 operadores en lugar de los 23
activos, y los choferes van a poder reportar a nombre de gente dada de baja.

> Si ya la llenaste en la copia, cópiala de ahí en vez de rehacer el trabajo. Verifica que el
> orden de los nombres coincida antes de pegar.

### 3. Extiende la fórmula de `KM RECORRIDOS`

La fórmula de la columna `AB` termina en la fila 2238, junto con el dato. Las de `AE`, `AF` y
`AG` sí llegan hasta la 34085 y se llenan solas.

Arrastra la de `AB` unos miles de renglones hacia abajo. Si no, quedará vacía en todo lo que
entre por el formulario.

`V` (Entregados) **no** hay que extenderla: el espejo le escribe la fórmula al llegar el
reporte final.

---

## La instalación

Sigue [instalacion.md](instalacion.md) completa. Aquí solo van los puntos donde producción se
porta distinto de la copia.

### Paso 2 · Los cuatro archivos

Son los mismos cuatro. **El riesgo aquí es alto**, porque la hoja real tiene código en uso:

| No toques | Por qué |
|---|---|
| `Código.gs` | Tiene `crearMenu()`, de la que depende `enviarR_SEMANAL` |
| `enviarR_SEMANAL.gs` | Es tu envío semanal |
| `appsscript.json` | Declara los permisos de todo el proyecto, incluido el acceso a Drive que usa `enviarR_SEMANAL` |

Los cuatro archivos del formulario se **agregan**. Ninguno reemplaza nada.

### Paso 3 · `ID_HOJA`

**Va el identificador de la hoja real, no el de la copia.** Sácalo de la dirección de la hoja
de producción: el pedazo entre `/d/` y `/edit`.

Este es el error más fácil de cometer, porque la copia y el original se ven igual. Si te
equivocas, el formulario de producción va a escribir en la copia y nadie se va a dar cuenta
hasta que falten datos.

### Paso 5 · Publicar

Te va a dar una **liga nueva**, distinta de la de pruebas. Esa es la que se reparte.

La de la copia queda inservible para operación: apúntala en algún lado como *liga de pruebas*
para no confundirlas, o borra esa implementación.

---

## La prueba, antes de repartir nada

> **Publica versión nueva antes de probar nada.** Guardar el código no cambia lo que sirve la
> liga: eso solo pasa al publicar. Es el tropiezo que más veces se repitió durante la
> instalación en la copia, y siempre se ve igual — pruebas un cambio, no aparece, y parece que
> el código está mal cuando en realidad ni siquiera se está ejecutando.
>
> **Implementar → Administrar implementaciones →** lápiz → *Versión*: **Nueva versión**.

Con la hoja real ya conectada, haz el ciclo completo **tú misma**:

1. Manda un reporte **inicial** con tu nombre o el de alguien de confianza.
2. Revisa que apareció la pestaña `Respuestas_Form` con tu renglón.
3. **Vacía** desde el menú *Formulario de ruta*. El renglón debe aparecer en `BD_AMAZON`
   pegado al último reporte real, no miles de filas abajo.
4. Manda el reporte **final** con ese mismo nombre.
5. **Vacía otra vez.** Debe **completarse la misma fila**, no crearse una nueva.
6. Revisa que `Entregados` (columna `V`) traiga la fórmula, y que de `AB` en adelante tus
   fórmulas sigan calculando.
7. **Borra ese renglón de prueba** de `BD_AMAZON` y de `Respuestas_Form`.

Y comprueba que `enviarR_SEMANAL` sigue vivo: córrelo una vez desde el editor y verifica que
no marque error de permisos.

---

## El arranque con los choferes

### Empieza con dos

No lo abras a los 23 el primer día. Escoge **dos choferes de confianza** y que lo usen una
jornada completa. Si algo falla, falla en chiquito.

### Lo que hay que enseñarles

Tres cosas, y la primera es la que más problemas evita:

1. **Instala el acceso directo.** Abre la liga en el navegador del teléfono —no tocándola desde
   el mensaje— y agrégala a la pantalla de inicio.

   > **Entras por el ícono, no por el mensaje.** Abrir la liga dentro de WhatsApp la manda al
   > navegador interno de esa aplicación, que a veces falla con páginas de Google.

2. **Son dos reportes al día.** El inicial al arrancar la ruta y el final al terminarla. La
   pantalla sabe cuál te toca: eliges tu nombre y te muestra el que falta.

3. **Comparte siempre al grupo.** Al terminar de enviar sale el botón verde. Un toque, eliges
   el grupo, envías. Así queda tu comprobante de que sí reportaste.

### Cuida la liga

Cualquiera que la tenga puede mandar reportes: el acceso es anónimo, que es justo lo que
permite que los choferes entren sin cuenta de Google.

Mándala **directo a cada chofer**, no la pongas en grupos abiertos ni en documentos
compartidos. Si algún día se filtra, se arregla publicando una implementación nueva: la liga
vieja deja de servir.

---

## Después de la primera semana

**Mide el tiempo.** El proyecto existe para bajar de 60 minutos diarios a 0. Si sigue
tomándote tiempo, vale la pena saber en qué se va: puede ser algo que todavía se pueda
automatizar.

Cosas que van a aparecer y conviene anotar en vez de resolver sobre la marcha:

- Choferes que no reportan. El grupo te sirve de registro: quien no compartió, no reportó.
- Zonas escritas de formas distintas. Si estorba, la salida es ofrecer sugerencias, no cerrar
  la lista.
- Datos que sigues capturando a mano. Son ocho columnas; si alguna se vuelve repetitiva,
  probablemente se pueda deducir.

---

## Si algo sale mal

La tabla de fallas de [instalacion.md](instalacion.md) cubre los tropiezos conocidos, todos
salidos de la instalación en la copia.

Lo importante: **nada de esto toca tus 2,238 reportes históricos.** El formulario solo agrega
renglones al final. Si algo sale mal, se borran los renglones nuevos y todo queda como estaba.
