// =====================================================
// SISTEMA DE AUTOMATIZACIÓN PRODUCTOS
// Google Sheets + Google Drive → GitHub
// =====================================================

// ============ CONFIGURACIÓN ============
const CONFIG = {
    // GitHub - Ahora se obtienen de forma segura desde las Propiedades del Script
    // Debes configurar estos valores en: Configuración del proyecto -> Propiedades del script
    GITHUB_TOKEN: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
    GITHUB_OWNER: PropertiesService.getScriptProperties().getProperty('GITHUB_OWNER'),
    GITHUB_REPO: PropertiesService.getScriptProperties().getProperty('GITHUB_REPO'),
    GITHUB_BRANCH: 'main', // O la rama que uses para tu sitio web
    GITHUB_FILE_PATH: 'js/productos.json', // Cambiado a JSON

    // Google Drive - También guardado por seguridad
    DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'),

    // Google Sheets
    SHEET_NAME: 'Productos',
    PEDIDOS_SHEET_NAME: 'Pedidos',

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

// ============ RECIBIR PEDIDOS DESDE EL FORMULARIO ============
function doPost(e) {
    try {
        if (!e.postData || !e.postData.contents) {
            throw new Error("No se recibieron datos válidos en la solicitud.");
        }

        const rawData = JSON.parse(e.postData.contents);
        const data = sanitizarYValidarPedido(rawData);

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(CONFIG.PEDIDOS_SHEET_NAME);

        // Si la hoja de pedidos no existe, la creamos con encabezados
        if (!sheet) {
            sheet = ss.insertSheet(CONFIG.PEDIDOS_SHEET_NAME);
            const headers = [
                'N° Pedido', 'Fecha', 'Hora', 'Nombre', 'Teléfono', 'Email', 
                'Dirección', 'Ciudad', 'Provincia', 'CP', 'Productos', 'Cant.', 
                'Cupón', 'Descuento', 'Subtotal', 'Total', 'Notas', 'Estado'
            ];
            sheet.appendRow(headers);
            sheet.getRange(1, 1, 1, 18).setFontWeight('bold').setBackground('#f3f3f3');
        }

        // 1. Generar número de pedido formateado (PED-0001)
        const ultimaFila = sheet.getLastRow();
        const nPedidoNum = ultimaFila <= 1 ? 1 : parseInt(sheet.getRange(ultimaFila, 1).getValue().toString().replace('PED-', '')) + 1;
        const nPedido = 'PED-' + nPedidoNum.toString().padStart(4, '0');

        // 2. Formatear Fecha y Hora por separado
        const ahora = new Date();
        const fecha = Utilities.formatDate(ahora, "GMT-3", "dd/MM/yyyy");
        const hora = Utilities.formatDate(ahora, "GMT-3", "HH:mm:ss");

        // 3. Preparar strings para productos y cantidades por separado
        const nombresProductos = data.productos.map(p => p.nombre).join("\n");
        const cantidadesProductos = data.productos.map(p => p.quantity).join("\n");

        // Insertar la nueva fila de pedido
        sheet.appendRow([
            nPedido,                  // A: N° Pedido
            fecha,                    // B: Fecha
            hora,                     // C: Hora
            data.cliente.nombre,      // D: Nombre
            "'" + data.cliente.telefono, // E: Teléfono (forzado como texto)
            data.cliente.email,       // F: Email
            data.cliente.direccion,   // G: Dirección
            data.cliente.ciudad,      // H: Ciudad
            data.cliente.provincia,   // I: Provincia
            data.cliente.codigoPostal,// J: CP
            nombresProductos,         // K: Productos
            cantidadesProductos,      // L: Cant.
            data.cupon,               // M: Cupón
            data.descuento,           // N: Descuento
            data.subtotal,            // O: Subtotal
            data.total,               // P: Total
            data.cliente.notas,       // Q: Notas
            "Pendiente"               // R: Estado
        ]);

        // 4. Aplicar formato visual a la nueva fila
        const nuevaFilaIndex = sheet.getLastRow();
        sheet.getRange(nuevaFilaIndex, 1, 1, 18).setVerticalAlignment('top');
        sheet.getRange(nuevaFilaIndex, 11, 1, 2).setWrap(true); // Wrap en productos y cantidades
        sheet.getRange(nuevaFilaIndex, 16).setNumberFormat('#,##0'); // Formato moneda en Total
        sheet.getRange(nuevaFilaIndex, 18).setBackground('#fff3cd').setHorizontalAlignment('center'); // Estado amarillo

        // Descontar stock automáticamente de la hoja "Productos"
        const huboAgotados = actualizarStockTrasPedido(data.productos);

        // Si algún producto se agotó, publicamos automáticamente a GitHub para actualizar la web
        if (huboAgotados) {
            ejecutarSincronizacionSilenciosa();
        }

        // Enviar notificación por email al dueño
        enviarEmailNotificacion(data);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ============ VALIDACIÓN Y SANITIZACIÓN ============
function sanitizarYValidarPedido(data) {
    if (!data || !data.cliente || !data.productos || !Array.isArray(data.productos)) {
        throw new Error('Estructura de pedido inválida.');
    }

    const { cliente, productos } = data;
    // Función para limpiar strings y evitar inyecciones básicas o exceso de datos
    const cleanString = (str) => typeof str === 'string' ? str.trim().substring(0, 500) : '';

    const clienteSanitizado = {
        nombre: cleanString(cliente.nombre),
        telefono: cleanString(cliente.telefono),
        email: cleanString(cliente.email).toLowerCase(),
        direccion: cleanString(cliente.direccion),
        ciudad: cleanString(cliente.ciudad),
        provincia: cleanString(cliente.provincia),
        codigoPostal: cleanString(cliente.codigoPostal),
        notas: cleanString(cliente.notas) || 'Sin notas'
    };

    // Validaciones de negocio obligatorias
    if (!clienteSanitizado.nombre || !clienteSanitizado.email || !clienteSanitizado.telefono) {
        throw new Error('Nombre, Email y Teléfono son obligatorios para procesar el pedido.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteSanitizado.email)) {
        throw new Error('El formato del correo electrónico es inválido.');
    }

    if (productos.length === 0) {
        throw new Error('El pedido debe contener al menos un producto.');
    }

    return {
        cliente: clienteSanitizado,
        productos: productos.map(p => ({
            nombre: cleanString(p.nombre),
            quantity: Math.max(1, parseInt(p.quantity) || 1),
            precio: parseFloat(p.precio) || 0
        })),
        cupon: cleanString(data.cupon) || 'NINGUNO',
        subtotal: Math.max(0, parseFloat(data.subtotal) || 0),
        descuento: Math.max(0, parseFloat(data.descuento) || 0),
        total: Math.max(0, parseFloat(data.total) || 0)
    };
}

// ============ ACTUALIZAR STOCK EN GOOGLE SHEETS ============
function actualizarStockTrasPedido(productosComprados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const stockColIdx = CONFIG.COLUMNAS.STOCK;
  const nombreColIdx = CONFIG.COLUMNAS.NOMBRE;
  
  let algunProductoAgotado = false;
  let huboCambios = false;

  productosComprados.forEach(item => {
    for (let i = 0; i < values.length; i++) {
      if (values[i][nombreColIdx] === item.nombre) {
        const stockActual = parseInt(values[i][stockColIdx]) || 0;
        const nuevoStock = Math.max(0, stockActual - item.quantity);
        
        if (stockActual !== nuevoStock) {
            values[i][stockColIdx] = nuevoStock;
            huboCambios = true;
            if (nuevoStock === 0) {
              sheet.getRange(i + 1, 1, 1, values[0].length).setBackground('#fff5f5');
              algunProductoAgotado = true;
            }
        }
        break;
      }
    }
  });

  if (huboCambios) {
      const stockData = values.slice(1).map(row => [row[stockColIdx]]);
      sheet.getRange(2, stockColIdx + 1, stockData.length, 1).setValues(stockData);
  }
  return algunProductoAgotado;
}

// ============ NOTIFICACIÓN POR EMAIL ============
function enviarEmailNotificacion(data) {
    const emailAdmin = Session.getEffectiveUser().getEmail(); // Más fiable en Web Apps
    const asunto = `🛍️ Nuevo Pedido de ${data.cliente.nombre}`;
    
    const productosHtml = data.productos.map(p => `<li>${p.nombre} (x${p.quantity})</li>`).join('');
    
    const cuerpo = `
        <h2>Detalles del Pedido</h2>
        <p><strong>Cliente:</strong> ${data.cliente.nombre}</p>
        <p><strong>Email:</strong> ${data.cliente.email}</p>
        <p><strong>Teléfono:</strong> ${data.cliente.telefono}</p>
        <p><strong>Total:</strong> $${data.total}</p>
        <h3>Productos:</h3>
        <ul>${productosHtml}</ul>
        <p>Revisa la hoja de cálculo para más detalles.</p>
    `;

    MailApp.sendEmail({
        to: emailAdmin,
        subject: asunto,
        htmlBody: cuerpo
    });
}

// ============ GESTIÓN DE ESTADOS (Incorporado de RegistroPedidos) ============
function actualizarEstadoPedido(numeroPedido, nuevoEstado) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.PEDIDOS_SHEET_NAME);
    if (!sheet) return;

    const datos = sheet.getDataRange().getValues();
    const colores = {
        'Pendiente': '#fff3cd',
        'Procesando': '#cfe2ff',
        'Enviado': '#d1e7dd',
        'Entregado': '#a3cfbb',
        'Cancelado': '#f8d7da'
    };

    for (let i = 1; i < datos.length; i++) {
        if (datos[i][0] === numeroPedido) {
            const celdaEstado = sheet.getRange(i + 1, 18);
            celdaEstado.setValue(nuevoEstado);
            celdaEstado.setBackground(colores[nuevoEstado] || '#ffffff');
            return;
        }
    }
}

function mostrarEstadisticas() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PEDIDOS_SHEET_NAME);
    if (!sheet) return;
    
    const datos = sheet.getDataRange().getValues();
    let totalVentas = 0;
    let estados = { 'Pendiente': 0, 'Procesando': 0, 'Enviado': 0, 'Entregado': 0, 'Cancelado': 0 };
    
    for (let i = 1; i < datos.length; i++) {
        totalVentas += parseFloat(datos[i][15]) || 0;
        const est = datos[i][17];
        if (estados.hasOwnProperty(est)) estados[est]++;
    }
    
    const mensaje = `📊 RESUMEN DE VENTAS\n\n` +
                    `Total Pedidos: ${datos.length - 1}\n` +
                    `Ventas Totales: $${totalVentas.toLocaleString('es-AR')}\n\n` +
                    `⏳ Pendientes: ${estados['Pendiente']}\n` +
                    `🚚 Enviados: ${estados['Enviado']}\n` +
                    `✅ Entregados: ${estados['Entregado']}`;
    
    SpreadsheetApp.getUi().alert('Estadísticas', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============ FUNCIÓN PARA CONFIGURAR SECRETOS (Ejecutar una vez) ============
function configurarSecretos() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'GITHUB_TOKEN': 'TU_TOKEN_AQUI',
    'GITHUB_OWNER': 'TU_USUARIO_AQUI',
    'GITHUB_REPO': 'TU_REPO_AQUI',
    'DRIVE_FOLDER_ID': 'TU_ID_DE_CARPETA_AQUI'
  });
  Logger.log('✅ Propiedades configuradas correctamente. Ya puedes borrar los valores de esta función.');
}

