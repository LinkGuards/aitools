/*
  Guidora Tools AdSense Settings
  Edit file ini setelah akun AdSense Anda siap.

  Cara pakai:
  1. Ganti publisherId dengan ID AdSense Anda, contoh: ca-pub-1234567890123456
  2. Isi slotId untuk setiap posisi iklan.
  3. Ubah enabled menjadi true.
  4. Ubah testMode menjadi false jika ingin menampilkan iklan asli.

  Saat enabled masih false atau slotId kosong, halaman akan menampilkan placeholder iklan.
*/
window.GUIDORA_ADSENSE = {
  enabled: true,
  testMode: false,
  publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
  showPlaceholderWhenEmpty: true,
  loadAdsenseScript: true,
  positions: {
    homeTop: {
      label: "Homepage Top Ad",
      slotId: "",
      format: "auto",
      responsive: true
    },
    homeMiddle: {
      label: "Homepage Middle Ad",
      slotId: "",
      format: "auto",
      responsive: true
    },
    homeBottom: {
      label: "Homepage Bottom Ad",
      slotId: "",
      format: "auto",
      responsive: true
    },
    catalogInline: {
      label: "Catalog Inline Ad",
      slotId: "",
      format: "auto",
      responsive: true,
      afterEvery: 8
    },
    toolTop: {
      label: "Tool Top Ad",
      slotId: "",
      format: "auto",
      responsive: true
    },
    toolMiddle: {
      label: "Tool Middle Ad",
      slotId: "",
      format: "auto",
      responsive: true
    },
    toolBottom: {
      label: "Tool Bottom Ad",
      slotId: "",
      format: "auto",
      responsive: true
    }
  }
};
