/* =====================================================================
   Boletín "Jornadas de Sensibilización" (prensa.html, #modalBoletin5)
   - Dibuja la galería de cada ciudad a partir de js/jornadas-fotos.js
   - Visor para ampliar fotos (teclado: ← → Esc). 100 % en el navegador.
   Si una ciudad no tiene fotos, simplemente no se muestra su galería.
   ===================================================================== */
(function () {
  var RUTA = 'img/jornadas/';
  var DESTACADAS = 5; // fotos visibles en la cuadrícula; el resto se ve en el visor
  var FOTOS = window.AGAH_JORNADAS_FOTOS || {};
  var visor = null, lista = [], indice = 0, titulo = '', disparador = null;

  function crear(tag, clase, attrs) {
    var el = document.createElement(tag);
    if (clase) el.className = clase;
    for (var k in (attrs || {})) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ---------- Visor ---------- */
  function construirVisor(modal) {
    var v = crear('div', 'agah-lightbox', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Galería de fotos', hidden: '' });
    v.innerHTML =
      '<button type="button" class="agah-lb-btn agah-lb-close" aria-label="Cerrar galería"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
      '<button type="button" class="agah-lb-btn agah-lb-prev" aria-label="Foto anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
      '<figure class="agah-lb-figure"><img class="agah-lb-img" alt=""><figcaption class="agah-lb-caption" aria-live="polite"></figcaption></figure>' +
      '<button type="button" class="agah-lb-btn agah-lb-next" aria-label="Foto siguiente"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>';
    // Dentro del modal de Bootstrap, para que su control de foco no lo bloquee
    modal.appendChild(v);
    v.querySelector('.agah-lb-close').addEventListener('click', cerrar);
    v.querySelector('.agah-lb-prev').addEventListener('click', function () { mover(-1); });
    v.querySelector('.agah-lb-next').addEventListener('click', function () { mover(1); });
    v.addEventListener('click', function (e) { if (e.target === v) cerrar(); });
    return v;
  }

  function mostrar() {
    var img = visor.querySelector('.agah-lb-img');
    img.src = lista[indice];
    img.alt = titulo + ': foto ' + (indice + 1) + ' de ' + lista.length;
    visor.querySelector('.agah-lb-caption').textContent = titulo + ' · ' + (indice + 1) + ' / ' + lista.length;
    var solo = lista.length < 2;
    visor.querySelector('.agah-lb-prev').hidden = solo;
    visor.querySelector('.agah-lb-next').hidden = solo;
  }

  function mover(d) {
    indice = (indice + d + lista.length) % lista.length;
    mostrar();
  }

  function abrir(modal, urls, desde, nombre, origen) {
    if (!visor) visor = construirVisor(modal);
    lista = urls; indice = desde; titulo = nombre; disparador = origen;
    mostrar();
    visor.hidden = false;
    visor.querySelector('.agah-lb-close').focus();
    document.addEventListener('keydown', teclas, true);
  }

  function cerrar() {
    if (!visor || visor.hidden) return;
    visor.hidden = true;
    visor.querySelector('.agah-lb-img').removeAttribute('src');
    document.removeEventListener('keydown', teclas, true);
    if (disparador) disparador.focus();
  }

  function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    else if (e.key === 'Tab') { // mantener el foco dentro del visor
      var btns = Array.prototype.filter.call(visor.querySelectorAll('button'), function (b) { return !b.hidden; });
      var primero = btns[0], ultimo = btns[btns.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  }

  /* ---------- Galerías ---------- */
  function dibujar(cont) {
    var clave = cont.getAttribute('data-ciudad');
    var nombre = cont.getAttribute('data-nombre') || clave;
    var fotos = FOTOS[clave] || [];
    var modal = cont.closest('.modal');
    if (!fotos.length || !modal) { cont.remove(); return; }

    var grandes = fotos.map(function (f) { return RUTA + clave + '/' + f; });
    var minis = fotos.map(function (f) { return RUTA + clave + '/min/' + f; });
    var rotulo = 'Jornada de Sensibilización en ' + nombre;

    var grid = crear('div', 'agah-gallery' + (fotos.length >= DESTACADAS ? ' is-featured' : ''));
    grid.setAttribute('data-n', Math.min(fotos.length, DESTACADAS));
    minis.slice(0, DESTACADAS).forEach(function (src, i) {
      var alt = rotulo + ': foto ' + (i + 1) + ' de ' + fotos.length;
      var b = crear('button', 'agah-gallery-item', { type: 'button', 'aria-label': 'Ampliar. ' + alt });
      var img = crear('img', '', { src: src, alt: '', loading: 'lazy', decoding: 'async' });
      img.addEventListener('error', function () { b.remove(); }); // foto que no existe: no se muestra rota
      b.appendChild(img);
      b.addEventListener('click', function () { abrir(modal, grandes, i, rotulo, b); });
      grid.appendChild(b);
    });
    cont.appendChild(grid);

    if (fotos.length > DESTACADAS) {
      var mas = crear('button', 'btn btn-sm btn-outline-secondary rounded-pill mt-3', { type: 'button' });
      mas.innerHTML = '<i class="bi bi-images" aria-hidden="true"></i> Ver las ' + fotos.length + ' fotos';
      mas.addEventListener('click', function () { abrir(modal, grandes, 0, rotulo, mas); });
      cont.appendChild(mas);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.agah-gallery-host').forEach(dibujar);
    // Al cerrar el modal del boletín se cierra también el visor
    var modal = document.getElementById('modalBoletin5');
    if (modal) modal.addEventListener('hidden.bs.modal', cerrar);
  });
})();