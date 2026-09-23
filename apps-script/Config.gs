/**
 * Configuracion del formulario. Es el unico archivo que se toca para
 * cambiar pestanias, catalogos o el orden de las columnas.
 */

const CONFIG = {
  // El ID de la hoja no se escribe aqui: el repositorio es publico.
  // Se guarda en Propiedades del Script con este nombre. Ver docs/instalacion.md
  PROPIEDAD_ID_HOJA: 'ID_HOJA',

  PESTANAS: {
    respuestas: 'Respuestas_Form',
    operadores: 'OPERADORES',
    control: 'BD_AMAZON',
  },

  OPERADORES: {
    encabezadoNombre: 'NOMBRE DEL DRIVER',
    encabezadoEstatus: 'STATUS',
    valorActivo: 'ACTIVO',
  },

  CEDIS: ['DMT3', 'DMT6', 'DMT4', 'DMT2', 'DTR1'],
};

/**
 * Orden de las columnas de la pestania de respuestas.
 * Cambiar este arreglo cambia la hoja: el encabezado se reescribe solo.
 */
const COLUMNAS = [
  // Envio inicial
  'MARCA_TIEMPO_INICIAL',
  'FECHA',
  'CEDIS',
  'DRIVER',
  'TIENE_AUXILIAR',
  'NOMBRE_AUXILIAR',
  'PLACAS',
  'HR_LLEGADA_BO',
  'HR_ENTRADA_BO',
  'HR_SALIDA_BOD',
  'HR_PE',
  'ZONA_RUTA',
  'ID_RUTA',
  'SPR',
  'KM_INICIAL',
  // Envio final
  'MARCA_TIEMPO_FINAL',
  'HR_UE',
  'ENTREGADOS',
  'DEVOLUCIONES',
  'NO_VISITADO',
  'VISITADO',
  'KM_FINAL',
  'MOTIVO',
  // Control del espejo. FILA_CONTROL recuerda en que renglon de BD_AMAZON
  // quedo el reporte, para completarlo por la tarde en vez de duplicarlo.
  'FILA_CONTROL',
  'ESPEJADO_INICIAL',
  'ESPEJADO_FINAL',
];

/** Campos que manda el envio inicial, con su validacion. */
const CAMPOS_INICIAL = [
  { clave: 'CEDIS',           etiqueta: 'CEDIS',                  tipo: 'lista',   obligatorio: true },
  { clave: 'DRIVER',          etiqueta: 'Driver',                 tipo: 'lista',   obligatorio: true },
  { clave: 'TIENE_AUXILIAR',  etiqueta: 'La ruta tiene auxiliar', tipo: 'lista',   obligatorio: true },
  { clave: 'NOMBRE_AUXILIAR', etiqueta: 'Nombre del auxiliar',    tipo: 'lista',   obligatorio: false },
  { clave: 'PLACAS',          etiqueta: 'Placas',                 tipo: 'texto',   obligatorio: true },
  { clave: 'HR_LLEGADA_BO',   etiqueta: 'Hora de llegada a BO',   tipo: 'hora',    obligatorio: true },
  { clave: 'HR_ENTRADA_BO',   etiqueta: 'Hora de entrada a BO',   tipo: 'hora',    obligatorio: true },
  { clave: 'HR_SALIDA_BOD',   etiqueta: 'Hora de salida de BOD',  tipo: 'hora',    obligatorio: true },
  { clave: 'HR_PE',           etiqueta: 'Hora de primera entrega',tipo: 'hora',    obligatorio: true },
  { clave: 'ZONA_RUTA',       etiqueta: 'Zona de ruta',           tipo: 'texto',   obligatorio: true },
  { clave: 'ID_RUTA',         etiqueta: 'ID de ruta',             tipo: 'texto',   obligatorio: true },
  { clave: 'SPR',             etiqueta: 'SPR',                    tipo: 'entero',  obligatorio: true },
  { clave: 'KM_INICIAL',      etiqueta: 'KM inicial',             tipo: 'entero',  obligatorio: true },
];

