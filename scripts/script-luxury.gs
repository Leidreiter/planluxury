// =====================================================
// SISTEMA DE AUTOMATIZACIÓN PRODUCTOS
// Google Sheets + Google Drive → GitHub
// =====================================================

// ============ CONFIGURACIÓN ============
const CONFIG = {
    // GitHub
    GITHUB_TOKEN: 'token-github',
    GITHUB_OWNER: 'usuario-github',
    GITHUB_REPO: 'nombre-repositorio_github',
    GITHUB_BRANCH: 'main',
    GITHUB_FILE_PATH: 'js/productos.js',

    // Google Drive
    DRIVE_FOLDER_ID: 'ID_CARPETA_PRODUCTOS',

    // Google Sheets
    SHEET_NAME: 'Productos',

    // Estructura de columnas
    COLUMNAS: {
        ID: 0,
        NOMBRE: 1,
        DESCRIPCION: 2,
        DESCRIPCION_DET: 3,
        PRECIO: 4,
        CATEGORIA: 5,
        STOCK: 6,
        CARACTERISTICAS: 7,
        CARPETA_IMAGENES: 8
    }
};

// ============ FUNCIÓN PRINCIPAL ============
function actualizarProductosEnGitHub() {
    try {
        Logger.log('🚀 Iniciando actualización de productos...');

        const productos = leerProductosDeSheet();
        Logger.log(`✅ ${productos.length} productos leídos de Google Sheets`);

        const carpetasCreadas = validarYCrearCarpetas(productos);
        if (carpetasCreadas > 0) {
            Logger.log(`✅ ${carpetasCreadas} carpetas creadas automáticamente`);
        }

        const productosConImagenes = procesarImagenesDesdeGDrive(productos);
        Logger.log(`✅ Imágenes procesadas desde Google Drive`);

        const contenidoJS = generarArchivoProductosJS(productosConImagenes);
        Logger.log(`✅ Archivo productos.js generado`);

        subirArchivoAGitHub(contenidoJS);
        Logger.log(`✅ Archivo subido exitosamente a GitHub`);

        mostrarResultadoConCarpetas(productosConImagenes.length, carpetasCreadas);

    } catch (error) {
        Logger.log(`❌ Error: ${error.message}`);
        SpreadsheetApp.getUi().alert(
            'Error en la actualización',
            `Ocurrió un error: ${error.message}\n\nRevisa los logs para más detalles.`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );
    }
}

// ============ LEER DATOS DE GOOGLE SHEETS ============
function leerProductosDeSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
        throw new Error(`No se encontró la hoja "${CONFIG.SHEET_NAME}"`);
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2) {
        throw new Error('No hay productos en la hoja. Agrega al menos un producto.');
    }

    const datos = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const productos = datos
        .filter(fila => fila[CONFIG.COLUMNAS.ID])
        .map(fila => ({
            id: fila[CONFIG.COLUMNAS.ID],
            nombre: fila[CONFIG.COLUMNAS.NOMBRE],
            descripcion: fila[CONFIG.COLUMNAS.DESCRIPCION],
            descripcionDetallada: fila[CONFIG.COLUMNAS.DESCRIPCION_DET],
            precio: parseFloat(fila[CONFIG.COLUMNAS.PRECIO]),
            categoria: fila[CONFIG.COLUMNAS.CATEGORIA],
            stock: parseInt(fila[CONFIG.COLUMNAS.STOCK]),
            caracteristicas: fila[CONFIG.COLUMNAS.CARACTERISTICAS]
                ? fila[CONFIG.COLUMNAS.CARACTERISTICAS].split('.').map(c => c.trim())
                : [],
            carpetaImagenes: fila[CONFIG.COLUMNAS.CARPETA_IMAGENES]
        }));

    return productos;
}

// ============ VALIDAR Y CREAR CARPETAS ============
function validarYCrearCarpetas(productos) {
    const carpetaProductos = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const carpetasExistentes = new Set();

    const carpetas = carpetaProductos.getFolders();
    while (carpetas.hasNext()) {
        carpetasExistentes.add(carpetas.next().getName());
    }

    let carpetasCreadas = 0;
    productos.forEach(producto => {
        const nombreCarpeta = producto.carpetaImagenes;

        if (nombreCarpeta && !carpetasExistentes.has(nombreCarpeta)) {
            carpetaProductos.createFolder(nombreCarpeta);
            carpetasExistentes.add(nombreCarpeta);
            carpetasCreadas++;
            Logger.log(`✅ Carpeta auto-creada: "${nombreCarpeta}"`);
        }
    });

    if (carpetasCreadas > 0) {
        Logger.log(`📁 Se crearon ${carpetasCreadas} carpetas nuevas automáticamente`);
    }

    return carpetasCreadas;
}

