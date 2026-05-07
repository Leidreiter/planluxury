// Sistema de búsqueda de productos en tiempo real - Compatible con categorías
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase, normalizarTexto } from './utils.js';

let productos = [];
let debounceTimer;

document.addEventListener('DOMContentLoaded', async function() {
    // Cargar productos usando el sistema centralizado
    productos = await obtenerProductos();

    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;

    // Búsqueda en tiempo real mientras se escribe
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // Mostrar/ocultar botón de limpiar
        if (query.length > 0) {
            clearButton.classList.add('visible');
        } else {
            clearButton.classList.remove('visible');
        }
        
        // Realizar búsqueda con debounce para rendimiento
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => buscarProductos(query), 300);
    });

    // Limpiar búsqueda
    if (clearButton) {
        clearButton.addEventListener('click', limpiarBusqueda);
    }

    // Limpiar al presionar ESC
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            limpiarBusqueda();
        }
    });
});

// Función principal de búsqueda
function buscarProductos(query) {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const searchResults = document.getElementById('searchResults');
    
    if (!grid || !productos) return;

    // Si no hay búsqueda, mostrar categorías
    if (!query || query.length === 0) {
        document.body.classList.remove('searching');
        if (noResults) noResults.classList.remove('visible');
        if (searchResults) searchResults.textContent = '';
        return;
    }

    // Activar modo búsqueda (oculta las secciones de categorías)
    document.body.classList.add('searching');

    // Normalizar query (minúsculas, sin acentos)
    const queryNormalizado = normalizarTexto(query);

    // Filtrar productos
    const productosFiltrados = productos.filter(producto => {
        const nombreNormalizado = normalizarTexto(producto.nombre);
        const descripcionNormalizada = normalizarTexto(producto.descripcion);
        const categoriaNormalizada = normalizarTexto(producto.categoria);
        
        return nombreNormalizado.includes(queryNormalizado) || 
               descripcionNormalizada.includes(queryNormalizado) ||
               categoriaNormalizada.includes(queryNormalizado);
    });

    // Mostrar resultados
    if (productosFiltrados.length > 0) {
        renderizarProductosFiltrados(productosFiltrados);
        if (noResults) noResults.classList.remove('visible');
        
        // Mostrar cantidad de resultados
        if (searchResults) {
            const plural = productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados';
            searchResults.textContent = `${productosFiltrados.length} ${plural}`;
        }
    } else {
        // No hay resultados
        grid.innerHTML = '';
        if (noResults) noResults.classList.add('visible');
        if (searchResults) searchResults.textContent = 'No se encontraron resultados';
    }
}

// Renderizar productos filtrados
function renderizarProductosFiltrados(productosFiltrados) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = productosFiltrados.map(p => generarHTMLTarjetaProducto(p)).join('');
}

// Limpiar búsqueda
function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (searchInput) searchInput.value = '';
    if (clearButton) clearButton.classList.remove('visible');
    if (searchResults) searchResults.textContent = '';
    if (noResults) noResults.classList.remove('visible');
    
    // Volver a mostrar las secciones de categorías
    document.body.classList.remove('searching');
    
    // Hacer foco en el input
    if (searchInput) searchInput.focus();
}

// Exponer funciones globalmente
window.limpiarBusqueda = limpiarBusqueda;