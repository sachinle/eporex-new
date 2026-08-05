/* ===========================================================================
   EPOREX — enquiry form UX (replaces the theme's contact-form.js)
   ---------------------------------------------------------------------------
   AJAX-submits #contact-form to its action (assets/php/contact.php), shows a
   "Sending…" state, then an animated success tick inside the form box, or an
   inline error. Response contract stays the theme's { status, msg } JSON.
   WhatsApp button is handled separately by eporex-whatsapp.js.
   =========================================================================== */
(function () {
  if (window.__epxFormsInit) return;
  window.__epxFormsInit = true;

  /* ---- inject styles once ---------------------------------------------- */
  var css =
    '.epx-success{text-align:center;padding:22px 12px;animation:epx-fadein .4s ease both}' +
    '.epx-success h4{margin:18px 0 6px;font-size:22px;line-height:1.2}' +
    '.epx-success p{margin:0 auto 18px;max-width:440px;opacity:.85}' +
    '.epx-send-another{display:inline-flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;color:#20BB99}' +
    '.epx-send-another:hover{text-decoration:underline}' +
    '.epx-tick{width:92px;height:92px;border-radius:50%;display:block;margin:0 auto;stroke-width:3;stroke:#fff;stroke-miterlimit:10;box-shadow:inset 0 0 0 #25c281;animation:epx-fill .4s ease-in-out .4s forwards,epx-scale .3s ease-in-out .9s both}' +
    '.epx-tick__circle{stroke-dasharray:166;stroke-dashoffset:166;stroke-width:3;stroke-miterlimit:10;stroke:#25c281;fill:none;animation:epx-stroke .6s cubic-bezier(.65,0,.45,1) forwards}' +
    '.epx-tick__check{transform-origin:50% 50%;stroke-dasharray:48;stroke-dashoffset:48;stroke:#fff;animation:epx-stroke .3s cubic-bezier(.65,0,.45,1) .85s forwards}' +
    '@keyframes epx-stroke{100%{stroke-dashoffset:0}}' +
    '@keyframes epx-scale{0%,100%{transform:none}50%{transform:scale3d(1.1,1.1,1)}}' +
    '@keyframes epx-fill{100%{box-shadow:inset 0 0 0 46px #25c281}}' +
    '@keyframes epx-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '.epx-form-error{background:#fdecea;color:#b3261e;border:1px solid #f5c6cb;padding:11px 14px;border-radius:8px;margin-bottom:14px;font-size:14px}' +
    'button.epx-loading{opacity:.75;cursor:progress;pointer-events:none}';
  var styleEl = document.createElement('style');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  function successPanel(msg) {
    return '' +
      '<div class="epx-success" role="status" aria-live="polite">' +
        '<svg class="epx-tick" viewBox="0 0 52 52" aria-hidden="true">' +
          '<circle class="epx-tick__circle" cx="26" cy="26" r="25" fill="none"/>' +
          '<path class="epx-tick__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>' +
        '</svg>' +
        '<h4>Enquiry sent!</h4>' +
        '<p>' + (msg || 'Thank you. Our team will get back to you shortly.') + '</p>' +
        '<span class="epx-send-another"><i class="far fa-arrow-rotate-left"></i> Send another enquiry</span>' +
      '</div>';
  }

  function wire(form) {
    var original = form.innerHTML;
    var msgBox = form.parentNode ? form.parentNode.querySelector('.form-message') : null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var btnHtml = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.classList.add('epx-loading'); btn.innerHTML = 'Sending&hellip;'; }
      if (msgBox) { msgBox.className = 'form-message'; msgBox.innerHTML = ''; }
      var oldErr = form.querySelector('.epx-form-error'); if (oldErr) oldErr.remove();

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var j; try { j = JSON.parse(text); } catch (err) { j = { status: 'error', msg: 'Unexpected server response.' }; }
        if (j.status === 'success') {
          form.innerHTML = successPanel(j.msg);
        } else {
          if (btn) { btn.disabled = false; btn.classList.remove('epx-loading'); btn.innerHTML = btnHtml; }
          var m = j.msg || 'Sorry, something went wrong. Please try again.';
          if (msgBox) { msgBox.className = 'form-message error'; msgBox.textContent = m; }
          else { form.insertAdjacentHTML('afterbegin', '<div class="epx-form-error">' + m + '</div>'); }
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.classList.remove('epx-loading'); btn.innerHTML = btnHtml; }
        var m = 'Could not send right now. Please message us on WhatsApp or call +91 73580 10419.';
        if (msgBox) { msgBox.className = 'form-message error'; msgBox.textContent = m; }
        else { form.insertAdjacentHTML('afterbegin', '<div class="epx-form-error">' + m + '</div>'); }
      });
    });

    form.addEventListener('click', function (e) {
      var again = e.target.closest ? e.target.closest('.epx-send-another') : null;
      if (again) { e.preventDefault(); form.innerHTML = original; }
    });
  }

  var forms = document.querySelectorAll('form#contact-form');
  for (var i = 0; i < forms.length; i++) wire(forms[i]);
})();