// ============ CREAR CARPETAS MANUALMENTE ============
function crearCarpetasProductos() {
    try {
        Logger.log('📁 Iniciando creación automática de carpetas...');

        const productos = leerProductosDeSheet();
        const carpetaProductos = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

        const carpetasExistentes = new Set();
        const carpetas = carpetaProductos.getFolders();
        while (carpetas.hasNext()) {
            carpetasExistentes.add(carpetas.next().getName());
        }

        let carpetasCreadas = 0;
        let carpetasYaExistentes = 0;

        productos.forEach(producto => {
            const nombreCarpeta = producto.carpetaImagenes;

            if (!nombreCarpeta) {
                Logger.log(`⚠️ Producto ID ${producto.id} no tiene nombre de carpeta definido`);
                return;
            }

            if (carpetasExistentes.has(nombreCarpeta)) {
                carpetasYaExistentes++;
                Logger.log(`✓ Carpeta "${nombreCarpeta}" ya existe`);
            } else {
                carpetaProductos.createFolder(nombreCarpeta);
                carpetasCreadas++;
                Logger.log(`✅ Carpeta "${nombreCarpeta}" creada exitosamente`);
            }
        });

        const ui = SpreadsheetApp.getUi();
        ui.alert(
            '✅ Carpetas Procesadas',
            `Carpetas creadas: ${carpetasCreadas}\n` +
            `Carpetas existentes: ${carpetasYaExistentes}\n` +
            `Total productos: ${productos.length}\n\n` +
            `Ahora puedes subir las imágenes a cada carpeta en Google Drive.`,
            ui.ButtonSet.OK
        );

    } catch (error) {
        Logger.log(`❌ Error: ${error.message}`);
        SpreadsheetApp.getUi().alert(
            'Error al crear carpetas',
            `Ocurrió un error: ${error.message}`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );
    }
}

// ============ PROCESAR IMÁGENES DESDE GOOGLE DRIVE ============
function procesarImagenesDesdeGDrive(productos) {
    const carpetaProductos = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

    return productos.map(producto => {
        try {
            const carpetasProducto = carpetaProductos.getFoldersByName(producto.carpetaImagenes);

            if (!carpetasProducto.hasNext()) {
                Logger.log(`⚠️ Advertencia: No se encontró carpeta "${producto.carpetaImagenes}" para producto ID ${producto.id}`);
                return {
                    ...producto,
                    imagen: 'img/productos/placeholder.png',
                    galeria: ['img/productos/placeholder.png']
                };
            }

            const carpeta = carpetasProducto.next();
            const archivos = carpeta.getFiles();
            const imagenes = [];
            let imagenPrincipal = null;

            while (archivos.hasNext()) {
                const archivo = archivos.next();
                const nombre = archivo.getName().toLowerCase();

                if (nombre.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    const urlPublica = obtenerUrlPublicaGDrive(archivo.getId());

                    if (nombre === 'principal.jpg' || nombre === 'principal.png' || nombre === 'principal.webp') {
                        imagenPrincipal = urlPublica;
                    }

                    imagenes.push({
                        nombre: nombre,
                        url: urlPublica
                    });
                }
            }

            imagenes.sort((a, b) => {
                if (a.nombre.startsWith('principal')) return -1;
                if (b.nombre.startsWith('principal')) return 1;
                return a.nombre.localeCompare(b.nombre);
            });

            const galeriaUrls = imagenes.map(img => img.url);

            return {
                ...producto,
                imagen: imagenPrincipal || galeriaUrls[0] || 'img/productos/placeholder.png',
                galeria: galeriaUrls.length > 0 ? galeriaUrls : ['img/productos/placeholder.png']
            };

        } catch (error) {
            Logger.log(`❌ Error procesando imágenes de producto ${producto.id}: ${error.message}`);
            return {
                ...producto,
                imagen: 'img/productos/placeholder.png',
                galeria: ['img/productos/placeholder.png']
            };
        }
    });
}

// ============ OBTENER URL PÚBLICA DE GOOGLE DRIVE ============
function obtenerUrlPublicaGDrive(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
}

// ============ SUBIR ARCHIVO A GITHUB ============
function subirArchivoAGitHub(contenido) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.GITHUB_FILE_PATH}`;

    let sha = null;
    try {
        const response = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
            const fileData = JSON.parse(response.getContentText());
            sha = fileData.sha;
        }
    } catch (e) {
        Logger.log('Archivo no existe, se creará uno nuevo');
    }

    const blob = Utilities.newBlob(
        contenido,
        'application/javascript; charset=utf-8'
    );
    const contenidoBase64 = Utilities.base64Encode(blob.getBytes());

    const payload = {
        message: `Actualización automática de productos - ${new Date().toLocaleString('es-AR')}`,
        content: contenidoBase64,
        branch: CONFIG.GITHUB_BRANCH
    };

    if (sha) {
        payload.sha = sha;
    }

    const response = UrlFetchApp.fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();

    if (responseCode !== 200 && responseCode !== 201) {
        throw new Error(`Error al subir a GitHub: ${response.getContentText()}`);
    }

    return JSON.parse(response.getContentText());
}

// ============ MOSTRAR RESULTADO ============
function mostrarResultadoConCarpetas(cantidadProductos, carpetasCreadas) {
    const ui = SpreadsheetApp.getUi();
    let mensaje = `Se actualizaron ${cantidadProductos} productos en GitHub.\n\n`;

    if (carpetasCreadas > 0) {
        mensaje += `📁 Se crearon ${carpetasCreadas} carpetas nuevas en Google Drive.\n`;
        mensaje += `Ahora puedes subir las imágenes correspondientes.\n\n`;
    }

    mensaje += `Tu sitio web se actualizará automáticamente en unos minutos.`;

    ui.alert('✅ Actualización Exitosa', mensaje, ui.ButtonSet.OK);
}

// ============ MENÚ ============
// NOTA: La función onOpen() principal está en MenuPrincipal.gs
// Este archivo contiene las funciones del menú de productos

// ============ DIÁLOGOS DE INFORMACIÓN ============
function mostrarConfiguracion() {
    const ui = SpreadsheetApp.getUi();
    const mensaje = `