// ============ FUNCIÓN PRINCIPAL ============
function actualizarProductosEnGitHub() {
    try {
        const resultado = sincronizarTodoCore();
        mostrarResultadoConCarpetas(resultado.cantidad, resultado.carpetas);
    } catch (error) {
        Logger.log(`❌ Error: ${error.message}`);
        SpreadsheetApp.getUi().alert(
            'Error en la actualización',
            `Ocurrió un error: ${error.message}\n\nRevisa los logs para más detalles.`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );
    }
}

function ejecutarSincronizacionSilenciosa() {
    try {
        sincronizarTodoCore();
        Logger.log('✅ Sincronización automática completada.');
    } catch (error) {
        Logger.log(`❌ Error en sincronización silenciosa: ${error.message}`);
    }
}

function sincronizarTodoCore() {
    const productos = leerProductosDeSheet();
    const carpetasCreadas = validarYCrearCarpetas(productos);
    const productosConImagenes = procesarImagenesDesdeGDrive(productos);

    // 1. Subir el JSON principal de productos
    const contenidoJSON = JSON.stringify(productosConImagenes, null, 2);
    subirArchivoAGitHub(contenidoJSON, 'application/json; charset=utf-8', CONFIG.GITHUB_FILE_PATH);
    return {
        cantidad: productosConImagenes.length,
        carpetas: carpetasCreadas
    };
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
    const mainFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    
    // Optimizamos: Mapeamos todas las carpetas de una vez en lugar de buscar una por una
    const folderMap = {};
    const folders = mainFolder.getFolders();
    while (folders.hasNext()) {
        const folder = folders.next();
        folderMap[folder.getName()] = folder;
    }

    return productos.map(producto => {
        try {
            const carpeta = folderMap[producto.carpetaImagenes];

            if (!carpeta) {
                Logger.log(`⚠️ Advertencia: No se encontró carpeta "${producto.carpetaImagenes}" para producto ID ${producto.id}`);
                return {
                    ...producto,
                    imagen: 'img/productos/placeholder.png',
                    galeria: ['img/productos/placeholder.png']
                };
            }

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
function subirArchivoAGitHub(contenido, contentType, path) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;

    let sha = null;
    try {
        const response = UrlFetchApp.fetch(url, {
            method: 'GET', // Intenta obtener el SHA del archivo existente
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
        contentType // Usar el tipo de contenido pasado como argumento
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
        headers: { // Encabezados para la solicitud PUT
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
    const contenidoJSON = JSON.stringify(productosConImagenes, null, 2); // Generar JSON para test
    Logger.log(contenidoJSON);
}
function testearCreacionCarpetas() {
    const productos = leerProductosDeSheet();
    const carpetasCreadas = validarYCrearCarpetas(productos);
    Logger.log(`Carpetas creadas: ${carpetasCreadas}`);
}