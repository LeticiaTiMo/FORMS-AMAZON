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
 * reporte, asi que getLastRow apunta al vacio.
 *
 * No basta con la columna del driver. En la hoja original, AmazonWriter y
 * añadirDatosInicioRuta() crean los renglones del dia con fecha (E) y route
 * code (T) pero sin driver; buscar solo por G escribiria encima de ellos.
 */
function primeraFilaLibre(control) {
  let ultima = 0;
  COLUMNAS_OCUPADAS.forEach(function (letra) {
    const valores = control.getRange(1, columnaANumero(letra), control.getMaxRows(), 1).getValues();
    for (let f = valores.length - 1; f > ultima - 1; f--) {
      if (String(valores[f][0] || '').trim()) { ultima = f + 1; break; }
    }
  });
  return Math.max(ultima + 1, 2);
}

function valorParaControl(clave, valor) {
  return COLUMNAS_HORA.indexOf(clave) !== -1 ? aFraccionDeDia(valor) : valor;
}

/**
 * Para comparar contra las listas desplegables de BD_AMAZON sin que importen
 * espacios invisibles, mayusculas o acentos: "Juan Pérez " y "juan perez"
 * cuentan como el mismo nombre.
 */
function llaveComparacion(valor) {
  return String(valor).replace(/[\s ]+/g, ' ').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Lo que acepta la lista desplegable de una celda, o null si no tiene. */
function valoresPermitidos(celda) {
  const regla = celda.getDataValidation();
  if (!regla) return null;

  const tipo = regla.getCriteriaType();
  const criterio = regla.getCriteriaValues();
  const tipos = SpreadsheetApp.DataValidationCriteria;

  if (tipo === tipos.VALUE_IN_LIST) return criterio[0].map(String);
  if (tipo === tipos.VALUE_IN_RANGE) {
    return criterio[0].getValues()
      .reduce(function (todos, fila) { return todos.concat(fila); }, [])
      .filter(function (v) { return !vacio(v); })
      .map(String);
  }
  return null;
}

/**
 * Las columnas de BD_AMAZON con lista desplegable rechazan el renglon entero
 * si un texto no coincide letra por letra, y basta un espacio al final del
 * nombre en OPERADORES para que pase. Aqui se cambia cada texto por como
 * viene escrito en la lista, y si de verdad no esta, se avisa cual es.
 */
function ajustarAListas(control, primeraFila, renglones) {
  Object.keys(ESPEJO_INICIAL).forEach(function (clave) {
    const letra = ESPEJO_INICIAL[clave];
    const columna = columnaANumero(letra);
    const permitidos = valoresPermitidos(control.getRange(primeraFila, columna));
    if (!permitidos) return;

    const porLlave = {};
    permitidos.forEach(function (p) { porLlave[llaveComparacion(p)] = p; });

    renglones.forEach(function (renglon, n) {
      const valor = renglon[columna - 1];
      if (typeof valor !== 'string' || vacio(valor) || permitidos.indexOf(valor) !== -1) return;

      const exacto = porLlave[llaveComparacion(valor)];
      if (exacto === undefined) {
        throw new Error(
          '"' + valor + '" no está en la lista desplegable de la columna ' + letra + ' de ' +
          CONFIG.PESTANAS.control + ' (renglón ' + (primeraFila + n) + '). Agrégalo a esa lista ' +
          'o corrige el reporte en ' + CONFIG.PESTANAS.respuestas + ' y vuelve a vaciar. ' +
          'No se pasó ningún reporte.'
        );
      }
      renglon[columna - 1] = exacto;
    });
  });
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
/**
 * Lo que identifica a un reporte dentro de BD_AMAZON: driver, ID de ruta y KM
 * inicial. Se lee una vez por vaciado.
 */
function indiceControl(control) {
  const ultima = primeraFilaLibre(control) - 1;
  const leer = function (letra) {
    return ultima < 1 ? [] : control.getRange(1, columnaANumero(letra), ultima, 1).getValues()
      .map(function (v) { return v[0]; });
  };
  return {
    driver: leer(ESPEJO_INICIAL.DRIVER),
    ruta: leer(ESPEJO_INICIAL.ID_RUTA),
    km: leer(ESPEJO_INICIAL.KM_INICIAL),
  };
}

function esSuRenglon(indice, fila, datos) {
  const n = fila - 1;
  if (n < 1 || n >= indice.driver.length) return false;
  return llaveComparacion(indice.driver[n]) === llaveComparacion(datos.DRIVER) &&
    String(indice.ruta[n]).trim().toUpperCase() === String(datos.ID_RUTA).trim().toUpperCase() &&
    Number(indice.km[n]) === Number(datos.KM_INICIAL);
}

/**
 * El renglon de BD_AMAZON de un reporte. FILA_CONTROL guarda el numero, pero
 * la hoja es compartida: si alguien inserta o borra renglones arriba, ese
 * numero pasa a ser de otro reporte y lo de la tarde caeria encima de el.
 * Por eso se confirma por contenido y, si no coincide, se busca de abajo
 * hacia arriba. Regresa 0 si no aparece: mejor no escribir que escribir en el
 * renglon de otro.
 */
function ubicarRenglon(indice, datos, filaGuardada) {
  if (filaGuardada && esSuRenglon(indice, filaGuardada, datos)) return filaGuardada;
  for (let fila = indice.driver.length; fila >= 2; fila--) {
    if (esSuRenglon(indice, fila, datos)) return fila;
  }
  return 0;
}

function completarRenglon(control, filaControl, datos) {
  Object.keys(ESPEJO_FINAL).forEach(function (clave) {
    if (vacio(datos[clave])) return;
    const celda = control.getRange(filaControl, columnaANumero(ESPEJO_FINAL[clave]));
    celda.setValue(valorParaControl(clave, datos[clave]));
    if (COLUMNAS_HORA.indexOf(clave) !== -1) celda.setNumberFormat(FORMATO_HORA_CONTROL);
  });

  escribirFormulasFinales(control, filaControl);
}

/**
 * Revisa una vez por vaciado que cada columna de ESPEJO_COMENTARIOS siga
 * donde se espera. Las que no, se reportan y no se escriben.
 */
function columnasDeComentarios(control) {
  const listas = {};
  const fallidas = [];
  Object.keys(ESPEJO_COMENTARIOS).forEach(function (clave) {
    const destino = ESPEJO_COMENTARIOS[clave];
    const numero = columnaANumero(destino.columna);
    const encabezado = String(control.getRange(1, numero).getValue() || '').trim().toUpperCase();
    if (encabezado === destino.encabezado.toUpperCase()) listas[clave] = numero;
    else fallidas.push(destino.encabezado);
  });
  return { listas: listas, fallidas: fallidas };
}

/**
 * Si Leticia ya escribio algo en la celda, se conserva y lo del chofer se
 * agrega despues. Si ya estaba, no se repite al volver a vaciar.
 */
function escribirComentarios(control, filaControl, datos, columnas) {
  Object.keys(columnas).forEach(function (clave) {
    // Los reportes capturados antes de NORMALIZAR.MOTIVO llegan como los
    // escribio el chofer; se acomodan aqui igual que los nuevos.
    const bruto = String(datos[clave] == null ? '' : datos[clave]).trim();
    const texto = NORMALIZAR[clave] ? normalizarTexto(bruto, NORMALIZAR[clave]) : bruto;
    if (!texto) return;
    const celda = control.getRange(filaControl, columnas[clave]);
    const actual = String(celda.getValue() || '').trim();
    if (actual.indexOf(texto) !== -1) return;
    celda.setValue(actual ? actual + ' / ' + texto : texto);
  });
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
  let total = 0;

  if (respuestas.getLastRow() < 2) {
    return { nuevos: nuevos, porCompletar: porCompletar, sinCerrar: sinCerrar, total: total };
  }

  const valores = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues();
  const i = {};
  COLUMNAS.forEach(function (c, n) { i[c] = n; });

  for (let f = 0; f < valores.length; f++) {
    const fila = valores[f];
    if (!String(fila[i.MARCA_TIEMPO_INICIAL] || '').trim()) continue;
    total++;

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

  return { nuevos: nuevos, porCompletar: porCompletar, sinCerrar: sinCerrar, total: total };
}

function vaciarAControl() {
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(30000)) {
    return { ok: false, mensaje: 'El sistema está ocupado. Intenta de nuevo en unos segundos.' };
  }

  try {
    const libro = hoja();

    // Respuestas_Form puede vivir en la hoja del formulario; BD_AMAZON siempre
    // esta en la de datos.
    const respuestas = libroDeRespuestas().getSheetByName(CONFIG.PESTANAS.respuestas);
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
          : 'No hay reportes nuevos que vaciar. ' + CONFIG.PESTANAS.respuestas + ' tiene ' + clasificados.total +
            ' reportes y todos ya están en ' + CONFIG.PESTANAS.control + '.',
      };
    }

    const marca = new Date();
    const colFila = COLUMNAS.indexOf('FILA_CONTROL') + 1;
    const colInicial = COLUMNAS.indexOf('ESPEJADO_INICIAL') + 1;
    const colFinal = COLUMNAS.indexOf('ESPEJADO_FINAL') + 1;
    const comentarios = columnasDeComentarios(control);

    if (nuevos.length) {
      const primeraFila = primeraFilaLibre(control);
      const renglones = nuevos.map(function (n) { return armarRenglon(n.datos); });
      ajustarAListas(control, primeraFila, renglones);

      control.getRange(primeraFila, 1, renglones.length, renglones[0].length).setValues(renglones);
      darFormatoHoras(control, primeraFila, renglones.length);

      nuevos.forEach(function (n, orden) {
        const filaControl = primeraFila + orden;
        respuestas.getRange(n.numeroFila, colFila).setValue(filaControl);
        respuestas.getRange(n.numeroFila, colInicial).setValue(marca).setNumberFormat(CONFIG.FORMATOS.marca);

        // Llego ya cerrado, asi que el renglon nace completo.
        if (n.tieneFinal) {
          escribirFormulasFinales(control, filaControl);
          escribirComentarios(control, filaControl, n.datos, comentarios.listas);
          respuestas.getRange(n.numeroFila, colFinal).setValue(marca).setNumberFormat(CONFIG.FORMATOS.marca);
        }
      });
    }

    const indice = porCompletar.length ? indiceControl(control) : null;
    const reubicados = [];
    const perdidos = [];
    let completados = 0;
    porCompletar.forEach(function (p) {
      const fila = ubicarRenglon(indice, p.datos, p.filaControl);
      if (!fila) {
        perdidos.push(p.datos.DRIVER + ' (ruta ' + p.datos.ID_RUTA + ')');
        return;
      }
      if (fila !== p.filaControl) {
        respuestas.getRange(p.numeroFila, colFila).setValue(fila);
        reubicados.push(p.datos.DRIVER);
      }
      completarRenglon(control, fila, p.datos);
      escribirComentarios(control, fila, p.datos, comentarios.listas);
      respuestas.getRange(p.numeroFila, colFinal).setValue(marca).setNumberFormat(CONFIG.FORMATOS.marca);
      completados++;
    });

    const partes = [];
    if (nuevos.length) partes.push(nuevos.length + ' reportes nuevos');
    if (completados) partes.push(completados + ' completados con lo de la tarde');

    let mensaje = partes.length ? 'Listo: ' + partes.join(' y ') + '.' : 'No se pasó ningún reporte.';
    if (reubicados.length) {
      mensaje += '\n\nSe movieron de renglón en ' + CONFIG.PESTANAS.control + ' y se completaron donde están ahora: ' +
        reubicados.join(', ') + '.';
    }
    if (perdidos.length) {
      mensaje += '\n\nNo se encontró su renglón en ' + CONFIG.PESTANAS.control + ', así que no se escribió lo de la tarde: ' +
        perdidos.join(', ') + '. Revisa que el driver, el ID de ruta y el KM inicial sigan como los mandó el chofer, y vuelve a vaciar.';
    }
    if (clasificados.sinCerrar) {
      mensaje += '\n\n' + clasificados.sinCerrar + ' rutas siguen en curso. Su renglón ya está en ' +
        CONFIG.PESTANAS.control + ', y se completa solo cuando el chofer mande su reporte final y vuelvas a vaciar.';
    }
    if (comentarios.fallidas.length) {
      mensaje += '\n\nNo se escribió ' + comentarios.fallidas.join(' ni ') + ': el encabezado de la columna ya no ' +
        'coincide. Revisa ESPEJO_COMENTARIOS en Config.gs.';
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
  recordarHojaDelFormulario();
  const resultado = vaciarAControl();

  // El menu puede vivir en una hoja distinta de la de datos, asi que el aviso
  // dice siempre sobre cual trabajo. Sin eso, un ID_HOJA equivocado se ve
  // igual que "no hay reportes".
  let destino = '';
  try { destino = 'Hoja de datos: ' + hoja().getName() + '\n\n'; } catch (e) {}

  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      resultado.ok ? 'Reportes vaciados' : 'No se pudo vaciar',
      destino + resultado.mensaje,
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(destino + resultado.mensaje);
  }

  return resultado;
}

/**
 * Cambia la hoja de datos desde el menu, sin entrar a Propiedades del script.
 * Revisa que la hoja nueva tenga las pestanias que el formulario necesita
 * antes de guardarla, para no dejar el formulario apuntando a una hoja
 * donde no puede trabajar.
 */
function cambiarHojaDeDatos() {
  recordarHojaDelFormulario();
  const ui = SpreadsheetApp.getUi();

  let actual = 'ninguna';
  try { actual = hoja().getName(); } catch (e) {}

  const respuesta = ui.prompt(
    'Hoja de datos',
    'Ahora: ' + actual + '\n\nPega la dirección de la hoja donde deben caer los reportes:',
    ui.ButtonSet.OK_CANCEL
  );
  if (respuesta.getSelectedButton() !== ui.Button.OK) return;

  const id = idDeHoja(respuesta.getResponseText());
  let libro;
  try {
    libro = SpreadsheetApp.openById(id);
  } catch (e) {
    ui.alert('No se pudo abrir esa hoja', 'Revisa la dirección y que tu cuenta tenga acceso.', ui.ButtonSet.OK);
    return;
  }

  const faltan = [CONFIG.PESTANAS.operadores, CONFIG.PESTANAS.control].filter(function (nombre) {
    return !libro.getSheetByName(nombre);
  });
  if (faltan.length) {
    ui.alert('No se cambió', libro.getName() + ' no tiene la pestaña ' + faltan.join(' ni ') + '.', ui.ButtonSet.OK);
    return;
  }

  // Cada reporte ya vaciado recuerda su renglon en el BD_AMAZON anterior. En
  // la hoja nueva ese numero de renglon es de otro reporte, y los que siguen
  // en curso se completarian encima de el al llegar su envio final.
  let anterior = null;
  try { anterior = hoja(); } catch (e) {}
  if (anterior && anterior.getId() !== id) {
    const respuestas = libroDeRespuestas().getSheetByName(CONFIG.PESTANAS.respuestas);
    const conteo = contarYaVaciados(respuestas);
    if (conteo.vaciados) {
      const seguir = ui.alert(
        'Hay reportes de la hoja anterior',
        CONFIG.PESTANAS.respuestas + ' tiene ' + conteo.vaciados + ' reportes ya vaciados a "' + anterior.getName() +
        '"' + (conteo.enCurso ? ', ' + conteo.enCurso + ' de ellos todavía sin reporte final' : '') + '.\n\n' +
        'No se pasan a la hoja nueva, y los que están en curso se completarían en el renglón equivocado. ' +
        'Si eran pruebas, bórralos de ' + CONFIG.PESTANAS.respuestas + ' antes de cambiar.\n\n¿Cambiar de todos modos?',
        ui.ButtonSet.YES_NO
      );
      if (seguir !== ui.Button.YES) return;
    }
  }

  PropertiesService.getScriptProperties().setProperty(CONFIG.PROPIEDAD_ID_HOJA, id);
  // La lista de choferes en memoria es de la hoja anterior.
  CacheService.getScriptCache().remove(CONFIG.CLAVE_CACHE_CATALOGOS);

  ui.alert(
    'Hoja de datos cambiada',
    'Ahora el formulario y el vaciado trabajan sobre: ' + libro.getName(),
    ui.ButtonSet.OK
  );
}

/**
 * Solo lee. Muestra, para cada reporte de hoy, si ya llego el final, en que
 * renglon de BD_AMAZON quedo y que hay en ese renglon; y cuantos renglones de
 * hoy con su ID de ruta existen en BD_AMAZON. Sirve para ver por que un
 * reporte no se completo sin tener que abrir las dos hojas.
 */
function revisarReportesDeHoy() {
  const ui = SpreadsheetApp.getUi();
  const respuestas = libroDeRespuestas().getSheetByName(CONFIG.PESTANAS.respuestas);
  const control = hoja().getSheetByName(CONFIG.PESTANAS.control);
  if (!respuestas || !control || respuestas.getLastRow() < 2) {
    ui.alert('Revisión', 'No hay reportes que revisar.', ui.ButtonSet.OK);
    return;
  }

  const hoy = fechaDeHoy();
  const i = {};
  COLUMNAS.forEach(function (c, n) { i[c] = n; });
  const filas = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues()
    .filter(function (f) { return comoFecha(f[i.FECHA]) === hoy; });

  // Renglones de BD_AMAZON por ID de ruta, para ver si la ruta ya tenia uno
  // creado por otro proceso.
  const ultima = primeraFilaLibre(control) - 1;
  const colT = columnaANumero(ESPEJO_INICIAL.ID_RUTA);
  const colG = columnaANumero(ESPEJO_INICIAL.DRIVER);
  const ids = ultima > 1 ? control.getRange(2, colT, ultima - 1, 1).getValues() : [];
  const drivers = ultima > 1 ? control.getRange(2, colG, ultima - 1, 1).getValues() : [];
  const renglonesPorRuta = {};
  ids.forEach(function (v, n) {
    const id = String(v[0] || '').trim().toUpperCase();
    if (!id) return;
    (renglonesPorRuta[id] = renglonesPorRuta[id] || []).push((n + 2) + (String(drivers[n][0] || '').trim() ? '' : ' sin driver'));
  });

  const lineas = filas.map(function (f) {
    const filaControl = parseInt(f[i.FILA_CONTROL], 10);
    let enControl = 'sin renglón';
    if (filaControl) {
      const r = control.getRange(filaControl, 1, 1, columnaANumero('AA')).getValues()[0];
      enControl = 'renglón ' + filaControl + ': driver "' + r[colG - 1] + '", ID "' + r[colT - 1] +
        '", HR UE "' + (r[columnaANumero('R') - 1] ? 'sí' : 'vacía') + '", KM final "' + r[columnaANumero('AA') - 1] + '"';
    }
    const id = String(f[i.ID_RUTA] || '').trim().toUpperCase();
    return '• ' + f[i.DRIVER] + ' (ruta ' + id + ')\n' +
      '   final enviado: ' + (String(f[i.MARCA_TIEMPO_FINAL] || '').trim() ? 'sí' : 'no') +
      ' · final vaciado: ' + (String(f[i.ESPEJADO_FINAL] || '').trim() ? 'sí' : 'no') + '\n' +
      '   ' + enControl + '\n' +
      '   renglones con ese ID en ' + CONFIG.PESTANAS.control + ': ' + ((renglonesPorRuta[id] || []).join(', ') || 'ninguno');
  });

  ui.alert(
    'Reportes de hoy (' + filas.length + ')',
    'Hoja de datos: ' + hoja().getName() + '\n\n' + (lineas.join('\n\n') || 'No hay reportes de hoy.'),
    ui.ButtonSet.OK
  );
}

/**
 * Arregla los reportes de hoy cuyo FILA_CONTROL quedo apuntando a otro
 * renglon, porque alguien inserto o borro renglones en BD_AMAZON despues del
 * vaciado de la manana y lo de la tarde se escribio en el renglon equivocado.
 *
 * En el renglon real de cada reporte borra lo de la tarde que no era suyo y
 * escribe lo suyo, si ya mando el final. Los renglones de otros reportes que
 * recibieron datos ajenos no se pueden reconstruir desde aqui (sus valores
 * se perdieron): se listan para restaurarlos con el historial de versiones.
 * Antes de escribir muestra el plan y pide confirmacion.
 */
function repararRenglonesDeHoy() {
  const ui = SpreadsheetApp.getUi();
  const respuestas = libroDeRespuestas().getSheetByName(CONFIG.PESTANAS.respuestas);
  const control = hoja().getSheetByName(CONFIG.PESTANAS.control);
  if (!respuestas || !control || respuestas.getLastRow() < 2) {
    ui.alert('Reparar', 'No hay reportes que revisar.', ui.ButtonSet.OK);
    return;
  }

  const hoy = fechaDeHoy();
  const i = {};
  COLUMNAS.forEach(function (c, n) { i[c] = n; });
  const valores = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues();
  const indice = indiceControl(control);

  const reportes = [];
  valores.forEach(function (f, n) {
    const filaControl = parseInt(f[i.FILA_CONTROL], 10);
    if (!filaControl || comoFecha(f[i.FECHA]) !== hoy) return;
    const datos = {};
    COLUMNAS.forEach(function (c, k) { datos[c] = f[k]; });
    reportes.push({
      numeroFila: n + 2,
      datos: datos,
      anotada: filaControl,
      real: ubicarRenglon(indice, datos, filaControl),
      tieneFinal: !!String(f[i.MARCA_TIEMPO_FINAL] || '').trim(),
      // Solo si ya se vacio lo de la tarde se escribio algo en el renglon anotado.
      escribioFinal: !!String(f[i.ESPEJADO_FINAL] || '').trim(),
    });
  });

  const malUbicados = reportes.filter(function (r) { return r.real !== r.anotada; });
  // Renglones donde se escribio lo de la tarde de un reporte que no era.
  const danadas = malUbicados.filter(function (r) { return r.escribioFinal; }).map(function (r) { return r.anotada; });
  if (!malUbicados.length) {
    ui.alert('Reparar', 'Los ' + reportes.length + ' reportes de hoy están en su renglón. No hay nada que reparar.', ui.ButtonSet.OK);
    return;
  }

  const sinRenglon = malUbicados.filter(function (r) { return !r.real; });
  // Tambien un reporte bien ubicado se reescribe si otro le escribio encima.
  const aReparar = reportes.filter(function (r) {
    return r.real && (r.real !== r.anotada || danadas.indexOf(r.real) !== -1);
  });
  const propias = reportes.map(function (r) { return r.real; }).filter(Boolean);
  const ajenas = danadas
    .filter(function (fila) { return propias.indexOf(fila) === -1; })
    .sort(function (a, b) { return a - b; });

  let plan = aReparar.map(function (r) {
    const donde = r.real === r.anotada ? 'renglón ' + r.real + ', recibió datos de otro' : 'renglón ' + r.anotada + ' → ' + r.real;
    return '• ' + r.datos.DRIVER + ': ' + donde +
      (r.tieneFinal ? ' (se escribe su reporte final)' : ' (sin final: se limpia lo que no es suyo)');
  }).join('\n');
  if (sinRenglon.length) {
    plan += '\n\nNo se encontró su renglón, no se toca: ' +
      sinRenglon.map(function (r) { return r.datos.DRIVER; }).join(', ') + '.';
  }
  if (ajenas.length) {
    plan += '\n\nOJO: los renglones ' + ajenas.join(', ') + ' son de otros reportes y recibieron lo de la tarde ' +
      'de alguien más. Eso no se puede deshacer desde aquí: restaura sus columnas R, V, W, X, Y, AA y COMENTARIOS ' +
      'con Archivo → Historial de versiones.';
  }

  const seguro = ui.alert('Reparar renglones de hoy', plan + '\n\n¿Reparar?', ui.ButtonSet.YES_NO);
  if (seguro !== ui.Button.YES) return;

  const candado = LockService.getScriptLock();
  if (!candado.tryLock(30000)) {
    ui.alert('Intenta de nuevo', 'El sistema está ocupado. Vuelve a intentar en unos segundos.', ui.ButtonSet.OK);
    return;
  }

  try {
    const comentarios = columnasDeComentarios(control).listas;
    const colFila = COLUMNAS.indexOf('FILA_CONTROL') + 1;
    const motivosDeHoy = reportes
      .map(function (r) { return normalizarTexto(r.datos.MOTIVO, NORMALIZAR.MOTIVO); })
      .filter(Boolean);

    // Primero se limpia todo y despues se escribe: el renglon real de un
    // reporte es el anotado de otro, y en otro orden se volverian a pisar.
    const tocadas = aReparar.map(function (r) { return r.real; }).concat(ajenas);
    tocadas.forEach(function (fila) {
      Object.keys(comentarios).forEach(function (clave) {
        const celda = control.getRange(fila, comentarios[clave]);
        const partes = String(celda.getValue() || '').split(' / ').filter(function (p) {
          return p.trim() && motivosDeHoy.indexOf(p.trim()) === -1;
        });
        celda.setValue(partes.join(' / '));
      });
    });

    aReparar.forEach(function (r) {
      Object.keys(ESPEJO_FINAL).concat(Object.keys(ESPEJO_FORMULAS_FINAL).map(function (l) { return '=' + l; }))
        .forEach(function (clave) {
          const letra = clave.charAt(0) === '=' ? clave.slice(1) : ESPEJO_FINAL[clave];
          control.getRange(r.real, columnaANumero(letra)).setValue('');
        });
    });

    aReparar.forEach(function (r) {
      if (r.tieneFinal) {
        completarRenglon(control, r.real, r.datos);
        escribirComentarios(control, r.real, r.datos, comentarios);
      }
      respuestas.getRange(r.numeroFila, colFila).setValue(r.real);
    });
  } finally {
    candado.releaseLock();
  }

  ui.alert(
    'Listo',
    'Se repararon ' + aReparar.length + ' reportes.' +
    (ajenas.length ? '\n\nFalta restaurar con el historial de versiones los renglones ' + ajenas.join(', ') + '.' : ''),
    ui.ButtonSet.OK
  );
}

/** Cuantos reportes ya tienen renglon en BD_AMAZON, y cuantos de esos siguen sin cerrar. */
function contarYaVaciados(respuestas) {
  const conteo = { vaciados: 0, enCurso: 0 };
  if (!respuestas || respuestas.getLastRow() < 2) return conteo;

  const valores = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues();
  const iFila = COLUMNAS.indexOf('FILA_CONTROL');
  const iFinal = COLUMNAS.indexOf('ESPEJADO_FINAL');
  valores.forEach(function (fila) {
    if (!String(fila[iFila] || '').trim()) return;
    conteo.vaciados++;
    if (!String(fila[iFinal] || '').trim()) conteo.enCurso++;
  });
  return conteo;
}

/**
 * Muda Respuestas_Form de la hoja de datos al archivo abierto (la hoja del
 * formulario). BD_AMAZON se queda donde esta y el vaciado sigue llegando ahi.
 *
 * Copia, compara la copia celda por celda con el original y solo entonces
 * borra el original. Si algo no cuadra, borra la copia y deja todo como
 * estaba. El cambio de lugar se marca con una propiedad al final, para que
 * ningun reporte caiga en un archivo mientras el historial sigue en el otro.
 */
function moverRespuestasAEsteArchivo() {
  recordarHojaDelFormulario();
  const ui = SpreadsheetApp.getUi();
  const nombre = CONFIG.PESTANAS.respuestas;
  const propiedades = PropertiesService.getScriptProperties();

  if (propiedades.getProperty(CONFIG.PROPIEDAD_RESPUESTAS_EN_FORMULARIO) === 'SI') {
    ui.alert('Ya estaba movida', nombre + ' ya vive en este archivo.', ui.ButtonSet.OK);
    return;
  }

  const destino = SpreadsheetApp.getActiveSpreadsheet();
  const datos = hoja();
  if (datos.getId() === destino.getId()) {
    ui.alert('Nada que mover', 'Este archivo es la misma hoja de datos.', ui.ButtonSet.OK);
    return;
  }

  const original = datos.getSheetByName(nombre);
  if (!original) {
    ui.alert('Nada que mover', datos.getName() + ' no tiene la pestaña ' + nombre + '.', ui.ButtonSet.OK);
    return;
  }
  const reportes = Math.max(original.getLastRow() - 1, 0);

  // Una pestania con reportes aqui podria ser la de una prueba anterior o la
  // buena: no se decide sola cual conservar.
  const existente = destino.getSheetByName(nombre);
  if (existente && existente.getLastRow() > 1) {
    ui.alert(
      'No se movió',
      'Este archivo ya tiene una pestaña ' + nombre + ' con ' + (existente.getLastRow() - 1) +
      ' renglones. Revisa si sirve, cámbiale el nombre o bórrala, y vuelve a intentar.',
      ui.ButtonSet.OK
    );
    return;
  }

  const seguro = ui.alert(
    'Mover ' + nombre,
    'Se copiará ' + nombre + ' (' + reportes + ' reportes) de "' + datos.getName() + '" a este archivo, ' +
    'y después se borrará de allá.\n\n' + CONFIG.PESTANAS.control + ' no se toca y el vaciado sigue llegando ahí.\n\n¿Continuar?',
    ui.ButtonSet.YES_NO
  );
  if (seguro !== ui.Button.YES) return;

  // El mismo candado que usan los envios: ningun reporte entra a la mitad.
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(30000)) {
    ui.alert('Intenta de nuevo', 'Un chofer está enviando en este momento. Vuelve a intentar en unos segundos.', ui.ButtonSet.OK);
    return;
  }

  try {
    if (existente) destino.deleteSheet(existente);
    const copia = original.copyTo(destino).setName(nombre);

    const filas = original.getLastRow();
    const columnas = original.getLastColumn();
    const igual = copia.getLastRow() === filas && copia.getLastColumn() === columnas &&
      (filas === 0 || JSON.stringify(original.getRange(1, 1, filas, columnas).getValues()) ===
                      JSON.stringify(copia.getRange(1, 1, filas, columnas).getValues()));
    if (!igual) {
      destino.deleteSheet(copia);
      ui.alert('No se movió', 'La copia no quedó igual al original. No se borró nada.', ui.ButtonSet.OK);
      return;
    }

    propiedades.setProperty(CONFIG.PROPIEDAD_RESPUESTAS_EN_FORMULARIO, 'SI');
    datos.deleteSheet(original);
  } finally {
    candado.releaseLock();
  }

  ui.alert(
    'Listo',
    nombre + ' ya está en este archivo, con sus ' + reportes + ' reportes. Los nuevos llegan aquí, ' +
    'y el vaciado sigue escribiendo en ' + CONFIG.PESTANAS.control + ' de "' + datos.getName() + '".',
    ui.ButtonSet.OK
  );
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
    .addItem('Enviar por WhatsApp…', 'abrirEnviarPorWhatsApp')
    .addItem('Revisar reportes de hoy', 'revisarReportesDeHoy')
    .addItem('Reparar renglones de hoy…', 'repararRenglonesDeHoy')
    .addSeparator()
    .addItem('Cambiar hoja de datos…', 'cambiarHojaDeDatos')
    .addItem('Mover ' + CONFIG.PESTANAS.respuestas + ' a este archivo…', 'moverRespuestasAEsteArchivo')
    .addToUi();
}
