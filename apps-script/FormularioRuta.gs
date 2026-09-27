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

/**
 * Entrada para la pantalla alojada en un hosting propio, fuera de Google.
 * Ahi no existe google.script.run, asi que la pantalla manda por POST el
 * nombre de la funcion y sus argumentos, y recibe la respuesta en JSON.
 *
 * Solo se pueden llamar las cuatro funciones que usa la pantalla. Abrir la
 * puerta a cualquier funcion dejaria correr vaciarAControl() desde afuera.
 */
function doPost(e) {
  const funciones = {
    obtenerCatalogos: obtenerCatalogos,
    estadoDelDia: estadoDelDia,
    guardarInicial: guardarInicial,
    guardarFinal: guardarFinal,
  };

  let respuesta;
  try {
    const pedido = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const funcion = funciones[pedido.funcion];
    if (!funcion) throw new Error('Petición no reconocida.');
    const args = Array.isArray(pedido.args) ? pedido.args : [];
    respuesta = { resultado: funcion.apply(null, args) };
  } catch (err) {
    respuesta = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(respuesta))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Acepta el identificador pelado o la direccion completa de la hoja. Copiar la
 * direccion entera, o dejarle pedazos como "d/" y "/edit", es el error mas
 * comun al configurar la propiedad, y el mensaje de Google no dice como
 * corregirlo.
 */
function idDeHoja(valor) {
  const texto = String(valor || '').trim();
  const enDireccion = texto.match(/(?:^|\/)d\/([a-zA-Z0-9-_]+)/);
  return enDireccion ? enDireccion[1] : texto;
}

// Una sola apertura por ejecucion: guardarInicial pasa por pestana() y por
// asegurarPestanaRespuestas(), y cada openById cuesta.
let libroAbierto = null;

function hoja() {
  if (!libroAbierto) libroAbierto = abrirHoja();
  return libroAbierto;
}

function abrirHoja() {
  const guardado = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPIEDAD_ID_HOJA);
  if (!guardado) {
    throw new Error(
      'Falta configurar ' + CONFIG.PROPIEDAD_ID_HOJA + ' en Propiedades del Script. ' +
      'Ver docs/instalacion.md'
    );
  }

  const id = idDeHoja(guardado);
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    throw new Error(
      'No se pudo abrir la hoja con el identificador "' + id + '". Revisa que ' +
      CONFIG.PROPIEDAD_ID_HOJA + ' tenga el pedazo que va entre /d/ y /edit de la ' +
      'direccion de la hoja de calculo, no la direccion del proyecto de Apps Script.'
    );
  }
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

/**
 * La hoja vinculada al proyecto. Desde el menu la da getActiveSpreadsheet(),
 * pero corriendo como liga web esa llamada no tiene hoja activa. Por eso
 * onOpen la apunta en una propiedad, y aqui se usa esa como respaldo.
 */
// undefined: todavia no se busca en esta ejecucion; null: no hay.
let libroDelFormulario;

function hojaDelFormulario() {
  if (libroDelFormulario === undefined) libroDelFormulario = buscarHojaDelFormulario();
  return libroDelFormulario;
}

function buscarHojaDelFormulario() {
  try {
    const activa = SpreadsheetApp.getActiveSpreadsheet();
    if (activa) return activa;
  } catch (e) {}

  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPIEDAD_ID_HOJA_FORMULARIO);
  if (!id) return null;
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    return null;
  }
}

/**
 * Donde vive Respuestas_Form. Empieza en la hoja de datos y pasa a la hoja
 * del formulario cuando moverRespuestasAEsteArchivo() la muda y deja la
 * propiedad puesta. Se decide con la propiedad y no buscando la pestania en
 * los dos archivos: asi no hay un momento en que los reportes caigan en uno y
 * el historial siga en el otro, y no se abre la hoja de datos, que es la lenta.
 */
function libroDeRespuestas() {
  const movida = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.PROPIEDAD_RESPUESTAS_EN_FORMULARIO) === 'SI';
  if (movida) {
    const propio = hojaDelFormulario();
    if (propio) return propio;
  }
  return hoja();
}

