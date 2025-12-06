# Frontend B3Sahabat IoT

Proyek ini adalah dashboard web untuk memantau dan mengelola perangkat IoT. Fokusnya: lihat status perangkat secara realtime, kirim perintah, dan cek log aktivitas lewat antarmuka yang simpel.

## Isi Utama
- **Monitoring**: Status online/offline ditampilkan realtime lewat websocket.
- **Kontrol**: Kirim perintah ke perangkat (ON/OFF) sesuai izin.
- **Log**: Riwayat perintah, status, dan koneksi per perangkat.
- **Manajemen**: Tambah/edit perangkat, kelola grup, dan penugasan perangkat ke grup.

## Prasyarat
- Node.js LTS (disarankan v18+).
- Paket manajer: `npm`, `yarn`, atau `pnpm`.
- Endpoint API backend sudah berjalan dan dapat diakses (lihat `NEXT_PUBLIC_API_URL`).

## Variabel Lingkungan
Buat file `.env.local` dengan nilai berikut:
- `NEXT_PUBLIC_API_URL` — URL backend (contoh: `http://localhost:8000`).

## Cara Menjalankan
1) **Instal dependensi**
```bash
npm install
# atau
yarn
# atau
pnpm install
```

2) **Jalankan mode pengembangan**
```bash
npm run dev
```
Buka `http://localhost:3000` di browser.

3) **Build untuk produksi**
```bash
npm run build
npm run start
```

## Alur Realtime Singkat
- Frontend berlangganan websocket ke backend.
- Backend mendorong event: status perangkat, koneksi (online/offline), dan log.
- UI langsung memperbarui ikon status (🟢/🔴) dan menonaktifkan kontrol saat perangkat offline, kecuali tombol "View Logs".

## Strukur Folder Ringkas
- `app/` — Halaman utama Next.js (App Router).
- `components/` — Komponen UI yang dapat digunakan ulang.
- `lib/` — Helper/API client.
- `public/` — Aset statis.

## Tips Penggunaan
- Pastikan backend aktif sebelum membuka dashboard agar status perangkat terisi.
- Jika status tidak muncul, cek koneksi websocket dan nilai `NEXT_PUBLIC_API_URL`.
- Gunakan tombol "View Logs" untuk melihat riwayat terakhir ketika perangkat offline.

## Lisensi
Internal project — gunakan sesuai izin pemilik repositori.
