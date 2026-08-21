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
    GITHUB_CUPONES_FILE_PATH: 'js/cupones.json',

    // Google Drive - También guardado por seguridad
    DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'),

    // Google Sheets
    SHEET_NAME: 'ProductosLuxury',
    CUPONES_SHEET_NAME: 'Cupones',
    PEDIDOS_SHEET_NAME: 'Pedidos',
    RESENAS_SHEET_NAME: 'Reseñas',
    RESENAS_FOLDER_NAME: 'reseñas',
    GITHUB_RESENAS_FILE_PATH: 'js/resenas.json',
    IMAGEN_FALLBACK_RESENAS: 'img/productos/profile.png',

    // Seguridad del endpoint de pedidos
    WEB_API_KEY: PropertiesService.getScriptProperties().getProperty('WEB_API_KEY'),
    TOPE_CANTIDAD_POR_PRODUCTO: 50,
    PEDIDOS_MAX_POR_HORA_POR_CLIENTE: 5,
    PEDIDOS_MAX_POR_MINUTO_GLOBAL: 30,

    // Lógica de descuentos (debe reflejar la lógica de js/utils.js en el frontend)
    UMBRAL_DESCUENTO: 100000,
    PORCENTAJE_DESCUENTO: 10,

    // Estructura de columnas
    COLUMNAS: {
        ID: 0,
        NOMBRE: 1,
        DESCRIPCION: 2,
        DESCRIPCION_DET: 3,
        PRECIO: 4,
        PRECIO_ANTERIOR: 5,
        CATEGORIA: 6,
        STOCK: 7,
        CARACTERISTICAS: 8,
        CARPETA_IMAGENES: 9
    }
};

