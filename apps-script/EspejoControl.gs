/**
 * Pasa los reportes de Respuestas_Form a BD_AMAZON.
 * Se dispara a mano desde el menu, no solo, para que Leticia decida cuando.
 *
 * Trabaja en dos tiempos, igual que el chofer: por la maniana crea el renglon
 * con lo que haya, y por la tarde completa ese mismo renglon en vez de crear
 * otro. Para lograrlo guarda en FILA_CONTROL el numero de renglon donde quedo.
 */

/**
 * El renglon llega hasta AA y ni una columna mas. De AB en adelante viven
 * formulas ya extendidas hacia abajo, asi que escribir ahi, aunque fuera una
 * celda vacia, las borraria.
 */
const ULTIMA_COLUMNA_ESPEJO = 'AA';

/** El mismo que ya traen las columnas de hora de BD_AMAZON. */
const FORMATO_HORA_CONTROL = 'h:mm:ss AM/PM';

function columnaANumero(letra) {
  let n = 0;
  for (let i = 0; i < letra.length; i++) {
    n = n * 26 + (letra.charCodeAt(i) - 64);
  }
  return n;
}

/**
 * BD_AMAZON guarda las horas como fraccion del dia porque les hace cuentas
 * (PROD_HORA y OHR multiplican diferencias por 24). Un texto "09:30" ahi
 * rompe esas formulas en silencio.
 */
function aFraccionDeDia(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  if (valor instanceof Date) {
    return (valor.getHours() * 60 + valor.getMinutes()) / 1440;
  }
  const partes = String(valor).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!partes) return valor;
  return (parseInt(partes[1], 10) * 60 + parseInt(partes[2], 10)) / 1440;
}

function vacio(valor) {
  return valor === '' || valor === null || valor === undefined;
}

/**
 * Donde termina el dato de verdad, que no es donde termina la hoja: las
 * formulas de AE a AG estan extendidas miles de filas por debajo del ultimo
 * reporte, asi que getLastRow apunta al vacio. Se busca por la columna del
 * driver, que solo tiene algo cuando hay un reporte real.
 */
function primeraFilaLibre(control) {
  const columnaLlave = columnaANumero(ESPEJO_INICIAL.DRIVER);
  const valores = control.getRange(1, columnaLlave, control.getMaxRows(), 1).getValues();
  for (let f = valores.length - 1; f >= 0; f--) {
    if (String(valores[f][0] || '').trim()) return f + 2;
  }
  return 2;
}

function valorParaControl(clave, valor) {
  return COLUMNAS_HORA.indexOf(clave) !== -1 ? aFraccionDeDia(valor) : valor;
}

function armarRenglon(datos) {
  const renglon = new Array(columnaANumero(ULTIMA_COLUMNA_ESPEJO)).fill('');

  [ESPEJO_INICIAL, ESPEJO_FINAL].forEach(function (mapa) {
    Object.keys(mapa).forEach(function (clave) {
      if (vacio(datos[clave])) return;
      renglon[columnaANumero(mapa[clave]) - 1] = valorParaControl(clave, datos[clave]);
    });
  });

  return renglon;
}

/**
 * Entregados y lo que dependa de columnas de la tarde. Se escribe hasta que
 * llega el envio final porque antes no existe el dato del que salen.
 */
function escribirFormulasFinales(control, filaControl) {
  Object.keys(ESPEJO_FORMULAS_FINAL).forEach(function (letra) {
    control.getRange(filaControl, columnaANumero(letra))
      .setFormula(ESPEJO_FORMULAS_FINAL[letra].replace(/\{f\}/g, String(filaControl)));
  });
}

/**
 * Escribe lo de la tarde sobre un renglon que ya existe, celda por celda:
 * las columnas del envio final no van seguidas y entre ellas hay formulas,
 * asi que un bloque las borraria.
 */
function completarRenglon(control, filaControl, datos) {
  Object.keys(ESPEJO_FINAL).forEach(function (clave) {
    if (vacio(datos[clave])) return;
    const celda = control.getRange(filaControl, columnaANumero(ESPEJO_FINAL[clave]));
    celda.setValue(valorParaControl(clave, datos[clave]));
    if (COLUMNAS_HORA.indexOf(clave) !== -1) celda.setNumberFormat(FORMATO_HORA_CONTROL);
  });

  escribirFormulasFinales(control, filaControl);
}

function darFormatoHoras(control, primeraFila, cuantos) {
  COLUMNAS_HORA.forEach(function (clave) {
    const letra = ESPEJO_INICIAL[clave] || ESPEJO_FINAL[clave];
    control.getRange(primeraFila, columnaANumero(letra), cuantos, 1)
      .setNumberFormat(FORMATO_HORA_CONTROL);
  });
}

