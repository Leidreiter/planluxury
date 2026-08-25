// Renderizar productos por categorías en el index
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase, obtenerBanners, escaparHtml } from './utils.js';

let productos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar productos usando el sistema centralizado con caché
    productos = await obtenerProductos();

    if (productos.length > 0) {
        // Banners dinámicos desde la hoja "Banners"; sin datos o error => sin banners
        const banners = await obtenerBanners();
        renderizarCategoriasAutomaticas(Array.isArray(banners) ? banners : []);

        // Scroll al hash si se viene desde otra página (ej: index.html#cat-calzado)
        if (window.location.hash) {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
});

function renderizarCategoriasAutomaticas(banners) {
    const container = document.getElementById('tienda');
    if (!container) return;

    // Extraer categorías únicas de los productos
    const categorias = [...new Set(productos.map(p => p.categoria))].filter(Boolean);

    // Intercalar banners dinámicos entre las categorías (máx 4 en el index; la fila 5 es del carrito)
    const bannersIndex = banners.slice(0, 4);
    let bannerActual = 0;

    let htmlFinal = '';

    // Emite el siguiente bloque según la posición:
    // fila 1 -> tarjeta completa · filas 2+3 -> par lado a lado · fila 4 -> tarjeta completa.
    // Si queda una sola del par (hoja con filas impares), sale como tarjeta completa.
    const emitirSiguienteBloque = () => {
        if (bannerActual >= bannersIndex.length) return;

        if (bannerActual === 1 && bannersIndex[2]) {
            htmlFinal += generarHTMLParBanners(bannersIndex[1], bannersIndex[2]);
            bannerActual += 2;
            return;
        }

        htmlFinal += generarHTMLBannerDinamico(bannersIndex[bannerActual]);
        bannerActual++;
    };

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

        // Bloque de banners después de cada categoría mientras haya disponibles
        emitirSiguienteBloque();
    });

    // Banners sobrantes al final (más banners que categorías)
    while (bannerActual < bannersIndex.length) {
        emitirSiguienteBloque();
    }

    container.innerHTML = htmlFinal;
}

// Fila de dos tarjetas blancas lado a lado (diseño original .banners-productos)
function generarHTMLParBanners(bannerA, bannerB) {
    return `
        <section class="banner-intercalado">
            <div class="banners-productos">
                ${generarHTMLTarjetaBanner(bannerA)}
                ${generarHTMLTarjetaBanner(bannerB)}
            </div>
        </section>
    `;
}

// Tarjeta del par: texto+botón a la izquierda, imagen a la derecha con esquina redondeada.
// La imagen va como fondo inline porque las clases viejas (.banner-img1/2) apuntan a archivos fijos locales.
// Sin párrafo descriptivo (no tiene columna en la hoja). Logos ignorados: este diseño no lleva ícono.
function generarHTMLTarjetaBanner(banner) {
    const titulo = escaparHtml(banner.titulo);
    const link = escaparHtml(banner.link || '');
    const tieneBoton = Boolean(banner.boton && banner.link);

    return `
        <div class="banner-productos-contenido banner-border">
            <div class="banner-promo-info">
                ${banner.badge ? `<h4>${escaparHtml(banner.badge)}</h4>` : ''}
                <h2>${titulo}</h2>
                ${tieneBoton ? `<a href="${link}" target="_self" class="btn btn-border">${escaparHtml(banner.boton)}</a>` : ''}
            </div>
            <div class="banner-img-dinamica" style="background-image:url('${escaparHtml(banner.imagen)}')"></div>
        </div>
    `;
}

// Misma estructura visual que los banners estáticos de la plantilla.
// Reglas: badge vacío => sin h4 · botón solo con texto Y link · logo vacío => sin bloque de ícono.
function generarHTMLBannerDinamico(banner) {
    const titulo = escaparHtml(banner.titulo);
    const link = escaparHtml(banner.link || '');
    const tieneBoton = Boolean(banner.boton && banner.link);

    return `
        <section class="banner-intercalado">
            <div class="banner banner-border">
                <div class="banner_imagen">
                    ${banner.link ? `<a href="${link}" target="_self">` : ''}
                        <img loading="lazy" src="${escaparHtml(banner.imagen)}" alt="${titulo}" width="1200" height="400">
                    ${banner.link ? '</a>' : ''}
                </div>

                <div class="banner_info">
                    ${banner.logo ? `
                    <div class="banner_info_icono banner-border">
                        <img loading="lazy" src="${escaparHtml(banner.logo)}" alt="" class="block" width="60" height="60">
                    </div>
                    ` : ''}

                    <div class="banner_info_copy">
                        ${banner.badge ? `<h4>${escaparHtml(banner.badge)}</h4>` : ''}
                        <h2>${titulo}</h2>
                        ${tieneBoton ? `<a href="${link}" target="_self">${escaparHtml(banner.boton)} <i class="fa-solid fa-chevron-right"></i></a>` : ''}
                    </div>
                </div>
            </div>
        </section>
    `;
}

// Lógica para agregar al carrito desde las tarjetas de esta página
function agregarAlCarrito(id) {
    agregarAlCarritoBase(id, productos);
}

// Exponer a window para que funcione con onclick en módulos
window.agregarAlCarrito = agregarAlCarrito;