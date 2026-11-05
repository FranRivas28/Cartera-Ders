# Cartera Ders

Terminal sencilla para seguir una cartera de CEDEARs, acciones argentinas y fondos.

- Precios en pesos de BYMA (vía Yahoo, ~15 min de demora), refrescados cada minuto.
- Carga de compras y ventas desde la página; resultado por costo promedio.
- Los movimientos se guardan en el navegador de quien los carga (no hay base de datos ni datos en este repo).
  Para pasarlos a otro dispositivo: "Copiar link con la cartera" o "Copiar respaldo".

## Publicar en Vercel

Importar el repo en Vercel, sin configuración extra: `index.html` es la página y `api/cotizacion.js` la función de precios.
No necesita claves.
