// Renderizar productos por categorías en el index
import { obtenerProductos, generarHTMLTarjetaProducto, agregarAlCarritoBase, obtenerBanners, escaparHtml, esBannerSoloImagen } from './utils.js';

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

    // Construir la secuencia de bloques en orden:
    // - "solo imagen" => bloque full-width independiente (nunca entra en el par)
    // - banners CON contenido => patrón: 1º completo, 2º+3º par lado a lado, 4º completo, etc.
    //   (si queda una sola del par, sale como tarjeta completa)
    const bloques = [];
    let bufferContenido = [];

    const vaciarBuffer = () => {
        if (bufferContenido.length === 0) return;
        bloques.push({ tipo: 'completo', banner: bufferContenido[0] });
        for (let i = 1; i < bufferContenido.length; i += 2) {
            if (i + 1 < bufferContenido.length) {
                bloques.push({ tipo: 'par', a: bufferContenido[i], b: bufferContenido[i + 1] });
            } else {
                bloques.push({ tipo: 'completo', banner: bufferContenido[i] });
            }
        }
        bufferContenido = [];
    };

    bannersIndex.forEach(banner => {
        if (esBannerSoloImagen(banner)) {
            vaciarBuffer();
            bloques.push({ tipo: 'solo', banner });
        } else {
            bufferContenido.push(banner);
        }
    });
    vaciarBuffer();

    let bloqueActual = 0;

    const emitirSiguienteBloque = () => {
        if (bloqueActual >= bloques.length) return;
        const bloque = bloques[bloqueActual++];
        if (bloque.tipo === 'solo') {
            htmlFinal += generarHTMLBannerSoloImagen(bloque.banner);
        } else if (bloque.tipo === 'par') {
            htmlFinal += generarHTMLParBanners(bloque.a, bloque.b);
        } else {
            htmlFinal += generarHTMLBannerDinamico(bloque.banner);
        }
    };

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

        // Bloque de banners después de cada categoría mientras haya disponibles
        emitirSiguienteBloque();
    });

    // Banners sobrantes al final (más banners que categorías)
    while (bloqueActual < bloques.length) {
        emitirSiguienteBloque();
    }

    container.innerHTML = htmlFinal;
}

// Banner "solo imagen": imagen a ancho completo como fondo con cover,
// mismo alto de banner (aspect-ratio 3:1). Con link => bloque clicable.
function generarHTMLBannerSoloImagen(banner) {
    const img = escaparHtml(banner.imagen);
    const link = escaparHtml(banner.link || '');
    const etiqueta = banner.link ? `aria-label="${escaparHtml(banner.titulo || 'Banner')}" ` : '';

    return `
        <section class="banner-intercalado">
            <div class="banner-solo-imagen banner-border" style="background-image:url('${img}')">
                ${banner.link ? `<a href="${link}" target="_self" ${etiqueta}></a>` : ''}
            </div>
        </section>
    `;
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