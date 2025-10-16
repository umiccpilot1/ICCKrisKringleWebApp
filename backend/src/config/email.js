const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Outlook365',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('Email configuration error:', error.message);
  } else {
    console.log('Email server ready');
  }
});

module.exports = transporter;