/** Lo llama onOpen: deja apuntada la hoja vinculada para cuando corra la liga web. */
function recordarHojaDelFormulario() {
  try {
    const activa = SpreadsheetApp.getActiveSpreadsheet();
    if (!activa) return;
    const propiedades = PropertiesService.getScriptProperties();
    if (propiedades.getProperty(CONFIG.PROPIEDAD_ID_HOJA_FORMULARIO) === activa.getId()) return;
    propiedades.setProperty(CONFIG.PROPIEDAD_ID_HOJA_FORMULARIO, activa.getId());
    // La lista en memoria se armo sin esta hoja, y le faltan las placas.
    CacheService.getScriptCache().remove(CONFIG.CLAVE_CACHE_CATALOGOS);
  } catch (e) {}
}

/**
 * Las placas para el desplegable. La pestania PLACAS vive en la hoja
 * vinculada al proyecto (FORMULARIO AMAZON), no en la de datos; si el proyecto
 * no esta vinculado o ahi no existe, se busca en la hoja de datos.
 *
 * Acepta la columna con encabezado PLACA o PLACAS, o las placas en la primera
 * columna sin encabezado. Una placa con BAJA en una columna STATUS no sale.
 *
 * Sin pestania regresa la lista vacia y la pantalla deja escribir la placa a
 * mano, como antes. No es motivo para dejar el formulario inservible.
 */
function pestanaDePlacas() {
  const propia = hojaDelFormulario();
  const origen = propia ? propia.getSheetByName(CONFIG.PESTANAS.placas) : null;
  return origen || hoja().getSheetByName(CONFIG.PESTANAS.placas);
}

function primerEncabezado(valores, opciones) {
  let columna = -1;
  opciones.forEach(function (e) {
    if (columna === -1) columna = columnaPorEncabezado(valores, e);
  });
  return columna;
}

function placasDisponibles() {
  const origen = pestanaDePlacas();
  if (!origen) return [];

  const valores = origen.getDataRange().getValues();
  if (!valores.length) return [];

  let columna = primerEncabezado(valores, CONFIG.PLACAS.encabezados);
  const conEncabezado = columna !== -1;
  if (!conEncabezado) columna = 0;
  const iEstatus = conEncabezado ? columnaPorEncabezado(valores, CONFIG.OPERADORES.encabezadoEstatus) : -1;

  const placas = [];
  for (let f = conEncabezado ? 1 : 0; f < valores.length; f++) {
    // Se acomoda igual que la placa escrita a mano, para que la misma placa
    // no llegue a la hoja de dos formas.
    const placa = normalizarTexto(valores[f][columna], NORMALIZAR.PLACAS);
    if (!placa) continue;
    if (iEstatus !== -1 && String(valores[f][iEstatus] || '').trim().toUpperCase() === 'BAJA') continue;
    if (placas.indexOf(placa) === -1) placas.push(placa);
  }
  return placas.sort();
}

/**
 * Anota en la columna OTRA de la pestania PLACAS una placa que el chofer
 * escribio a mano, para que Leticia la revise y la pase a la lista. Solo una
 * vez: si ya esta en la lista o en OTRA, no se repite.
 *
 * Nunca debe impedir que se guarde el reporte, que ya se escribio antes de
 * llegar aqui. Sin columna OTRA simplemente no anota.
 */
function anotarPlacaNueva(placa) {
  if (!placa) return;
  try {
    const origen = pestanaDePlacas();
    if (!origen) return;
    const valores = origen.getDataRange().getValues();
    if (!valores.length) return;

    const iOtra = primerEncabezado(valores, CONFIG.PLACAS.encabezadosNuevas);
    if (iOtra === -1) return;
    const iLista = primerEncabezado(valores, CONFIG.PLACAS.encabezados);

    let filaLibre = valores.length + 1;
    for (let f = 1; f < valores.length; f++) {
      const enOtra = normalizarTexto(valores[f][iOtra], NORMALIZAR.PLACAS);
      const enLista = iLista === -1 ? '' : normalizarTexto(valores[f][iLista], NORMALIZAR.PLACAS);
      if (enOtra === placa || enLista === placa) return;
      if (!enOtra && filaLibre > valores.length) filaLibre = f + 1;
    }

    origen.getRange(filaLibre, iOtra + 1).setValue(placa);
  } catch (e) {}
}

/**
 * La lista sale de memoria cuando se puede. Es lo primero que pide la
 * pantalla, y leerla de la hoja en frio deja al chofer mas de 20 segundos
 * viendo "Cargando".
 *
 * Un chofer dado de alta tarda hasta SEGUNDOS_CACHE_CATALOGOS en aparecer, o
 * menos si corre el activador de precargar().
 */
