# UNIKA SPA HOLÍSTICO — Sitio comercial

Sitio estático en HTML, CSS y JavaScript, diseñado para publicarse en GitHub Pages sin alojamiento de pago ni backend. Incluye catálogo de servicios en JSON, búsqueda, filtros, cambio de idioma español/inglés, selección de servicios y consulta de disponibilidad por WhatsApp, además de un panel administrativo independiente.

## 1. Publicar en GitHub Pages

1. Descomprime el ZIP. Los archivos `index.html`, `admin.html` y las carpetas `css`, `js`, `data` y `assets` deben quedar en la **raíz** del repositorio, no dentro de una carpeta adicional.
2. Crea un repositorio de GitHub o abre uno existente. Sube esos archivos a la rama `main`.
3. En el repositorio abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**. Elige `main` y la carpeta `/(root)`. Guarda.
5. Espera a que GitHub Pages indique que la web está publicada. Su dirección será similar a `https://USUARIO.github.io/REPOSITORIO/`.
6. Comprueba la carga del catálogo, las imágenes, los filtros y los enlaces de contacto tanto en celular como en computador.

La web funciona también bajo la ruta de un proyecto (`/REPOSITORIO/`) porque sus archivos utilizan rutas relativas.

## 2. Abrir en un equipo sin publicarla

Los navegadores suelen bloquear la lectura de JSON al abrir `index.html` directamente con `file://`. Inicia un servidor web local desde la carpeta del proyecto. Una alternativa sin dependencias adicionales, si tienes Python instalado, es:

```bash
python -m http.server 8000
```

Después visita `http://localhost:8000/` y `http://localhost:8000/admin.html`.

## 3. Modificar servicios y precios sin GitHub

1. Abre `admin.html` desde el sitio o el servidor local.
2. Pulsa **Nuevo servicio** para crear, o utiliza **Editar**, **Ocultar/Mostrar** y **Eliminar** en la tabla.
3. Pulsa **Descargar JSON**. Se descargará `catalogo.json` con todos tus cambios.
4. En GitHub, reemplaza el archivo `data/catalogo.json` por el descargado y confirma el commit.
5. Espera el despliegue de GitHub Pages y recarga la web pública.

Los cambios hechos solo en la pantalla del administrador **no** se publican automáticamente. Si cierras la página antes de descargar o enviar a GitHub, se perderán.

## 4. Conectar el administrador a GitHub

1. En GitHub, abre **Settings → Developer settings → Personal access tokens → Fine-grained tokens** y crea un token nuevo.
2. Limita el token a **un solo repositorio**, el del sitio. En **Repository permissions**, concede **Contents: Read and write**. No necesita permisos sobre otros repositorios.
3. Abre `admin.html` e introduce el usuario/organización, nombre del repositorio, rama (normalmente `main`) y el token.
4. Pulsa **Conectar y cargar GitHub**. El administrador descargará el `data/catalogo.json` y su SHA actual.
5. Edita el catálogo. Cuando esté listo, pulsa **Publicar cambios en GitHub**. Se creará un commit usando la API de contenidos de GitHub.
6. Confirma que el cambio aparece en GitHub y espera a que Pages actualice la página.

**Seguridad:** el token se mantiene únicamente en memoria durante esa sesión del navegador. No se guarda en archivos, repositorio, `localStorage`, `sessionStorage` ni en la URL. Al desconectar, recargar o cerrar la pestaña, debes introducirlo de nuevo. No compartas el token por mensajería ni lo subas al repositorio. El panel estático no tiene autenticación de usuarios: cualquier persona que conozca `admin.html` puede abrir la interfaz, pero solo un token válido con permiso de escritura puede editar el repositorio.

Si GitHub detecta que el archivo fue modificado por alguien más desde que te conectaste, puede devolver un conflicto de versión. En ese caso, revisa los cambios y vuelve a conectarte; no sobrescribas a ciegas. Para perfiles de empleados y acceso privado real se necesitaría un sistema de autenticación con backend.

## 5. Archivos principales

- `index.html`: sitio público y selección de servicios.
- `admin.html`: administrador de servicios y precios.
- `data/catalogo.json`: fuente editable de nombres, precios, categorías, descripciones y visibilidad.
- `js/app.js`: búsqueda, filtros, idioma y consulta de WhatsApp.
- `js/admin.js`: CRUD local y sincronización opcional con GitHub.
- `css/styles.css`: identidad y diseño responsivo del sitio.
- `css/admin.css`: diseño del administrador.
- `assets/images`: fotografías y logo preparados a partir del material facilitado.
- `assets/originales`: piezas promocionales recibidas como respaldo.

## 6. Datos que conviene confirmar antes de ofrecer la web al establecimiento

- **Moneda:** se utilizaron **dólares estadounidenses (USD)** de acuerdo con las piezas de promoción y la referencia a Puerto Rico.
- **Teléfono:** +1 (939) 397-9462 y **Instagram:** @unika_spa_holistico aparecen repetidamente en el material.
- **Correo:** Unikaspa03@gmail.com aparece en una pieza informativa.
- **Dirección:** una promoción menciona *Mahi Mahi Shopping Village, Dorado, Puerto Rico*, junto a la marca *Malibu Hair & Nails*. No se muestra como sede confirmada en el sitio hasta verificar que sigue siendo la ubicación de Unika Spa.
- **Horario:** una promoción menciona lunes a sábado, 9:00 a. m. a 6:00 p. m. Por tratarse de una pieza puntual, se dejó fuera del sitio hasta confirmar vigencia.
- **Tratamiento facial de $120:** los materiales lo describen de dos maneras: «Microdermoabrasión y fototerapia» y «Limpieza facial profunda con microdermoabrasión». El catálogo usa el primer nombre de la pieza general; se recomienda validar la denominación comercial actual.

Los botones de WhatsApp solo preparan un mensaje para que el cliente lo envíe; no cobran dinero ni confirman citas. Los servicios marcados «Desde» pueden variar de precio.
