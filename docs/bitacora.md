# Bitácora del proyecto

Registro de cómo se construyó el formulario: qué se decidió, por qué, qué encontramos en los
datos reales y qué salió mal en el camino.

Sirve para dos cosas: que quien retome el proyecto entienda las decisiones sin tener que
volver a discutirlas, y que los errores que ya cometimos no se repitan.

Construido en una sesión de trabajo, del 20 al 25 de septiembre de 2026.

> **Sin datos sensibles a propósito.** Este repositorio es público, así que aquí no van la liga
> del formulario, los identificadores de las hojas ni los nombres de los choferes. Eso vive en
> la hoja de Google y en las propiedades del script.

---

## De dónde salió el proyecto

Leticia perdía **60 minutos diarios, seis días por semana** —unas 24 horas al mes— cazando
reportes de ruta en grupos de WhatsApp, descifrando qué quisieron decir los choferes y pasando
los datos a mano, celda por celda, a una hoja de control.

El problema no era solo el tiempo: los reportes llegaban incompletos, ambiguos, y había que
adivinar quién era quién.

La meta era bajar ese tiempo a cero.

---

## Las decisiones y su razón

### Google Apps Script, no un backend propio

Los choferes capturan desde su celular, cada quien en su ruta. Apps Script sirve la pantalla y
escribe directo en la hoja, sin hosting que pagar ni servidor que mantener, y se instala como
acceso directo sin pasar por una tienda de aplicaciones.

### Un renglón por chofer y por día

El envío de la mañana crea el renglón; el de la tarde **completa ese mismo renglón**, buscándolo
por `chofer + fecha`.

Se eligió sobre "un renglón por turno" porque los cálculos cruzan ambos turnos, así que salen
solos en la misma fila sin tener que cruzar dos después.

### Una sola liga, la pantalla decide qué mostrar

El chofer entra, elige su nombre, y la pantalla le muestra lo que le toca: el envío inicial, el
final, o el aviso de que ya está al corriente.

No tiene que recordar cuál le toca ni manejar dos direcciones. Esa fricción era justo el tipo
de cosa que los empujaría de vuelta al grupo de WhatsApp.

### Identidad por lista desplegable, sin contraseña

El chofer se identifica eligiendo su nombre, sin NIP. **Riesgo aceptado:** nada impide
técnicamente que reporte a nombre de otro. Se priorizó que la capacitación fuera mínima.

Si aparece ese problema, la salida es agregar un NIP de cuatro dígitos por chofer.

### Escritura libre en zona, ID de ruta y placas

Operaciones lo pidió así: esos tres cambian seguido y una lista cerrada envejece mal.

Se aceptó sabiendo el costo, que está medido más abajo. Se compensa acomodando mayúsculas y
juntando espacios al capturar, no cerrando la lista.

### Respuestas crudas, y de ahí al control cuando Leticia decide

El formulario escribe en `Respuestas_Form`, que queda como respaldo intacto de lo que mandó el
chofer. De ahí pasa a `BD_AMAZON` con un botón del menú.

Se prefirió sobre escribir directo al control para conservar el dato original: si el espejo
falla o alguien edita el control por error, el envío del chofer sigue ahí.

---

## Lo que encontramos en los datos

Antes de construir se revisaron los 2,237 reportes históricos. Tres hallazgos cambiaron el
diseño.

### La columna de zona estaba sucia

**50 valores distintos para unas 20 zonas reales.** Convivían `San Jerónimo`, `San Jeronimo` y
`San Jemo`; `Cumbres` y `Cumbres ` con espacio al final; `San Pedro`, `San Pedro ` y
`San Pédro`.

Es la mejor evidencia de por qué el proyecto hacía falta.

### Las reglas de aritmética se sostienen

Se verificaron contra el histórico **antes** de imponerlas en el formulario:

| Regla | Registros evaluables | Cuadran |
|---|---|---|
| `Entregados + Devoluciones = SPR` | 2,053 | **2,053 (100%)** |
| `No visitado + Visitado = Devoluciones` | 368 | 358 |

Los 10 que no cuadran no se contradicen: traen devoluciones con el desglose en cero, o sea que
no lo llenaron.

Y ahí está lo revelador: **solo 368 de 2,053 registros traen el desglose.** El 82% de las veces
nadie lo capturó. Volverlo obligatorio cierra ese hueco solo.

### De 84 operadores, 23 activos

La pestaña `OPERADORES` no distinguía activos de bajas. Sin esa distinción, el desplegable
habría ofrecido **61 nombres de gente que ya no trabaja ahí**.

