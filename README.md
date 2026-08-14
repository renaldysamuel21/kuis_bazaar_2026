# Kuis Bazaar Sekolah Minggu 2026

Aplikasi kuis PWA untuk permainan bazaar Sekolah Minggu. Aplikasi berisi dua permainan:

- Tebak Tokoh Alkitab
- Benar atau Salah

## Aturan permainan

- Setiap ronde berisi tiga soal: satu mudah, satu sedang, dan satu sulit.
- Urutan ketiga soal diacak pada setiap ronde.
- Soal yang sudah dipakai tidak muncul kembali sampai seluruh 20 ronde selesai.
- Progres tersimpan di perangkat, sehingga refresh atau kembali ke menu tidak mengulang soal.
- Jawaban benar 2–3 soal mendapat 10 poin.
- Jawaban benar 0–1 soal mendapat 5 poin.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Build dan preview produksi:

```bash
npm run build
npm start
```

## Pemeriksaan kualitas

```bash
npm run lint
npm test
npm run test:visual
```

`test:visual` menggunakan instalasi Google Chrome lokal untuk menguji enam ukuran smartphone, alur ronde, tampilan benar/salah, hasil 5/10 poin, cache PWA, dan reload offline.

## Memperbarui bank soal

Sumber soal lokal bernama `Soal bazaar - Revisi Pertanyaan.docx`. Berkas tersebut sengaja tidak dimasukkan ke Git. Setelah memperbarui DOCX, jalankan:

```bash
npm run extract:questions
```

Data hasil ekstraksi tersimpan di `src/data/questions.json` dan dibundel ke aplikasi sehingga pergantian soal tidak membutuhkan koneksi internet.
