/**
 * Servidor del formulario de captura de ruta.
 * La validacion se repite aqui aunque el navegador ya la haya hecho:
 * un envio puede llegar sin pasar por la pantalla.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Formulario')
    .setTitle('Reporte de ruta - BDB')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function hoja() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPIEDAD_ID_HOJA);
  if (!id) {
    throw new Error(
      'Falta configurar ' + CONFIG.PROPIEDAD_ID_HOJA + ' en Propiedades del Script. ' +
      'Ver docs/instalacion.md'
    );
  }
  return SpreadsheetApp.openById(id);
}

function pestana(nombre) {
  const h = hoja().getSheetByName(nombre);
  if (!h) throw new Error('No existe la pestania "' + nombre + '" en la hoja.');
  return h;
}

// --- Catalogos ---

function columnaPorEncabezado(valores, encabezado) {
  const fila = valores[0].map(function (c) { return String(c).trim().toUpperCase(); });
  return fila.indexOf(encabezado.trim().toUpperCase());
}

function driversActivos() {
  const valores = pestana(CONFIG.PESTANAS.operadores).getDataRange().getValues();
  if (valores.length < 2) return [];

  const iNombre = columnaPorEncabezado(valores, CONFIG.OPERADORES.encabezadoNombre);
  if (iNombre === -1) {
    throw new Error('OPERADORES no tiene la columna "' + CONFIG.OPERADORES.encabezadoNombre + '".');
  }
  const iEstatus = columnaPorEncabezado(valores, CONFIG.OPERADORES.encabezadoEstatus);

  const activos = [];
  for (let f = 1; f < valores.length; f++) {
    const nombre = String(valores[f][iNombre] || '').trim();
    if (!nombre) continue;

    // Sin columna de estatus se muestran todos, para no dejar el formulario
    // inservible mientras se da de alta esa columna.
    if (iEstatus !== -1) {
      const estatus = String(valores[f][iEstatus] || '').trim().toUpperCase();
      if (estatus !== CONFIG.OPERADORES.valorActivo.toUpperCase()) continue;
    }
    if (activos.indexOf(nombre) === -1) activos.push(nombre);
  }
  return activos.sort(function (a, b) { return a.localeCompare(b, 'es'); });
}

function placas() {
  const valores = pestana(CONFIG.PESTANAS.placas).getDataRange().getValues();
  const lista = [];
  for (let f = 0; f < valores.length; f++) {
    const p = String(valores[f][0] || '').trim();
    if (!p || p.toUpperCase() === 'PLACAS') continue;
    if (lista.indexOf(p) === -1) lista.push(p);
  }
  return lista.sort();
}

function obtenerCatalogos() {
  return {
    drivers: driversActivos(),
    placas: placas(),
    cedis: CONFIG.CEDIS,
    zonas: CONFIG.ZONAS_SUGERIDAS,
    campos: CAMPOS_INICIAL,
  };
}

// --- Validacion ---

function esHoraValida(v) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '').trim());
}

function aMinutos(hhmm) {
  const p = String(hhmm).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function aEntero(v) {
  const s = String(v == null ? '' : v).trim();
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

function validarInicial(datos, catalogos) {
  const errores = [];
  const limpio = {};

  CAMPOS_INICIAL.forEach(function (campo) {
    limpio[campo.clave] = String(datos[campo.clave] == null ? '' : datos[campo.clave]).trim();
  });

  const auxiliar = limpio.TIENE_AUXILIAR === 'Sí';

  CAMPOS_INICIAL.forEach(function (campo) {
    const v = limpio[campo.clave];
    const obligatorio = campo.clave === 'NOMBRE_AUXILIAR' ? auxiliar : campo.obligatorio;
    if (obligatorio && !v) errores.push('Falta ' + campo.etiqueta + '.');
  });

  if (limpio.CEDIS && catalogos.cedis.indexOf(limpio.CEDIS) === -1) {
    errores.push('CEDIS no válido.');
  }
  if (limpio.DRIVER && catalogos.drivers.indexOf(limpio.DRIVER) === -1) {
    errores.push('El driver no está en la lista de operadores activos.');
  }
  if (limpio.PLACAS && catalogos.placas.indexOf(limpio.PLACAS) === -1) {
    errores.push('La placa no está en el catálogo.');
  }
  if (['Sí', 'NO'].indexOf(limpio.TIENE_AUXILIAR) === -1) {
    errores.push('Indica si la ruta tiene auxiliar.');
  }
  if (auxiliar) {
    if (limpio.NOMBRE_AUXILIAR && catalogos.drivers.indexOf(limpio.NOMBRE_AUXILIAR) === -1) {
      errores.push('El auxiliar no está en la lista de operadores activos.');
    }
    if (limpio.NOMBRE_AUXILIAR && limpio.NOMBRE_AUXILIAR === limpio.DRIVER) {
      errores.push('El auxiliar no puede ser la misma persona que el driver.');
    }
  } else {
    limpio.NOMBRE_AUXILIAR = '';
  }

  ORDEN_HORAS.forEach(function (clave) {
    if (limpio[clave] && !esHoraValida(limpio[clave])) {
      errores.push('Hora con formato inválido en ' + clave.replace(/_/g, ' ') + '.');
    }
  });

  const todasLasHoras = ORDEN_HORAS.every(function (c) { return esHoraValida(limpio[c]); });
  if (todasLasHoras) {
    for (let i = 1; i < ORDEN_HORAS.length; i++) {
      if (aMinutos(limpio[ORDEN_HORAS[i]]) < aMinutos(limpio[ORDEN_HORAS[i - 1]])) {
        errores.push('Las horas no van en orden: revisa llegada, entrada, salida y primera entrega.');
        break;
      }
    }
  }

  const spr = aEntero(limpio.SPR);
  const km = aEntero(limpio.KM_INICIAL);

  if (limpio.SPR && spr === null) errores.push('SPR debe ser un número entero.');
  if (limpio.KM_INICIAL && km === null) errores.push('KM inicial debe ser un número entero.');

  if (spr !== null) limpio.SPR = spr;
  if (km !== null) limpio.KM_INICIAL = km;

  return { errores: errores, datos: limpio };
}

// --- Escritura ---

function asegurarPestanaRespuestas() {
  const libro = hoja();
  let h = libro.getSheetByName(CONFIG.PESTANAS.respuestas);
  if (!h) {
    h = libro.insertSheet(CONFIG.PESTANAS.respuestas);
  }
  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

/**
 * Sheets convierte "2026-09-20" en fecha al guardarla, asi que al releerla
 * regresa un Date y no el texto. Sin normalizar, la busqueda nunca encuentra
 * el renglon del dia y se duplican los reportes.
 */
