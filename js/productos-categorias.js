// Renderizar productos por categorías en el index
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase } from './utils.js';

let productos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar productos usando el sistema centralizado con caché
    productos = await obtenerProductos();
    
    if (productos.length > 0) {
        renderizarCategoriasAutomaticas();
    }
});

function renderizarCategoriasAutomaticas() {
    const container = document.getElementById('tienda');
    if (!container) return;

    // Extraer categorías únicas de los productos
    const categorias = [...new Set(productos.map(p => p.categoria))].filter(Boolean);

    let htmlFinal = '';

    categorias.forEach((categoria, index) => {
        const productosFiltrados = productos.filter(p => p.categoria === categoria);
        if (productosFiltrados.length === 0) return;

        // Agregar la sección de productos de la categoría
        htmlFinal += `
            <section class="category-section" id="cat-${categoria.toLowerCase().replace(/\s+/g, '-')}">
                <div class="products-grid">
                    ${productosFiltrados.map(p => generarHTMLTarjetaProducto(p)).join('')}
                </div>
            </section>
        `;

        // Intercalar los banners (banner1, banner2, banner3) entre las categorías
        const bannerId = `banner${index + 1}`;
        const bannerElement = document.getElementById(bannerId);
        
        if (bannerElement && index < 3) {
            htmlFinal += bannerElement.outerHTML;
            bannerElement.remove(); // Eliminar el original del fondo de la página para evitar duplicados
        }
    });

    container.innerHTML = htmlFinal;
}

// Lógica para agregar al carrito desde las tarjetas de esta página
function agregarAlCarrito(id) {
    agregarAlCarritoBase(id, productos);
}

// Exponer a window para que funcione con onclick en módulos
window.agregarAlCarrito = agregarAlCarrito;