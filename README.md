# FORMS-AMAZON — Captura por Formulario

Pantalla web para que los choferes de **BDB Logística** reporten su ruta (mañana y tarde)
y el dato caiga solo, ya limpio, en Google Sheets.

Sustituye el proceso actual de cazar reportes en grupos de WhatsApp y pasarlos a mano,
celda por celda, a la hoja de control.

| | Hoy | Meta |
|---|---|---|
| Tiempo de captura | 60 min diarios, 6 días por semana (~24 h al mes) | 0 min |
| Calidad del dato | Texto libre por WhatsApp, incompleto o ambiguo | Campos obligatorios y listas cerradas |
| Identificación del chofer | Adivinar quién es quién | Lista desplegable, nombre exacto |

---

## Cómo funciona

1. El chofer abre la pantalla desde un acceso directo en su celular.
2. Elige su nombre de una **lista cerrada** (viene de la hoja de choferes) y captura su turno.
3. La pantalla **no lo deja enviar** si falta un dato obligatorio.
4. Apps Script guarda el envío crudo en la hoja de **Respuestas** y refleja el renglón
   ya formateado en la **hoja de control**, en la pestaña del Cedis que corresponda.

No usa Inteligencia Artificial. Todo el proceso corre con reglas fijas, sin costo por peticiones.

---

## Decisiones de arquitectura

Estas decisiones están cerradas. Si alguna cambia, se actualiza aquí primero.

### Tecnología: Google Apps Script

La pantalla es HTML servido por Apps Script, que escribe directo en las hojas.
Se eligió sobre un backend propio porque no requiere hosting de pago ni mantenimiento de
servidor, y porque se instala como acceso directo en el celular del chofer sin pasar por
una tienda de aplicaciones.

El código vive en este repositorio y se sincroniza con Google mediante `clasp`.

### Un renglón por chofer y por día

El envío de la **mañana crea** el renglón. El envío de la **tarde completa ese mismo
renglón**, buscándolo por la llave `chofer + fecha`.

Se eligió sobre "un renglón por turno" porque los cálculos cruzan ambos turnos
(por ejemplo `devoluciones = cargados − entregados`) y así salen solos en el mismo renglón,
sin tener que cruzar dos filas después.

### Respuestas crudas + espejo automático al control

El formulario escribe primero en una hoja de **Respuestas**, que queda como respaldo
intacto de lo que mandó el chofer. Un proceso automático refleja ese dato, ya formateado,
en la **hoja de control**.

Se eligió sobre escribir directo al control para conservar el dato original: si el espejo
falla o alguien edita el control por error, el envío del chofer sigue ahí para reconstruirlo.
El resultado para operaciones es el mismo — cero copiar y pegar.

### Identidad del chofer: solo lista desplegable

El chofer se identifica eligiendo su nombre de la lista, sin contraseña ni NIP,
tal como lo plantea el documento original del proyecto.

**Riesgo aceptado:** nada impide técnicamente que un chofer reporte a nombre de otro.
Se prioriza que la capacitación sea mínima y el uso diario rápido. Si más adelante aparece
ese problema, la ruta de solución es agregar un NIP de 4 dígitos por chofer.

---

## Fuentes de datos

| Dato | Dónde vive | Quién lo llena | Frecuencia |
|---|---|---|---|
| Reportes de ruta (horas, KM, SPR) | Esta pantalla | Choferes | 2 veces al día |
| Lista de choferes | Google Sheets | Leticia / Miguel | Al dar de alta un chofer nuevo |

La **lista de choferes es la fuente de verdad** del desplegable. Para dar de alta o de baja
a un chofer se edita esa hoja, no el código.

---

## Documentación

| Documento | Para qué |
|---|---|
| [docs/paso-a-produccion.md](docs/paso-a-produccion.md) | Qué hacer para instalarlo en la hoja real |
| [docs/instalacion.md](docs/instalacion.md) | La instalación paso a paso, con las fallas conocidas |
| [docs/campos.md](docs/campos.md) | Qué pregunta el formulario y a qué columna va cada dato |

---

## Calendario

El documento original numera las semanas del 3 al 6. Aquí se listan en orden de ejecución.

| Etapa | Objetivo | Cómo se sabe que quedó lista |
|---|---|---|
| 1 — El PMV | Pantalla con los campos de la mañana, escribiendo en Google Sheets | Llenas el formulario en tu celular y el renglón aparece al instante |
| 2 — Que aguante | Campos de la tarde, listas obligatorias y cálculos automáticos | Mandas un reporte incompleto y la pantalla no te deja enviarlo |
| 3 — Que lo use otro | Acceso directo instalado en el celular de 2 choferes de confianza | Los 2 mandan mañana y tarde sin ayuda |
| 4 — Que se defienda | Capacitación al resto y una semana de operación real | El tiempo de captura baja de 60 min a 0 min diarios |

**Riesgo principal:** que los choferes se resistan al cambio o argumenten fallas de la
pantalla para seguir usando el grupo de WhatsApp.

**Para después:** que la hoja avise automáticamente quién no ha entregado antes de las 11:58 PM.

---

## Responsables

- **Choferes** — capturan su reporte.
- **Leticia** — revisa la hoja y corrige lo que no cuadre.
- **Miguel Ángel Jiménez Burton** — respaldo durante los descansos de Leticia.
