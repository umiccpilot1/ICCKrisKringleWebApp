const transporter = require('../config/email');

class EmailService {
  async sendMagicLink(email, name, token) {
  const magicLink = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Login to Kris Kringle Gift Exchange',
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Kris Kringle Login</title>
<style>
  body { font-family: Arial, sans-serif; color: #333; }
  .container { max-width: 560px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px; }
  .cta { display: inline-block; padding: 14px 26px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <h1>Hello ${name || 'there'}!</h1>
    <p>Your secure login link is ready. Click the button below within the next few hours to access the Kris Kringle exchange.</p>
    <a class="cta" href="${magicLink}">Access your dashboard</a>
    <p>If you did not request this link, please ignore this email.</p>
  </div>
</body>
</html>`
    };
    await transporter.sendMail(mailOptions);
  }

  async sendWishlistConfirmation(email, name, confirmationLink) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Confirm your wishlist',
      html: `<p>Hi ${name || 'there'},</p><p>Please confirm your wishlist by clicking <a href="${confirmationLink}">here</a>.</p>`
    };
    await transporter.sendMail(mailOptions);
  }

  async sendAssignmentEmail(giver, recipient) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: giver.email,
      subject: 'Your Kris Kringle Assignment',
      html: `<p>Hi ${giver.name},</p><p>You have been assigned <strong>${recipient.name}</strong> for the gift exchange.</p>`
    };
    await transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