CONFIGURACIÓN ACTUAL:

GitHub:
- Usuario: ${CONFIG.GITHUB_OWNER}
- Repositorio: ${CONFIG.GITHUB_REPO}
- Rama: ${CONFIG.GITHUB_BRANCH}
- Archivo: ${CONFIG.GITHUB_FILE_PATH}

Google Drive:
- ID Carpeta: ${CONFIG.DRIVE_FOLDER_ID}

Google Sheets:
- Hoja: ${CONFIG.SHEET_NAME}

Para modificar estos valores, edita el código del script en:
Extensiones → Apps Script → CONFIG
  `;

    ui.alert('⚙️ Configuración', mensaje, ui.ButtonSet.OK);
}

function mostrarEstructuraDrive() {
    const ui = SpreadsheetApp.getUi();
    const mensaje = `
ESTRUCTURA ESPERADA EN GOOGLE DRIVE:

📁 productos (Carpeta principal)
  ├── 📁 producto01
  │   ├── 🖼️ principal.jpg (imagen principal)
  │   ├── 🖼️ 001.jpg (galería)
  │   ├── 🖼️ 002.jpg (galería)
  │   └── 🖼️ 003.jpg (galería)
  │
  ├── 📁 producto02
  │   ├── 🖼️ principal.png
  │   └── 🖼️ 001.png
  │
  └── 📁 producto03
      └── 🖼️ principal.jpg

IMPORTANTE:
- El nombre de cada carpeta debe coincidir con la columna "Carpeta Imágenes" en Sheets
- Las carpetas se crean AUTOMÁTICAMENTE al publicar
- La imagen "principal.jpg" (o .png) será la imagen destacada
- Las demás imágenes formarán la galería
- Formatos soportados: jpg, jpeg, png, gif, webp
  `;

    ui.alert('📋 Estructura de Drive', mensaje, ui.ButtonSet.OK);
}

function mostrarAyuda() {
    const ui = SpreadsheetApp.getUi();
    const mensaje = `
CÓMO USAR ESTE SISTEMA:

1️⃣ CONFIGURACIÓN INICIAL:
   - Obtén un Personal Access Token de GitHub
   - Actualiza CONFIG.GITHUB_TOKEN en el código
   - Configura los demás valores en CONFIG

2️⃣ COMPLETAR GOOGLE SHEETS:
   - Llena cada columna con los datos del producto
   - En "Carpeta Imágenes" escribe el nombre que quieras

3️⃣ PUBLICAR (TODO AUTOMÁTICO):
   - Ve a: 🚀 Actualizar Web → 📤 Publicar productos a GitHub
   - Las carpetas se crean automáticamente en Drive
   - Espera la confirmación
   - Sube las imágenes a las carpetas creadas
   - Tu web se actualizará automáticamente

4️⃣ CREAR CARPETAS MANUALMENTE (Opcional):
   - Ve a: 🚀 Actualizar Web → 📁 Crear carpetas en Drive
   - Esto solo crea las carpetas sin publicar

¿NECESITAS AYUDA?
Contacta con tu desarrollador.
  `;

    ui.alert('❓ Ayuda', mensaje, ui.ButtonSet.OK);
}

// ============ FUNCIONES DE TESTING ============
function testearLecturaSheet() {
    const productos = leerProductosDeSheet();
    Logger.log(`Total productos: ${productos.length}`);
    Logger.log(JSON.stringify(productos[0], null, 2));
}

function testearImagenesDrive() {
    const productos = leerProductosDeSheet();
    const productosConImagenes = procesarImagenesDesdeGDrive(productos);
    Logger.log(JSON.stringify(productosConImagenes[0], null, 2));
}

function testearGeneracionJS() {
    const productos = leerProductosDeSheet();
    const productosConImagenes = procesarImagenesDesdeGDrive(productos);
    const contenido = generarArchivoProductosJS(productosConImagenes);
    Logger.log(contenido);
}

function testearCreacionCarpetas() {
    const productos = leerProductosDeSheet();
    const carpetasCreadas = validarYCrearCarpetas(productos);
    Logger.log(`Carpetas creadas: ${carpetasCreadas}`);
}