function obtenerCatalogos() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get(CONFIG.CLAVE_CACHE_CATALOGOS);
  if (guardado) return JSON.parse(guardado);
  return guardarCatalogosEnCache();
}

function guardarCatalogosEnCache() {
  const catalogos = {
    drivers: driversActivos(),
    cedis: CONFIG.CEDIS,
    placas: placasDisponibles(),
  };
  CacheService.getScriptCache().put(CONFIG.CLAVE_CACHE_CATALOGOS, JSON.stringify(catalogos), CONFIG.SEGUNDOS_CACHE_CATALOGOS);
  return catalogos;
}

/**
 * Para un activador de tiempo cada 10 minutos. Mantiene la lista de choferes
 * al dia en memoria y, de paso, la hoja abierta, para que el primer chofer de
 * la manana no pague la apertura en frio.
 */
function precargar() {
  guardarCatalogosEnCache();
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

/**
 * Acomoda el texto libre para que la hoja no termine con la misma zona escrita
 * de cinco formas. Tambien junta los espacios repetidos, que son la causa de
 * duplicados como "Cumbres" contra "Cumbres ".
 */
function normalizarTexto(valor, modo) {
  const texto = String(valor == null ? '' : valor).trim().replace(/\s+/g, ' ');
  if (!texto) return '';

  if (modo === 'mayusculas') return texto.toUpperCase();

  if (modo === 'inicial') {
    return texto.toLowerCase().replace(/(^|\s)(\S)/g, function (todo, antes, letra) {
      return antes + letra.toUpperCase();
    });
  }

  return texto;
}

function validarInicial(datos, catalogos) {
  const errores = [];
  const limpio = {};

  CAMPOS_INICIAL.forEach(function (campo) {
    const bruto = String(datos[campo.clave] == null ? '' : datos[campo.clave]).trim();
    limpio[campo.clave] = NORMALIZAR[campo.clave]
      ? normalizarTexto(bruto, NORMALIZAR[campo.clave])
      : bruto;
  });

  const auxiliar = limpio.TIENE_AUXILIAR === 'Sí';

  CAMPOS_INICIAL.forEach(function (campo) {
    const v = limpio[campo.clave];
    const obligatorio = campo.clave === 'NOMBRE_AUXILIAR' ? auxiliar : campo.obligatorio;
    if (obligatorio && !v) errores.push(('Falta ' + campo.etiqueta + '.').replace('..', '.'));
  });

  if (limpio.CEDIS && catalogos.cedis.indexOf(limpio.CEDIS) === -1) {
    errores.push('CEDIS no válido.');
  }
  if (limpio.DRIVER && catalogos.drivers.indexOf(limpio.DRIVER) === -1) {
    errores.push('El driver no está en la lista de operadores activos.');
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

  CAMPOS_INICIAL.forEach(function (campo) {
    if (campo.tipo !== 'entero' || !limpio[campo.clave]) return;
    const n = aEntero(limpio[campo.clave]);
    if (n === null) errores.push(campo.etiqueta + ' debe ser un número entero.');
    else limpio[campo.clave] = n;
  });

  return { errores: errores, datos: limpio };
}

// --- Resumen para compartir ---

/**
 * El texto que el chofer manda al grupo de WhatsApp.
 *
 * Lo arma el sistema y no el chofer, que es todo el punto: ya no puede quedar
 * incompleto ni ambiguo, y le sirve de comprobante de que si reporto.
 */
function fechaLegible(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'dd-MM-yyyy');
}

function resumenInicial(d, fecha) {
  return [
    'REPORTE INICIAL - ' + fechaLegible(fecha),
    'Driver: ' + d.DRIVER,
    'CEDIS: ' + d.CEDIS,
    'Ruta: ' + d.ID_RUTA + ' - ' + d.ZONA_RUTA,
    'Placas: ' + d.PLACAS,
    d.TIENE_AUXILIAR === 'Sí' ? 'Auxiliar: ' + d.NOMBRE_AUXILIAR : 'Sin auxiliar',
    '',
    'Llegada BO: ' + d.HR_LLEGADA_BO,
    'Entrada BO: ' + d.HR_ENTRADA_BO,
    'Salida BOD: ' + d.HR_SALIDA_BOD,
    'Primera entrega: ' + d.HR_PE,
    '',
    'SPR: ' + d.SPR,
    'CANT. PAR.: ' + d.CANT_PAR,
    'CANT. UBI.: ' + d.CANT_UBI,
    'KM inicial: ' + d.KM_INICIAL,
  ].join('\n');
}

function resumenFinal(driver, d, referencia, fecha) {
  const lineas = [
    'REPORTE FINAL - ' + fechaLegible(fecha),
    'Driver: ' + driver,
    '',
    'Ultima entrega: ' + d.HR_UE,
    'Entregados: ' + d.ENTREGADOS + ' de ' + referencia.SPR,
    'Devoluciones: ' + d.DEVOLUCIONES + ' (no visitado ' + d.NO_VISITADO + ', visitado ' + d.VISITADO + ')',
    '',
    'KM final: ' + d.KM_FINAL,
  ];

  if (referencia.KM_INICIAL) {
    lineas.push('Recorrido: ' + (d.KM_FINAL - referencia.KM_INICIAL) + ' km');
  }
  if (d.MOTIVO) {
    lineas.push('', 'Motivo: ' + d.MOTIVO);
  }

  return lineas.join('\n');
}

// --- Escritura ---

function asegurarPestanaRespuestas() {
  const libro = libroDeRespuestas();
  let h = libro.getSheetByName(CONFIG.PESTANAS.respuestas);
  if (!h) {
    h = libro.insertSheet(CONFIG.PESTANAS.respuestas);
  }

  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    h.setFrozenRows(1);
    return h;
  }

  // Si las columnas cambiaron, seguir escribiendo dejaria cada dato en la
  // celda equivocada sin que nada avise. Mas vale detenerse aqui.
  // La excepcion son columnas nuevas agregadas al final: los renglones viejos
  // no se recorren, asi que basta con escribirles el encabezado.
  const encabezado = h.getRange(1, 1, 1, COLUMNAS.length).getValues()[0]
    .map(function (v) { return String(v || '').trim(); });
  let existentes = encabezado.length;
  while (existentes > 0 && !encabezado[existentes - 1]) existentes--;

  const desalineado = COLUMNAS.slice(0, existentes).some(function (c, i) {
    return encabezado[i] !== c;
  });
  if (!desalineado && existentes < COLUMNAS.length) {
    h.getRange(1, existentes + 1, 1, COLUMNAS.length - existentes)
      .setValues([COLUMNAS.slice(existentes)])
      .setFontWeight('bold');
  }
  if (desalineado) {
    throw new Error(
      'La pestaña ' + CONFIG.PESTANAS.respuestas + ' tiene las columnas de una versión ' +
      'anterior. Bórrala para que se vuelva a crear; se pierden los reportes que tenga, ' +
      'pero los que ya pasaron a ' + CONFIG.PESTANAS.control + ' siguen ahí.'
    );
  }

  return h;
}

