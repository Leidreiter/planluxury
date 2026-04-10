// Base de datos de productos con galería de imágenes
// Generado automáticamente desde Google Sheets
// Última actualización: 10/4/2026, 12:47:19

const productos = [
    {
        id: 1,
        nombre: "Botas cuero hombre",
        descripcion: "Botas de cuero resistentes con estilo clásico masculino",
        descripcionDetallada: "Botas de cuero genuino diseñadas para hombres que buscan durabilidad y presencia. Ideales para uso diario o salidas, combinan comodidad con un diseño robusto y elegante.",
        precio: 114000,
        imagen: "https://lh3.googleusercontent.com/d/1XRvBa52MEohlTqtFBu3XVTUp1MmelF8I",
        galeria: [
            "https://lh3.googleusercontent.com/d/1XRvBa52MEohlTqtFBu3XVTUp1MmelF8I",
            "https://lh3.googleusercontent.com/d/162rcn298gX3Agq1xwsgEHWA8F7UhK0IO",
            "https://lh3.googleusercontent.com/d/1irYSLUlSqsdrkwVBGUsl6JLVVm-an31y"
        ],
        categoria: "Calzado",
        stock: 20,
        caracteristicas: [
            "Cuero genuino",
            "Suela antideslizante",
            "Interior acolchado",
            "Alta durabilidad"
        ]
    },
    {
        id: 2,
        nombre: "Botitas lowtops mujer",
        descripcion: "Botitas bajas modernas y versátiles para uso diario",
        descripcionDetallada: "Botitas lowtops para mujer con diseño urbano, ideales para looks casuales. Livianas y cómodas, perfectas para acompañarte todo el día sin perder estilo.",
        precio: 78000,
        imagen: "https://lh3.googleusercontent.com/d/1bd_4VHX6smbYR5hyJo8fAnU_smX6Chb1",
        galeria: [
            "https://lh3.googleusercontent.com/d/1bd_4VHX6smbYR5hyJo8fAnU_smX6Chb1",
            "https://lh3.googleusercontent.com/d/1YN8dvR3vi_Xy-Ky6kJ0QZ7PvFfMxuusc",
            "https://lh3.googleusercontent.com/d/1SypvaQtWzeo_LOqC60kFMF_M0rGrMNIP"
        ],
        categoria: "Calzado",
        stock: 25,
        caracteristicas: [
            "Diseño lowtop",
            "Material sintético premium",
            "Livianas",
            "Suela flexible"
        ]
    },
    {
        id: 3,
        nombre: "Buzo canguro liso hombre",
        descripcion: "Buzo canguro básico y cómodo para uso diario",
        descripcionDetallada: "Buzo canguro liso para hombre, ideal para un look relajado. Fabricado con materiales suaves que brindan abrigo y confort en cualquier ocasión.",
        precio: 54000,
        imagen: "https://lh3.googleusercontent.com/d/1TnBSORvZT7buvqElpidZuh0PFgO2Ayjp",
        galeria: [
            "https://lh3.googleusercontent.com/d/1TnBSORvZT7buvqElpidZuh0PFgO2Ayjp",
            "https://lh3.googleusercontent.com/d/19VAjBhBAtseoL94UQHNB6FK5neC_f-BX",
            "https://lh3.googleusercontent.com/d/1ArTpnrmpgfYA4LThJv1BoubT59EMJKmY"
        ],
        categoria: "Abrigos",
        stock: 30,
        caracteristicas: [
            "Bolsillo frontal",
            "Capucha ajustable",
            "Tela suave",
            "Corte regular"
        ]
    },
    {
        id: 4,
        nombre: "Buzo canguro mujer",
        descripcion: "Buzo canguro femenino cómodo y versátil",
        descripcionDetallada: "Buzo canguro para mujer con diseño moderno, ideal para outfits casuales. Ofrece abrigo y estilo en una sola prenda.",
        precio: 57600,
        imagen: "https://lh3.googleusercontent.com/d/1kSYVlEOPb34gNCBL-hqaCZVlbTZ0WENc",
        galeria: [
            "https://lh3.googleusercontent.com/d/1kSYVlEOPb34gNCBL-hqaCZVlbTZ0WENc",
            "https://lh3.googleusercontent.com/d/1d4H8sfh0Zgsu6lDUOiswCX4aswmOMHAK",
            "https://lh3.googleusercontent.com/d/1mNj6cNZgUPu-OMh4BKRcftqRe_07RhXz"
        ],
        categoria: "Abrigos",
        stock: 10,
        caracteristicas: [
            "Capucha con cordón",
            "Bolsillo frontal",
            "Tela abrigada",
            "Ajuste cómodo"
        ]
    },
    {
        id: 5,
        nombre: "Buzo liso mujer",
        descripcion: "Buzo básico femenino, ideal para cualquier ocasión",
        descripcionDetallada: "Buzo liso para mujer de diseño minimalista, fácil de combinar. Perfecto para looks casuales o deportivos.",
        precio: 48000,
        imagen: "https://lh3.googleusercontent.com/d/1Isnq45gffmO8MKfVNhsBakspc1qnzkGs",
        galeria: [
            "https://lh3.googleusercontent.com/d/1Isnq45gffmO8MKfVNhsBakspc1qnzkGs",
            "https://lh3.googleusercontent.com/d/19KbSdjEXuzp8KX5U2LyDY2Oh-yf6cBOW",
            "https://lh3.googleusercontent.com/d/1iYRwLWK2D1s70W6JgEnZlG2W42y1Q6Vq"
        ],
        categoria: "Abrigos",
        stock: 35,
        caracteristicas: [
            "Diseño minimalista",
            "Tela suave",
            "Corte clásico",
            "Fácil combinación"
        ]
    },
    {
        id: 6,
        nombre: "Buzo oversize mujer",
        descripcion: "Buzo oversize con estilo relajado y moderno",
        descripcionDetallada: "Buzo oversize para mujer, tendencia actual que combina comodidad y estilo urbano. Ideal para looks sueltos y descontracturados.",
        precio: 62400,
        imagen: "https://lh3.googleusercontent.com/d/1B7XDLlPvK2eWKX36mH-w9F4oYWZj7C4N",
        galeria: [
            "https://lh3.googleusercontent.com/d/1B7XDLlPvK2eWKX36mH-w9F4oYWZj7C4N",
            "https://lh3.googleusercontent.com/d/1QKqzyDNwPNrhK5supsf4wKJzH_StxOce",
            "https://lh3.googleusercontent.com/d/1N6hkCFJV9xThhiKWuroA1xQ-WLeGPS7j"
        ],
        categoria: "Abrigos",
        stock: 22,
        caracteristicas: [
            "Fit oversize",
            "Tela gruesa",
            "Estilo urbano",
            "Máximo confort"
        ]
    },
    {
        id: 7,
        nombre: "Jean oscuro mujer",
        descripcion: "Jean oscuro elegante y versátil",
        descripcionDetallada: "Jean para mujer en tono oscuro, ideal para looks tanto casuales como formales. Ajuste cómodo que resalta la silueta.",
        precio: 66000,
        imagen: "https://lh3.googleusercontent.com/d/19dALGxH4xSTHUUgbLLLv0c-ixIe253iP",
        galeria: [
            "https://lh3.googleusercontent.com/d/19dALGxH4xSTHUUgbLLLv0c-ixIe253iP",
            "https://lh3.googleusercontent.com/d/1rX7JTCO2KWZOB_PvdKLUooCiSVhyFWU_",
            "https://lh3.googleusercontent.com/d/1F1Bu_qCbnKeEnG20jnmL8M4RuB3PLQxz"
        ],
        categoria: "Pantalones",
        stock: 27,
        caracteristicas: [
            "Color oscuro",
            "Ajuste cómodo",
            "Tela resistente",
            "Diseño versátil"
        ]
    },
    {
        id: 8,
        nombre: "Jeans clásicos hombre",
        descripcion: "Jeans clásicos masculinos de uso diario",
        descripcionDetallada: "Jeans para hombre con corte tradicional, ideales para cualquier ocasión. Duraderos y cómodos para el día a día.",
        precio: 72000,
        imagen: "https://lh3.googleusercontent.com/d/1oBuHoRoMNf8tga4-WERHhL59C2cPbgQ4",
        galeria: [
            "https://lh3.googleusercontent.com/d/1oBuHoRoMNf8tga4-WERHhL59C2cPbgQ4",
            "https://lh3.googleusercontent.com/d/1EU33b_C95nNRq_mp1AjV2MoArL0v-9MQ",
            "https://lh3.googleusercontent.com/d/1LOwEpAaa98TxZkhNcfnqWXZFHEQeve1V"
        ],
        categoria: "Pantalones",
        stock: 32,
        caracteristicas: [
            "Corte clásico",
            "Denim resistente",
            "Ajuste regular",
            "Alta durabilidad"
        ]
    },
    {
        id: 9,
        nombre: "Jeans pata elefante mujer",
        descripcion: "Jeans pata elefante con estilo retro",
        descripcionDetallada: "Jeans para mujer con corte pata elefante, inspirados en tendencias vintage. Perfectos para destacar con un look único.",
        precio: 69600,
        imagen: "https://lh3.googleusercontent.com/d/15NTvnnD3QmAiTjqEebO3KcKO811p6ffv",
        galeria: [
            "https://lh3.googleusercontent.com/d/15NTvnnD3QmAiTjqEebO3KcKO811p6ffv",
            "https://lh3.googleusercontent.com/d/1uOoZKr-_xmuvrZP_I5Agv3j7NxV07uzh",
            "https://lh3.googleusercontent.com/d/1kkuivo55iGiwbJZqDgTPAMo81ylyvyVn"
        ],
        categoria: "Pantalones",
        stock: 18,
        caracteristicas: [
            "Corte amplio",
            "Estilo retro",
            "Tela cómoda",
            "Tiro medio/alto"
        ]
    },
    {
        id: 10,
        nombre: "Jeans rotura hombre",
        descripcion: "Jeans desgastados con roturas modernas",
        descripcionDetallada: "Jeans para hombre con roturas estratégicas que aportan un look urbano y actual. Ideales para outfits informales.",
        precio: 74400,
        imagen: "https://lh3.googleusercontent.com/d/10v2Ba-w5B67DLYJIpwsimqo_HKTvDJDG",
        galeria: [
            "https://lh3.googleusercontent.com/d/10v2Ba-w5B67DLYJIpwsimqo_HKTvDJDG",
            "https://lh3.googleusercontent.com/d/1kHz_LUgCxGC2h4qqxyP56gjYduxwOHq5",
            "https://lh3.googleusercontent.com/d/1Ym8j8r1eiyVTrT4fZJqvEXS8ScR-89lX"
        ],
        categoria: "Pantalones",
        stock: 24,
        caracteristicas: [
            "Diseño con roturas",
            "Estilo urbano",
            "Denim flexible",
            "Ajuste moderno"
        ]
    },
    {
        id: 11,
        nombre: "Remera calavera hombre",
        descripcion: "Remera con diseño de calavera llamativo",
        descripcionDetallada: "Remera para hombre con estampado de calavera, perfecta para un estilo rebelde y moderno.",
        precio: 36000,
        imagen: "https://lh3.googleusercontent.com/d/1tVjE7MdzZyOUJ38lEZ7PBERgcmmhzSfd",
        galeria: [
            "https://lh3.googleusercontent.com/d/1tVjE7MdzZyOUJ38lEZ7PBERgcmmhzSfd",
            "https://lh3.googleusercontent.com/d/1WTDGdF2c8RRMdS7y_ZdPGElwWe_RCUFU",
            "https://lh3.googleusercontent.com/d/1hSwYcU2_m7QNsX28eMFAWmsEymCIuczQ"
        ],
        categoria: "Remeras",
        stock: 10,
        caracteristicas: [
            "Estampa frontal",
            "Algodón suave",
            "Corte regular",
            "Alta calidad de impresión"
        ]
    },
    {
        id: 12,
        nombre: "Remera game over mujer",
        descripcion: "Remera gamer con diseño “Game Over”",
        descripcionDetallada: "Remera para mujer con estampa divertida “Game Over”, ideal para fanáticas del gaming y el estilo casual.",
        precio: 33600,
        imagen: "https://lh3.googleusercontent.com/d/1_pj-RtbTVCGu6_-ou6bkLqeH3zCZSedA",
        galeria: [
            "https://lh3.googleusercontent.com/d/1_pj-RtbTVCGu6_-ou6bkLqeH3zCZSedA",
            "https://lh3.googleusercontent.com/d/1x-ByWMkrZOWdg40mg2G-iUbU4_-p_tjh",
            "https://lh3.googleusercontent.com/d/1ztJRqoEio2OArP2j1DjvxFJ4avHlGdOJ"
        ],
        categoria: "Remeras",
        stock: 5,
        caracteristicas: [
            "Diseño gamer",
            "Tela liviana",
            "Corte femenino",
            "Estampa duradera"
        ]
    },
    {
        id: 13,
        nombre: "Remera tucán mujer",
        descripcion: "Remera con estampa de tucán colorida",
        descripcionDetallada: "Remera femenina con diseño de tucán vibrante, ideal para looks frescos y veraniegos",
        precio: 32400,
        imagen: "https://lh3.googleusercontent.com/d/1Nhz65hG73zpyQ56dq9oz3JswUAl3LsVe",
        galeria: [
            "https://lh3.googleusercontent.com/d/1Nhz65hG73zpyQ56dq9oz3JswUAl3LsVe",
            "https://lh3.googleusercontent.com/d/1Bjke89phz-O_n7LYvvO2qFhjiVOYsE59",
            "https://lh3.googleusercontent.com/d/1jVnTH65FZbVt8xkDx4S1Zht-wkTyJwIa"
        ],
        categoria: "Remeras",
        stock: 23,
        caracteristicas: [
            "Estampa tropical",
            "Algodón liviano",
            "Corte cómodo",
            "Colores vivos"
        ]
    },
    {
        id: 14,
        nombre: "Suéter traveller mujer",
        descripcion: "Suéter cómodo ideal para viajes",
        descripcionDetallada: "Suéter para mujer pensado para viajes y uso diario, combinando abrigo ligero con estilo moderno.",
        precio: 60000,
        imagen: "https://lh3.googleusercontent.com/d/1AXaBdEgw2esUfLxSNJL9H-Co1woqVLAj",
        galeria: [
            "https://lh3.googleusercontent.com/d/1AXaBdEgw2esUfLxSNJL9H-Co1woqVLAj",
            "https://lh3.googleusercontent.com/d/14R0p-shBJIsrGLoQ3p88qT91q6rq_2w6",
            "https://lh3.googleusercontent.com/d/1L3o5R30K31tnCQPw-TrfFFLKOZ744ZjN"
        ],
        categoria: "Remeras",
        stock: 5,
        caracteristicas: [
            "Tela térmica ligera",
            "Diseño versátil",
            "Ajuste cómodo",
            "Fácil de transportar"
        ]
    },
    {
        id: 15,
        nombre: "Zapatillas hightop mujer",
        descripcion: "Zapatillas high top con estilo urbano",
        descripcionDetallada: "Zapatillas de caña alta para mujer, ideales para looks urbanos y modernos. Combinan diseño y comodidad.",
        precio: 84000,
        imagen: "https://lh3.googleusercontent.com/d/1dmKkLbPsFeqR_Me3wrv8DecFv7lffE01",
        galeria: [
            "https://lh3.googleusercontent.com/d/1dmKkLbPsFeqR_Me3wrv8DecFv7lffE01",
            "https://lh3.googleusercontent.com/d/1HtziFT4dEIz3lgnYuJf1deQOaanGkLR8",
            "https://lh3.googleusercontent.com/d/1P88iVgijw_ICuRBz7hFmbvVfBCYJybKl"
        ],
        categoria: "Calzado",
        stock: 20,
        caracteristicas: [
            "Caña alta",
            "Diseño moderno",
            "Suela resistente",
            "Ajuste seguro"
        ]
    },
    {
        id: 16,
        nombre: "Zapatillas urbanas mujer",
        descripcion: "Zapatillas urbanas cómodas para el día a día",
        descripcionDetallada: "Zapatillas para mujer con estilo urbano, pensadas para uso diario. Livianas, cómodas y fáciles de combinar.",
        precio: 81600,
        imagen: "https://lh3.googleusercontent.com/d/1OU1lieM-MY5siUCyM_klmpjnDJOIIfif",
        galeria: [
            "https://lh3.googleusercontent.com/d/1OU1lieM-MY5siUCyM_klmpjnDJOIIfif"
        ],
        categoria: "Calzado",
        stock: 12,
        caracteristicas: [
            "Diseño urbano",
            "Material liviano",
            "Suela flexible",
            "Uso diario"
        ]
    }
];


// ============================================
// FUNCIONES DEL CLIENTE (Navegador)
// ============================================

// Renderizar productos
function renderizarProductos() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = productos.map(producto => `
        <article class="product-card">
            <a href="producto.html?id=${producto.id}" class="product-link">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcion}</p>
                    <p class="product-price">${formatearPrecio(producto.precio)}</p>
                </div>
            </a>
            <div class="product-actions">
                <button class="add-to-cart-btn" onclick="window.location.href='producto.html?id=${producto.id}'" aria-label="Ver detalles de ${producto.nombre}">
                    Ver producto
                </button>

                <button class="add-to-cart-btn" onclick="agregarAlCarrito(${producto.id})" aria-label="Agregar ${producto.nombre} al carrito">
                    Agregar al Carrito
                </button>
            </div>
        </article>
    `).join('');
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

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', renderizarProductos);
