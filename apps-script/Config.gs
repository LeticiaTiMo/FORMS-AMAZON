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
    placas: 'PLACAS',
  },

  OPERADORES: {
    encabezadoNombre: 'NOMBRE DEL DRIVER',
    encabezadoEstatus: 'STATUS',
    valorActivo: 'ACTIVO',
  },

  CEDIS: ['DMT3', 'DMT6', 'DMT4', 'DMT2', 'DTR1'],

  // Solo sugerencias: el campo acepta cualquier texto porque las zonas cambian.
  ZONAS_SUGERIDAS: [
    'Cumbres',
    'San Jerónimo',
    'San Pedro',
    'Santa Catarina',
    'Santa María',
    'Monterrey',
    'Puerta de Hierro',
    'Vista Hermosa',
    'Guadalupe',
    'San Agustín',
    'Apodaca',
    'García',
    'Santiago',
    'San Cristóbal',
    'Escobedo',
    'Linda Vista',
    'La Rioja',
    'La Herradura',
    'Mitras',
    'San Nicolás',
  ],
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
];

/** Campos que manda el envio inicial, con su validacion. */
const CAMPOS_INICIAL = [
  { clave: 'CEDIS',           etiqueta: 'CEDIS',                  tipo: 'lista',   obligatorio: true },
  { clave: 'DRIVER',          etiqueta: 'Driver',                 tipo: 'lista',   obligatorio: true },
  { clave: 'TIENE_AUXILIAR',  etiqueta: 'La ruta tiene auxiliar', tipo: 'lista',   obligatorio: true },
  { clave: 'NOMBRE_AUXILIAR', etiqueta: 'Nombre del auxiliar',    tipo: 'lista',   obligatorio: false },
  { clave: 'PLACAS',          etiqueta: 'Placas',                 tipo: 'lista',   obligatorio: true },
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

/** Las horas deben ir en este orden cronologico. */
const ORDEN_HORAS = ['HR_LLEGADA_BO', 'HR_ENTRADA_BO', 'HR_SALIDA_BOD', 'HR_PE'];