/**
 * Lleva cualquier fecha de la columna FECHA a "yyyy-MM-dd" para comparar.
 * Conviven tres formas: los renglones nuevos traen un Date; los viejos, texto
 * "2026-09-20" que Sheets pudo o no convertir en Date; y alguien puede escribir
 * "20-09-2026" a mano. Sin normalizar, la busqueda nunca encuentra el renglon
 * del dia y se duplican los reportes.
 */
function comoFecha(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const texto = String(valor || '').trim();
  const diaMesAnio = texto.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  return diaMesAnio ? diaMesAnio[3] + '-' + diaMesAnio[2] + '-' + diaMesAnio[1] : texto;
}

/**
 * Lee solo de FECHA a DRIVER, no el renglon entero, y busca de abajo hacia
 * arriba: los reportes de hoy siempre son los ultimos.
 */
function buscarFila(h, driver, fecha) {
  if (h.getLastRow() < 2) return 0;
  const iFecha = COLUMNAS.indexOf('FECHA');
  const iDriver = COLUMNAS.indexOf('DRIVER');
  const valores = h.getRange(2, iFecha + 1, h.getLastRow() - 1, iDriver - iFecha + 1).getValues();
  for (let f = valores.length - 1; f >= 0; f--) {
    if (String(valores[f][iDriver - iFecha]).trim() === driver && comoFecha(valores[f][0]) === fecha) {
      return f + 2;
    }
  }
  return 0;
}

