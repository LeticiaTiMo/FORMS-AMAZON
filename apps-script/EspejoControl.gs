/**
 * Pasa los reportes de Respuestas_Form a BD_AMAZON.
 * Se dispara a mano desde el menu, no solo, para que Leticia decida cuando.
 */

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
  const texto = String(valor).trim();
  const partes = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (!partes) return texto;
  return (parseInt(partes[1], 10) * 60 + parseInt(partes[2], 10)) / 1440;
}

function reportesPendientes(h) {
  if (h.getLastRow() < 2) return [];

  const valores = h.getRange(2, 1, h.getLastRow() - 1, COLUMNAS.length).getValues();
  const iFinal = COLUMNAS.indexOf('MARCA_TIEMPO_FINAL');
  const iEspejado = COLUMNAS.indexOf('ESPEJADO');

  const listos = [];
  let incompletos = 0;

  for (let f = 0; f < valores.length; f++) {
    const fila = valores[f];
    if (!String(fila[0] || '').trim()) continue;
    if (String(fila[iEspejado] || '').trim()) continue;

    if (!String(fila[iFinal] || '').trim()) {
      incompletos++;
      continue;
    }

    const datos = {};
    COLUMNAS.forEach(function (c, i) { datos[c] = fila[i]; });
    listos.push({ numeroFila: f + 2, datos: datos });
  }

  listos.incompletos = incompletos;
  return listos;
}

function armarRenglon(datos, filaDestino, anchoControl) {
  const renglon = new Array(anchoControl).fill('');

  Object.keys(ESPEJO_VALORES).forEach(function (clave) {
    const i = columnaANumero(ESPEJO_VALORES[clave]) - 1;
    if (i >= anchoControl) return;
    const valor = datos[clave];
    renglon[i] = COLUMNAS_HORA.indexOf(clave) !== -1 ? aFraccionDeDia(valor) : valor;
  });

  Object.keys(ESPEJO_FORMULAS).forEach(function (letra) {
    const i = columnaANumero(letra) - 1;
    if (i >= anchoControl) return;
    renglon[i] = ESPEJO_FORMULAS[letra].replace(/\{f\}/g, String(filaDestino));
  });

  return renglon;
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

    const pendientes = reportesPendientes(respuestas);
    const incompletos = pendientes.incompletos || 0;

    if (!pendientes.length) {
      return {
        ok: true,
        vaciados: 0,
        incompletos: incompletos,
        mensaje: incompletos
          ? 'No hay nada que vaciar. Quedan ' + incompletos + ' reportes sin cerrar: el chofer aún no manda el final.'
          : 'No hay reportes nuevos que vaciar.',
      };
    }

    const ancho = control.getLastColumn();
    const primeraFila = control.getLastRow() + 1;

    const renglones = pendientes.map(function (p, i) {
      return armarRenglon(p.datos, primeraFila + i, ancho);
    });

    control.getRange(primeraFila, 1, renglones.length, ancho).setValues(renglones);

    const formatoHora = COLUMNAS_HORA.map(function (c) { return ESPEJO_VALORES[c]; });
    formatoHora.forEach(function (letra) {
      const col = columnaANumero(letra);
      control.getRange(primeraFila, col, renglones.length, 1).setNumberFormat('HH:mm');
    });

    const marca = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const colEspejado = COLUMNAS.indexOf('ESPEJADO') + 1;
    pendientes.forEach(function (p) {
      respuestas.getRange(p.numeroFila, colEspejado).setValue(marca);
    });

    let mensaje = 'Se vaciaron ' + renglones.length + ' reportes a ' + CONFIG.PESTANAS.control + '.';
    if (incompletos) {
      mensaje += '\n\nQuedan ' + incompletos + ' sin cerrar: el chofer aún no manda el reporte final.';
    }
    mensaje += '\n\nFaltan por capturar a mano: semana, mes, periodo, captura, fecha, tipo de vehículo, tipo de servicio y tipo de ruta.';

    return { ok: true, vaciados: renglones.length, incompletos: incompletos, mensaje: mensaje };
  } catch (e) {
    return { ok: false, mensaje: 'Error al vaciar: ' + e.message };
  } finally {
    candado.releaseLock();
  }
}

/** Lo que llama el menu. */
function vaciarReportesDesdeMenu() {
  const resultado = vaciarAControl();
  SpreadsheetApp.getUi().alert(
    resultado.ok ? 'Reportes vaciados' : 'No se pudo vaciar',
    resultado.mensaje,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Agrega el menu del formulario. Se llama aparte en vez de definir un onOpen
 * propio, porque el proyecto ya tiene el suyo y dos funciones con el mismo
 * nombre se pisan.
 */
function crearMenuFormulario() {
  SpreadsheetApp.getUi()
    .createMenu('Formulario de ruta')
    .addItem('Vaciar reportes a ' + CONFIG.PESTANAS.control, 'vaciarReportesDesdeMenu')
    .addToUi();
}