/**
 * Campos del envio final.
 * DEVOLUCIONES es como los choferes le llaman a lo que la hoja de control
 * registra en la columna Fallidas. Es el mismo dato.
 */
const CAMPOS_FINAL = [
  { clave: 'HR_UE',        etiqueta: 'Hora de última entrega', tipo: 'hora',   obligatorio: true },
  { clave: 'ENTREGADOS',   etiqueta: 'Entregados',             tipo: 'entero', obligatorio: true },
  { clave: 'DEVOLUCIONES', etiqueta: 'Devoluciones',           tipo: 'entero', obligatorio: true },
  { clave: 'NO_VISITADO',  etiqueta: 'No visitado',            tipo: 'entero', obligatorio: true },
  { clave: 'VISITADO',     etiqueta: 'Visitado',               tipo: 'entero', obligatorio: true },
  { clave: 'KM_FINAL',     etiqueta: 'KM final',               tipo: 'entero', obligatorio: true },
  { clave: 'MOTIVO',       etiqueta: 'Motivo',                 tipo: 'texto',  obligatorio: false },
];

/**
 * Como se acomoda cada texto libre antes de guardarlo.
 * Se hace al capturar y no al espejar, para que Respuestas_Form y la hoja de
 * control digan lo mismo, y para que el chofer no tenga que cuidar mayusculas
 * escribiendo en el celular a media ruta.
 */
const NORMALIZAR = {
  PLACAS: 'mayusculas',
  ID_RUTA: 'mayusculas',
  ZONA_RUTA: 'inicial',
};

/** Las horas deben ir en este orden cronologico. */
const ORDEN_HORAS = ['HR_LLEGADA_BO', 'HR_ENTRADA_BO', 'HR_SALIDA_BOD', 'HR_PE'];

/** Horas que se guardan como fraccion del dia, porque BD_AMAZON hace cuentas con ellas. */
const COLUMNAS_HORA = [
  'HR_LLEGADA_BO', 'HR_ENTRADA_BO', 'HR_SALIDA_BOD', 'HR_PE', 'HR_UE',
];

/**
 * A que columna de BD_AMAZON va cada respuesta.
 *
 * El espejo escribe solo valores y **nunca pasa de AA**. De AB en adelante la
 * hoja se llena sola con formulas ya extendidas, y escribir ahi las borraria.
 *
 * Tampoco toca las que captura Leticia a mano: A SEMANA, B MES, C PERIODO,
 * D CAPTURA, E FECHA, H Tipo de Vehiculo, L TIPO DE SERVICIO y M Tipo de ruta.
 *
 * V Entregados queda fuera aunque el chofer lo capture, porque en la hoja de
 * control sale de una formula: SPR menos devoluciones.
 *
 * MOTIVO se guarda en Respuestas_Form pero no se espeja, por la misma regla de
 * no tocar de AB en adelante.
 */
const ESPEJO_INICIAL = {
  CEDIS: 'F',
  DRIVER: 'G',
  TIENE_AUXILIAR: 'I',
  NOMBRE_AUXILIAR: 'J',
  PLACAS: 'K',
  HR_LLEGADA_BO: 'N',
  HR_ENTRADA_BO: 'O',
  HR_SALIDA_BOD: 'P',
  HR_PE: 'Q',
  ZONA_RUTA: 'S',
  ID_RUTA: 'T',
  SPR: 'U',
  KM_INICIAL: 'Z',
};

/**
 * Lo que llega por la tarde y se escribe sobre el renglon que ya existe.
 * No son columnas seguidas, y entre ellas hay formulas, asi que se escriben
 * una por una en vez de como bloque.
 */
const ESPEJO_FINAL = {
  HR_UE: 'R',
  DEVOLUCIONES: 'W',
  NO_VISITADO: 'X',
  VISITADO: 'Y',
  KM_FINAL: 'AA',
};