Se agregó la columna `STATUS`.

---

## Los errores que cometimos

Se dejan escritos porque son los que más probablemente se repitan.

### Dimos por hecho que el proyecto de Apps Script estaba vacío

No lo estaba. La hoja traía `enviarR_SEMANAL`, una automatización en uso, y una función
`crearMenu()` en `Código.gs`.

La guía decía que se vaciara `Código.gs` y se reemplazara `appsscript.json`. Las dos cosas
rompieron lo que ya existía:

- Reemplazar el manifiesto **revocó el permiso de Drive** que necesitaba `enviarR_SEMANAL`.
- Vaciar `Código.gs` borró `crearMenu()`, y el error apareció después y en otro archivo:
  `ReferenceError: crearMenu is not defined`.

**Qué cambió:** el archivo del formulario se llama `FormularioRuta.gs` y no `Codigo.gs`, para no
chocar con el que Google crea por defecto. El manifiesto ya no se toca: los ajustes del
formulario se eligen en la ventana de implementación.

**La lección:** revisar qué código ya vive en el proyecto antes de tocar nada. Se salvó porque
las pruebas se hacían sobre una copia, no sobre la hoja real.

### `getLastRow()` apuntaba treinta mil filas abajo

Las fórmulas de `PERFORMANCE`, `PROD_HORA` y `OHR` están extendidas hasta la fila 34,085, muy
por debajo del último reporte real (2,238).

`getLastRow()` las sigue, así que el espejo habría escrito los reportes en medio de la nada.
Ahora busca la última fila con driver, que solo tiene algo cuando hay un reporte de verdad.

### Casi borramos las fórmulas del control

Cinco columnas de `BD_AMAZON` son fórmulas. Si el espejo hubiera escrito números ahí, la hoja
habría dejado de recalcular **sin que nadie se diera cuenta** hasta que las cuentas empezaran a
no cuadrar.

El espejo escribe de `F` a `AA` y ni una celda más.

### Publicar no es guardar

El tropiezo que más veces se repitió. La liga sirve una **versión congelada** del proyecto: se
guarda un cambio, se prueba, no aparece, y parece que el código está mal cuando en realidad ni
siquiera se está ejecutando.

Hay que publicar versión nueva sobre la implementación existente, para que la liga no cambie.

---

## Lo que no se pudo hacer

### Publicar solo en el grupo de WhatsApp

Se pidió que los reportes aparecieran automáticamente en el grupo. **No es posible por vías
oficiales:** la API de WhatsApp Business manda mensajes a números individuales, nunca a grupos.

Hacerlo exigiría una librería no oficial, un servidor encendido todo el día y un número que
Meta puede bloquear sin aviso ni forma de recuperarlo.

**La solución:** un botón en la pantalla de confirmación que abre WhatsApp con el mensaje ya
escrito. El chofer elige el grupo y envía.

Da un toque más, pero encaja mejor con el propósito, que era que el chofer tuviera comprobante:
el mensaje sale a su nombre y con su hora. Y lo importante se conserva — **el texto lo arma el
sistema**, así que ya no puede salir incompleto ni ambiguo, que era el problema original.

---

## Qué quedó pendiente

- **Instalar en producción.** Ver [paso-a-produccion.md](paso-a-produccion.md).
- **Extender la fórmula de `KM RECORRIDOS`** (columna `AB`), que termina junto con el dato.
- **Medir el tiempo real** después de la primera semana, contra los 60 minutos de antes.
- **El aviso automático** de quién no ha entregado antes de las 11:58 PM, que el documento
  original dejaba "para el futuro".

---

## Cómo está organizado el repositorio

| Archivo | Qué contiene |
|---|---|
| `apps-script/Config.gs` | Los ajustes: pestañas, catálogos, a qué columna va cada dato |
| `apps-script/FormularioRuta.gs` | La pantalla del chofer, validación y guardado |
| `apps-script/EspejoControl.gs` | El paso de `Respuestas_Form` a `BD_AMAZON` |
| `apps-script/Formulario.html` | El diseño de la pantalla |
| `docs/campos.md` | Qué pregunta el formulario y qué valida |
| `docs/instalacion.md` | Instalación paso a paso, con las fallas conocidas |
| `docs/paso-a-produccion.md` | Qué hacer para instalarlo en la hoja real |

**Todo lo configurable vive en `Config.gs`.** Si cambia una pestaña, un catálogo o el destino de
un campo, se toca ahí y no se busca por todo el código.
