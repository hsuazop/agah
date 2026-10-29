/* =====================================================================
   Funcionalidades del sitio AGAH — 100 % en el navegador.
   No hay backend ni base de datos: se filtra/busca sobre el contenido
   escrito en el HTML de cada página. No se envía ningún dato.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  function normalizar(texto) {
    return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /* -------------------------------------------------------------
     REPOSITORIO.HTML — búsqueda sobre los documentos listados.
     Cada documento lleva el atributo data-doc-item; si la pestaña
     activa no tiene coincidencias, se abre la primera que sí tenga.
     ------------------------------------------------------------- */
  var repoInput = document.getElementById('repoSearchInput');
  if (repoInput) {
    var repoBtn = document.getElementById('repoSearchBtn');
    var repoStatus = document.getElementById('repoSearchStatus');
    var panes = Array.prototype.slice.call(document.querySelectorAll('#contenido .tab-pane'));

    // ?filtro=actas | normativa | informes | planes abre esa pestaña
    var filtro = new URLSearchParams(window.location.search).get('filtro');
    if (filtro && window.bootstrap) {
      var btnInicial = document.getElementById('tabBtn-' + filtro);
      if (btnInicial) new bootstrap.Tab(btnInicial).show();
    }

    function buscarRepositorio() {
      var termino = normalizar(repoInput.value.trim());
      var total = 0;
      var primeraConResultados = null;
      var activaTieneResultados = false;

      panes.forEach(function (pane) {
        var visibles = 0;
        pane.querySelectorAll('[data-doc-item]').forEach(function (item) {
          var ok = !termino || normalizar(item.textContent).indexOf(termino) !== -1;
          item.style.display = ok ? '' : 'none';
          if (ok) visibles++;
        });
        total += visibles;
        if (visibles > 0 && !primeraConResultados) primeraConResultados = pane.id;
        if (visibles > 0 && pane.classList.contains('active')) activaTieneResultados = true;
      });

      if (!termino) {
        repoStatus.textContent = '';
      } else if (total === 0) {
        repoStatus.textContent = 'No se encontraron documentos para «' + repoInput.value.trim() + '». Prueba con otra palabra.';
      } else {
        repoStatus.textContent = total + ' documento(s) encontrado(s).';
        if (!activaTieneResultados && primeraConResultados && window.bootstrap) {
          new bootstrap.Tab(document.getElementById(primeraConResultados.replace('tab-', 'tabBtn-'))).show();
        }
      }
    }

    repoBtn.addEventListener('click', buscarRepositorio);
    repoInput.addEventListener('input', buscarRepositorio);
    repoInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') buscarRepositorio(); });
  }

  /* -------------------------------------------------------------
     TABLERO.HTML — filtro por institución responsable
     ------------------------------------------------------------- */
  var filtroResp = document.getElementById('tableroFiltroResponsable');
  if (filtroResp) {
    var tarjetas = document.querySelectorAll('[data-responsable]');
    var tableroStatus = document.getElementById('tableroStatus');
    filtroResp.addEventListener('change', function () {
      var valor = filtroResp.value, n = 0;
      tarjetas.forEach(function (t) {
        var ok = !valor || t.getAttribute('data-responsable') === valor;
        t.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      if (tableroStatus) tableroStatus.textContent = n + ' compromiso(s) mostrados.';
    });
  }

  /* -------------------------------------------------------------
     PRENSA.HTML — filtro por tipo de publicación
     ------------------------------------------------------------- */
  var filtrosPrensa = document.querySelectorAll('.agah-filter');
  if (filtrosPrensa.length) {
    var itemsPrensa = document.querySelectorAll('#prensaLista [data-tipo]');
    var prensaStatus = document.getElementById('prensaStatus');
    filtrosPrensa.forEach(function (boton) {
      boton.addEventListener('click', function () {
        var tipo = boton.getAttribute('data-filtro'), n = 0;
        filtrosPrensa.forEach(function (b) { b.setAttribute('aria-pressed', b === boton ? 'true' : 'false'); });
        itemsPrensa.forEach(function (item) {
          var ok = !tipo || item.getAttribute('data-tipo') === tipo;
          item.style.display = ok ? '' : 'none';
          if (ok) n++;
        });
        if (prensaStatus) prensaStatus.textContent = n + ' publicación(es) mostradas.';
      });
    });
  }

  /* -------------------------------------------------------------
     PRENSA.HTML — si se llega con prensa.html#modalBoletinX
     (por ejemplo, desde la portada), abrir esa nota.
     ------------------------------------------------------------- */
  if (window.location.hash && window.location.hash.indexOf('#modalBoletin') === 0) {
    var modal = document.querySelector(window.location.hash);
    if (modal && window.bootstrap) new bootstrap.Modal(modal).show();
  }
});