// ============ RECIBIR PEDIDOS DESDE EL FORMULARIO ============
function doPost(e) {
    try {
        if (!e.postData || !e.postData.contents) {
            throw new Error("No se recibieron datos válidos en la solicitud.");
        }

        const rawData = JSON.parse(e.postData.contents);

        // 0. Autenticación por clave compartida (anti-spam; la autoridad real
        // es el recalculo de montos server-side, ver calcularMontosServidor)
        if (!validarApiKey(rawData)) {
            Logger.log(`🔒 Petición rechazada por API key inválida (cliente: ${rawData.cliente && rawData.cliente.email})`);
            return respuestaJson({ status: 'error', message: 'Solicitud no autorizada.' });
        }

        // 0b. Rate limit: evita inundar la hoja de pedidos
        if (!respetarRateLimit(rawData)) {
            Logger.log(`🚫 Rate limit superado (cliente: ${rawData.cliente && rawData.cliente.email})`);
            return respuestaJson({ status: 'error', message: 'Demasiados pedidos desde este cliente. Inténtalo más tarde.' });
        }

        const data = sanitizarYValidarPedido(rawData);

        // Lock para numeración atómica de pedidos (evita duplicados en paralelo)
        const lock = LockService.getScriptLock();
        lock.waitLock(10000);

        try {
            const ss = SpreadsheetApp.getActiveSpreadsheet();
            const sheet = garantizarHojaPedidos(ss);

            // 1. Generar número de pedido formateado (PED-0001)
            const ultimaFila = sheet.getLastRow();
            let nPedidoNum = 1;
            if (ultimaFila > 1) {
                const ultimoValor = sheet.getRange(ultimaFila, 1).getValue().toString().replace('PED-', '');
                const ultimoNumero = parseInt(ultimoValor, 10);
                nPedidoNum = isNaN(ultimoNumero) ? 1 : ultimoNumero + 1;
            }
            const nPedido = 'PED-' + nPedidoNum.toString().padStart(4, '0');

            // 2. Formatear Fecha y Hora por separado (zona horaria del spreadsheet)
            const tz = ss.getSpreadsheetTimeZone();
            const ahora = new Date();
            const fecha = Utilities.formatDate(ahora, tz, "dd/MM/yyyy");
            const hora = Utilities.formatDate(ahora, tz, "HH:mm:ss");

            // 3. Recalcular montos con precios, stock y cupones REALES de la hoja
            const calculo = calcularMontosServidor(data.productos, data.cupon);

            // 4. Preparar strings para productos y cantidades por separado
            const nombresProductos = calculo.productos.map(p => p.nombre).join("\n");
            const cantidadesProductos = calculo.productos.map(p => p.quantity).join("\n");

            // Insertar la nueva fila de pedido
            sheet.appendRow([
                nPedido,                  // A: N° Pedido
                fecha,                    // B: Fecha
                hora,                     // C: Hora
                data.cliente.nombre,      // D: Nombre
                data.cliente.telefono,    // E: Teléfono (forzado como texto)
                data.cliente.email,       // F: Email
                data.cliente.direccion,   // G: Dirección
                data.cliente.ciudad,      // H: Ciudad
                data.cliente.provincia,   // I: Provincia
                data.cliente.codigoPostal,// J: CP
                nombresProductos,         // K: Productos
                cantidadesProductos,      // L: Cant.
                calculo.cupon,            // M: Cupón
                calculo.subtotal,         // N: Subtotal (recalculado en servidor)
                calculo.descuento,        // O: Descuento (recalculado en servidor)
                calculo.porcentaje + "%", // P: % Dcto
                calculo.total,            // Q: Total (recalculado en servidor)
                data.cliente.notas,       // R: Notas
                "Pendiente",              // S: Estado
                data.token               // T: Token
            ]);

            // 5. Aplicar formato visual a la nueva fila
            const nuevaFilaIndex = sheet.getLastRow();
            sheet.getRange(nuevaFilaIndex, 1, 1, 20).setVerticalAlignment('top');
            sheet.getRange(nuevaFilaIndex, 11, 1, 2).setWrap(true); // Wrap en productos y cantidades
            sheet.getRange(nuevaFilaIndex, 14, 1, 2).setNumberFormat('$ #,##0'); // Subtotal y Descuento
            sheet.getRange(nuevaFilaIndex, 17).setNumberFormat('$ #,##0'); // Total
            sheet.getRange(nuevaFilaIndex, 5).setNumberFormat('@'); // Teléfono como texto real
            sheet.getRange(nuevaFilaIndex, 19).setBackground('#fff3cd').setHorizontalAlignment('center'); // Estado amarillo
            SpreadsheetApp.flush(); // Forzar cambios en la interfaz

            // 6. Descontar stock automáticamente de la hoja "Productos"
            const huboAgotados = actualizarStockTrasPedido(calculo.productos);

            // Si algún producto se agotó, publicamos automáticamente a GitHub para actualizar la web
            if (huboAgotados) {
                ejecutarSincronizacionSilenciosa();
            }

            // 7. Enviar notificación por email al dueño
            enviarEmailNotificacion(data.cliente, calculo);

            return respuestaJson({ status: 'success' });
        } finally {
            lock.releaseLock();
        }
    } catch (error) {
        Logger.log(`❌ Error en doPost: ${error.message}\n${error.stack}`);
        return respuestaJson({ status: 'error', message: 'No se pudo procesar el pedido. Inténtalo nuevamente.' });
    }
}

