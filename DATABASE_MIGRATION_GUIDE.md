# Database Migration Guide - WBS KPPU

Dokumen ini berisi panduan migrasi database dan aplikasi dari Supabase ke server KPPU sendiri.

---

## ⚠️ PERHATIAN: Supabase Auth Tidak Ikut Pindah

Di Supabase, sistem login/register menggunakan **Supabase Auth (GoTrue)** yang tersimpan di schema `auth.*`. Kalau kamu migrate hanya schema `public`, maka:

- ✅ Data laporan (reports, profiles, history) bisa dipindah
- ❌ Sistem login/register **TIDAK** otomatis ikut

**Pilihan migrasi yang tersedia:**

| Opsi | Deskripsi | Kompleksitas |
|------|-----------|--------------|
| **A** | Self-host Supabase full stack | Tinggi |
| **B** | Postgres + Backend Express + JWT sendiri | Sedang |

Dokumen ini menggunakan **Opsi B** karena lebih enterprise/government friendly.

---

## 📋 Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Arsitektur Baru](#2-arsitektur baru)
3. [Migrasi Database](#3-migrasi-database)
4. [Setup Backend API](#4-setup-backend-api)
5. [Konfigurasi Environment](#5-konfigurasi-environment)
6. [Migrasi Frontend](#6-migrasi-frontend)
7. [Verifikasi](#7-verifikasi)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Persiapan

### A. Requirements Server Baru

```text
OS        : Ubuntu 20.04+ / CentOS 8+
Database  : PostgreSQL 14+
Node.js   : 18.x LTS
RAM       : Minimal 4GB (disarankan 8GB)
Storage   : Minimal 20GB SSD
```

### B. Backup Data dari Supabase

1. **Ambil Connection String** dari Supabase Dashboard:
   ```
   Settings → Database → Connection string
   ```

2. **Export dengan pg_dump**:
   ```bash
   # Install PostgreSQL client
   sudo apt install postgresql-client

   # Export (GANTI dengan connection string asli)
   pg_dump "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
     --schema=public \
     --data-only \
     --no-owner \
     --no-privileges \
     > wbs_kppu_data.sql

   # Export schema saja (untuk buat struktur baru)
   pg_dump "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
     --schema=public \
     --schema-only \
     --no-owner \
     --no-privileges \
     > wbs_kppu_schema.sql
   ```

---

## 2. Arsitektur Baru

### Sebelum (Supabase):
```
Frontend → Supabase Auth + REST API → PostgreSQL + RLS
```

### Sesudah (Server KPPU):
```
Frontend → Express API (JWT) → PostgreSQL (tanpa RLS)
                                    ↓
                            SMTP Server KPPU
```

### Perbedaan Kunci:

| Aspek | Supabase | Server KPPU |
|-------|----------|-------------|
| Auth | Supabase Auth | JWT di Backend |
| Access Control | RLS Policies | Middleware API |
| Email | Resend API | SMTP KPPU |
| Storage | Supabase Storage | MinIO/S3 KPPU |

---

## 3. Migrasi Database

### A. Install PostgreSQL

```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### B. Setup Database

```sql
-- Login sebagai postgres
sudo -u postgres psql

-- Buat database
CREATE DATABASE wbs_kppu;

-- Buat user (opsional - lebih aman)
CREATE USER wbs_admin WITH PASSWORD 'PASSWORD_STRONG';
GRANT ALL PRIVILEGES ON DATABASE wbs_kppu TO wbs_admin;
GRANT ALL ON SCHEMA public TO wbs_admin;

-- Enable extension untuk UUID
\c wbs_kppu
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### C. Import Data

```bash
# Import schema
psql -h localhost -U wbs_admin -d wbs_kppu < wbs_kppu_schema.sql

# Import data
psql -h localhost -U wbs_admin -d wbs_kppu < wbs_kppu_data.sql
```

### D. RLS Tidak Diperlukan Lagi

Di server KPPU, **access control dilakukan oleh Backend API**, bukan RLS. Matikan RLS:

```sql
-- Matikan RLS di semua tabel
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history DISABLE ROW LEVEL SECURITY;
```

---

## 4. Setup Backend API

### A. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Cek versi
node --version  # harus 18.x
npm --version
```

### B. Struktur Backend

Buat folder baru untuk backend:

```bash
sudo mkdir -p /var/www/wbs-backend
cd /var/www/wbs-backend
```

### C. Package.json

```json
{
  "name": "wbs-kppu-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "pg": "^8.11.3",
    "nodemailer": "^6.9.7",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/pg": "^8.10.9",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

### D. File Utama - src/index.ts

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`WBS Backend running on port ${PORT}`);
});
```

### E. Contoh Route - src/routes/admin.ts

```typescript
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { verifyToken, verifyAdmin } from '../middleware/auth';

const router = Router();

// Update report status + insert history + send email
router.patch('/reports/:id/status', verifyToken, verifyAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const adminId = req.body.user?.id;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get old status
    const oldReport = await client.query(
      'SELECT status, user_id FROM reports WHERE id = $1',
      [id]
    );

    if (oldReport.rows.length === 0) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    const oldStatus = oldReport.rows[0].status;
    const userId = oldReport.rows[0].user_id;

    // Update status
    await client.query(
      'UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Insert history
    await client.query(
      `INSERT INTO report_status_history 
       (report_id, old_status, new_status, note, changed_by) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, note, adminId]
    );

    await client.query('COMMIT');

    // Get user email for notification
    const userResult = await client.query(
      'SELECT email, name FROM profiles WHERE user_id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Send email notification (non-blocking)
    if (user?.email) {
      // Panggil fungsi kirim email di background
      // (implementasi lihat di bawah)
    }

    res.json({ success: true, message: 'Status diperbarui' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  } finally {
    client.release();
  }
});

export default router;
```

---

## 5. Konfigurasi Environment

### A. Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wbs_kppu
DB_USER=wbs_admin
DB_PASSWORD=PASSWORD_STRONG_DISINI

# JWT
JWT_SECRET=generate_dengan_openssl_rand_base64_32
JWT_EXPIRES_IN=7d

# Email (SMTP KPPU)
SMTP_HOST=smtp.kppu.go.id
SMTP_PORT=587
SMTP_USER=admin@kppu.go.id
SMTP_PASSWORD=smtp_password

# App URL
APP_URL=https://wbs.kppu.go.id

# Frontend URL (untuk CORS)
FRONTEND_URL=https://wbs.kppu.go.id
```

### B. Generate JWT Secret

```bash
openssl rand -base64 32
```

---

## 6. Migrasi Frontend

### A. Hapus Supabase Client

Frontend **tidak bisa pakai `createClient` Supabase** untuk backend Express. Install axios:

```bash
npm install axios
```

### B. Buat API Service Baru

```typescript
// src/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.wbs.kppu.go.id';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### C. Contoh Penggunaan

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Get reports
const getReports = async () => {
  const response = await api.get('/api/reports');
  return response.data;
};

// Update status (admin only)
const updateStatus = async (reportId: string, status: string, note: string) => {
  const response = await api.patch(`/api/admin/reports/${reportId}/status`, {
    status,
    note,
  });
  return response.data;
};
```

### D. Update Config Files

Hapus atau update file:
- `src/integrations/supabase/client.ts` (bisa dihapus atau rename)
- `src/integrations/supabase/api.ts` (bisa dihapus)

---

## 7. Verifikasi

### Checklist

- [ ] PostgreSQL running dan accessible
- [ ] Backend API running di port 3000
- [ ] User bisa register/login
- [ ] User bisa buat laporan
- [ ] Admin bisa login dan akses dashboard
- [ ] Update status berfungsi
- [ ] Email notifikasi terkirim via SMTP KPPU
- [ ] Riwayat status tersimpan
- [ ] Frontend connect ke API baru

### Test Commands

```bash
# Test API health
curl https://api.wbs.kppu.go.id/api/health

# Test login
curl -X POST https://api.wbs.kppu.go.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@kppu.go.id","password":"test123"}'
```

---

## 8. Troubleshooting

### Error: Connection Refused

```bash
# Cek PostgreSQL
sudo systemctl status postgresql

# Cek port
sudo netstat -tlnp | grep 5432

# Allow remote di pg_hba.conf
host all all 0.0.0.0/0 md5
```

### Error: JWT Invalid

```bash
# Generate new secret
openssl rand -base64 32

# Update .env
JWT_SECRET=secret_baru_disini
```

### Error: Email Tidak Terkirim

```bash
# Test SMTP
telnet smtp.kppu.go.id 25

# Cek logs backend
tail -f /var/log/wbs-backend.log
```

---

## 📎 Lampiran

### A. Struktur Tabel Lengkap

```sql
-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  ticket_number TEXT UNIQUE,
  institution_type TEXT,
  unit_work TEXT,
  reported_name TEXT,
  reported_position TEXT,
  incident_time TIMESTAMP,
  report_description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'submitted',
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- report_status_history
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id),
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  changed_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- user_notifications
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  report_id UUID REFERENCES reports(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Versi**: 1.1  
**Last Updated**: 2026-03-02  
**Author**: Tim Pengembangan WBS KPPU  
**Review**: Compatible dengan Postgres + Express + JWT