// Template dinámico para Header y Footer

import { WHATSAPP_CONFIG } from './utils.js';

// Renderizar Header
function renderHeader(activePage = '') {
    const header = document.createElement('div');
    header.className = 'header-wrapper';
    header.innerHTML = `
        <div class="redes">
            <div class="contenedor">
                <a href="https://www.facebook.com/p/" target="_blank" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="https://www.instagram.com/" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://www.tiktok.com/@" target="_blank" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
            </div>
        </div>
        <nav class="navbar">
            <div class="nav-container">
                <!--
                <a href="index.html" class="logo">Mi Tienda</a>
                -->
                <a href="index.html" class="logo-link">
                    <img src="img/logo.svg" alt="Logo de la tienda" class="logo">
                </a>

                <button class="menu-toggle" aria-label="Abrir menú de navegación">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                
                <div class="nav-menu">
                    <a href="index.html" class="nav-link ${activePage === 'inicio' ? 'active' : ''}">Inicio</a>
                    <a href="index.html#tienda" class="nav-link ${activePage === 'productos' ? 'active' : ''}">Productos</a>
                    <a href="nosotros.html" class="nav-link ${activePage === 'nosotros' ? 'active' : ''}">Nosotros</a>
                    <a href="faq.html" class="nav-link ${activePage === 'faq' ? 'active' : ''}">Preguntas</a> 
                    <!-- <a href="index.html#contacto" class="nav-link ${activePage === 'contacto' ? 'active' : ''}">Contacto</a>-->
                    <a href="contacto.html" class="nav-link ${activePage === 'contacto' ? 'active' : ''}">Contacto</a> 
                    <a href="favoritos.html" class="nav-link favorites-link ${activePage === 'favoritos' ? 'active' : ''}" aria-label="Mis Favoritos">
                        <i class="fa-solid fa-heart"></i>
                        <span class="nav-label">Favoritos</span>
                        <span class="favorites-count">0</span>
                    </a>
                    <a href="carrito.html" class="nav-link cart-link ${activePage === 'carrito' ? 'active' : ''}">
                        <i class="fa-solid fa-cart-shopping"></i>
                        <span class="nav-label">Carrito</span>
                        <span class="cart-count">0</span>
                    </a>
                </div>
            </div>
        </nav>
    `;
    return header;
}

// Renderizar Footer
function renderFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <p>&copy; 2026 Mi Tienda Online. Todos los derechos reservados. Hecho con ♥️ por <a href="https://lemora.lat" target="_blank"><img src="img/lemora.svg" alt="Diseño y Desarrollo por Lemora" class="devBy"></a></p>
        <div class="whatsapp">
            <a href="https://wa.me/${WHATSAPP_CONFIG.number}?text=${encodeURIComponent(WHATSAPP_CONFIG.defaultMessage)}" 
               target="_blank" 
               rel="noopener" 
               aria-label="Contactar por WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
        </div>
        `;

    return footer;
}

// Función para inicializar el Marquee (integrada para evitar conflictos de orden)
function initMarquee() {
    const textos = [
        '🔥 ¡20% OFF en toda la tienda con el código PROMO20!',
        '🚚 Envío gratis en compras mayores a $100.000',
        '⭐ Nuevos productos disponibles — ¡Descubrí las novedades!'
    ];

    const marqueeBar = document.createElement('div');
    marqueeBar.className = 'marquee-bar';

    const marqueeTrack = document.createElement('div');
    marqueeTrack.className = 'marquee-track';

    const contenido = textos.map(t => `<span class="marquee-item">${t}</span>`).join('');
    marqueeTrack.innerHTML = contenido + contenido; // Duplicado para loop infinito

    marqueeBar.appendChild(marqueeTrack);
    return marqueeBar;
}

// Inicializar template
function initTemplate(activePage = '') {
    const body = document.body;
    
    // 1. Insertar Marquee (siempre primero)
    const marquee = initMarquee();
    body.insertBefore(marquee, body.firstChild);

    // 2. Insertar Header (después del marquee)
    const header = renderHeader(activePage);
    body.insertBefore(header, marquee.nextSibling);

    // Insertar footer al final del body
    const footer = renderFooter();
    body.appendChild(footer);
}

// Actualizar contador de favoritos en el nav
function actualizarContadorFavoritosGlobal() {
    const favoritos = JSON.parse(localStorage.getItem('favorites')) || [];
    const contadores = document.querySelectorAll('.favorites-count');
    contadores.forEach(contador => {
        contador.textContent = favoritos.length;
        if (favoritos.length > 0) {
            contador.style.display = 'flex';
        } else {
            contador.style.display = 'none';
        }
    });
}

// Actualizar contador del carrito en el nav
function actualizarContadorCarrito() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const contadores = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    contadores.forEach(contador => {
        contador.textContent = totalItems;
        if (totalItems > 0) {
            contador.style.display = 'flex';
        } else {
            contador.style.display = 'none';
        }
    });
}
// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Detectar página activa desde el atributo data-page del body
    const activePage = document.body.getAttribute('data-page') || '';
    initTemplate(activePage);
    
    // Actualizar contador de favoritos
    actualizarContadorFavoritosGlobal();
    // Actualizar contador del carrito
    actualizarContadorCarrito();

    // Hacer que la función de actualizar favoritos sea accesible para otros módulos
    // sin tener que duplicar el código en cada archivo.
    window.actualizarContadorFavoritosGlobal = actualizarContadorFavoritosGlobal;
    // Hacer que la función de actualizar carrito sea accesible para otros módulos
    window.actualizarContadorCarrito = actualizarContadorCarrito;

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registrado:', registration))
                .catch(registrationError => console.log('SW registro fallido:', registrationError));
        });
    }
});
