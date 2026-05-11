// Gestión del menú hamburguesa
document.addEventListener('click', function(e) {
    // Buscamos los elementos cada vez que hay un click porque son dinámicos
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    // Si el header aún no se ha inyectado en el DOM, salimos
    if (!navMenu || !menuToggle) return;

    const isToggle = e.target.closest('.menu-toggle');
    const isLink = e.target.closest('.nav-link, .submenu a');
    const isClickInsideMenu = navMenu.contains(e.target);

    // 1. Click en el botón hamburguesa (Toggle)
    if (isToggle) {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        // Prevenir scroll cuando el menú está abierto
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        return;
    }

    // 2. Cerrar menú al hacer click en un enlace (en móvil)
    if (isLink && window.innerWidth <= 768) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
        return;
    }

    // 3. Cerrar menú al hacer click fuera del menú y del botón
    if (!isClickInsideMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Ajustar al cambiar tamaño de ventana para limpiar estados si se pasa a escritorio
window.addEventListener('resize', function() {
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth > 768 && navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
});