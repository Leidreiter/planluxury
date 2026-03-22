// =====================================================
// MENÚ PRINCIPAL UNIFICADO
// Gestiona todos los menús de la aplicación
// =====================================================

/**
 * Función que se ejecuta automáticamente al abrir Google Sheets
 * Crea todos los menús personalizados
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    
    // Menú principal de Productos
    ui.createMenu('🚀 Actualizar Web')
        .addItem('📤 Publicar productos a GitHub', 'actualizarProductosEnGitHub')
        .addSeparator()
        .addItem('📁 Crear carpetas en Drive', 'crearCarpetasProductos')
        .addSeparator()
        .addItem('⚙️ Configurar credenciales', 'mostrarConfiguracion')
        .addItem('📋 Ver estructura de Drive', 'mostrarEstructuraDrive')
        .addItem('❓ Ayuda', 'mostrarAyuda')
        .addToUi();
    
    // Menú de Gestión de Pedidos
    ui.createMenu('📦 Gestión de Pedidos')
        .addItem('📊 Ver estadísticas', 'mostrarEstadisticas')
        .addSeparator()
        .addSubMenu(ui.createMenu('🔄 Cambiar Estado')
            .addItem('⏳ Marcar como Procesando', 'marcarComoProcesando')
            .addItem('🚚 Marcar como Enviado', 'marcarComoEnviado')
            .addItem('✅ Marcar como Entregado', 'marcarComoEntregado')
            .addItem('❌ Marcar como Cancelado', 'marcarComoCancelado'))
        .addSeparator()
        .addItem('🔧 Crear hoja de pedidos', 'testCrearHojaPedidos')
        .addItem('🧪 Registrar pedido de prueba', 'testRegistrarPedido')
        .addToUi();
}
