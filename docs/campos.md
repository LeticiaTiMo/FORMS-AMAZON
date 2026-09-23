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
| **Inicial** | Al arrancar la ruta | 13 |
| **Final** | Al terminar la ruta | 7 |

Los choferes usan **una sola liga**. Al entrar eligen su nombre y la pantalla decide qué
mostrarles según lo que ya hayan mandado ese día: el envío inicial, el final, o el aviso de que
ya están al corriente. Así no tienen que recordar cuál les toca ni manejar dos direcciones.

---

## Envío inicial

| # | Campo | Col | Tipo | Obligatorio | Opciones / regla |
|---|---|---|---|---|---|
| 1 | CEDIS | F | Lista | Sí | DMT3, DMT6, DMT4, DMT2, DTR1 |
| 2 | DRIVER | G | Lista | Sí | Pestaña `OPERADORES`, solo activos |
| 3 | La ruta tiene auxiliar | I | Lista | Sí | `Sí` / `NO` |
| 4 | NOMBRE (auxiliar) | J | Lista | Solo si el anterior es `Sí` | **Misma lista que DRIVER** |
| 5 | Placas | K | Texto libre | Sí | Cambian seguido, por eso no es lista |
| 6 | HR LLEGADA BO | N | Hora | Sí | |
| 7 | HR ENTRADA BO | O | Hora | Sí | No anterior a HR LLEGADA BO |
| 8 | HR SALIDA BOD | P | Hora | Sí | No anterior a HR ENTRADA BO |
| 9 | HR PE | Q | Hora | Sí | No anterior a HR SALIDA BOD |
| 10 | ZONA DE RUTA | S | Texto libre | Sí | Ver *Zonas* abajo |
| 11 | ID Ruta | T | Texto libre | Sí | Cambia seguido, por eso no es lista |
| 12 | SPR | U | Entero | Sí | Mayor o igual a 0 |
| 13 | KM INICIAL | Z | Entero | Sí | Mayor o igual a 0 |

## Envío final

| # | Campo | Col | Tipo | Obligatorio | Opciones / regla |
|---|---|---|---|---|---|
| 1 | HR UE | R | Hora | Sí | No anterior a HR PE |
| 2 | Entregados | V | Entero | Sí | |
| 3 | Devoluciones | W | Entero | Sí | Lo escribe el chofer |
| 4 | No visitado | X | Entero | Sí | |
| 5 | Visitado | Y | Entero | Sí | |
| 6 | KM FINAL | AA | Entero | Sí | No menor que KM INICIAL |
| 7 | MOTIVO | AD | Texto | No | Por qué hubo devoluciones |

**`Devoluciones` es como los choferes le llaman a lo que la hoja registra en la columna
`Fallidas`.** Es el mismo dato: la pantalla usa la palabra de ellos y el espejo lo deja en la
columna que le corresponde.

### Las dos cuentas que deben cuadrar

```
Entregados + Devoluciones = SPR
No visitado + Visitado   = Devoluciones
```

Ambas se bloquean en el envío: si no cuadran, no deja mandar. Además la pantalla las va
calculando mientras el chofer escribe, para que corrija antes de intentar enviar.

Se verificaron contra el histórico antes de imponerlas:

| Regla | Registros evaluables | Cuadran |
|---|---|---|
| `Entregados + Devoluciones = SPR` | 2,053 | **2,053 (100%)** |
| `No visitado + Visitado = Devoluciones` | 368 | 358 |

Los 10 casos que no cuadran no se contradicen: traen devoluciones con el desglose en cero, o
sea que no lo llenaron. Y ahí está lo importante — **solo 368 de 2,053 registros traen el
desglose**. El 82% de las veces nadie lo capturó. Volverlo obligatorio cierra ese hueco.

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

Solo dos campos son lista desplegable. El resto es escritura libre.

| Lista | De dónde sale |
|---|---|
| DRIVER y NOMBRE (auxiliar) | Pestaña `OPERADORES`, columna `NOMBRE DEL DRIVER` |
| CEDIS | Fijo en configuración — solo 5 valores y no cambian |

### Choferes activos

La pestaña `OPERADORES` tiene 84 operadores, de los cuales **solo 23 están activos**. Se
distinguen por la columna `STATUS` (columna D), con los valores `ACTIVO` y `BAJA`.

El desplegable muestra únicamente los `ACTIVO`. Sin ese filtro ofrecería 61 nombres de gente
que ya no trabaja ahí.

### Zonas, rutas y placas

`ZONA DE RUTA`, `ID Ruta` y `Placas` son **escritura libre**, porque cambian seguido y una
lista cerrada quedaría desactualizada. Es una decisión de operación, tomada sabiendo lo que
cuesta.

Y cuesta: el histórico tiene **50 valores distintos para unas 20 zonas reales**. Conviven
`San Jerónimo`, `San Jeronimo` y `San Jemo`; `Cumbres` y `Cumbres ` con espacio al final;
`San Pedro`, `San Pedro ` y `San Pédro`.

Lo único que se hace al respecto es **recortar los espacios** de sobra al guardar, que son la
causa de duplicados como `Cumbres` contra `Cumbres `. Lo demás queda a criterio de quien
escribe.

Si algún día el desorden estorba más que la flexibilidad, la salida no es volverlos lista
cerrada sino ofrecer sugerencias a partir de lo ya capturado, que corrige sin estorbar.

---

## Puntos abiertos

1. **`HR SALIDA BOD` aparece en los dos envíos.** Está listada tanto en el inicial como en el
   final. Se asume inicial hasta que se confirme.

2. **La fecha la captura Leticia a mano**, pero el formulario la necesita como llave para
   juntar el envío inicial con el final del mismo chofer. El formulario registra su propia
   fecha de envío para ese fin.

3. **El espejo a `BD_AMAZON` está pendiente.** Hoy el formulario solo escribe en
   `Respuestas_Form`. Se conecta con la hoja de control cuando los dos envíos estén probados
   en operación real.
