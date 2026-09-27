/**
 * Pone el menu "Formulario de ruta" al abrir la hoja a la que esta vinculado
 * este proyecto, que no es la hoja de datos: el vaciado trabaja sobre la hoja
 * de ID_HOJA, asi que se puede lanzar desde cualquier hoja.
 *
 * Solo va en un proyecto que no tenga ya su propio onOpen. Si lo tiene, dos
 * funciones con el mismo nombre se pisan: en ese caso no se copia este
 * archivo y crearMenuFormulario se instala como activador al abrir.
 */
function onOpen() {
  crearMenuFormulario();
  recordarHojaDelFormulario();
}
