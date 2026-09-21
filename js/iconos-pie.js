// Iconos de confianza del pie del home.
// Contenido dinámico desde la hoja "Iconos" (js/iconos-pie.json).
// El JSON llega con la sección oculta (hidden en el HTML); sin iconos => sigue oculta.

import { obtenerIconos, imagenOptimizada, escaparHtml } from './utils.js';

async function renderizarIconos() {
    const seccion = document.querySelector('.iconos-pie');
    if (!seccion) return;

    const contenedor = seccion.querySelector('#iconos-pie');
    const iconos = await obtenerIconos();

    if (!Array.isArray(iconos) || iconos.length === 0) {
        seccion.hidden = true;
        return;
    }

    if (!contenedor) {
        seccion.hidden = true;
        return;
    }

    contenedor.innerHTML = iconos.map(icono => {
        const titulo = escaparHtml(icono.titulo || '');
        const descripcion = escaparHtml(icono.descripcion || '');
        const img = icono.imagen
            ? `<img loading="lazy" src="${escaparHtml(imagenOptimizada(icono.imagen))}" alt="${titulo}" width="60" height="60">`
            : '';

        return `
            <div class="icono">
                ${img}
                <h3>${titulo}</h3>
                ${descripcion ? `<p>${descripcion}</p>` : ''}
            </div>
        `;
    }).join('');

    seccion.hidden = false;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderizarIconos);
} else {
    renderizarIconos();
}