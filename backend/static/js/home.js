/**
 * Inicialização dos carrosséis da página inicial (Swiper.js)
 */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var busca = params.get('q');
  if (busca && busca.trim() && document.getElementById('catalogo')) {
    var alvo = document.getElementById('catalogo');
    if (window.location.hash === '#catalogo') {
      alvo.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      var offset = 110;
      var top = alvo.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  if (typeof Swiper === 'undefined') return;

  var swiperBase = {
    speed: 450,
    spaceBetween: 20,
    grabCursor: true,
    watchOverflow: true,
  };

  /* Carrossel de categorias */
  if (document.querySelector('.swiper-categorias')) {
    new Swiper('.swiper-categorias', Object.assign({}, swiperBase, {
      slidesPerView: 2.2,
      navigation: {
        nextEl: '.swiper-cat-next',
        prevEl: '.swiper-cat-prev',
      },
      breakpoints: {
        576: { slidesPerView: 3.2 },
        768: { slidesPerView: 4.2 },
        992: { slidesPerView: 5.2 },
        1200: { slidesPerView: 6.2 },
      },
    }));
  }

  /* Carrossel de medicamentos em destaque */
  if (document.querySelector('.swiper-medicamentos')) {
    new Swiper('.swiper-medicamentos', Object.assign({}, swiperBase, {
      slidesPerView: 1.15,
      navigation: {
        nextEl: '.swiper-med-next',
        prevEl: '.swiper-med-prev',
      },
      breakpoints: {
        576: { slidesPerView: 2.2 },
        768: { slidesPerView: 3.2 },
        992: { slidesPerView: 4.2 },
        1200: { slidesPerView: 4.5 },
      },
    }));
  }

  /* Logo fallback quando imagem não existe */
  var logoImg = document.querySelector('.navbar-brand img');
  if (logoImg) {
    logoImg.addEventListener('error', function () {
      var icon = document.querySelector('.logo-fallback-icon');
      if (icon) icon.classList.remove('d-none');
    });
    if (!logoImg.complete || logoImg.naturalHeight === 0) {
      if (!logoImg.src || logoImg.naturalHeight === 0) {
        logoImg.dispatchEvent(new Event('error'));
      }
    }
  }
});
