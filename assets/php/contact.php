<?php
/* ===========================================================================
   EPOREX — contact / enquiry endpoint (Manrox theme)
   ---------------------------------------------------------------------------
   Keeps the theme's AJAX form working (returns {status, msg}) but sends via
   the shared SMTP config in /config/smtp.php. Credentials are NOT stored here.
   =========================================================================== */

header('Content-Type: application/json; charset=utf-8');

/* Theme's contact-form.js expects: { status: 'success' | 'error', msg: '...' } */
function epx_out($ok, $msg)
{
    echo json_encode(array('status' => $ok ? 'success' : 'error', 'msg' => $msg));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    epx_out(false, 'Invalid request method.');
}

/* ---- load SMTP config (../../config/smtp.php) --------------------------- */
$EPX_DEFAULTS = array(
    'to'        => 'enquiry.eporex@gmail.com',
    'from'      => 'enquiry.eporex@gmail.com',
    'from_name' => 'EPOREX Website',
    'smtp'      => array('enabled' => false, 'host' => '', 'port' => 587, 'encryption' => 'tls', 'username' => '', 'password' => ''),
);
$__cfgFile = __DIR__ . '/../../config/smtp.php';
$__cfg     = is_readable($__cfgFile) ? require $__cfgFile : array();
if (!is_array($__cfg)) { $__cfg = array(); }
$EPX_MAIL         = array_merge($EPX_DEFAULTS, $__cfg);
$EPX_MAIL['smtp'] = array_merge($EPX_DEFAULTS['smtp'], (isset($__cfg['smtp']) && is_array($__cfg['smtp'])) ? $__cfg['smtp'] : array());

/* ---- read + sanitise fields (header-injection safe) -------------------- */
function epx_field($key)
{
    $v = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    return trim(str_replace(array("\r", "\n"), ' ', $v));
}
function epx_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }

$name    = epx_field('name');
$email   = epx_field('email');
$phone   = epx_field('phone');       // optional — present on some forms
$subject = epx_field('subject');
$message = trim(isset($_POST['message']) ? (string) $_POST['message'] : '');

/* Honeypot: bots fill the hidden "website" field — pretend success. */
if (epx_field('website') !== '') { epx_out(true, 'Thank you!'); }

