/**
 * "Enviar por WhatsApp" del menu: arma otra vez el mensaje de los reportes
 * del dia, igual que el que manda el chofer con su boton, para que Leticia
 * reenvie los que quiera. El texto sale de resumenInicial() y resumenFinal(),
 * las mismas funciones que usa la pantalla del chofer, asi que no puede
 * quedar distinto.
 */

function abrirEnviarPorWhatsApp() {
  const pantalla = HtmlService.createHtmlOutputFromFile('EnviarWhatsApp')
    .setWidth(620)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(pantalla, 'Enviar por WhatsApp');
}

/**
 * Los mensajes de los reportes de hoy, del mas reciente al mas antiguo. Un
 * reporte da dos mensajes si ya llego el final.
 */
function mensajesDeHoy() {
  const respuestas = libroDeRespuestas().getSheetByName(CONFIG.PESTANAS.respuestas);
  if (!respuestas || respuestas.getLastRow() < 2) return [];

  const hoy = fechaDeHoy();
  const zona = Session.getScriptTimeZone();
  const valores = respuestas.getRange(2, 1, respuestas.getLastRow() - 1, COLUMNAS.length).getValues();
  const mensajes = [];

  valores.forEach(function (fila, n) {
    const d = {};
    COLUMNAS.forEach(function (c, i) { d[c] = fila[i]; });
    if (!String(d.MARCA_TIEMPO_INICIAL || '').trim() || comoFecha(d.FECHA) !== hoy) return;

    // Sheets relee las horas como Date; el mensaje del chofer las trae "HH:mm".
    COLUMNAS_HORA.forEach(function (c) { d[c] = comoHora(d[c]); });
    const fecha = Utilities.parseDate(hoy + ' 12:00', zona, 'yyyy-MM-dd HH:mm');

    mensajes.push({
      id: (n + 2) + '-inicial',
      driver: String(d.DRIVER),
      tipo: 'Inicial',
      hora: horaDeMarca(d.MARCA_TIEMPO_INICIAL),
      orden: marcaEnMilisegundos(d.MARCA_TIEMPO_INICIAL),
      texto: resumenInicial(d, fecha),
    });

    if (String(d.MARCA_TIEMPO_FINAL || '').trim()) {
      const referencia = { SPR: Number(d.SPR) || 0, KM_INICIAL: Number(d.KM_INICIAL) || 0 };
      mensajes.push({
        id: (n + 2) + '-final',
        driver: String(d.DRIVER),
        tipo: 'Final',
        hora: horaDeMarca(d.MARCA_TIEMPO_FINAL),
        orden: marcaEnMilisegundos(d.MARCA_TIEMPO_FINAL),
        texto: resumenFinal(String(d.DRIVER), d, referencia, fecha),
      });
    }
  });

  return mensajes.sort(function (a, b) { return b.orden - a.orden; });
}

/** Las marcas viejas son texto "yyyy-MM-dd HH:mm:ss"; las nuevas, Date. */
function marcaEnMilisegundos(valor) {
  if (valor instanceof Date) return valor.getTime();
  const m = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0;
}

function horaDeMarca(valor) {
  if (valor instanceof Date) return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  const m = String(valor || '').match(/ (\d{2}:\d{2})/);
  return m ? m[1] : '';
}
