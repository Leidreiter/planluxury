// Testimonios - carrusel de reseñas (patrón marquee: track duplicado + translateX -50%)

const TESTIMONIOS = [
    {
        nombre: 'María González',
        avatar: 'https://i.pravatar.cc/150?img=45',
        rating: 5,
        fecha: '12/08/2026',
        texto: 'Excelente atención y envío rapidísimo. El producto llegó perfectamente embalado y tal cual la descripción.'
    },
    {
        nombre: 'Carlos Rodríguez',
        avatar: 'https://i.pravatar.cc/150?img=12',
        rating: 5,
        fecha: '08/08/2026',
        texto: 'Muy buena calidad. Hice el pedido un martes y el jueves ya lo tenía en casa. Recomiendo completamente.'
    },
    {
        nombre: 'Lucía Fernández',
        avatar: 'https://i.pravatar.cc/150?img=32',
        rating: 5,
        fecha: '03/08/2026',
        texto: 'La atención por WhatsApp fue excelente, me ayudaron a elegir el producto correcto. ¡Volveré a comprar!'
    },
    {
        nombre: 'Martín López',
        avatar: 'https://i.pravatar.cc/150?img=68',
        rating: 4,
        fecha: '29/07/2026',
        texto: 'Compré por primera vez y la experiencia fue genial. Precios justos y muy buena comunicación durante todo el proceso.'
    },
    {
        nombre: 'Valentina García',
        avatar: 'https://i.pravatar.cc/150?img=25',
        rating: 5,
        fecha: '24/07/2026',
        texto: 'El producto superó mis expectativas. La entrega llegó en el horario prometido y en perfectas condiciones.'
    },
    {
        nombre: 'Pablo Martínez',
        avatar: 'https://i.pravatar.cc/150?img=53',
        rating: 5,
        fecha: '19/07/2026',
        texto: 'Muy conforme con la compra. El packaging era impecable y el producto funciona de maravilla. 100% recomendable.'
    },
    {
        nombre: 'Sofía Díaz',
        avatar: 'https://i.pravatar.cc/150?img=47',
        rating: 5,
        fecha: '15/07/2026',
        texto: 'Atención personalizada de principio a fin. Consulté varias dudas por WhatsApp y me respondieron al instante.'
    },
    {
        nombre: 'Jorge Sánchez',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 4,
        fecha: '10/07/2026',
        texto: 'Segunda compra que hago y todo perfecto otra vez. Calidad garantizada y envíos muy puntuales.'
    },
    {
        nombre: 'Camila Romero',
        avatar: 'https://i.pravatar.cc/150?img=20',
        rating: 5,
        fecha: '06/07/2026',
        texto: 'Gran experiencia de compra. La página es clara, el pago fue simple y el envío llegó en tiempo récord.'
    },
    {
        nombre: 'Diego Torres',
        avatar: 'https://i.pravatar.cc/150?img=59',
        rating: 5,
        fecha: '01/07/2026',
        texto: 'Los productos son tal cual se muestran en la web. Muy buena relación precio-calidad. Estoy muy satisfecho.'
    },
    {
        nombre: 'Florencia Álvarez',
        avatar: 'https://i.pravatar.cc/150?img=38',
        rating: 5,
        fecha: '27/06/2026',
        texto: 'Me encantó el detalle del seguimiento del pedido. Todo el proceso fue transparente y sin sorpresas.'
    },
    {
        nombre: 'Nicolás Herrera',
        avatar: 'https://i.pravatar.cc/150?img=15',
        rating: 4,
        fecha: '22/06/2026',
        texto: 'Recomendada por un amigo y no me defraudó. Excelente servicio, atención amable y productos de calidad.'
    }
];

function generarCard(testimonio) {
    const card = document.createElement('article');
    card.className = 'testimonio-card';

    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        estrellas += `<i class="${i <= testimonio.rating ? 'fa-solid' : 'fa-regular'} fa-star star"></i>`;
    }

    card.innerHTML = `
        <div class="testimonio-body">
            <div class="testimonio-head">
                <img src="${testimonio.avatar}" alt="Foto de ${testimonio.nombre}" class="testimonio-foto" loading="lazy" width="56" height="56">
                <div class="testimonio-info">
                    <p class="testimonio-nombre">${testimonio.nombre}</p>
                    <div class="testimonio-stars">${estrellas}</div>
                    <p class="testimonio-fecha">${testimonio.fecha}</p>
                </div>
                <i class="fa-brands fa-google google-isologo" aria-hidden="true"></i>
            </div>
            <p class="testimonio-texto">"${testimonio.texto}"</p>
        </div>
    `;

    return card;
}

document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.testimonios-track');
    if (!track) return;

    // Dos copias del listado para el loop infinito sin saltos
    const fragment = document.createDocumentFragment();
    for (let copia = 0; copia < 2; copia++) {
        TESTIMONIOS.forEach(t => fragment.appendChild(generarCard(t)));
    }
    track.appendChild(fragment);
});