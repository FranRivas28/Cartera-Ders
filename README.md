# Cartera Ders

Terminal sencilla para seguir una cartera de CEDEARs, acciones argentinas y fondos.

- Precios en pesos de BYMA (vía Yahoo, ~15 min de demora), refrescados cada minuto.
- Carga de compras y ventas desde la página, con búsqueda por ticker entre todos los CEDEARs de BYMA y las acciones del Merval (`data/activos.json`).
- Los movimientos se guardan en `data/cartera.json` de este repo: cada cambio es un commit, así que queda el historial.
- Resultado por costo promedio.

## Publicar en Vercel

1. Importar el repo en Vercel (Add New → Project). `index.html` es la página; `api/` son las funciones.
2. Crear un token de GitHub con permiso de escritura solo en este repo:
   github.com → Settings → Developer settings → Fine-grained tokens → Generate new token →
   Repository access: *Only select repositories* → Cartera-Ders → Permissions: *Contents: Read and write*.
3. En Vercel → el proyecto → Settings → Environment Variables: `GITHUB_TOKEN` = ese token. Opcional: `CLAVE` = una clave que se pide para guardar.
4. Redeploy.

Los commits que solo cambian `data/cartera.json` no vuelven a publicar el sitio (`vercel.json`).
