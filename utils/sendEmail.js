import nodemailer from 'nodemailer';

let transporter;
let verified = false;

function classifyError(err) {
  if (!err) return { suggestions: [] };
  const s = [];
  if (err.code === 'EAUTH') {
    s.push('Invalid EMAIL_USER or EMAIL_PASS');
    s.push('If Gmail: create 16-char App Password (account > Security)');
  }
  if (err.code === 'ECONNECTION') {
    s.push('Check EMAIL_HOST / EMAIL_PORT reachability');
    s.push('Firewall or network block possible');
  }
  if (/self signed certificate/i.test(err.message || '')) {
    s.push('Provide a valid TLS cert or use a trusted SMTP host');
  }
  if (/ETIMEDOUT/i.test(err.message || '')) {
    s.push('Port/security mismatch (try 587 STARTTLS or 465 secure)');
  }
  return { suggestions: s };
}

function buildTransport() {
  if (transporter) return transporter;
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    logger: process.env.SMTP_DEBUG === 'true',
    debug: process.env.SMTP_DEBUG === 'true'
  });
  return transporter;
}

export async function verifySMTP() {
  const required = ['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS'];
  const missing = required.filter(k => !process.env[k]);
  const empty = required.filter(k => process.env[k] === '');
  if (missing.length || empty.length) {
    return {
      success: false,
      error: 'Missing/empty: ' + [...missing, ...empty].join(', ')
    };
  }
  try {
    await buildTransport().verify();
    verified = true;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
}

function preflight() {
  const required = ['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS'];
  const missing = required.filter(k => !process.env[k]);
  const empty = required.filter(k => process.env[k] === '');
  const host = process.env.EMAIL_HOST || '';
  let gmailHint = null;
  if (/gmail\.com$/i.test(host) && (process.env.EMAIL_PASS || '').length < 16) {
    gmailHint = 'Gmail requires a 16-char App Password (not your login password).';
  }
  return { ok: !missing.length && !empty.length, missing, empty, gmailHint };
}

export async function sendEmail({ to, subject, html, text }) {
  const pf = preflight();
  if (!pf.ok) {
    return {
      success: false,
      error: 'SMTP config incomplete',
      code: 'ENV_MISSING',
      missing: pf.missing,
      empty: pf.empty,
      ...(pf.gmailHint && { gmailHint: pf.gmailHint })
    };
  }
  try {
    const info = await buildTransport().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const { suggestions } = classifyError(err);
    return {
      success: false,
      error: err.message,
      code: err.code,
      suggestions,
      diagnostic: {
        command: err.command,
        response: err.response,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      }
    };
  }
}

export async function sendOTPEmail(to, otp, purpose = 'verification') {
  const subject = `Your OTP for ${purpose}`;
  const html = `<div style="font-family:sans-serif">
    <h3>OTP for ${purpose}</h3>
    <p><strong>${otp}</strong></p>
    <p>Expires in 10 minutes.</p>
  </div>`;
  const text = `OTP for ${purpose}: ${otp} (expires in 10 minutes)`;
  return sendEmail({ to, subject, html, text });
}


