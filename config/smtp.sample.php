<?php
/* ===========================================================================
   EPOREX — SMTP configuration TEMPLATE
   ---------------------------------------------------------------------------
   This sample file IS tracked in git and must NEVER contain real credentials.

   SETUP
   -----
   1. Copy this file to  config/smtp.php   (same folder, drop the ".sample")
          cp config/smtp.sample.php config/smtp.php
   2. Fill in the values in config/smtp.php.
   3. Set 'enabled' => true.

   config/smtp.php is ignored by git and blocked from the web by
   config/.htaccess, so the password never lands in the repo or in a browser.
   If config/smtp.php is missing, the site still works — the enquiry form
   simply falls back to WhatsApp / mail().

   COMMON PROVIDERS
   ----------------
   Hostinger : host smtp.hostinger.com  port 587  encryption tls
   Gmail     : host smtp.gmail.com      port 587  encryption tls
               (requires 2FA + a Google "App Password", not your login password)
   Office365 : host smtp.office365.com  port 587  encryption tls
   SSL option: port 465 with encryption 'ssl'
   =========================================================================== */

return array(

    // Where enquiry e-mails are delivered.
    'to'        => 'info@eporex.in',

    // The mailbox messages are sent FROM. For most providers this must be the
    // same mailbox as 'username' below, otherwise the mail is rejected.
    'from'      => 'website@eporex.in',
    'from_name' => 'EPOREX Website',

    'smtp' => array(
        'enabled'    => false,          // set true once the fields below are filled
        'host'       => 'smtp.hostinger.com',
        'port'       => 587,
        'encryption' => 'tls',          // 'tls' (587), 'ssl' (465), or '' for none
        'username'   => '',             // full mailbox address
        'password'   => '',             // mailbox / app password
    ),
);