/** Aplica el formato dia-mes-anio a las celdas de fecha que se acaban de escribir. */
function darFormatoFechas(h, numeroFila, claves) {
  claves.forEach(function (clave) {
    const formato = clave === 'FECHA' ? CONFIG.FORMATOS.fecha : CONFIG.FORMATOS.marca;
    h.getRange(numeroFila, COLUMNAS.indexOf(clave) + 1).setNumberFormat(formato);
  });
}

function fechaDeHoy() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function leerFila(h, numeroFila) {
  const valores = h.getRange(numeroFila, 1, 1, COLUMNAS.length).getValues()[0];
  const fila = {};
  COLUMNAS.forEach(function (c, i) { fila[c] = valores[i]; });
  return fila;
}

/**
 * Decide que pantalla le toca al chofer, para que no tenga que elegir
 * entre dos formularios ni recordar cual ya mando.
 */
function estadoDelDia(driver) {
  const nombre = String(driver || '').trim();
  if (!nombre) return { estado: 'sin_driver' };

  const h = asegurarPestanaRespuestas();
  const numeroFila = buscarFila(h, nombre, fechaDeHoy());
  if (!numeroFila) return { estado: 'falta_inicial' };

  const fila = leerFila(h, numeroFila);
  if (String(fila.MARCA_TIEMPO_FINAL || '').trim()) {
    return { estado: 'completo' };
  }

  return {
    estado: 'falta_final',
    referencia: {
      SPR: Number(fila.SPR) || 0,
      KM_INICIAL: Number(fila.KM_INICIAL) || 0,
      HR_PE: comoHora(fila.HR_PE),
      ZONA_RUTA: String(fila.ZONA_RUTA || ''),
      ID_RUTA: String(fila.ID_RUTA || ''),
    },
  };
}

/** Sheets convierte "09:30" en hora y al releerla regresa un Date. */
function comoHora(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(valor || '').trim();
}

function guardarInicial(datos) {
  // Sin candado, dos choferes que envian al mismo tiempo pueden escribir
  // en la misma fila o duplicar el renglon del dia.
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(20000)) {
    return { ok: false, errores: ['El sistema está ocupado. Intenta de nuevo en unos segundos.'] };
  }

  try {
    // La lista en memoria y no la de OPERADORES: leerla obligaria a abrir la
    // hoja de datos, la lenta. Un chofer dado de baja puede seguir enviando
    // hasta que se renueve la lista (SEGUNDOS_CACHE_CATALOGOS).
    const catalogos = obtenerCatalogos();
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

    limpio.MARCA_TIEMPO_INICIAL = ahora;
    // A mediodia y no a medianoche: si la hoja tuviera otra zona horaria que
    // el script, la medianoche se veria como el dia anterior.
    limpio.FECHA = Utilities.parseDate(fecha + ' 12:00', zona, 'yyyy-MM-dd HH:mm');

    const fila = COLUMNAS.map(function (c) { return limpio[c] === undefined ? '' : limpio[c]; });
    h.appendRow(fila);
    darFormatoFechas(h, h.getLastRow(), ['MARCA_TIEMPO_INICIAL', 'FECHA']);
    anotarPlacaNueva(limpio.PLACAS);

    return {
      ok: true,
      mensaje: 'Reporte inicial guardado. Gracias, ' + limpio.DRIVER + '.',
      resumen: resumenInicial(limpio, ahora),
    };
  } catch (e) {
    return { ok: false, errores: ['Error al guardar: ' + e.message] };
  } finally {
    candado.releaseLock();
  }
}