function respuestaJson(objeto) {
    return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function validarApiKey(data) {
    const claveEsperada = CONFIG.WEB_API_KEY;
    if (!claveEsperada) {
        Logger.log('⚠️ WEB_API_KEY no está configurada en las propiedades del script. El endpoint acepta peticiones sin validar.');
        return true;
    }
    return data.apiKey === claveEsperada;
}

function respetarRateLimit(data) {
    const cache = CacheService.getScriptCache();
    const email = (data.cliente && data.cliente.email) || '';
    const telefono = (data.cliente && data.cliente.telefono) || '';
    const hashCliente = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        email + '|' + telefono,
        Utilities.Charset.UTF_8
    ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');

    // Por cliente: máximo N pedidos por hora
    const keyCliente = 'pedidos_hora_' + hashCliente;
    const actualCliente = parseInt(cache.get(keyCliente) || '0', 10);
    if (actualCliente >= CONFIG.PEDIDOS_MAX_POR_HORA_POR_CLIENTE) {
        return false;
    }
    cache.put(keyCliente, (actualCliente + 1).toString(), 3600);

    // Global: máximo N pedidos por minuto
    const keyGlobal = 'pedidos_min_' + Math.floor(Date.now() / 60000);
    const actualGlobal = parseInt(cache.get(keyGlobal) || '0', 10);
    if (actualGlobal >= CONFIG.PEDIDOS_MAX_POR_MINUTO_GLOBAL) {
        return false;
    }
    cache.put(keyGlobal, (actualGlobal + 1).toString(), 120);

    return true;
}

/**
 * Garantiza que la hoja de pedidos exista y tenga las columnas correctas.
 * Si las columnas son antiguas, las actualiza.
 */
function garantizarHojaPedidos(ss) {
    let sheet = ss.getSheetByName(CONFIG.PEDIDOS_SHEET_NAME);
    const headers = [
        'N° Pedido', 'Fecha', 'Hora', 'Nombre', 'Teléfono', 'Email', 
        'Dirección', 'Ciudad', 'Provincia', 'CP', 'Productos', 'Cant.', 
        'Cupón', 'Subtotal', 'Descuento', '% Dcto', 'Total', 'Notas', 'Estado', 'Token'
    ];

    if (!sheet) {
        sheet = ss.insertSheet(CONFIG.PEDIDOS_SHEET_NAME);
    }

    // Verificar si la hoja tiene suficientes columnas, si no, agregarlas
    const columnasActuales = sheet.getMaxColumns();
    if (columnasActuales < headers.length) {
        sheet.insertColumnsAfter(columnasActuales, headers.length - columnasActuales);
    }
    
    // Forzar siempre los encabezados en la fila 1 para asegurar la estructura
    sheet.getRange(1, 1, 1, headers.length)
         .setValues([headers])
         .setFontWeight('bold')
         .setBackground('#f3f3f3')
         .setHorizontalAlignment('center')
         .setVerticalAlignment('middle');

    // Congelar la primera fila para que siempre sea visible
    if (sheet.getFrozenRows() === 0) sheet.setFrozenRows(1);
    
    SpreadsheetApp.flush();
    return sheet;
}

// ============ VALIDACIÓN Y SANITIZACIÓN ============
function sanitizarYValidarPedido(data) {
    if (!data || !data.cliente || !data.productos || !Array.isArray(data.productos)) {
        throw new Error('Estructura de pedido inválida.');
    }

    const { cliente, productos } = data;
    // Limpia strings y evita inyección de fórmulas en Sheets:
    // un valor que comience con =, +, -, @ o tab se escribe prefijado con ' (texto plano)
    const cleanString = (str) => {
        if (typeof str !== 'string') return '';
        let limpio = str
            .trim()
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // elimina caracteres de control
            .substring(0, 500);
        if (/^[=+\-@\t\r]/.test(limpio)) {
            limpio = "'" + limpio;
        }
        return limpio;
    };

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
            quantity: Math.max(1, Math.min(CONFIG.TOPE_CANTIDAD_POR_PRODUCTO, parseInt(p.quantity, 10) || 1))
        })),
        cupon: cleanString(data.cupon) || 'NINGUNO',
        token: cleanString(data.token) || ''
    };
}

// ============ CÁLCULO DE MONTOS SERVER-SIDE ============
// La fuente de verdad son las hojas ProductosLuxury y Cupones.
// El cliente solo aporta el detalle del pedido; precios, stock, cupones,
// descuentos y totales se recalculan acá para que nadie pueda alterarlos.
function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function obtenerCatalogoParaVenta() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    return sheet.getRange(2, 1, lastRow - 1, 10).getValues()
        .filter(fila => fila[CONFIG.COLUMNAS.ID])
        .map(fila => ({
            nombreNormalizado: normalizarTexto(fila[CONFIG.COLUMNAS.NOMBRE]),
            precio: parseFloat(fila[CONFIG.COLUMNAS.PRECIO]),
            stock: parseInt(fila[CONFIG.COLUMNAS.STOCK], 10)
        }));
}

