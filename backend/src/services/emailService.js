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

  async sendAssignmentEmail(giver, recipient, magicLinkToken) {
    const dashboardLink = `${process.env.FRONTEND_URL}/auth/callback?token=${magicLinkToken}&email=${encodeURIComponent(giver.email)}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: giver.email,
      subject: '🎄 Your INFOSOFT Kris Kringle Assignment 🎅',
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Your Kris Kringle Assignment</title>
<style>
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    color: #1f2937; 
    line-height: 1.6; 
    margin: 0;
    padding: 0;
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: #ffffff;
  }
  .header { 
    background: linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
    color: white; 
    padding: 32px 24px; 
    text-align: center; 
    border-bottom: 4px solid #15803d;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️';
    position: absolute;
    top: 8px;
    left: 0;
    right: 0;
    font-size: 20px;
    opacity: 0.3;
  }
  .header::after {
    content: '❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️';
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    font-size: 20px;
    opacity: 0.3;
  }
  .logo-section {
    background: white;
    padding: 24px;
    text-align: center;
    border-bottom: 3px solid #f3f4f6;
  }
  .logo-section img {
    max-width: 200px;
    height: auto;
  }
  .content { 
    background: white; 
    padding: 32px 24px;
    border-left: 4px solid #DC2626;
    border-right: 4px solid #15803d;
  }
  .assignment-box {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 3px solid #f59e0b;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .recipient-name {
    font-size: 28px;
    font-weight: bold;
    color: #DC2626;
    margin: 12px 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  .cta { 
    display: inline-block; 
    padding: 16px 40px; 
    background: linear-gradient(135deg, #DC2626, #B91C1C);
    color: #fff; 
    border-radius: 50px; 
    text-decoration: none; 
    margin: 24px 0;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    border: 2px solid #15803d;
    transition: all 0.3s ease;
  }
  .cta:hover { 
    background: linear-gradient(135deg, #B91C1C, #991B1B);
    box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
    transform: translateY(-2px);
  }
  .info-box {
    background: #f0fdf4;
    border-left: 4px solid #15803d;
    padding: 16px;
    margin: 20px 0;
    border-radius: 8px;
  }
  .footer { 
    text-align: center; 
    color: #6b7280; 
    font-size: 14px; 
    padding: 24px;
    background: #f9fafb;
    border-top: 3px solid #e5e7eb;
  }
  .emoji-large { 
    font-size: 64px; 
    margin: 16px 0;
    display: block;
  }
  .divider {
    height: 2px;
    background: linear-gradient(to right, #DC2626, #15803d, #DC2626);
    margin: 24px 0;
  }
  .snowflake {
    display: inline-block;
    margin: 0 4px;
    opacity: 0.6;
  }
</style>
</head>
<body>
  <div class="container">
    <!-- Infosoft Logo Section -->
    <div class="logo-section">
      <img src="${process.env.FRONTEND_URL}/images/infosoft-logo.png" alt="Infosoft Consulting Corporation" />
    </div>

    <!-- Header -->
    <div class="header">
      <div class="emoji-large">🎅</div>
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Kris Kringle Gift Exchange</h1>
      <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.95;">Season ${new Date().getFullYear()}</p>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <h2 style="color: #DC2626; font-size: 24px; margin-top: 0;">
        🎄 Ho Ho Ho, ${giver.name}! 🎄
      </h2>
      
      <p style="font-size: 16px; color: #374151;">
        The holiday magic is here! Your Secret Santa assignment is ready, and we're excited to reveal who you'll be spreading joy to this season.
      </p>

      <div class="divider"></div>

      <!-- Assignment Box -->
      <div class="assignment-box">
        <p style="margin: 0; font-size: 18px; color: #78350f; font-weight: 600;">
          🎅🎁 You're playing Secret Santa for:
        </p>
        <div class="recipient-name">${recipient.name}</div>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">
          ⭐ Make their Christmas special! ⭐
        </p>
      </div>

      <div class="divider"></div>

      <!-- Instructions -->
      <div class="info-box">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d; font-size: 16px;">
          🎁 What's Next?
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #166534;">
          <li style="margin-bottom: 8px;">Click the button below to access your dashboard</li>
          <li style="margin-bottom: 8px;">Complete your wishlist so your Secret Santa knows what you'd like</li>
          <li style="margin-bottom: 8px;">Check ${recipient.name}'s wishlist for gift ideas</li>
          <li style="margin-bottom: 8px;">Keep it secret until the big reveal! 🤫</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a class="cta" href="${dashboardLink}">View My Dashboard 🎄</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 24px 0 0 0;">
        <span class="snowflake">❄️</span>
        This magic link is valid for 48 hours and can be used multiple times
        <span class="snowflake">❄️</span>
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        <strong style="color: #DC2626;">🎄 Happy Holidays from INFOSOFT! 🎄</strong>
      </p>
      <p style="margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Infosoft Consulting Corporation
      </p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
        Questions? Contact your Kris Kringle administrator
      </p>
    </div>
  </div>
</body>
</html>`
    };
    await transporter.sendMail(mailOptions);
  }

  async sendWishlistReminder(email, name, token) {
    const reminderLink = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(email)}&reminder=wishlist`;
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reminder: Complete your INFOSOFT Kris Kringle Wishlist!',
      html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Complete Your Wishlist</title>
<style>
  body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
  .container { max-width: 560px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px; }
  .header { background: linear-gradient(135deg, #FF0000, #DC0000); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
  .content { background: white; padding: 24px; border-radius: 8px; margin-bottom: 16px; }
  .cta { display: inline-block; padding: 14px 32px; background: #FF0000; color: #fff; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: bold; }
  .cta:hover { background: #DC0000; }
  .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 16px; }
  .emoji { font-size: 48px; margin-bottom: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🎁</div>
      <h1 style="margin: 0; font-size: 24px;">Kris Kringle Gift Exchange</h1>
    </div>
    
    <div class="content">
      <h2>Hi ${name || 'there'}!</h2>
      <p>We noticed you haven't completed your wishlist for this year's <strong>INFOSOFT Kris Kringle</strong> gift exchange.</p>
      
      <p>Your Secret Santa is waiting to know what to get you! 🎅</p>
      
      <p><strong>Please take a moment to add your gift ideas</strong> so your Secret Santa knows what would make you happy this holiday season.</p>
      
      <div style="text-align: center;">
        <a class="cta" href="${reminderLink}">Confirm Wishlist</a>
      </div>
      
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This link will expire in 4 hours and can only be used once.</p>
    </div>
    
    <div class="footer">
      <p>If you already completed your wishlist, please ignore this reminder.</p>
      <p>© ${new Date().getFullYear()} Infosoft Consulting Corporation</p>
    </div>
  </div>
</body>
</html>`
    };
    await transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
