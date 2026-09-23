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

## El espejo a BD_AMAZON

El formulario escribe en `Respuestas_Form`. De ahí a la hoja de control pasa **cuando Leticia
lo decide**, con la opción *Vaciar reportes* del menú **Formulario de ruta**.

### Trabaja en dos tiempos, igual que el chofer

| Al vaciar | Qué hace |
|---|---|
| Un reporte que aún no está en el control | Crea el renglón con lo que haya, aunque solo tenga lo de la mañana |
| Un reporte que ya estaba, y cuyo envío final llegó después | **Completa ese mismo renglón**, no crea otro |

Así la ruta en curso ya se ve en el control desde temprano, y por la tarde se termina de llenar
sola. La columna `FILA_CONTROL` de `Respuestas_Form` es lo que hace posible reencontrar el
renglón: guarda en qué fila de `BD_AMAZON` quedó cada reporte.

### El espejo nunca pasa de la columna AA

De `AB` en adelante la hoja se llena sola con fórmulas extendidas miles de filas hacia abajo.
Escribir ahí las borraría, y el daño no se notaría hasta que las cuentas dejaran de cuadrar.

| Columnas | Quién las llena |
|---|---|
| `F`–`AA`, salvo las de abajo | El espejo, con lo que capturó el chofer |
| `A` `B` `C` `D` `E` `H` `L` `M` | Leticia, a mano |
| `V` Entregados | Fórmula de la hoja: `SPR − devoluciones` |
| `AB` en adelante | Fórmulas de la hoja |

`MOTIVO` se guarda en `Respuestas_Form` pero **no se espeja**, porque su columna (`AD`) cae
dentro de esa zona. Si hace falta consultarlo, está en la pestaña de respuestas.

`FOTO RUTA` (col `AC`) quedó fuera de ambos envíos.

### Las horas van como fracción del día

`PROD_HORA` y `OHR` multiplican diferencias de horas por 24. Un texto `"09:30"` en esas
columnas rompe ambas fórmulas sin dar error, así que el espejo convierte cada hora a la
fracción del día que la hoja espera.

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

Sin quitarle la libertad de escribir, al guardar se acomoda el texto para que la misma zona no
termine escrita de cinco formas:

| Campo | Cómo queda | El chofer escribe | Se guarda |
|---|---|---|---|
| `Placas` | Todo en mayúsculas | `pl1989b` | `PL1989B` |
| `ID Ruta` | Todo en mayúsculas | `cv13` | `CV13` |
| `ZONA DE RUTA` | Inicial de cada palabra | `SAN JERONIMO` | `San Jeronimo` |

En los tres se juntan además los espacios repetidos, que son la causa de duplicados como
`Cumbres` contra `Cumbres `.

Se hace **al capturar**, no al espejar, para que `Respuestas_Form` y la hoja de control digan
lo mismo, y para que el chofer no tenga que cuidar mayúsculas escribiendo en el celular a media
ruta.

Si algún día el desorden estorba más que la flexibilidad, la salida no es volverlos lista
cerrada sino ofrecer sugerencias a partir de lo ya capturado, que corrige sin estorbar.

---

## Puntos abiertos

1. **`HR SALIDA BOD` aparece en los dos envíos.** Está listada tanto en el inicial como en el
   final. Se asume inicial hasta que se confirme.

2. **La fecha la captura Leticia a mano**, pero el formulario la necesita como llave para
   juntar el envío inicial con el final del mismo chofer. El formulario registra su propia
   fecha de envío para ese fin.

3. **`V` (Entregados) y `AB` (KM RECORRIDOS) tienen fórmula solo hasta la fila 2238**, donde
   termina el dato. A diferencia de `AE`, `AF` y `AG`, que llegan hasta la 34085. Leticia va a
   extenderlas para que se llenen solas; mientras no lo haga, quedarán vacías en los renglones
   que agregue el espejo.
