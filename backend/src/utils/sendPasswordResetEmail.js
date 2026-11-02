const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

const sendPasswordResetEmail = async (email, token) => {
  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Reset your Smart Retail POS password',
      text: `Your Smart Retail POS password reset code is: ${token}\n\nThis code expires in 15 minutes. If you did not request a password reset, you can ignore this email.`,
      html: `<p>Your Smart Retail POS password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:3px">${escapeHtml(token)}</p><p>This code expires in 15 minutes. If you did not request a password reset, you can ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Resend returned HTTP ${response.status}`);
  }
};

export default sendPasswordResetEmail;
