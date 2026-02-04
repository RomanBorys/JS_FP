const body = document.body;

const menuButton = document.querySelector('.header_menu-btn');
const menu = document.querySelector('.mobile-menu');
const menuContent = document.querySelector('.mobile-menu__content');
const menuClose = document.querySelector('.mobile-menu__close');

const navLinks = document.querySelectorAll('[data-nav]');

const openMenu = () => {
  if (!menu) return;

  menu.classList.add('mobile-menu--open');
  menu.setAttribute('aria-hidden', 'false');
  body.style.overflow = 'hidden';
};

const closeMenu = () => {
  if (!menu) return;

  menu.classList.remove('mobile-menu--open');
  menu.setAttribute('aria-hidden', 'true');
  body.style.overflow = '';
};

const isFavoritesPath = path => {
  const normalized = (path || '').toLowerCase();
  return (
    normalized.endsWith('/page-2.html') ||
    normalized.endsWith('page-2.html') ||
    normalized.endsWith('/favourites.html') ||
    normalized.endsWith('favourites.html')
  );
};

const setActiveLinks = () => {
  const path = window.location.pathname;
  const isFavorites = isFavoritesPath(path);

  navLinks.forEach(link => {
    const isFavoritesLink = link.dataset.nav === 'favorites';
    const isHomeLink = link.dataset.nav === 'home';
    const isActive = isFavorites ? isFavoritesLink : isHomeLink;

    if (link.classList.contains('header_nav-link')) {
      link.classList.toggle('header_nav-link-active', isActive);
    }

    if (link.classList.contains('mobile-menu__link')) {
      link.classList.toggle('mobile-menu__link--active', isActive);
    }
  });
};

if (menuButton && menu) {
  menuButton.addEventListener('click', openMenu);
}

if (menuClose && menu) {
  menuClose.addEventListener('click', closeMenu);
}

if (menu) {
  menu.addEventListener('click', event => {
    if (!menuContent) {
      if (event.target === menu) closeMenu();
      return;
    }

    const clickedInside = menuContent.contains(event.target);
    if (!clickedInside) closeMenu();
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});

setActiveLinks();
