require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Gmail configuration - Ganti dengan App Password Anda
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'zainfahri003@gmail.com',
    pass: 'fozi kwyb grcd nnsd', // App Password Gmail
  },
});

// Email HTML Template
const createEmailHtml = (userName, ticketNumber, status) => {
  const statusLabels = {
    submitted: 'Diterima',
    in_review: 'Sedang Ditelaah',
    in_progress: 'Dalam Proses',
    completed: 'Selesai',
    rejected: 'Ditolak',
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Notifikasi Status Laporan WBS KPPU</h2>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Yth. <strong>${userName}</strong>,</p>
        <p>Status laporan Anda telah diperbarui:</p>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 8px 0;"><strong>Nomor Tiket:</strong> ${ticketNumber}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${statusLabels[status] || status}</span></p>
        </div>
        <p style="margin-top: 16px;">Masuk ke dashboard untuk detail lengkap.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          Sistem Pengaduan Whistleblowing KPPU
        </p>
      </div>
    </div>
  `;
};

app.post('/send-status-email', async (req, res) => {
  try {
    const { to, userName, ticketNumber, status } = req.body;

    if (!to || !ticketNumber || !status) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: to, userName, ticketNumber, status' 
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@kppu.go.id',
      to: to,
      subject: `Notifikasi: Status Laporan ${ticketNumber}`,
      html: createEmailHtml(userName || 'Pengguna', ticketNumber, status),
    });

    console.log('Email sent:', info.messageId);
    res.json({ ok: true, email_sent: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      ok: false, 
      email_sent: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});