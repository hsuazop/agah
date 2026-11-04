(function () {
  var URL_SERVICIO = 'https://portalunico.iaip.gob.hn/services/contacto/';
  var CORREO = 'secretariatecnicaagah@iaip.gob.hn'; // solo para el aviso cuando algo falla
  var ASUNTO = 'Consulta desde el portal AGAHonduras';
  var TIEMPO_MAXIMO_MS = 20000; // si el servicio no responde en 20 s, se avisa y se libera el botón

  var form = document.getElementById('formConsulta');
  if (!form) return;
  var estado = document.getElementById('consultaEstado');
  var boton = document.getElementById('consultaEnviar');

  /* Muestra un aviso dentro de la página. El texto se inserta como TEXTO (no como HTML),
     así un mensaje del servidor nunca puede meter código en la página. */
  function mostrar(tipo, texto, conEnlaceCorreo) {
    var caja = document.createElement('div');
    caja.className = 'alert alert-' + tipo + ' mb-0';
    caja.setAttribute('role', tipo === 'danger' ? 'alert' : 'status');
    var p = document.createElement('span');
    p.textContent = texto;
    caja.appendChild(p);
    if (conEnlaceCorreo) {
      caja.appendChild(document.createTextNode(' También puedes escribir a '));
      var a = document.createElement('a');
      a.className = 'alert-link';
      a.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(ASUNTO);
      a.textContent = CORREO;
      caja.appendChild(a);
      caja.appendChild(document.createTextNode('.'));
    }
    estado.replaceChildren(caja);
  }

  // Al corregir un campo se le quita el aviso de error
  form.addEventListener('input', function (e) {
    var el = e.target;
    if (el.classList && el.classList.contains('is-invalid') && el.checkValidity()) {
      el.removeAttribute('aria-invalid');
      el.classList.remove('is-invalid');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements._honey && form.elements._honey.value) return; // robot: se ignora sin avisar

    if (!form.checkValidity()) {
      var invalidos = Array.prototype.slice.call(form.querySelectorAll(':invalid'));
      var nombres = invalidos.map(function (el) {
        var lb = form.querySelector('label[for="' + el.id + '"]');
        return lb ? lb.textContent.trim() : el.name;
      });
      invalidos.forEach(function (el) { el.setAttribute('aria-invalid', 'true'); el.classList.add('is-invalid'); });
      invalidos[0].focus();
      mostrar('warning', 'Revisa estos campos antes de enviar: ' + nombres.join(', ') + '.');
      return;
    }

    var datos = {
      nombre: form.elements.nombre.value.trim(),
      apellido: form.elements.apellido.value.trim(),
      correo: form.elements.email.value.trim(),
      mensaje: form.elements.mensaje.value.trim()
    };

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    mostrar('info', 'Enviando tu mensaje…');

    var control = new AbortController();
    var reloj = setTimeout(function () { control.abort(); }, TIEMPO_MAXIMO_MS);

    fetch(URL_SERVICIO, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      signal: control.signal
    })
      .then(function (r) {
        // Si el servicio no devuelve JSON (por ejemplo, una página de error), se usa un objeto vacío
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, json: j || {} }; });
      })
      .then(function (res) {
        if (res.ok && res.json.enviado === true) {
          form.reset();
          mostrar('success', res.json.mensaje || 'Mensaje enviado. La Secretaría Técnica lo recibirá en su correo institucional.');
          return;
        }
        var falla = new Error(res.json.mensaje || 'No se pudo enviar el mensaje.');
        falla.delServicio = true;
        throw falla;
      })
      .catch(function (err) {
        if (err && err.delServicio) {
          mostrar('danger', err.message, true);
        } else if (err && err.name === 'AbortError') {
          mostrar('danger', 'El servicio tardó demasiado en responder. Inténtalo nuevamente.', true);
        } else {
          mostrar('danger', 'Error de conexión. Inténtalo nuevamente.', true);
        }
      })
      .then(function () {
        clearTimeout(reloj);
        boton.disabled = false;
        boton.textContent = 'Enviar';
      });
  });
})();