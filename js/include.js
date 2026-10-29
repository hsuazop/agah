// Carga el header y footer compartidos (partials/header.html y partials/footer.html)
// dentro de #site-header y #site-footer, y marca el enlace de la página actual
// (clase "active" + aria-current="page" para lectores de pantalla).
document.addEventListener('DOMContentLoaded', function () {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function cargarParcial(url, contenedorId, alTerminar) {
    var contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    fetch(url)
      .then(function (respuesta) { return respuesta.text(); })
      .then(function (html) {
        contenedor.innerHTML = html;
        if (typeof alTerminar === 'function') alTerminar();
      })
      .catch(function (error) {
        console.error('No se pudo cargar ' + url + ':', error);
      });
  }

  cargarParcial('partials/header.html', 'site-header', function () {
    document.querySelectorAll('#site-header [data-page]').forEach(function (link) {
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  });

  cargarParcial('partials/footer.html', 'site-footer');
});
