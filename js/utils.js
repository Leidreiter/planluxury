// utils.js

// Configuración de descuentos
export const CONFIG_DESCUENTO = {
    UMBRAL: 100000, // Monto mínimo para aplicar descuento (ej. $100.000)
    PORCENTAJE: 10  // Porcentaje de descuento (ej. 10%)
};

// Cupones manuales válidos
export const CONFIG_CUPONES = {
    'PROMO20': { porcentaje: 20, expira: '2026-12-31' },
    'BIENVENIDA': { porcentaje: 15, expira: '2026-06-30' },
    'LUXURY10': { porcentaje: 10, expira: '2026-05-15' }
};

// Configuración de WhatsApp centralizada
export const WHATSAPP_CONFIG = {
    number: '543515957014',
    defaultMessage: 'Hola, quería consultar '
};

// Calcular subtotales, descuentos y totales
export function calcularTotales(cart, codigoCupon = null) {
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    let descuentoAuto = 0;
    
    if (subtotal >= CONFIG_DESCUENTO.UMBRAL) {
        descuentoAuto = subtotal * (CONFIG_DESCUENTO.PORCENTAJE / 100);
    }

    let descuentoCupon = 0;
    let porcentajeAplicado = CONFIG_DESCUENTO.PORCENTAJE;

    const cuponData = codigoCupon ? CONFIG_CUPONES[codigoCupon.toUpperCase()] : null;
    
    if (cuponData) {
        const hoy = new Date();
        const fechaExp = new Date(cuponData.expira);
        
        // Solo aplicar si no ha expirado (comparando solo fechas a medianoche local)
        if (hoy.setHours(0,0,0,0) <= fechaExp.setHours(0,0,0,0)) {
            const porcentajeCupon = cuponData.porcentaje;
            descuentoCupon = subtotal * (porcentajeCupon / 100);
            porcentajeAplicado = porcentajeCupon;
        }
    }
    
    // Aplicamos el mayor de los dos descuentos (no acumulables)
    const descuentoFinal = Math.max(descuentoAuto, descuentoCupon);
    const total = subtotal - descuentoFinal;

    return { 
        subtotal, 
        descuento: descuentoFinal, 
        total,
        esCupon: descuentoCupon > descuentoAuto,
        porcentaje: descuentoFinal > 0 ? (descuentoCupon > descuentoAuto ? porcentajeAplicado : CONFIG_DESCUENTO.PORCENTAJE) : 0
    };
}

// Cargar productos con caché de sesión para evitar múltiples peticiones de red
export async function obtenerProductos() {
    const cachedData = sessionStorage.getItem('cache_productos');
    const cachedVersion = sessionStorage.getItem('cache_version');

    try {
        // Opcional: Podrías disparar un evento de 'loading-start' aquí
        
        // Consultamos la cabecera Last-Modified o ETag para ver si el archivo cambió en el servidor
        const headResponse = await fetch('js/productos.json', { method: 'HEAD' });
        const serverVersion = headResponse.headers.get('Last-Modified') || headResponse.headers.get('ETag');

        // Si el cache existe y coincide con la versión del servidor, lo usamos
        if (cachedData && cachedVersion === serverVersion) {
            return JSON.parse(cachedData);
        }

        // Si no hay cache o la versión es distinta (servidor más nuevo), descargamos el archivo completo
        const response = await fetch('js/productos.json');
        if (!response.ok) throw new Error('Error al cargar productos');
        const productos = await response.json();

        // Guardamos en cache los datos y la versión (timestamp de modificación)
        sessionStorage.setItem('cache_productos', JSON.stringify(productos));
        if (serverVersion) {
            sessionStorage.setItem('cache_version', serverVersion);
        }

        return productos;
    } catch (error) {
        if (cachedData) return JSON.parse(cachedData); // Fallback al cache si falla la red
        mostrarNotificacion('No pudimos cargar el catálogo. Por favor, recarga la página.', 'error');
        return [];
    }
}

// Generar el HTML de una tarjeta de producto (estándar para toda la web)
export function generarHTMLTarjetaProducto(producto) {
    const esAgotado = producto.stock === 0;
    return `
        <article class="product-card ${esAgotado ? 'out-of-stock' : ''}">
            ${esAgotado ? '<span class="out-of-stock-badge">Sin Stock</span>' : ''}
            <a href="producto.html?id=${producto.id}" class="product-link">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion}</p>
                    <p class="product-price">$${formatearPrecio(producto.precio)}</p>
                </div>
            </a>
            <div class="product-actions">
                <button class="view-product-btn" onclick="window.location.href='producto.html?id=${producto.id}'" aria-label="Ver detalles de ${producto.nombre}">
                    Ver producto
                </button>

                <button class="add-to-cart-btn" onclick="agregarAlCarrito(${producto.id})" 
                    ${esAgotado ? 'disabled' : ''} 
                    aria-label="Agregar ${producto.nombre} al carrito">
                    ${esAgotado ? 'Agotado' : 'Agregar al Carrito'}
                </button>
            </div>
        </article>
    `;
}

// Lógica compartida para agregar productos al carrito
export function agregarAlCarritoBase(id, listaProductos) {
    const producto = listaProductos.find(p => p.id === id);
    if (!producto) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...producto, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
    mostrarNotificacion('Producto agregado al carrito');
}

// Formatear precio
export function formatearPrecio(precio) {
    return precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Mostrar notificación
export function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// Estilos de animación para notificaciones (se pueden mover a styles.css si se prefiere)
// Para mantenerlo autocontenido con la función, lo dejamos aquí por ahora.
// Asegúrate de que estos estilos no se dupliquen si ya están en styles.css
// (En tu styles.css ya están, así que esta parte se eliminaría de aquí y se mantendría en styles.css)