function clasificarReportes(respuestas) {
  const nuevos = [];
  const porCompletar = [];
  let sinCerrar = 0;

  if (respuestas.getLastRow() < 2) {
    return { nuevos: nuevos, porCompletar: porCompletar, sinCerrar: sinCerrar };
  }

  const valores = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues();
  const i = {};
  COLUMNAS.forEach(function (c, n) { i[c] = n; });

  for (let f = 0; f < valores.length; f++) {
    const fila = valores[f];
    if (!String(fila[i.MARCA_TIEMPO_INICIAL] || '').trim()) continue;

    const datos = {};
    COLUMNAS.forEach(function (c, n) { datos[c] = fila[n]; });

    const filaControl = parseInt(fila[i.FILA_CONTROL], 10);
    const tieneFinal = !!String(fila[i.MARCA_TIEMPO_FINAL] || '').trim();
    const finalEspejado = !!String(fila[i.ESPEJADO_FINAL] || '').trim();

    if (!filaControl) {
      nuevos.push({ numeroFila: f + 2, datos: datos, tieneFinal: tieneFinal });
      if (!tieneFinal) sinCerrar++;
    } else if (tieneFinal && !finalEspejado) {
      porCompletar.push({ numeroFila: f + 2, datos: datos, filaControl: filaControl });
    } else if (!tieneFinal) {
      sinCerrar++;
    }
  }

  return { nuevos: nuevos, porCompletar: porCompletar, sinCerrar: sinCerrar };
}

function vaciarAControl() {
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(30000)) {
    return { ok: false, mensaje: 'El sistema está ocupado. Intenta de nuevo en unos segundos.' };
  }

  try {
    const libro = hoja();

    const respuestas = libro.getSheetByName(CONFIG.PESTANAS.respuestas);
    if (!respuestas) {
      return { ok: false, mensaje: 'Todavía no hay reportes: falta la pestaña ' + CONFIG.PESTANAS.respuestas + '.' };
    }

    const control = libro.getSheetByName(CONFIG.PESTANAS.control);
    if (!control) {
      return { ok: false, mensaje: 'No existe la pestaña ' + CONFIG.PESTANAS.control + '.' };
    }

    const clasificados = clasificarReportes(respuestas);
    const nuevos = clasificados.nuevos;
    const porCompletar = clasificados.porCompletar;

    if (!nuevos.length && !porCompletar.length) {
      return {
        ok: true,
        mensaje: clasificados.sinCerrar
          ? 'No hay nada nuevo que vaciar. Hay ' + clasificados.sinCerrar + ' rutas en curso, ya reflejadas en el control.'
          : 'No hay reportes nuevos que vaciar.',
      };
    }

    const marca = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const colFila = COLUMNAS.indexOf('FILA_CONTROL') + 1;
    const colInicial = COLUMNAS.indexOf('ESPEJADO_INICIAL') + 1;
    const colFinal = COLUMNAS.indexOf('ESPEJADO_FINAL') + 1;

    if (nuevos.length) {
      const primeraFila = primeraFilaLibre(control);
      const renglones = nuevos.map(function (n) { return armarRenglon(n.datos); });

      control.getRange(primeraFila, 1, renglones.length, renglones[0].length).setValues(renglones);
      darFormatoHoras(control, primeraFila, renglones.length);

      nuevos.forEach(function (n, orden) {
        const filaControl = primeraFila + orden;
        respuestas.getRange(n.numeroFila, colFila).setValue(filaControl);
        respuestas.getRange(n.numeroFila, colInicial).setValue(marca);

        // Llego ya cerrado, asi que el renglon nace completo.
        if (n.tieneFinal) {
          escribirFormulasFinales(control, filaControl);
          respuestas.getRange(n.numeroFila, colFinal).setValue(marca);
        }
      });
    }

    porCompletar.forEach(function (p) {
      completarRenglon(control, p.filaControl, p.datos);
      respuestas.getRange(p.numeroFila, colFinal).setValue(marca);
    });

    const partes = [];
    if (nuevos.length) partes.push(nuevos.length + ' reportes nuevos');
    if (porCompletar.length) partes.push(porCompletar.length + ' completados con lo de la tarde');

    let mensaje = 'Listo: ' + partes.join(' y ') + '.';
    if (clasificados.sinCerrar) {
      mensaje += '\n\n' + clasificados.sinCerrar + ' rutas siguen en curso. Su renglón ya está en ' +
        CONFIG.PESTANAS.control + ', y se completa solo cuando el chofer mande su reporte final y vuelvas a vaciar.';
    }
    mensaje += '\n\nFaltan por capturar a mano: semana, mes, periodo, captura, fecha, tipo de vehículo, tipo de servicio y tipo de ruta.';

    return { ok: true, nuevos: nuevos.length, completados: porCompletar.length, mensaje: mensaje };
  } catch (e) {
    return { ok: false, mensaje: 'Error al vaciar: ' + e.message };
  } finally {
    candado.releaseLock();
  }
}

/**
 * Lo que llama el menu.
 * Corriendo desde el editor no hay interfaz que avisar y getUi() truena, asi
 * que en ese caso el resultado se manda al registro. El vaciado ya ocurrio
 * para entonces: solo cambia por donde se entera uno.
 */
function vaciarReportesDesdeMenu() {
  const resultado = vaciarAControl();

  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      resultado.ok ? 'Reportes vaciados' : 'No se pudo vaciar',
      resultado.mensaje,
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(resultado.mensaje);
  }

  return resultado;
}

/**
 * Agrega el menu del formulario. Se instala como activador al abrir en vez de
 * definir un onOpen propio, porque el proyecto ya tiene el suyo y dos
 * funciones con el mismo nombre se pisan.
 */
function crearMenuFormulario() {
  SpreadsheetApp.getUi()
    .createMenu('Formulario de ruta')
    .addItem('Vaciar reportes a ' + CONFIG.PESTANAS.control, 'vaciarReportesDesdeMenu')
    .addToUi();
}
