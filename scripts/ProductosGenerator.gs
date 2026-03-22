// =====================================================
// GENERADOR DE ARCHIVO productos.js
// Lógica de generación independiente de servicios Google
// =====================================================

/**
 * Genera el contenido completo del archivo productos.js
 * @param {Array} productos - Array de productos con imágenes procesadas
 * @returns {String} - Contenido del archivo JavaScript
 */
function generarArchivoProductosJS(productos) {
    let contenido = generarEncabezado();
    contenido += generarArrayProductos(productos);
    contenido += generarFuncionesCliente();
    
    return contenido;
}

/**
 * Genera el encabezado del archivo
 */
function generarEncabezado() {
    return `// Base de datos de productos con galería de imágenes
// Generado automáticamente desde Google Sheets
// Última actualización: ${new Date().toLocaleString('es-AR')}

`;
}

/**
 * Genera el array de productos
 */
function generarArrayProductos(productos) {
    let contenido = `const productos = [\n`;

    productos.forEach((producto, index) => {
        contenido += `    {\n`;
        contenido += `        id: ${producto.id},\n`;
        contenido += `        nombre: "${escaparComillas(producto.nombre)}",\n`;
        contenido += `        descripcion: "${escaparComillas(producto.descripcion)}",\n`;
        contenido += `        descripcionDetallada: "${escaparComillas(producto.descripcionDetallada)}",\n`;
        contenido += `        precio: ${producto.precio},\n`;
        contenido += `        imagen: "${producto.imagen}",\n`;
        contenido += `        galeria: [\n`;
        producto.galeria.forEach((img, imgIndex) => {
            contenido += `            "${img}"${imgIndex < producto.galeria.length - 1 ? ',' : ''}\n`;
        });
        contenido += `        ],\n`;
        contenido += `        categoria: "${producto.categoria}",\n`;
        contenido += `        stock: ${producto.stock},\n`;
        contenido += `        caracteristicas: [\n`;
        producto.caracteristicas.forEach((caract, cIndex) => {
            contenido += `            "${escaparComillas(caract)}"${cIndex < producto.caracteristicas.length - 1 ? ',' : ''}\n`;
        });
        contenido += `        ]\n`;
        contenido += `    }${index < productos.length - 1 ? ',' : ''}\n`;
    });

    contenido += `];\n\n`;
    
    return contenido;
}

/**
 * Genera las funciones que se ejecutarán en el cliente (navegador)
 */
function generarFuncionesCliente() {
    return `
// ============================================
// FUNCIONES DEL CLIENTE (Navegador)
// ============================================

// Renderizar productos
function renderizarProductos() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = productos.map(producto => \`
        <article class="product-card">
            <a href="producto.html?id=\${producto.id}" class="product-link">
                <img src="\${producto.imagen}" alt="\${producto.nombre}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3 class="product-title">\${producto.nombre}</h3>
                    <p class="product-description">\${producto.descripcion}</p>
                    <p class="product-price">\${formatearPrecio(producto.precio)}</p>
                </div>
            </a>
            <div class="product-actions">
                <button class="add-to-cart-btn" onclick="window.location.href='producto.html?id=\${producto.id}'" aria-label="Ver detalles de \${producto.nombre}">
                    Ver producto
                </button>

                <button class="add-to-cart-btn" onclick="agregarAlCarrito(\${producto.id})" aria-label="Agregar \${producto.nombre} al carrito">
                    Agregar al Carrito
                </button>
            </div>
        </article>
    \`).join('');
}

// Agregar al carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    actualizarContadorCarrito();
    mostrarNotificacion('Producto agregado al carrito');
}

// Formatear precio
function formatearPrecio(precio) {
    return precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Mostrar notificación
function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;
    notif.style.cssText = \`
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
    \`;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = \`
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
\`;
document.head.appendChild(style);

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', renderizarProductos);
`;
}

/**
 * Escapa comillas y saltos de línea para JavaScript
 */
function escaparComillas(texto) {
    if (!texto) return '';
    return texto.toString().replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
