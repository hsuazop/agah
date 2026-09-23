// Carga el header y footer compartidos (partials/header.html y partials/footer.html)
// dentro de los contenedores #site-header y #site-footer de cada página,
// y marca como "activo" el link del menú que corresponde a la página actual.
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
    var links = document.querySelectorAll('#site-header [data-page]');
    links.forEach(function (link) {
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
      }
    });
  });

  cargarParcial('partials/footer.html', 'site-footer');
});
