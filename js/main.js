/* =====================================================================
   Funcionalidades básicas del sitio AGAH — 100% en el navegador.
   No hay backend ni base de datos: todo filtra/busca sobre el
   contenido que ya está escrito en el HTML de cada página. No se
   envía ni se guarda ningún dato del visitante en ningún servidor.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* -------------------------------------------------------------
     REPOSITORIO.HTML — búsqueda de texto + filtro por Tipo de Documento
     ------------------------------------------------------------- */
  var repoSearchInput = document.getElementById('repoSearchInput');
  if (repoSearchInput) {
    var repoSearchBtn = document.getElementById('repoSearchBtn');
    var repoSearchStatus = document.getElementById('repoSearchStatus');
    var repoFiltroTipo = document.getElementById('repoFiltroTipo');

    // Si se llegó desde un "filtro rápido" del inicio (?filtro=normativa),
    // abrir directamente esa pestaña.
    var params = new URLSearchParams(window.location.search);
    var filtroInicial = params.get('filtro');
    if (filtroInicial === 'normativa') {
      var tabNormativa = document.getElementById('tabBtn-normativa');
      if (tabNormativa && window.bootstrap) {
        new bootstrap.Tab(tabNormativa).show();
      }
    }

    function normalizar(texto) {
      return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function aplicarFiltrosRepositorio() {
      var termino = normalizar(repoSearchInput.value.trim());
      var tipoSeleccionado = repoFiltroTipo ? repoFiltroTipo.value : '';
      var totalVisible = 0;
      var primerTabConResultado = null;

      // --- Filas de la tabla de Actas ---
      var filasActas = document.querySelectorAll('#tab-actas tbody tr');
      var actasVisibles = 0;
      filasActas.forEach(function (fila) {
        var coincideTexto = !termino || normalizar(fila.textContent).indexOf(termino) !== -1;
        var coincideTipo = !tipoSeleccionado || tipoSeleccionado === 'Actas';
        var visible = coincideTexto && coincideTipo;
        fila.style.display = visible ? '' : 'none';
        if (visible) { actasVisibles++; totalVisible++; }
      });
      if (actasVisibles > 0 && !primerTabConResultado) primerTabConResultado = 'tabBtn-actas';

      // --- Tarjetas de Decretos y Normativa (tienen data-doc-tipo real) ---
      var tarjetasNormativa = document.querySelectorAll('#tab-normativa [data-doc-tipo]');
      var normativaVisibles = 0;
      tarjetasNormativa.forEach(function (tarjeta) {
        var coincideTexto = !termino || normalizar(tarjeta.textContent).indexOf(termino) !== -1;
        var coincideTipo = !tipoSeleccionado || tipoSeleccionado === tarjeta.getAttribute('data-doc-tipo');
        var visible = coincideTexto && coincideTipo;
        tarjeta.style.display = visible ? '' : 'none';
        if (visible) { normativaVisibles++; totalVisible++; }
      });
      if (normativaVisibles > 0 && !primerTabConResultado) primerTabConResultado = 'tabBtn-normativa';

      // --- Tarjetas de Documentos de Trabajo (no tienen "tipo" propio, solo texto) ---
      var tarjetasTrabajo = document.querySelectorAll('#tab-trabajo .col-md-4');
      var trabajoVisibles = 0;
      var tipoAplicaATrabajo = !tipoSeleccionado || tipoSeleccionado === 'Propuestas';
      tarjetasTrabajo.forEach(function (tarjeta) {
        var coincideTexto = !termino || normalizar(tarjeta.textContent).indexOf(termino) !== -1;
        var visible = coincideTexto && tipoAplicaATrabajo;
        tarjeta.style.display = visible ? '' : 'none';
        if (visible) { trabajoVisibles++; totalVisible++; }
      });
      if (trabajoVisibles > 0 && !primerTabConResultado) primerTabConResultado = 'tabBtn-trabajo';

      // Mensaje honesto de estado: solo cuenta lo que realmente hay escrito
      // en la página, no simula un índice documental que no existe.
      if (!termino && !tipoSeleccionado) {
        repoSearchStatus.textContent = '';
      } else if (totalVisible === 0) {
        repoSearchStatus.textContent = 'No se encontraron documentos que coincidan con tu búsqueda.';
      } else {
        repoSearchStatus.textContent = totalVisible + ' documento(s) encontrado(s).';
        var tabActivaTieneResultados =
          (document.getElementById('tab-actas').classList.contains('active') && actasVisibles > 0) ||
          (document.getElementById('tab-normativa').classList.contains('active') && normativaVisibles > 0) ||
          (document.getElementById('tab-trabajo').classList.contains('active') && trabajoVisibles > 0);
        if (!tabActivaTieneResultados && primerTabConResultado && window.bootstrap) {
          new bootstrap.Tab(document.getElementById(primerTabConResultado)).show();
        }
      }
    }

    repoSearchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      aplicarFiltrosRepositorio();
    });
    repoSearchInput.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') aplicarFiltrosRepositorio();
    });
    repoSearchInput.addEventListener('input', function () {
      aplicarFiltrosRepositorio();
    });
    if (repoFiltroTipo) {
      repoFiltroTipo.addEventListener('change', aplicarFiltrosRepositorio);
    }
  }

  /* -------------------------------------------------------------
     TABLERO.HTML — filtro por Estado sobre los 14 compromisos reales
     del V PAEAH 2023-2025 (cada tarjeta trae su propio data-estado,
     tomado del mismo texto que ya se ve en su badge).
     ------------------------------------------------------------- */
  var tableroFiltroEstado = document.getElementById('tableroFiltroEstado');
  if (tableroFiltroEstado) {
    var tarjetasCompromiso = document.querySelectorAll('[data-estado]');
    tableroFiltroEstado.addEventListener('change', function () {
      var valor = tableroFiltroEstado.value;
      tarjetasCompromiso.forEach(function (tarjeta) {
        var visible = !valor || tarjeta.getAttribute('data-estado') === valor;
        tarjeta.style.display = visible ? '' : 'none';
      });
    });
  }

  /* -------------------------------------------------------------
     PRENSA.HTML — "Copiar enlace" de cada boletín (Clipboard API,
     nada se envía a ningún servidor).
     ------------------------------------------------------------- */
  document.querySelectorAll('.copiar-enlace-boletin').forEach(function (boton) {
    boton.addEventListener('click', function () {
      var modalId = boton.getAttribute('data-modal-id');
      var url = window.location.href.split('#')[0] + '#' + modalId;
      var textoOriginal = boton.innerHTML;

      function marcarComoCopiado() {
        boton.innerHTML = '<i class="bi bi-check2"></i> Enlace copiado';
        setTimeout(function () { boton.innerHTML = textoOriginal; }, 2000);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(marcarComoCopiado).catch(function () {
          boton.innerHTML = '<i class="bi bi-exclamation-triangle"></i> No se pudo copiar';
          setTimeout(function () { boton.innerHTML = textoOriginal; }, 2000);
        });
      }
    });
  });

  /* -------------------------------------------------------------
     PRENSA.HTML — si alguien llega con un enlace copiado
     (pagina.html#modalBoletinX), abrir ese boletín automáticamente.
     ------------------------------------------------------------- */
  if (window.location.hash && window.location.hash.indexOf('modalBoletin') === 1) {
    var modalDesdeEnlace = document.querySelector(window.location.hash);
    if (modalDesdeEnlace && window.bootstrap) {
      new bootstrap.Modal(modalDesdeEnlace).show();
    }
  }

});