# Especificación de campos

Qué pregunta el formulario, a qué columna de `BD_AMAZON` va cada respuesta y qué valida.

Este archivo es la fuente de verdad del formulario. Si un campo cambia, se cambia aquí primero
y después en el código.

**Estado:** la lista de campos está cerrada. Quedan puntos abiertos al final del documento.

---

## Los dos envíos

El chofer reporta **dos veces al día**. Ambos envíos caen en el **mismo renglón**, que se
identifica por la llave `DRIVER + fecha`.

| Envío | Cuándo | Cuántos campos |
|---|---|---|
| **Inicial** | Al arrancar la ruta | 14 |
| **Final** | Al terminar la ruta | 6 |

---

## Envío inicial

| # | Campo | Col | Tipo | Obligatorio | Opciones / regla |
|---|---|---|---|---|---|
| 1 | CEDIS | F | Lista | Sí | DMT3, DMT6, DMT4, DMT2, DTR1 |
| 2 | DRIVER | G | Lista | Sí | Pestaña `OPERADORES`, solo activos |
| 3 | La ruta tiene auxiliar | I | Lista | Sí | `Sí` / `NO` |
| 4 | NOMBRE (auxiliar) | J | Lista | Solo si el anterior es `Sí` | **Misma lista que DRIVER** |
| 5 | Placas | K | Lista | Sí | Pestaña `PLACAS` |
| 6 | HR LLEGADA BO | N | Hora | Sí | |
| 7 | HR ENTRADA BO | O | Hora | Sí | No anterior a HR LLEGADA BO |
| 8 | HR SALIDA BOD | P | Hora | Sí | No anterior a HR ENTRADA BO |
| 9 | HR PE | Q | Hora | Sí | No anterior a HR SALIDA BOD |
| 10 | ZONA DE RUTA | S | Texto libre | Sí | Con sugerencias — ver *Zonas* abajo |
| 11 | ID Ruta | T | Texto libre | Sí | Cambia seguido, por eso no es lista |
| 12 | SPR | U | Entero | Sí | Mayor o igual a 0 |
| 13 | Entregados | V | Entero | Sí | Entre 0 y SPR |
| 14 | KM INICIAL | Z | Entero | Sí | Mayor o igual a 0 |

## Envío final

| # | Campo | Col | Tipo | Obligatorio | Opciones / regla |
|---|---|---|---|---|---|
| 1 | Fallidas | W | Entero | Sí | Ver punto abierto: ¿se captura o se calcula? |
| 2 | MOTIVO (COMENTARIOS) | AD | Texto largo | No | |
| 3 | No visitado | X | Por definir | Por definir | |
| 4 | Visitado | Y | Por definir | Por definir | |
| 5 | KM FINAL | AA | Entero | Sí | No menor que KM INICIAL |

---

## Lo que el formulario NO toca

**Leticia captura a mano** en la hoja de control, como hasta hoy:
`SEMANA` · `MES` · `PERIODO` · `CAPTURA` · `FECHA` · `Tipo de Vehículo` ·
`TIPO DE SERVICIO` · `Tipo de ruta`

**Salen de fórmula** y no se escriben desde el formulario:
`KM RECORRIDOS` (= KM FINAL − KM INICIAL) · `PERFORMANCE` · `PROD_HORA` · `OHR`

`FOTO RUTA` (col AC) quedó fuera de ambos envíos.

---

## Catálogos

Las listas desplegables se leen **en vivo** de la hoja, nunca del código. Para dar de alta o de
baja se edita la hoja y el formulario se entera solo.

| Lista | De dónde sale |
|---|---|
| DRIVER y NOMBRE (auxiliar) | Pestaña `OPERADORES`, columna `NOMBRE DEL DRIVER` |
| Placas | Pestaña `PLACAS`, columna A |
| CEDIS | Fijo en configuración — solo 5 valores y no cambian |

### Choferes activos

La pestaña `OPERADORES` tiene 81 nombres, pero **no todos siguen activos y hoy nada los
distingue**. Hay que agregarle una columna de estatus; sin ella el desplegable ofrecerá gente
dada de baja.

### Zonas

`ZONA DE RUTA` e `ID Ruta` son **escritura libre**, porque cambian seguido y una lista cerrada
quedaría desactualizada.

El costo de esa decisión es conocido: el histórico tiene **50 valores distintos para unas 20
zonas reales**. Conviven `San Jerónimo`, `San Jeronimo` y `San Jemo`; `Cumbres` y `Cumbres `
con espacio al final; `San Pedro`, `San Pedro ` y `San Pédro`.

Para no repetir ese desorden sin quitar la libertad de escribir:

- El campo ofrece **sugerencias** con las zonas ya usadas, pero acepta cualquier texto.
- Al guardar se **recortan los espacios** de sobra al inicio y al final, que es la causa de
  duplicados como `Cumbres` contra `Cumbres `.

---

## Puntos abiertos

1. **`HR SALIDA BOD` aparece en los dos envíos.** Está listada tanto en el inicial como en el
   final. Se asume inicial hasta que se confirme.

2. **`Entregados` quedó en el envío inicial.** No se puede saber cuántos paquetes se
   entregaron al arrancar la ruta. Probablemente pertenece al envío final.

3. **`HR UE` (hora última entrega) no aparece en ningún envío**, aunque sí es columna del
   control y sí venía en el formato de WhatsApp. Falta confirmar si se elimina o si va en el
   envío final.

4. **`Fallidas`**: falta definir si el chofer la escribe o si se calcula como
   `SPR − Entregados`.

5. **`No visitado` y `Visitado`**: vinieron vacías en toda la muestra. Falta saber qué
   significan y quién las llena.

6. **La fecha la captura Leticia a mano**, pero el formulario la necesita como llave para
   juntar el envío inicial con el final del mismo chofer. El formulario registrará su propia
   fecha de envío para ese fin.
