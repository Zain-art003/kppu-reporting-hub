# Cara Deploy Email Service ke Render

## Opsi 1: Deploy ke Render (Gratis)

1. Buat akun di https://render.com
2. Hubungkan GitHub repository yang berisi folder `email-service`
3. Buat New Web Service:
   - Root Directory: `email-service`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Tambahkan Environment Variables:
   - SMTP_HOST: smtp.gmail.com
   - SMTP_PORT: 587
   - SMTP_USERNAME: zainfahri003@gmail.com
   - SMTP_PASSWORD: (App Password Gmail Anda)
   - SMTP_FROM_EMAIL: zainfahri003@gmail.com
   - SMTP_FROM_NAME: KPPU WBS System
5. Setelah deploy, copy URL service (misalnya: `https://kppu-email-service.onrender.com`)

## Opsi 2: Deploy ke Railway

1. Buat akun di https://railway.app
2. Buat New Project → Empty Project
3. Add New → GitHub Repo
4. Pilih repository dan folder `email-service`
5. Tambahkan Environment Variables di tab Variables
6. Deploy akan otomatis dimulai

## Opsi 3: Local Development

```bash
cd email-service
cp .env.example .env
# Edit .env dengan App Password Gmail Anda
npm install
npm start
```

## Setelah Deploy

1. Copy URL service (misalnya: `https://your-app.onrender.com`)
2. Tambahkan ke Supabase Secrets:
   - Name: `EMAIL_SERVICE_URL`
   - Value: `https://your-app.onrender.com`
3. Coba ubah status laporan lagi