# WBS KPPU - Whistleblowing System

Sistem Pelaporan Pelanggaran Komisi Pengawas Persaingan Usaha Republik Indonesia.

## Deskripsi

Whistleblowing System (WBS) KPPU adalah sistem pelaporan pelanggaran yang memungkinkan peran aktif pegawai dan pihak eksternal organisasi untuk menyampaikan pengaduan mengenai tindakan pelanggaran dan dugaan pelanggaran yang dilakukan oleh pegawai KPPU.

## Teknologi

Proyek ini dibangun dengan:

- [Vite](https://vitejs.dev/) - Build tool modern
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [React](https://react.dev/) - UI library
- [shadcn/ui](https://ui.shadcn.com/) - Komponen UI
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Backend as a Service

## Cara Menjalankan

1. Clone repositori ini:
```bash
git clone <REPO_URL>
```

2. Install dependencies:
```bash
npm install
```

3. Buat file `.env` berdasarkan `.env` template dan isi dengan konfigurasi yang diperlukan.

4. Jalankan development server:
```bash
npm run dev
```

5. Buka http://localhost:8080 di browser.

## Struktur Proyek

```
src/
├── components/      # Komponen React
│   └── ui/         # Komponen shadcn/ui
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── integrations/   # Konfigurasi Supabase/PostgreSQL
├── lib/            # Utility functions
└── pages/          # Halaman aplikasi
```

## Lisensi

Hak Cipta © 2026 Komisi Pengawas Persaingan Usaha. Hak Cipta Dilindungi.