if ($name === '' || $email === '' || $message === '') {
    epx_out(false, 'Please fill in your name, email and message.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    epx_out(false, 'Please enter a valid e-mail address.');
}

$mailSubject = 'Website Enquiry' . ($subject !== '' ? ' - ' . $subject : '') . ($name !== '' ? ' from ' . $name : '');

/* ---- HTML email --------------------------------------------------------- */
$rows = '';
$rows .= '<tr><td style="padding:14px 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;">Name</td><td style="padding:14px 0 6px;font-size:15px;color:#222;">' . epx_html($name !== '' ? $name : '-') . '</td></tr>';
$rows .= '<tr><td style="padding:6px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;">Email</td><td style="padding:6px 0;font-size:15px;color:#222;">' . epx_html($email !== '' ? $email : '-') . '</td></tr>';
if ($phone !== '') {
    $rows .= '<tr><td style="padding:6px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;">Phone</td><td style="padding:6px 0;font-size:15px;color:#222;">' . epx_html($phone) . '</td></tr>';
}
$rows .= '<tr><td style="padding:6px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;">Subject</td><td style="padding:6px 0;font-size:15px;color:#222;">' . epx_html($subject !== '' ? $subject : '-') . '</td></tr>';

$htmlBody = '<!doctype html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#222;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f5f7;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.08);max-width:600px;width:100%;">
<tr><td style="background:#232323;color:#fff;padding:28px 32px;"><h1 style="margin:0;font-size:24px;">EPOREX Website Enquiry</h1><p style="margin:10px 0 0;font-size:14px;opacity:.9;">A new enquiry was submitted via your website.</p></td></tr>
<tr><td style="padding:8px 32px 24px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation">' . $rows . '</table>
<div style="margin-top:20px;padding:18px;border-radius:12px;border:1px solid #ececec;background:#fcfcfc;"><p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;">Message</p><div style="font-size:15px;line-height:1.7;color:#222;">' . nl2br(epx_html($message)) . '</div></div></td></tr>
<tr><td style="padding:16px 32px;background:#f8f9fa;font-size:13px;color:#888;">Sent on: ' . epx_html(date('d M Y, h:i A')) . '</td></tr>
</table></td></tr></table></body></html>';

/* ---- minimal SMTP client ------------------------------------------------ */
function epx_smtp_send($cfg, $fromName, $from, $to, $replyTo, $subject, $body, &$error)
{
    $error = '';
    $addr  = (($cfg['encryption'] === 'ssl') ? 'ssl://' : 'tcp://') . $cfg['host'] . ':' . (int) $cfg['port'];
    $fp    = @stream_socket_client($addr, $errno, $errstr, 15);
    if (!$fp) { $error = 'Connection failed: ' . $errstr; return false; }
    stream_set_timeout($fp, 15);
    $read = function () use ($fp) { $d = ''; while (($l = fgets($fp, 515)) !== false) { $d .= $l; if (strlen($l) < 4 || $l[3] !== '-') break; } return $d; };
    $cmd = function ($c, $ok) use ($fp, $read, &$error) { if ($c !== null) fwrite($fp, $c . "\r\n"); $r = $read(); if (!in_array((int) substr($r, 0, 3), (array) $ok, true)) { $error = 'SMTP error (' . trim($r) . ')'; return false; } return true; };
    $host = isset($_SERVER['SERVER_NAME']) && $_SERVER['SERVER_NAME'] !== '' ? $_SERVER['SERVER_NAME'] : 'localhost';
    if (!$cmd(null, 220)) { fclose($fp); return false; }
    if (!$cmd('EHLO ' . $host, 250)) { fclose($fp); return false; }
    if ($cfg['encryption'] === 'tls') {
        if (!$cmd('STARTTLS', 220)) { fclose($fp); return false; }
        $crypto = STREAM_CRYPTO_METHOD_TLS_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) { $crypto |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT; }
        if (!@stream_socket_enable_crypto($fp, true, $crypto)) { $error = 'TLS negotiation failed.'; fclose($fp); return false; }
        if (!$cmd('EHLO ' . $host, 250)) { fclose($fp); return false; }
    }
    if ($cfg['username'] !== '') {
        if (!$cmd('AUTH LOGIN', 334)) { fclose($fp); return false; }
        if (!$cmd(base64_encode($cfg['username']), 334)) { fclose($fp); return false; }
        if (!$cmd(base64_encode($cfg['password']), 235)) { fclose($fp); return false; }
    }
    if (!$cmd('MAIL FROM:<' . $from . '>', 250)) { fclose($fp); return false; }
    if (!$cmd('RCPT TO:<' . $to . '>', array(250, 251))) { fclose($fp); return false; }
    if (!$cmd('DATA', 354)) { fclose($fp); return false; }
    $headers = 'From: =?UTF-8?B?' . base64_encode($fromName) . "?= <$from>\r\n"
             . ($replyTo !== '' ? "Reply-To: <$replyTo>\r\n" : '')
             . "To: <$to>\r\n"
             . 'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n"
             . 'Date: ' . date('r') . "\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
    if (!$cmd($headers . "\r\n" . preg_replace('/^\./m', '..', $body) . "\r\n.", 250)) { fclose($fp); return false; }
    fwrite($fp, "QUIT\r\n"); fclose($fp);
    return true;
}

/* ---- dispatch ----------------------------------------------------------- */
$FAIL = 'Sorry, we could not send your enquiry due to a technical issue. Please contact us on WhatsApp and we will respond right away.';
$smtp = $EPX_MAIL['smtp'];

if (!empty($smtp['enabled']) && $smtp['host'] !== '' && $smtp['username'] !== '' && $smtp['password'] !== '') {
    $err = '';
    if (epx_smtp_send($smtp, $EPX_MAIL['from_name'], $EPX_MAIL['from'], $EPX_MAIL['to'], $email, $mailSubject, $htmlBody, $err)) {
        epx_out(true, 'Thank you! Your enquiry has been sent. We will get back to you shortly.');
    }
    error_log('EPOREX enquiry: SMTP send failed - ' . $err);
}

/* Fallback: PHP mail() */
$hdr = 'From: ' . $EPX_MAIL['from_name'] . ' <' . $EPX_MAIL['from'] . ">\r\n" . ($email !== '' ? 'Reply-To: <' . $email . ">\r\n" : '') . "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n";
if (@mail($EPX_MAIL['to'], $mailSubject, $htmlBody, $hdr)) {
    epx_out(true, 'Thank you! Your enquiry has been sent. We will get back to you shortly.');
}
error_log('EPOREX enquiry: mail() failed and SMTP disabled/invalid - check config/smtp.php');
epx_out(false, $FAIL);