function comoFecha(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(valor || '').trim();
}

function buscarFila(h, driver, fecha) {
  if (h.getLastRow() < 2) return 0;
  const iDriver = COLUMNAS.indexOf('DRIVER');
  const iFecha = COLUMNAS.indexOf('FECHA');
  const valores = h.getRange(2, 1, h.getLastRow() - 1, COLUMNAS.length).getValues();
  for (let f = 0; f < valores.length; f++) {
    if (String(valores[f][iDriver]).trim() === driver && comoFecha(valores[f][iFecha]) === fecha) {
      return f + 2;
    }
  }
  return 0;
}

function guardarInicial(datos) {
  // Sin candado, dos choferes que envian al mismo tiempo pueden escribir
  // en la misma fila o duplicar el renglon del dia.
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(20000)) {
    return { ok: false, errores: ['El sistema está ocupado. Intenta de nuevo en unos segundos.'] };
  }

  try {
    const catalogos = { drivers: driversActivos(), placas: placas(), cedis: CONFIG.CEDIS };
    const revision = validarInicial(datos, catalogos);
    if (revision.errores.length) return { ok: false, errores: revision.errores };

    const limpio = revision.datos;
    const zona = Session.getScriptTimeZone();
    const ahora = new Date();
    const fecha = Utilities.formatDate(ahora, zona, 'yyyy-MM-dd');

    const h = asegurarPestanaRespuestas();
    if (buscarFila(h, limpio.DRIVER, fecha)) {
      return {
        ok: false,
        errores: ['Ya hay un reporte inicial de ' + limpio.DRIVER + ' para hoy. Si necesitas corregirlo, avísale a Leticia.'],
      };
    }

    limpio.MARCA_TIEMPO_INICIAL = Utilities.formatDate(ahora, zona, 'yyyy-MM-dd HH:mm:ss');
    limpio.FECHA = fecha;

    const fila = COLUMNAS.map(function (c) { return limpio[c] === undefined ? '' : limpio[c]; });
    h.appendRow(fila);

    return { ok: true, mensaje: 'Reporte inicial guardado. Gracias, ' + limpio.DRIVER + '.' };
  } catch (e) {
    return { ok: false, errores: ['Error al guardar: ' + e.message] };
  } finally {
    candado.releaseLock();
  }
}
