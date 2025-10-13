const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    method: 'LOGIN'
  },
  tls: {
    ciphers: 'TLSv1.2',
    servername: process.env.SMTP_HOST
  },
  connectionTimeout: 15_000,
  socketTimeout: 15_000,
  greetingTimeout: 10_000,
  family: 4
});

transporter.verify((error) => {
  if (error) {
    console.error('Email configuration error:', error.message);
  } else {
    console.log('Email server ready');
  }
});

module.exports = transporter;