function validarFinal(datos, referencia) {
  const errores = [];
  const limpio = {};

  CAMPOS_FINAL.forEach(function (campo) {
    const bruto = String(datos[campo.clave] == null ? '' : datos[campo.clave]).trim();
    limpio[campo.clave] = NORMALIZAR[campo.clave] ? normalizarTexto(bruto, NORMALIZAR[campo.clave]) : bruto;
    if (campo.obligatorio && !limpio[campo.clave]) errores.push('Falta ' + campo.etiqueta + '.');
  });

  if (limpio.HR_UE && !esHoraValida(limpio.HR_UE)) {
    errores.push('La hora de última entrega tiene formato inválido.');
  } else if (limpio.HR_UE && referencia.HR_PE && esHoraValida(referencia.HR_PE)) {
    if (aMinutos(limpio.HR_UE) < aMinutos(referencia.HR_PE)) {
      errores.push('La última entrega (' + limpio.HR_UE + ') no puede ser antes de la primera (' + referencia.HR_PE + ').');
    }
  }

  const numeros = {};
  ['ENTREGADOS', 'DEVOLUCIONES', 'NO_VISITADO', 'VISITADO', 'KM_FINAL'].forEach(function (clave) {
    if (!limpio[clave]) return;
    const n = aEntero(limpio[clave]);
    if (n === null) {
      errores.push(clave.replace(/_/g, ' ').toLowerCase() + ' debe ser un número entero.');
    } else {
      numeros[clave] = n;
      limpio[clave] = n;
    }
  });

  const entregados = numeros.ENTREGADOS;
  const devoluciones = numeros.DEVOLUCIONES;
  const noVisitado = numeros.NO_VISITADO;
  const visitado = numeros.VISITADO;
  const kmFinal = numeros.KM_FINAL;

  if (entregados !== undefined && devoluciones !== undefined && referencia.SPR) {
    if (entregados + devoluciones !== referencia.SPR) {
      errores.push(
        'Entregados (' + entregados + ') más devoluciones (' + devoluciones + ') dan ' +
        (entregados + devoluciones) + ', y el SPR del día es ' + referencia.SPR + '.'
      );
    }
  }

  if (noVisitado !== undefined && visitado !== undefined && devoluciones !== undefined) {
    if (noVisitado + visitado !== devoluciones) {
      errores.push(
        'No visitado (' + noVisitado + ') más visitado (' + visitado + ') dan ' +
        (noVisitado + visitado) + ', y las devoluciones son ' + devoluciones + '.'
      );
    }
  }

  if (kmFinal !== undefined && referencia.KM_INICIAL && kmFinal < referencia.KM_INICIAL) {
    errores.push('El KM final (' + kmFinal + ') no puede ser menor que el inicial (' + referencia.KM_INICIAL + ').');
  }

  return { errores: errores, datos: limpio };
}

function guardarFinal(driver, datos) {
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(20000)) {
    return { ok: false, errores: ['El sistema está ocupado. Intenta de nuevo en unos segundos.'] };
  }

  try {
    const nombre = String(driver || '').trim();
    const h = asegurarPestanaRespuestas();
    const numeroFila = buscarFila(h, nombre, fechaDeHoy());

    if (!numeroFila) {
      return { ok: false, errores: ['No hay reporte inicial de hoy. Manda primero el de la mañana.'] };
    }

    const fila = leerFila(h, numeroFila);
    if (String(fila.MARCA_TIEMPO_FINAL || '').trim()) {
      return { ok: false, errores: ['Ya mandaste el reporte final de hoy. Si necesitas corregirlo, avísale a Leticia.'] };
    }

    const referencia = {
      SPR: Number(fila.SPR) || 0,
      KM_INICIAL: Number(fila.KM_INICIAL) || 0,
      HR_PE: comoHora(fila.HR_PE),
    };

    const revision = validarFinal(datos, referencia);
    if (revision.errores.length) return { ok: false, errores: revision.errores };

    const limpio = revision.datos;
    limpio.MARCA_TIEMPO_FINAL = new Date();

    // Los campos del envio final ocupan un bloque contiguo, asi que se escriben
    // de una sola vez. El bloque termina en MOTIVO a proposito: despues viene
    // ESPEJADO, que lleva el control de que ya paso a BD_AMAZON.
    const inicio = COLUMNAS.indexOf('MARCA_TIEMPO_FINAL');
    const fin = COLUMNAS.indexOf('MOTIVO');
    const bloque = COLUMNAS.slice(inicio, fin + 1).map(function (c) {
      return limpio[c] === undefined ? '' : limpio[c];
    });
    h.getRange(numeroFila, inicio + 1, 1, bloque.length).setValues([bloque]);
    darFormatoFechas(h, numeroFila, ['MARCA_TIEMPO_FINAL']);

    return {
      ok: true,
      mensaje: 'Reporte final guardado. Buen trabajo, ' + nombre + '.',
      resumen: resumenFinal(nombre, limpio, referencia, new Date()),
    };
  } catch (e) {
    return { ok: false, errores: ['Error al guardar: ' + e.message] };
  } finally {
    candado.releaseLock();
  }
}
