/* ===========================================================================
   EPOREX — "Send to WhatsApp" helper
   ---------------------------------------------------------------------------
   Any button/link with [data-epx-whatsapp] builds a pre-filled WhatsApp
   message from the fields of its closest <form> and opens wa.me chat.
   Pure JS, no dependencies. Does not touch the theme's normal AJAX submit.
   =========================================================================== */
(function () {
  var WA_NUMBER = '917358010419'; // EPOREX enquiries (+91 73580 10419)

  function fieldVal(form, name) {
    if (!form) return '';
    var el = form.querySelector('[name="' + name + '"]');
    return el && el.value ? el.value.trim() : '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-epx-whatsapp]') : null;
    if (!btn) return;
    e.preventDefault();

    var form = btn.closest ? btn.closest('form') : null;
    var name    = fieldVal(form, 'name');
    var email   = fieldVal(form, 'email');
    var phone   = fieldVal(form, 'phone');
    var subject = fieldVal(form, 'subject');
    var service = fieldVal(form, 'service');
    var message = fieldVal(form, 'message');

    var lines = ['Hello EPOREX, I would like to enquire.'];
    if (name)    lines.push('Name: ' + name);
    if (email)   lines.push('Email: ' + email);
    if (phone)   lines.push('Phone: ' + phone);
    if (subject) lines.push('Subject: ' + subject);
    if (service) lines.push('Product: ' + service);
    if (message) lines.push('Message: ' + message);

    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(url, '_blank');
  });
})();
