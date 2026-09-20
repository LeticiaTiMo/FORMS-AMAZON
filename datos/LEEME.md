# Carpeta de datos exportados

Aquí van las exportaciones en CSV de la hoja de control de Google Sheets,
para poder revisar la estructura real de las columnas mientras se construye el formulario.

**El contenido de esta carpeta no se sube a GitHub.** Trae nombres de choferes, placas y
datos de operación, y el repositorio es público. El `.gitignore` ya está configurado para
ignorar todo lo que esté aquí, excepto este archivo.

## Cómo exportar

En Google Sheets, con la pestaña que quieras abierta:
**Archivo → Descargar → Valores separados por comas (.csv)**

Google exporta **solo la pestaña activa**, así que hay que repetirlo por cada una.

Guarda los archivos aquí con estos nombres:

| Archivo | Pestaña de origen |
|---|---|
| `control.csv` | La pestaña principal de control de rutas |
| `operadores.csv` | La pestaña `OPERADORES` |

## Ojo con estos datos

Son una **foto del momento**, no la fuente de verdad. El formulario en producción lee
siempre la hoja en vivo. Estos CSV sirven únicamente para diseñar la estructura y se
pueden borrar cuando el formulario esté funcionando.
