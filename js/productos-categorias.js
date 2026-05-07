// Renderizar productos por categorías en el index
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase } from './utils.js';

let productos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar productos usando el sistema centralizado con caché
    productos = await obtenerProductos();
    
    if (productos.length > 0) {
        renderizarProductosPorCategoria('Remeras', 'gridCat1');
        renderizarProductosPorCategoria('Abrigos', 'gridCat2');
        renderizarProductosPorCategoria('Pantalones', 'gridCat3');
        renderizarProductosPorCategoria('Calzado', 'gridCat4');
    }
});

function renderizarProductosPorCategoria(categoria, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const productosFiltrados = productos.filter(p => p.categoria === categoria);

    // Mostrar todos los productos de la categoría
    grid.innerHTML = productosFiltrados.map(p => generarHTMLTarjetaProducto(p)).join('');
}

// Lógica para agregar al carrito desde las tarjetas de esta página
function agregarAlCarrito(id) {
    agregarAlCarritoBase(id, productos);
}

// Exponer a window para que funcione con onclick en módulos
window.agregarAlCarrito = agregarAlCarrito;