function calcularMontosServidor(productosSolicitados, cuponCodigo) {
    const catalogo = obtenerCatalogoParaVenta();
    const porNombre = {};
    catalogo.forEach(p => { if (p.nombreNormalizado) porNombre[p.nombreNormalizado] = p; });

    const productosResueltos = [];
    let subtotal = 0;

    productosSolicitados.forEach(item => {
        const ref = porNombre[normalizarTexto(item.nombre)];
        const cantidadSolicitada = Math.max(1, Math.min(CONFIG.TOPE_CANTIDAD_POR_PRODUCTO, parseInt(item.quantity, 10) || 1));
        let cantidadFinal = cantidadSolicitada;
        let precioFinal = 0;

        if (ref) {
            if (!isNaN(ref.precio)) {
                precioFinal = ref.precio;
            }
            const stockHoja = isNaN(ref.stock) ? null : ref.stock;
            if (stockHoja !== null && stockHoja > 0 && cantidadFinal > stockHoja) {
                cantidadFinal = stockHoja;
                Logger.log(`⚠️ Stock ajustado para "${item.nombre}": solicitado ${cantidadSolicitada}, disponible ${stockHoja}`);
            }
            if (stockHoja === 0) {
                Logger.log(`⚠️ Producto sin stock en la hoja: "${item.nombre}"`);
            }
        } else {
            Logger.log(`⚠️ Producto no encontrado en la hoja: "${item.nombre}"`);
        }

        subtotal += precioFinal * cantidadFinal;
        productosResueltos.push({ nombre: item.nombre, quantity: cantidadFinal, precio: precioFinal });
    });

    // Descuento automático por umbral
    let descuentoAuto = 0;
    if (subtotal >= CONFIG.UMBRAL_DESCUENTO) {
        descuentoAuto = subtotal * (CONFIG.PORCENTAJE_DESCUENTO / 100);
    }

    // Descuento por cupón (desde la hoja Cupones)
    let descuentoCupon = 0;
    let porcentajeAplicado = CONFIG.PORCENTAJE_DESCUENTO;
    let cuponFinal = 'NINGUNO';

    const cupones = leerCuponesDeSheet();
    const cuponData = cuponCodigo
        ? cupones.find(c => c.codigo.toUpperCase() === String(cuponCodigo).toUpperCase())
        : null;

    if (cuponData) {
        const hoy = new Date();
        const fechaExp = new Date(cuponData.expira);
        if (hoy.setHours(0, 0, 0, 0) <= fechaExp.setHours(0, 0, 0, 0)) {
            const porcentajeCupon = parseFloat(cuponData.porcentaje) || 0;
            descuentoCupon = subtotal * (porcentajeCupon / 100);
            porcentajeAplicado = porcentajeCupon;
            cuponFinal = cuponData.codigo.toUpperCase();
        }
    }

    // Se aplica el mayor de los dos descuentos (no acumulables)
    const descuentoFinal = Math.max(descuentoAuto, descuentoCupon);

    return {
        productos: productosResueltos,
        subtotal: Math.round(subtotal),
        descuento: Math.round(descuentoFinal),
        porcentaje: descuentoFinal > 0 ? (descuentoCupon > descuentoAuto ? porcentajeAplicado : CONFIG.PORCENTAJE_DESCUENTO) : 0,
        total: Math.round(subtotal - descuentoFinal),
        cupon: cuponFinal
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
    const nombreNormalizado = normalizarTexto(item.nombre);
    for (let i = 0; i < values.length; i++) {
      if (normalizarTexto(values[i][nombreColIdx]) === nombreNormalizado) {
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
function escapeHtml(texto) {
    return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function enviarEmailNotificacion(cliente, calculo) {
    const emailAdmin = Session.getEffectiveUser().getEmail(); // Más fiable en Web Apps
    const asunto = `🛍️ Nuevo Pedido de ${escapeHtml(cliente.nombre)}`;

    const productosHtml = calculo.productos.map(p =>
        `<li>${escapeHtml(p.nombre)} (x${p.quantity}) - $${p.precio.toLocaleString('es-AR')}</li>`
    ).join('');
    const dctoEtiqueta = calculo.cupon !== 'NINGUNO' ? `Cupón (${escapeHtml(calculo.cupon)})` : 'Descuento';

    const cuerpo = `
        <h2>Detalles del Pedido</h2>
        <p><strong>Cliente:</strong> ${escapeHtml(cliente.nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(cliente.email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(cliente.telefono)}</p>
        <p><strong>Subtotal:</strong> $${calculo.subtotal.toLocaleString('es-AR')}</p>
        <p><strong>${dctoEtiqueta}:</strong> -$${calculo.descuento.toLocaleString('es-AR')} (${calculo.porcentaje}%)</p>
        <p><strong>TOTAL A PAGAR:</strong> $${calculo.total.toLocaleString('es-AR')}</p>
        <h3>Productos:</h3>
        <ul>${productosHtml}</ul>
    `;

    MailApp.sendEmail({
        to: emailAdmin,
        subject: asunto,
        htmlBody: cuerpo
    });
}

// ============ GESTIÓN DE ESTADOS (Incorporado de RegistroPedidos) ============
function actualizarEstadoPedido(numeroPedido, nuevoEstado) {
    try {
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
                const celdaEstado = sheet.getRange(i + 1, 19); // Columna S (19)
                celdaEstado.setValue(nuevoEstado);
                celdaEstado.setBackground(colores[nuevoEstado] || '#ffffff');
                return;
            }
        }
        Logger.log(`⚠️ No se encontró el pedido ${numeroPedido} al actualizar su estado.`);
    } catch (error) {
        Logger.log(`❌ Error al actualizar estado del pedido ${numeroPedido}: ${error.message}`);
        SpreadsheetApp.getUi().alert(
            'Error',
            `No se pudo actualizar el estado del pedido ${numeroPedido}.`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );
    }
}

function mostrarEstadisticas() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PEDIDOS_SHEET_NAME);
    if (!sheet) return;
    
    const datos = sheet.getDataRange().getValues();
    let totalVentas = 0;
    let estados = { 'Pendiente': 0, 'Procesando': 0, 'Enviado': 0, 'Entregado': 0, 'Cancelado': 0 };
    
    for (let i = 1; i < datos.length; i++) {
        totalVentas += parseFloat(datos[i][16]) || 0; // Columna Q (index 16) es el Total
        const est = datos[i][18]; // Columna S (index 18) es el Estado
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
  const actuales = scriptProperties.getProperties();
  // No se pisan los valores ya configurados: solo se crean las claves faltantes
  const nuevos = {
    'GITHUB_TOKEN': actuales['GITHUB_TOKEN'] || '',
    'GITHUB_OWNER': actuales['GITHUB_OWNER'] || '',
    'GITHUB_REPO': actuales['GITHUB_REPO'] || '',
    'DRIVE_FOLDER_ID': actuales['DRIVE_FOLDER_ID'] || '',
    'WEB_API_KEY': actuales['WEB_API_KEY'] || ''
  };
  scriptProperties.setProperties(nuevos);
  Logger.log('✅ Propiedades verificadas. Las claves faltantes se crearon vacías. Configura GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, DRIVE_FOLDER_ID y WEB_API_KEY con sus valores.');
}

// ============ FUNCIÓN PRINCIPAL ============
function actualizarProductosEnGitHub() {
    try {
        const resultado = sincronizarTodoCore();
        mostrarResultadoConCarpetas(resultado);
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
    // 1. Sincronizar Productos
    const productos = leerProductosDeSheet();
    const carpetasCreadas = validarYCrearCarpetas(productos);
    const productosConImagenes = procesarImagenesDesdeGDrive(productos);
    const contenidoProductosJSON = JSON.stringify(productosConImagenes, null, 2);
    subirArchivoAGitHub(contenidoProductosJSON, 'application/json; charset=utf-8', CONFIG.GITHUB_FILE_PATH);

    // 2. Sincronizar Cupones (Nueva lógica)
    const cupones = leerCuponesDeSheet();
    let cantidadCupones = 0;
    if (cupones.length > 0) {
        const contenidoCuponesJSON = JSON.stringify(cupones, null, 2);
        subirArchivoAGitHub(contenidoCuponesJSON, 'application/json; charset=utf-8', CONFIG.GITHUB_CUPONES_FILE_PATH);
        cantidadCupones = cupones.length;
    }

    // 3. Sincronizar Reseñas
    const resenas = leerResenasDeSheet();
    let cantidadResenas = 0;
    if (resenas.length > 0) {
        const resenasConImagenes = procesarImagenesResenas(resenas);
        const contenidoResenasJSON = JSON.stringify(resenasConImagenes, null, 2);
        subirArchivoAGitHub(contenidoResenasJSON, 'application/json; charset=utf-8', CONFIG.GITHUB_RESENAS_FILE_PATH);
        cantidadResenas = resenasConImagenes.length;
    }

    return {
        cantidad: productosConImagenes.length,
        carpetas: carpetasCreadas,
        cantidadCupones: cantidadCupones,
        cantidadResenas: cantidadResenas
    };
}

// Sincronizar solo las reseñas (accesible desde el menú)
function sincronizarResenas() {
    garantizarHojaResenas(SpreadsheetApp.getActiveSpreadsheet());
    const resenas = leerResenasDeSheet();
    if (resenas.length === 0) {
        SpreadsheetApp.getUi().alert('ℹ️ Sin reseñas', 'La hoja "Reseñas" está vacía. Agrega reseñas y volvé a intentar.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }
    const resenasConImagenes = procesarImagenesResenas(resenas);
    const contenidoResenasJSON = JSON.stringify(resenasConImagenes, null, 2);
    subirArchivoAGitHub(contenidoResenasJSON, 'application/json; charset=utf-8', CONFIG.GITHUB_RESENAS_FILE_PATH);
    SpreadsheetApp.getUi().alert('✅ Reseñas sincronizadas', `Se publicaron ${resenasConImagenes.length} reseñas en el sitio.`, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============ LEER CUPONES DE GOOGLE SHEETS ============
function leerCuponesDeSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.CUPONES_SHEET_NAME);

    if (!sheet) {
        Logger.log(`⚠️ No se encontró la hoja "${CONFIG.CUPONES_SHEET_NAME}". Saltando sincronización de cupones.`);
        return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const tz = ss.getSpreadsheetTimeZone();
    const datos = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

    return datos
        .filter(fila => fila[0]) // Filtrar filas que no tengan código
        .map(fila => ({
            codigo: fila[0].toString().trim(),
            porcentaje: fila[1],
            expira: fila[2] instanceof Date ? Utilities.formatDate(fila[2], tz, "yyyy-MM-dd") : fila[2].toString().trim()
        }));
}

// ============ RESEÑAS (Google Sheets + Drive) ============

// Crear la hoja "Reseñas" con encabezados si no existe (o agregar columnas faltantes)
function garantizarHojaResenas(ss) {
    let sheet = ss.getSheetByName(CONFIG.RESENAS_SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(CONFIG.RESENAS_SHEET_NAME);
        const encabezados = ['Fecha', 'Nombre', 'Valoración', 'Reseña', 'Imagen'];
        sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
        sheet.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
        sheet.setColumnWidth(1, 100);
        sheet.setColumnWidth(2, 200);
        sheet.setColumnWidth(3, 80);
        sheet.setColumnWidth(4, 500);
        sheet.setColumnWidth(5, 220);
        Logger.log(`✅ Hoja "${CONFIG.RESENAS_SHEET_NAME}" creada con encabezados.`);
        return sheet;
    }

    // Migración: agregar columna "Imagen" a hojas que ya existían con 4 columnas
    if (sheet.getLastColumn() < 5) {
        sheet.getRange(1, 5).setValue('Imagen');
        sheet.getRange(1, 5).setFontWeight('bold');
        sheet.setColumnWidth(5, 220);
        Logger.log(`✅ Columna "Imagen" agregada a la hoja "${CONFIG.RESENAS_SHEET_NAME}".`);
    }

    return sheet;
}

// Leer reseñas de la hoja (Fecha | Nombre | Valoración | Reseña | Imagen)
function leerResenasDeSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.RESENAS_SHEET_NAME);

    if (!sheet) {
        Logger.log(`⚠️ No se encontró la hoja "${CONFIG.RESENAS_SHEET_NAME}". Saltando sincronización de reseñas.`);
        return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const tz = ss.getSpreadsheetTimeZone();
    const datos = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

    return datos
        .filter(fila => {
            const nombre = String(fila[1] || '').trim();
            const texto = String(fila[3] || '').trim();
            const valoracion = parseFloat(fila[2]);
            const valida = nombre && texto && !isNaN(valoracion) && valoracion >= 1 && valoracion <= 5;
            if (!valida && (nombre || texto || fila[2] !== '')) {
                Logger.log(`⚠️ Reseña de "${nombre}" omitida: valoración no válida (${fila[2]}) o faltan datos.`);
            }
            return valida;
        })
        .map(fila => ({
            fecha: fila[0] instanceof Date ? Utilities.formatDate(fila[0], tz, 'dd/MM/yyyy') : String(fila[0] || '').trim(),
            nombre: String(fila[1]).trim(),
            valoracion: parseFloat(fila[2]),
            resena: String(fila[3]).trim(),
            imagen: String(fila[4] || '').trim()
        }));
}

// Asociar fotos de perfil desde la carpeta "reseñas" de Drive.
// La columna "Imagen" indica el nombre EXACTO del archivo (sin ruta ni URL).
// Celda vacía o archivo inexistente -> imagen de respaldo.
function procesarImagenesResenas(resenas) {
    const carpetaResenas = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

    let carpeta = null;
    const carpetas = carpetaResenas.getFolders();
    while (carpetas.hasNext()) {
        const f = carpetas.next();
        if (f.getName().toLowerCase() === CONFIG.RESENAS_FOLDER_NAME) {
            carpeta = f;
            break;
        }
    }

    if (!carpeta) {
        Logger.log(`⚠️ No se encontró la carpeta "${CONFIG.RESENAS_FOLDER_NAME}" en Drive. Usando imagen de respaldo para todas las reseñas.`);
        return resenas.map(r => ({ ...r, imagen: CONFIG.IMAGEN_FALLBACK_RESENAS }));
    }

    // Mapa nombre-normalizado -> archivo (tolera tildes y codificación NFC/NFD)
    const mapaArchivos = {};
    const archivos = carpeta.getFiles();
    while (archivos.hasNext()) {
        const archivo = archivos.next();
        const nombreArchivo = archivo.getName();
        if (nombreArchivo.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const clave = normalizarNombreArchivo(nombreArchivo);
            if (mapaArchivos[clave]) {
                Logger.log(`⚠️ Dos archivos con el mismo nombre normalizado: "${mapaArchivos[clave].getName()}" y "${nombreArchivo}". El último gana.`);
            }
            mapaArchivos[clave] = archivo;
        }
    }

    return resenas.map(resena => {
        const nombreImagen = resena.imagen.trim();
        if (!nombreImagen) {
            return { ...resena, imagen: CONFIG.IMAGEN_FALLBACK_RESENAS };
        }

        const archivo = mapaArchivos[normalizarNombreArchivo(nombreImagen)];
        if (!archivo) {
            Logger.log(`⚠️ No se encontró el archivo "${nombreImagen}" en la carpeta "reseñas". Usando ${CONFIG.IMAGEN_FALLBACK_RESENAS}.`);
            return { ...resena, imagen: CONFIG.IMAGEN_FALLBACK_RESENAS };
        }

        return { ...resena, imagen: obtenerUrlPublicaGDrive(archivo.getId(), 150) };
    });
}

// Normalizar nombre de archivo: sin tildes, sin mayúsculas, sin espacios al inicio/fin.
// Unifica NFC/NFD (bug de codificación entre macOS/Drive y la planilla).
function normalizarNombreArchivo(nombre) {
    return String(nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
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
        .filter(fila => {
            const precioValido = !isNaN(parseFloat(fila[CONFIG.COLUMNAS.PRECIO]));
            const stockValido = !isNaN(parseInt(fila[CONFIG.COLUMNAS.STOCK], 10));
            if (!precioValido || !stockValido) {
                Logger.log(`⚠️ Producto ID ${fila[CONFIG.COLUMNAS.ID]} omitido: precio o stock no numérico (precio="${fila[CONFIG.COLUMNAS.PRECIO]}", stock="${fila[CONFIG.COLUMNAS.STOCK]}")`);
            }
            return precioValido && stockValido;
        })
        .map(fila => {
            const precioAnterior = parseFloat(fila[CONFIG.COLUMNAS.PRECIO_ANTERIOR]);
            return {
                id: fila[CONFIG.COLUMNAS.ID],
                nombre: fila[CONFIG.COLUMNAS.NOMBRE],
                descripcion: fila[CONFIG.COLUMNAS.DESCRIPCION],
                descripcionDetallada: fila[CONFIG.COLUMNAS.DESCRIPCION_DET],
                precio: parseFloat(fila[CONFIG.COLUMNAS.PRECIO]),
                precioAnterior: precioAnterior > 0 ? precioAnterior : null,
                categoria: fila[CONFIG.COLUMNAS.CATEGORIA],
                stock: parseInt(fila[CONFIG.COLUMNAS.STOCK]),
                caracteristicas: fila[CONFIG.COLUMNAS.CARACTERISTICAS]
                    ? fila[CONFIG.COLUMNAS.CARACTERISTICAS].split('.').map(c => c.trim())
                    : [],
                carpetaImagenes: fila[CONFIG.COLUMNAS.CARPETA_IMAGENES]
            };
        });

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
                    const urlGaleria = obtenerUrlPublicaGDrive(archivo.getId(), 1920);
                    const urlThumb = obtenerUrlPublicaGDrive(archivo.getId(), 600);

                    if (nombre === 'principal.jpg' || nombre === 'principal.png' || nombre === 'principal.webp') {
                        imagenPrincipal = urlThumb;
                    }

                    imagenes.push({
                        nombre: nombre,
                        url: urlGaleria,
                        thumb: urlThumb
                    });
                }
            }

            imagenes.sort((a, b) => {
                if (a.nombre.startsWith('principal')) return -1;
                if (b.nombre.startsWith('principal')) return 1;
                return a.nombre.localeCompare(b.nombre);
            });

            const galeriaUrls = imagenes.map(img => img.url);
            const thumbnailUrls = imagenes.map(img => img.thumb);

            return {
                ...producto,
                imagen: imagenPrincipal || thumbnailUrls[0] || 'img/productos/placeholder.png',
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
function obtenerUrlPublicaGDrive(fileId, size) {
    const base = `https://lh3.googleusercontent.com/d/${fileId}`;
    return size ? `${base}=s${size}` : base;
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
function mostrarResultadoConCarpetas(resultado) {
    const ui = SpreadsheetApp.getUi();
    let mensaje = `Se actualizaron ${resultado.cantidad} productos en GitHub.\n`;

    if (resultado.cantidadCupones > 0) {
        mensaje += `✅ Se actualizaron ${resultado.cantidadCupones} cupones.\n`;
    }

    if (resultado.carpetas > 0) {
        mensaje += `📁 Se crearon ${resultado.carpetas} carpetas nuevas en Google Drive.\n`;
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

Seguridad:
- API Key de pedidos: ${CONFIG.WEB_API_KEY ? '✅ Configurada' : '⚠️ NO configurada (el endpoint acepta peticiones sin validar)'}

Para modificar estos valores:
1. Extensiones → Apps Script → Configuración del proyecto → Propiedades del script
2. Ejecuta configurarSecretos() una sola vez para crear las claves
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