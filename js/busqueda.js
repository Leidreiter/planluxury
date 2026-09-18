// Sistema de búsqueda de productos en tiempo real - Compatible con categorías
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase, normalizarTexto } from './utils.js';

let productos = [];
let debounceTimer;

document.addEventListener('DOMContentLoaded', async function() {
    // Cargar productos usando el sistema centralizado
    productos = await obtenerProductos();

    // Se vincula por clase para soportar el buscador desktop y el panel móvil
    const searchInputs = document.querySelectorAll('.search-input');
    if (searchInputs.length === 0) return;

    searchInputs.forEach(function(searchInput) {
        // Mostrar/ocultar botón de limpiar según haya o no texto
        const clearButton = searchInput
            .closest('.search-container')
            ?.querySelector('.clear-search');

        // Búsqueda en tiempo real mientras se escribe
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();

            if (clearButton) {
                if (query.length > 0) {
                    clearButton.classList.add('visible');
                } else {
                    clearButton.classList.remove('visible');
                }
            }

            // Realizar búsqueda con debounce para rendimiento
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => buscarProductos(query), 300);
        });

        // Limpiar al presionar ESC
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                limpiarBusqueda();
            }
        });
    });

    // Botones de limpiar (desktop y móvil)
    document.querySelectorAll('.clear-search').forEach(btn => {
        btn.addEventListener('click', limpiarBusqueda);
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
    // Limpiar todos los inputs (desktop y panel móvil)
    document.querySelectorAll('.search-input').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('.clear-search').forEach(btn => {
        btn.classList.remove('visible');
    });

    const searchResults = document.getElementById('searchResults');
    if (searchResults) searchResults.textContent = '';

    const noResults = document.getElementById('noResults');
    if (noResults) noResults.classList.remove('visible');

    // Volver a mostrar las secciones de categorías
    document.body.classList.remove('searching');

    // Hacer foco en el primer input visible (desktop; el del panel móvil se enfoca al abrirlo)
    const visibleInput = [...document.querySelectorAll('.search-input')]
        .find(input => input.offsetParent !== null && !input.closest('#mobileSearch'));
    if (visibleInput) visibleInput.focus();
}

// Exponer funciones globalmente
window.limpiarBusqueda = limpiarBusqueda;