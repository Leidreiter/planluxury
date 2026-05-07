// =====================================================
// SISTEMA DE REGISTRO DE PEDIDOS
// Registra automáticamente pedidos de WhatsApp en Google Sheets
// =====================================================

// ============ CONFIGURACIÓN ============
const PEDIDOS_CONFIG = {
    // Nombre de la hoja donde se guardarán los pedidos
    SHEET_NAME: 'Pedidos',
    
    // Zona horaria
    TIMEZONE: 'America/Argentina/Buenos_Aires'
};

// ============ FUNCIÓN PRINCIPAL - RECIBIR PEDIDO ============
/**
 * Función que recibe pedidos vía POST desde el formulario web
 * Se ejecuta automáticamente cuando se hace una petición al Web App
 */
function doPost(e) {
    try {
        // Parsear los datos recibidos
        const datos = JSON.parse(e.postData.contents);
        
        // Registrar el pedido en Google Sheets
        const resultado = registrarPedido(datos);
        
        // Retornar respuesta exitosa
        return ContentService
            .createTextOutput(JSON.stringify({
                success: true,
                message: 'Pedido registrado exitosamente',
                numeroPedido: resultado.numeroPedido
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        Logger.log(`Error en doPost: ${error.message}`);
        
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                message: 'Error al registrar pedido: ' + error.message
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============ REGISTRAR PEDIDO EN GOOGLE SHEETS ============
/**
 * Registra un nuevo pedido en la hoja de Google Sheets
 * @param {Object} datos - Datos del pedido (cliente, productos, total, etc.)
 * @returns {Object} - Resultado con número de pedido
 */
function registrarPedido(datos) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(PEDIDOS_CONFIG.SHEET_NAME);
    
    // Si no existe la hoja, crearla
    if (!sheet) {
        sheet = crearHojaPedidos(spreadsheet);
    }
    
    // Generar número de pedido único
    const numeroPedido = generarNumeroPedido(sheet);
    
    // Obtener fecha y hora actual
    const fechaHora = new Date();
    const fecha = Utilities.formatDate(fechaHora, PEDIDOS_CONFIG.TIMEZONE, 'dd/MM/yyyy');
    const hora = Utilities.formatDate(fechaHora, PEDIDOS_CONFIG.TIMEZONE, 'HH:mm:ss');
    
    // Formatear productos
    const productosTexto = formatearProductos(datos.productos);
    const cantidadProductos = datos.productos.reduce((sum, p) => sum + p.quantity, 0);
    
    // Estado inicial del pedido
    const estado = 'Pendiente';
    
    // Preparar fila de datos
    const fila = [
        numeroPedido,                    // A: Número de Pedido
        fecha,                           // B: Fecha
        hora,                            // C: Hora
        datos.cliente.nombre,            // D: Nombre Cliente
        datos.cliente.telefono,          // E: Teléfono
        datos.cliente.email,             // F: Email
        datos.cliente.direccion,         // G: Dirección
        datos.cliente.ciudad,            // H: Ciudad
        datos.cliente.provincia,         // I: Provincia
        datos.cliente.codigoPostal,      // J: Código Postal
        productosTexto,                  // K: Productos (detalle)
        cantidadProductos,               // L: Cantidad Total de Productos
        datos.total,                     // M: Total
        datos.cliente.notas || '',       // N: Notas
        estado                           // O: Estado
    ];
    
    // Agregar fila al final de la hoja
    sheet.appendRow(fila);
    
    // Aplicar formato a la nueva fila
    const ultimaFila = sheet.getLastRow();
    aplicarFormatoFila(sheet, ultimaFila);
    
    Logger.log(`✅ Pedido ${numeroPedido} registrado exitosamente`);
    
    return {
        numeroPedido: numeroPedido,
        fecha: fecha,
        hora: hora
    };
}

// ============ CREAR HOJA DE PEDIDOS ============
/**
 * Crea una nueva hoja de pedidos con encabezados y formato
 * @param {Spreadsheet} spreadsheet - Objeto spreadsheet de Google Sheets
 * @returns {Sheet} - Hoja creada
 */
function crearHojaPedidos(spreadsheet) {
    const sheet = spreadsheet.insertSheet(PEDIDOS_CONFIG.SHEET_NAME);
    
    // Encabezados
    const encabezados = [
        'N° Pedido',
        'Fecha',
        'Hora',
        'Nombre',
        'Teléfono',
        'Email',
        'Dirección',
        'Ciudad',
        'Provincia',
        'CP',
        'Productos',
        'Cant.',
        'Total',
        'Notas',
        'Estado'
    ];
    
    // Agregar encabezados
    sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    
    // Formatear encabezados
    const encabezadoRange = sheet.getRange(1, 1, 1, encabezados.length);
    encabezadoRange.setBackground('#4285f4');
    encabezadoRange.setFontColor('#ffffff');
    encabezadoRange.setFontWeight('bold');
    encabezadoRange.setHorizontalAlignment('center');
    
    // Ajustar anchos de columnas
    sheet.setColumnWidth(1, 100);  // N° Pedido
    sheet.setColumnWidth(2, 90);   // Fecha
    sheet.setColumnWidth(3, 70);   // Hora
    sheet.setColumnWidth(4, 150);  // Nombre
    sheet.setColumnWidth(5, 120);  // Teléfono
    sheet.setColumnWidth(6, 180);  // Email
    sheet.setColumnWidth(7, 200);  // Dirección
    sheet.setColumnWidth(8, 120);  // Ciudad
    sheet.setColumnWidth(9, 100);  // Provincia
    sheet.setColumnWidth(10, 60);  // CP
    sheet.setColumnWidth(11, 300); // Productos
    sheet.setColumnWidth(12, 50);  // Cant.
    sheet.setColumnWidth(13, 100); // Total
    sheet.setColumnWidth(14, 200); // Notas
    sheet.setColumnWidth(15, 100); // Estado
    
    // Congelar primera fila
    sheet.setFrozenRows(1);
    
    Logger.log(`✅ Hoja "${PEDIDOS_CONFIG.SHEET_NAME}" creada exitosamente`);
    
    return sheet;
}

// ============ GENERAR NÚMERO DE PEDIDO ============
/**
 * Genera un número de pedido único secuencial
 * @param {Sheet} sheet - Hoja de pedidos
 * @returns {String} - Número de pedido formateado
 */
function generarNumeroPedido(sheet) {
    const ultimaFila = sheet.getLastRow();
    
    // Si solo existe el encabezado, es el primer pedido
    if (ultimaFila <= 1) {
        return 'PED-0001';
    }
    
    // Obtener el último número de pedido
    const ultimoPedido = sheet.getRange(ultimaFila, 1).getValue();
    
    // Extraer el número
    const numero = parseInt(ultimoPedido.replace('PED-', '')) + 1;
    
    // Formatear con ceros a la izquierda
    return 'PED-' + numero.toString().padStart(4, '0');
}

// ============ FORMATEAR PRODUCTOS ============
/**
 * Convierte el array de productos en texto legible
 * @param {Array} productos - Array de productos del pedido
 * @returns {String} - Texto formateado con todos los productos
 */
function formatearProductos(productos) {
    return productos.map(p => 
        `${p.nombre} (x${p.quantity}) - $${formatearPrecio(p.precio)} c/u`
    ).join('\n');
}

// ============ FORMATEAR PRECIO ============
/**
 * Formatea un número como precio argentino
 * @param {Number} precio - Precio a formatear
 * @returns {String} - Precio formateado
 */
function formatearPrecio(precio) {
    return precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// ============ APLICAR FORMATO A FILA ============
/**
 * Aplica formato visual a una fila de pedido
 * @param {Sheet} sheet - Hoja de cálculo
 * @param {Number} fila - Número de fila a formatear
 */
function aplicarFormatoFila(sheet, fila) {
    // Formato general
    const filaRange = sheet.getRange(fila, 1, 1, 15);
    filaRange.setVerticalAlignment('top');
    filaRange.setBorder(true, true, true, true, true, true);
    
    // Formato para columna de Total (columna 13)
    const totalCell = sheet.getRange(fila, 13);
    totalCell.setNumberFormat('#,##0');
    totalCell.setHorizontalAlignment('right');
    totalCell.setFontWeight('bold');
    
    // Formato para Estado (columna 15)
    const estadoCell = sheet.getRange(fila, 15);
    estadoCell.setBackground('#fff3cd');
    estadoCell.setHorizontalAlignment('center');
    
    // Wrap text para columnas largas
    sheet.getRange(fila, 11).setWrap(true); // Productos
    sheet.getRange(fila, 14).setWrap(true); // Notas
}

// ============ ACTUALIZAR ESTADO DE PEDIDO ============
/**
 * Actualiza el estado de un pedido específico
 * @param {String} numeroPedido - Número de pedido a actualizar
 * @param {String} nuevoEstado - Nuevo estado ('Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado')
 */
function actualizarEstadoPedido(numeroPedido, nuevoEstado) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PEDIDOS_CONFIG.SHEET_NAME);
    
    if (!sheet) {
        throw new Error('No existe la hoja de pedidos');
    }
    
    // Buscar el pedido
    const datos = sheet.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
        if (datos[i][0] === numeroPedido) {
            // Actualizar estado (columna 15, índice 14)
            sheet.getRange(i + 1, 15).setValue(nuevoEstado);
            
            // Aplicar color según estado
            const color = obtenerColorEstado(nuevoEstado);
            sheet.getRange(i + 1, 15).setBackground(color);
            
            Logger.log(`✅ Pedido ${numeroPedido} actualizado a: ${nuevoEstado}`);
            return;
        }
    }
    
    throw new Error(`No se encontró el pedido ${numeroPedido}`);
}

// ============ OBTENER COLOR SEGÚN ESTADO ============
/**
 * Retorna el color de fondo según el estado del pedido
 * @param {String} estado - Estado del pedido
 * @returns {String} - Código de color hexadecimal
 */
function obtenerColorEstado(estado) {
    const colores = {
        'Pendiente': '#fff3cd',      // Amarillo claro
        'Procesando': '#cfe2ff',     // Azul claro
        'Enviado': '#d1e7dd',        // Verde claro
        'Entregado': '#a3cfbb',      // Verde más oscuro
        'Cancelado': '#f8d7da'       // Rojo claro
    };
    
    return colores[estado] || '#ffffff';
}

// ============ FUNCIONES DE PRUEBA ============
/**
 * Función de prueba para crear la hoja de pedidos manualmente
 */
function testCrearHojaPedidos() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    crearHojaPedidos(spreadsheet);
    Logger.log('Hoja de pedidos creada para pruebas');
}

/**
 * Función de prueba para registrar un pedido de ejemplo
 */
function testRegistrarPedido() {
    const pedidoPrueba = {
        cliente: {
            nombre: 'Juan Pérez',
            telefono: '+54 9 11 1234-5678',
            email: 'juan.perez@email.com',
            direccion: 'Av. Corrientes 1234',
            ciudad: 'Buenos Aires',
            provincia: 'CABA',
            codigoPostal: '1043',
            notas: 'Llamar antes de entregar'
        },
        productos: [
            {
                id: 1,
                nombre: 'Producto Ejemplo 1',
                precio: 15000,
                quantity: 2
            },
            {
                id: 2,
                nombre: 'Producto Ejemplo 2',
                precio: 8500,
                quantity: 1
            }
        ],
        total: 38500
    };
    
    const resultado = registrarPedido(pedidoPrueba);
    Logger.log(`Pedido de prueba registrado: ${JSON.stringify(resultado)}`);
}

/**
 * Función de prueba para actualizar estado
 */
function testActualizarEstado() {
    actualizarEstadoPedido('PED-0001', 'Procesando');
}

// ============ MENÚ PERSONALIZADO ============
// NOTA: La función onOpen() principal está en MenuPrincipal.gs
// Este archivo contiene las funciones del menú de pedidos

// ============ FUNCIONES DEL MENÚ ============
function mostrarEstadisticas() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PEDIDOS_CONFIG.SHEET_NAME);
    
    if (!sheet) {
        SpreadsheetApp.getUi().alert('No existe la hoja de pedidos');
        return;
    }
    
    const datos = sheet.getDataRange().getValues();
    const totalPedidos = datos.length - 1; // Sin contar encabezado
    
    let totalVentas = 0;
    let pendientes = 0;
    let procesando = 0;
    let enviados = 0;
    let entregados = 0;
    let cancelados = 0;
    
    for (let i = 1; i < datos.length; i++) {
        totalVentas += parseFloat(datos[i][12]) || 0;
        
        const estado = datos[i][14];
        switch(estado) {
            case 'Pendiente': pendientes++; break;
            case 'Procesando': procesando++; break;
            case 'Enviado': enviados++; break;
            case 'Entregado': entregados++; break;
            case 'Cancelado': cancelados++; break;
        }
    }
    
    const mensaje = `
📊 ESTADÍSTICAS DE PEDIDOS

Total de pedidos: ${totalPedidos}
Total en ventas: $${formatearPrecio(totalVentas)}

Por estado:
⏳ Pendientes: ${pendientes}
🔄 Procesando: ${procesando}
🚚 Enviados: ${enviados}
✅ Entregados: ${entregados}
❌ Cancelados: ${cancelados}
    `;
    
    SpreadsheetApp.getUi().alert('📊 Estadísticas', mensaje, SpreadsheetApp.getUi().ButtonSet.OK);
}

function marcarComoProcesando() {
    cambiarEstadoSeleccion('Procesando');
}

function marcarComoEnviado() {
    cambiarEstadoSeleccion('Enviado');
}

function marcarComoEntregado() {
    cambiarEstadoSeleccion('Entregado');
}

function marcarComoCancelado() {
    cambiarEstadoSeleccion('Cancelado');
}

function cambiarEstadoSeleccion(nuevoEstado) {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selection = sheet.getActiveRange();
    const fila = selection.getRow();
    
    if (fila === 1) {
        SpreadsheetApp.getUi().alert('Selecciona una fila de pedido (no el encabezado)');
        return;
    }
    
    const numeroPedido = sheet.getRange(fila, 1).getValue();
    
    try {
        actualizarEstadoPedido(numeroPedido, nuevoEstado);
        SpreadsheetApp.getUi().alert(`✅ Pedido ${numeroPedido} actualizado a: ${nuevoEstado}`);
    } catch (error) {
        SpreadsheetApp.getUi().alert(`❌ Error: ${error.message}`);
    }
}
