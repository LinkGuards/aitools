# Guidora Free Online Tools

Static web app berisi kumpulan tools online gratis untuk AI, security, developer, SEO, social media, dan utility.

## Cara Upload ke GitHub Pages

1. Buat repository baru, contoh: `guidora-tools`.
2. Upload semua file dan folder ini ke repository.
3. Buka `Settings` > `Pages`.
4. Pada `Build and deployment`, pilih `Deploy from a branch`.
5. Pilih branch `main` dan folder `/root`.
6. Simpan.
7. GitHub akan membuat URL seperti:

```text
https://username.github.io/guidora-tools/
```

## Cara Pasang di Blogspot

Buat halaman baru di Blogger, masuk ke mode HTML, lalu tempel iframe berikut:

```html
<iframe
  src="https://username.github.io/guidora-tools/"
  style="width:100%;height:920px;border:0;border-radius:12px;"
  loading="lazy">
</iframe>
```

Ganti `username` dengan username GitHub Anda.

## Backlink Guidora

Footer sudah memuat backlink visible ke:

```text
https://www.guidora.my.id
```

JavaScript juga memastikan elemen backlink tetap tersedia di footer.

## Catatan

- Tools berjalan sebagai static web app.
- Tidak butuh database.
- Tidak butuh backend.
- Tidak butuh API key.
- QR Code dan Barcode memakai layanan gambar publik eksternal.
- Facebook UID checker dibuat versi aman dan manual. Tidak ada scraping dan tidak ada bulk checking.


## Meta Description Siap Pakai

Gunakan teks berikut untuk GitHub Pages, Blogspot Search Description, atau meta description halaman tools:

```text
Kumpulan tools online gratis untuk AI, SEO, security, developer, social media, QR, password, JSON, dan utilitas harian.
```

Panjang: 124 karakter.

## Update UI/UX

- Setiap kategori memakai ikon berbeda.
- Setiap tool memiliki emoji/icon sesuai fungsi.
- Card tools, tombol, filter, dan workspace sudah dibuat responsif.
- Backlink ke `guidora.my.id` tetap tampil di footer dan dicek ulang oleh JavaScript.

## Setting Google AdSense

File setting iklan ada di:

```text
assets/ads-config.js
```

Edit bagian ini:

```js
window.GUIDORA_ADSENSE = {
  enabled: true,
  testMode: false,
  publisherId: "ca-pub-1234567890123456",
  positions: {
    homeTop: { slotId: "1111111111" },
    homeMiddle: { slotId: "2222222222" },
    homeBottom: { slotId: "3333333333" },
    catalogInline: { slotId: "4444444444", afterEvery: 8 },
    toolTop: { slotId: "5555555555" },
    toolMiddle: { slotId: "6666666666" },
    toolBottom: { slotId: "7777777777" }
  }
};
```

Posisi iklan yang sudah tersedia:

| Posisi | Letak |
|---|---|
| homeTop | Setelah hero homepage |
| homeMiddle | Antara kategori dan katalog tools |
| homeBottom | Bawah area tools homepage |
| catalogInline | Di sela katalog tools |
| toolTop | Atas halaman setiap tool |
| toolMiddle | Tengah halaman setiap tool |
| toolBottom | Bawah halaman setiap tool |

Saat `enabled: false`, `testMode: true`, atau `slotId` kosong, halaman akan menampilkan placeholder iklan. Placeholder ini membantu Anda melihat posisi iklan sebelum AdSense aktif.

