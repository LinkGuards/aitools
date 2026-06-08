(function () {
  "use strict";

  const APP = {
    activeCategory: "All",
    lastOutput: "",
    categories: ["All", "AI Tools", "Security", "Developer", "SEO", "Social Media", "Utility"]
  };

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function words(value) {
    const text = clean(value).replace(/[^\p{L}\p{N}\s-]/gu, " ");
    return text ? text.split(/\s+/).filter(Boolean) : [];
  }

  function unique(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function titleCase(value) {
    return clean(value).toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function toHashtag(value) {
    const item = titleCase(value).replace(/[^a-zA-Z0-9]/g, "");
    return item ? "#" + item : "";
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function setOutput(html, text) {
    const output = $("toolOutput");
    APP.lastOutput = text ?? html.replace(/<[^>]+>/g, "");
    output.innerHTML = html;
  }

  function copyToClipboard(text) {
    if (!text) {
      alert("Belum ada hasil untuk disalin.");
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert("Hasil berhasil disalin."));
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
    alert("Hasil berhasil disalin.");
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const commonFields = {
    topic: { id: "topic", label: "Topik atau keyword", type: "textarea", placeholder: "Contoh: bisnis online untuk pemula, tips menabung, skincare kulit berminyak" },
    keyword: { id: "keyword", label: "Keyword utama", type: "text", placeholder: "Contoh: digital marketing" },
    brand: { id: "brand", label: "Brand atau nama", type: "text", placeholder: "Opsional. Contoh: Guidora" },
    tone: { id: "tone", label: "Tone", type: "select", options: ["Profesional", "Santai", "Persuasif", "Formal", "Friendly"] },
    lang: { id: "lang", label: "Bahasa", type: "select", options: ["Indonesia", "English"] },
    count: { id: "count", label: "Jumlah", type: "number", value: "5", min: "1", max: "30" },
    text: { id: "text", label: "Teks", type: "textarea", placeholder: "Masukkan teks di sini" },
    url: { id: "url", label: "URL", type: "text", placeholder: "https://www.guidora.my.id" }
  };

  function field(id, label, type, placeholder, extra) {
    return Object.assign({ id, label, type, placeholder: placeholder || "" }, extra || {});
  }

  function textTool(id, title, category, desc, fields, run, note) {
    return { id, title, category, desc, fields, run, note: note || "Tools berjalan di browser. Tidak ada data yang dikirim ke server Guidora." };
  }

  function aiIntro(values, type) {
    const topic = clean(values.topic || values.keyword || values.brand || "konten digital");
    const tone = values.tone || "Profesional";
    const lang = values.lang || "Indonesia";
    const brand = clean(values.brand || "");
    const brandLine = brand ? ` untuk ${brand}` : "";
    if (lang === "English") return `${type} for ${topic}${brandLine}. Tone: ${tone}.`;
    return `${type} untuk ${topic}${brandLine}. Tone: ${tone}.`;
  }

  function makeAiList(values, type, templates) {
    const count = clamp(parseInt(values.count || 5, 10), 1, 30);
    const topic = clean(values.topic || values.keyword || "konten digital");
    const brand = clean(values.brand || "");
    const lang = values.lang || "Indonesia";
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const tpl = templates[i % templates.length];
      out.push(`${i + 1}. ${tpl(topic, brand, lang)}`);
    }
    return `${aiIntro(values, type)}\n\n${out.join("\n")}`;
  }

  const tools = [
    textTool("ai-blog-title", "AI Blog Title Generator", "AI Tools", "Buat ide judul blog dari topik dan keyword.", [commonFields.topic, commonFields.brand, commonFields.tone, commonFields.lang, commonFields.count], (v) => makeAiList(v, "Judul blog", [
      (t) => `Cara ${titleCase(t)} yang Mudah Dipahami Pemula`,
      (t) => `${titleCase(t)}: Panduan Lengkap dan Praktis`,
      (t) => `Kesalahan Umum dalam ${titleCase(t)} dan Cara Menghindarinya`,
      (t) => `Strategi ${titleCase(t)} untuk Hasil Lebih Efektif`,
      (t) => `Apa Itu ${titleCase(t)}? Ini Penjelasan Lengkapnya`
    ])),
    textTool("ai-meta-description", "AI Meta Description Generator", "AI Tools", "Buat meta description maksimal 150 karakter.", [commonFields.topic, commonFields.brand, commonFields.tone, commonFields.lang], (v) => {
      const topic = clean(v.topic || "konten digital");
      const brand = clean(v.brand || "Guidora");
      let meta = `Pelajari ${topic} secara praktis bersama ${brand}. Panduan ringkas, jelas, dan mudah diterapkan.`;
      if (v.lang === "English") meta = `Learn ${topic} with ${brand}. A clear, practical, and easy guide for better digital results.`;
      return meta.slice(0, 150);
    }),
    textTool("ai-product-description", "AI Product Description Generator", "AI Tools", "Buat deskripsi produk untuk toko online dan marketplace.", [field("product", "Nama produk", "text", "Contoh: Tas laptop waterproof"), field("benefit", "Keunggulan produk", "textarea", "Contoh: kuat, ringan, anti air, banyak slot"), commonFields.tone, commonFields.lang], (v) => {
      const product = clean(v.product || "Produk");
      const benefit = clean(v.benefit || "berkualitas, praktis, dan mudah digunakan");
      if (v.lang === "English") return `${product} is designed for users who need a practical and reliable solution. Key benefits include ${benefit}. Suitable for daily use, work, and personal needs.`;
      return `${product} adalah pilihan tepat untuk Anda yang membutuhkan produk praktis dan berkualitas. Produk ini memiliki keunggulan ${benefit}. Cocok untuk kebutuhan harian, kerja, dan aktivitas personal.`;
    }),
    textTool("ai-caption", "AI Caption Generator", "AI Tools", "Buat caption untuk Instagram, TikTok, Facebook, dan LinkedIn.", [commonFields.topic, commonFields.brand, commonFields.tone, commonFields.lang, commonFields.count], (v) => makeAiList(v, "Caption", [
      (t) => `Mulai dari hal kecil. ${titleCase(t)} bisa jadi langkah besar kalau dilakukan konsisten.`,
      (t) => `${titleCase(t)} bukan cuma tren. Ini cara baru untuk bekerja lebih cerdas.`,
      (t) => `Simpan dulu. Tips tentang ${t} ini bisa kamu pakai kapan saja.`,
      (t) => `Mau hasil lebih rapi? Mulai pahami ${t} dari dasarnya.`,
      (t) => `Jangan tunggu sempurna. Mulai belajar ${t} hari ini.`
    ])),
    textTool("ai-hashtag", "AI Hashtag Generator", "AI Tools", "Buat hashtag otomatis dari topik konten.", [commonFields.topic, commonFields.brand, commonFields.count], (v) => {
      const count = clamp(parseInt(v.count || 15, 10), 1, 30);
      const list = unique(words(`${v.topic} ${v.brand}`).map(toHashtag).concat(["#KontenDigital", "#TipsOnline", "#Guidora", "#CreatorTools", "#Produktivitas", "#DigitalMarketing", "#BelajarOnline", "#ToolsGratis", "#InfoBermanfaat", "#OnlineTools"]));
      return list.slice(0, count).join(" ");
    }),
    textTool("ai-email-reply", "AI Email Reply Generator", "AI Tools", "Buat balasan email formal dan profesional.", [field("email", "Isi email yang diterima", "textarea", "Tempel email yang ingin dibalas"), field("purpose", "Tujuan balasan", "text", "Contoh: menyetujui, menolak dengan sopan, follow up"), commonFields.tone, commonFields.lang], (v) => {
      const purpose = clean(v.purpose || "memberikan tanggapan");
      if (v.lang === "English") return `Subject: Re: Your Email\n\nHello,\n\nThank you for your message. I am writing to ${purpose}. I appreciate the information you shared and will follow up as needed.\n\nBest regards,`;
      return `Subjek: Re: Email Anda\n\nYth. Bapak/Ibu,\n\nTerima kasih atas pesan yang telah disampaikan. Melalui email ini, saya ingin ${purpose}. Informasi yang diberikan sudah saya terima dengan baik dan akan saya tindak lanjuti sesuai kebutuhan.\n\nHormat saya,`;
    }),
    textTool("ai-faq", "AI FAQ Generator", "AI Tools", "Buat pertanyaan dan jawaban umum untuk artikel atau produk.", [commonFields.topic, commonFields.lang, commonFields.count], (v) => {
      const count = clamp(parseInt(v.count || 5, 10), 1, 20);
      const topic = clean(v.topic || "topik ini");
      const q = [];
      for (let i = 1; i <= count; i += 1) q.push(`${i}. Apa itu ${topic}?\nJawaban: ${titleCase(topic)} adalah topik yang perlu dipahami dari fungsi, manfaat, dan cara penggunaannya.\n`);
      return q.join("\n");
    }),
    textTool("ai-blog-outline", "AI Blog Outline Generator", "AI Tools", "Buat kerangka artikel blog SEO friendly.", [commonFields.topic, commonFields.lang], (v) => {
      const t = clean(v.topic || "topik blog");
      return `H1: ${titleCase(t)}\n\nH2: Pengertian ${titleCase(t)}\nH2: Manfaat Utama\nH2: Cara Menggunakan atau Menerapkan\nH2: Kesalahan yang Sering Terjadi\nH2: Tips Praktis\nH2: Kesimpulan\n\nFAQ:\n1. Apa itu ${t}?\n2. Mengapa ${t} penting?\n3. Bagaimana cara memulai ${t}?`;
    }),
    textTool("ai-youtube-title", "AI YouTube Title Generator", "AI Tools", "Buat ide judul video YouTube dari keyword.", [commonFields.topic, commonFields.count], (v) => makeAiList(v, "Judul YouTube", [
      (t) => `${titleCase(t)} untuk Pemula: Mulai dari Nol`,
      (t) => `Jangan Salah! Ini Cara ${titleCase(t)} yang Benar`,
      (t) => `7 Tips ${titleCase(t)} yang Wajib Kamu Coba`,
      (t) => `${titleCase(t)} Dijelaskan dalam 10 Menit`,
      (t) => `Rahasia ${titleCase(t)} yang Jarang Dibahas`
    ])),
    textTool("ai-instagram-bio", "AI Instagram Bio Generator", "AI Tools", "Buat bio Instagram untuk personal, creator, dan bisnis.", [commonFields.brand, field("niche", "Niche", "text", "Contoh: edukasi finance, coffee shop, skincare"), commonFields.lang], (v) => {
      const name = clean(v.brand || "Nama Anda");
      const niche = clean(v.niche || "konten digital");
      return `${name}\n${titleCase(niche)}\nTips praktis setiap minggu\nKolaborasi atau kerja sama: DM\n👇 Cek info terbaru`;
    }),

    textTool("text-encrypt-decrypt", "Text Encrypt & Decrypt Tool", "Security", "Enkripsi dan dekripsi teks sederhana memakai kunci.", [commonFields.text, field("key", "Kunci rahasia", "text", "Masukkan password atau kata kunci"), field("mode", "Mode", "select", "", { options: ["Encrypt", "Decrypt"] })], (v) => simpleCipher(v)),
    textTool("aes-text-encrypt-decrypt", "AES Text Encrypt & Decrypt Tool", "Security", "Enkripsi teks memakai AES-GCM dan password.", [commonFields.text, field("password", "Password", "text", "Password enkripsi"), field("mode", "Mode", "select", "", { options: ["Encrypt", "Decrypt"] })], (v) => aesCipher(v), "AES-GCM memakai Web Crypto API. Simpan password dengan aman."),
    textTool("base64-encoder-decoder", "Base64 Encoder & Decoder", "Security", "Encode dan decode teks Base64.", [commonFields.text, field("mode", "Mode", "select", "", { options: ["Encode", "Decode"] })], (v) => v.mode === "Decode" ? decodeBase64(v.text) : encodeBase64(v.text)),
    textTool("md5-hash-generator", "MD5 Hash Generator", "Security", "Buat hash MD5 dari teks.", [commonFields.text], (v) => md5(v.text || ""), "MD5 cocok untuk kebutuhan legacy, bukan untuk keamanan password modern."),
    textTool("sha256-hash-generator", "SHA256 Hash Generator", "Security", "Buat hash SHA256 dari teks.", [commonFields.text], async (v) => sha256(v.text || "")),
    textTool("password-generator", "Password Generator", "Security", "Buat password kuat otomatis.", [field("length", "Panjang password", "number", "", { value: "16", min: "6", max: "64" }), field("include", "Karakter", "select", "", { options: ["Semua karakter", "Huruf dan angka", "Angka saja", "Mudah dibaca"] })], (v) => generatePassword(v)),
    textTool("password-strength-checker", "Password Strength Checker", "Security", "Cek kekuatan password.", [field("password", "Password", "text", "Masukkan password")], (v) => passwordStrength(v.password), "Pemeriksaan dilakukan di browser dan tidak mengirim password ke server."),
    textTool("random-token-generator", "Random Token Generator", "Security", "Buat token acak untuk API, form, dan testing.", [field("length", "Panjang token", "number", "", { value: "32", min: "8", max: "128" })], (v) => randomToken(v.length)),
    textTool("secure-note-generator", "Secure Note Generator", "Security", "Buat catatan terenkripsi lokal memakai password.", [commonFields.text, field("password", "Password", "text", "Password enkripsi")], async (v) => aesCipher({ text: v.text, password: v.password, mode: "Encrypt" }), "Hasil berupa teks terenkripsi. Untuk membuka kembali, gunakan AES Text Encrypt & Decrypt Tool."),
    textTool("jwt-decoder", "JWT Decoder", "Security", "Decode header dan payload JWT tanpa server.", [field("jwt", "JWT Token", "textarea", "Tempel JWT token")], (v) => jwtDecode(v.jwt)),

    textTool("json-formatter-validator", "JSON Formatter & Validator", "Developer", "Format dan validasi JSON.", [field("json", "JSON", "textarea", "Tempel JSON")], (v) => jsonFormat(v.json)),
    textTool("html-minifier", "HTML Minifier", "Developer", "Minify kode HTML sederhana.", [field("html", "Kode HTML", "textarea", "Tempel HTML")], (v) => simpleMinify(v.html, "html")),
    textTool("css-minifier", "CSS Minifier", "Developer", "Minify kode CSS sederhana.", [field("css", "Kode CSS", "textarea", "Tempel CSS")], (v) => simpleMinify(v.css, "css")),
    textTool("javascript-minifier", "JavaScript Minifier", "Developer", "Minify kode JavaScript sederhana.", [field("js", "Kode JavaScript", "textarea", "Tempel JavaScript")], (v) => simpleMinify(v.js, "js")),
    textTool("url-encoder-decoder", "URL Encoder & Decoder", "Developer", "Encode dan decode URL.", [commonFields.text, field("mode", "Mode", "select", "", { options: ["Encode", "Decode"] })], (v) => v.mode === "Decode" ? decodeURIComponentSafe(v.text) : encodeURIComponent(v.text || "")),
    textTool("html-entity-encoder-decoder", "HTML Entity Encoder & Decoder", "Developer", "Encode dan decode entity HTML.", [commonFields.text, field("mode", "Mode", "select", "", { options: ["Encode", "Decode"] })], (v) => v.mode === "Decode" ? decodeHtmlEntities(v.text) : esc(v.text)),
    textTool("uuid-generator", "UUID Generator", "Developer", "Buat UUID v4.", [field("count", "Jumlah UUID", "number", "", { value: "5", min: "1", max: "100" })], (v) => Array.from({ length: clamp(parseInt(v.count || 5, 10), 1, 100) }, () => crypto.randomUUID()).join("\n")),
    textTool("timestamp-converter", "Timestamp Converter", "Developer", "Konversi Unix timestamp ke tanggal dan sebaliknya.", [field("timestamp", "Timestamp atau tanggal", "text", "Contoh: 1717228800 atau 2026-06-08 10:00")], (v) => timestampConvert(v.timestamp)),
    textTool("regex-tester", "Regex Tester", "Developer", "Tes pola regex pada teks.", [field("pattern", "Regex pattern", "text", "Contoh: \\b\\w+@\\w+\\.\\w+\\b"), field("flags", "Flags", "text", "gi"), commonFields.text], (v) => regexTest(v)),
    textTool("lorem-ipsum-generator", "Lorem Ipsum Generator", "Developer", "Buat dummy text untuk desain dan testing.", [field("paragraphs", "Jumlah paragraf", "number", "", { value: "3", min: "1", max: "20" })], (v) => lorem(v.paragraphs)),

    textTool("meta-tag-generator", "Meta Tag Generator", "SEO", "Buat meta tag dasar untuk website.", [field("title", "Meta title", "text", "Judul halaman"), field("description", "Meta description", "textarea", "Deskripsi halaman"), commonFields.url], (v) => metaTags(v)),
    textTool("robots-txt-generator", "Robots.txt Generator", "SEO", "Buat robots.txt untuk website atau Blogger.", [commonFields.url, field("allow", "Izinkan semua crawler?", "select", "", { options: ["Ya", "Tidak"] })], (v) => robotsTxt(v)),
    textTool("sitemap-url-generator", "Sitemap URL Generator", "SEO", "Buat daftar URL sitemap Blogger.", [commonFields.url], (v) => sitemapUrls(v.url)),
    textTool("slug-generator", "Slug Generator", "SEO", "Buat slug SEO friendly.", [commonFields.text], (v) => slugify(v.text)),
    textTool("keyword-density-checker", "Keyword Density Checker", "SEO", "Cek density keyword dalam teks.", [commonFields.keyword, commonFields.text], (v) => keywordDensity(v)),
    textTool("title-length-checker", "Title Length Checker", "SEO", "Cek panjang judul SEO.", [field("title", "Judul", "text", "Masukkan judul")], (v) => lengthCheck(v.title, 50, 60, "judul SEO")),
    textTool("meta-description-length-checker", "Meta Description Length Checker", "SEO", "Cek panjang meta description.", [field("description", "Meta description", "textarea", "Masukkan meta description")], (v) => lengthCheck(v.description, 120, 150, "meta description")),
    textTool("open-graph-preview", "Open Graph Preview Tool", "SEO", "Simulasi preview saat link dibagikan.", [field("title", "Judul", "text", "Judul share"), field("description", "Deskripsi", "textarea", "Deskripsi share"), field("image", "URL gambar", "text", "https://...jpg"), commonFields.url], (v) => ogPreview(v)),
    textTool("schema-markup-generator", "Schema Markup Generator", "SEO", "Buat schema Article atau FAQ sederhana.", [field("type", "Tipe schema", "select", "", { options: ["Article", "FAQPage"] }), field("title", "Judul", "text", "Judul konten"), field("description", "Deskripsi", "textarea", "Deskripsi singkat"), commonFields.url], (v) => schemaMarkup(v)),
    textTool("utm-link-builder", "UTM Link Builder", "SEO", "Buat URL campaign UTM.", [commonFields.url, field("source", "utm_source", "text", "facebook"), field("medium", "utm_medium", "text", "social"), field("campaign", "utm_campaign", "text", "promo_juni")], (v) => utmBuilder(v)),

    textTool("facebook-uid-live-checker", "Facebook UID Live or Die Checker", "Social Media", "Buat link cek profil Facebook dari UID secara manual.", [field("uid", "Facebook UID", "text", "Contoh: 100000000000000"), field("status", "Status manual", "select", "", { options: ["Unknown", "Live", "Die or Not Found", "Private or Checkpoint"] })], (v) => facebookUidCheck(v), "Versi aman. Tool ini tidak melakukan scraping atau bulk checking."),
    textTool("facebook-uid-to-profile-link", "Facebook UID to Profile Link Generator", "Social Media", "Ubah UID Facebook menjadi link profil.", [field("uid", "Facebook UID", "text", "Contoh: 100000000000000")], (v) => facebookUidLink(v.uid)),
    textTool("facebook-profile-url-cleaner", "Facebook Profile URL Cleaner", "Social Media", "Bersihkan link profil Facebook dari parameter panjang.", [commonFields.url], (v) => cleanUrl(v.url)),
    textTool("facebook-share-link-generator", "Facebook Share Link Generator", "Social Media", "Buat link share Facebook dari URL.", [commonFields.url], (v) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(v.url || "")}`),
    textTool("facebook-caption-formatter", "Facebook Caption Formatter", "Social Media", "Rapikan caption Facebook dengan paragraf dan CTA.", [commonFields.text, field("cta", "CTA", "text", "Contoh: Tulis pendapatmu di komentar")], (v) => `${clean(v.text)}\n\n${clean(v.cta || "Bagikan jika bermanfaat.")}`),
    textTool("instagram-bio-generator", "Instagram Bio Generator", "Social Media", "Buat bio Instagram personal atau bisnis.", [commonFields.brand, field("niche", "Niche", "text", "Contoh: finance, food, travel"), field("cta", "CTA", "text", "Contoh: DM for collab")], (v) => `${clean(v.brand || "Nama Brand")}\n${titleCase(v.niche || "Digital Creator")}\nTips, ide, dan insight harian\n${clean(v.cta || "DM for collab")}`),
    textTool("instagram-username-generator", "Instagram Username Generator", "Social Media", "Buat ide username Instagram.", [commonFields.brand, field("niche", "Niche", "text", "Contoh: finance")], (v) => usernameIdeas(v.brand, v.niche, "ig")),
    textTool("instagram-character-counter", "Instagram Character Counter", "Social Media", "Hitung karakter caption dan bio Instagram.", [commonFields.text], (v) => characterCounter(v.text, { caption: 2200, bio: 150 })),
    textTool("instagram-engagement-rate-calculator", "Instagram Engagement Rate Calculator", "Social Media", "Hitung engagement rate Instagram.", [field("likes", "Total likes", "number", "", { value: "100" }), field("comments", "Total komentar", "number", "", { value: "10" }), field("followers", "Follower", "number", "", { value: "1000" })], (v) => engagementRate(v)),
    textTool("tiktok-bio-generator", "TikTok Bio Generator", "Social Media", "Buat bio TikTok singkat.", [commonFields.brand, field("niche", "Niche", "text", "Contoh: tips bisnis")], (v) => `${clean(v.brand || "Creator")}\n${titleCase(v.niche || "Daily Content")}\nFollow untuk tips baru setiap hari`),
    textTool("tiktok-username-generator", "TikTok Username Generator", "Social Media", "Buat ide username TikTok.", [commonFields.brand, field("niche", "Niche", "text", "Contoh: beauty")], (v) => usernameIdeas(v.brand, v.niche, "tt")),
    textTool("tiktok-caption-counter", "TikTok Caption Counter", "Social Media", "Hitung panjang caption TikTok.", [commonFields.text], (v) => characterCounter(v.text, { caption: 2200 })),
    textTool("youtube-tag-generator", "YouTube Tag Generator", "Social Media", "Buat tag YouTube dari keyword.", [commonFields.topic, commonFields.count], (v) => youtubeTags(v)),
    textTool("youtube-channel-description", "YouTube Channel Description Generator", "Social Media", "Buat deskripsi channel YouTube.", [commonFields.brand, field("niche", "Niche channel", "text", "Contoh: tutorial teknologi")], (v) => `Selamat datang di ${clean(v.brand || "channel ini")}. Channel ini membahas ${clean(v.niche || "topik digital")} dengan penjelasan yang mudah dipahami, praktis, dan relevan untuk kebutuhan harian. Subscribe untuk konten terbaru setiap minggu.`),
    textTool("content-calendar-generator", "Content Calendar Generator", "Social Media", "Buat kalender konten 7 atau 30 hari.", [commonFields.topic, field("days", "Jumlah hari", "select", "", { options: ["7", "14", "30"] })], (v) => contentCalendar(v)),

    textTool("qr-code-generator", "QR Code Generator", "Utility", "Buat QR Code dari teks atau link.", [commonFields.text], (v) => qrCode(v.text), "QR dibuat memakai layanan gambar publik tanpa API key."),
    textTool("barcode-generator", "Barcode Generator", "Utility", "Buat barcode Code128 sederhana dari teks.", [commonFields.text], (v) => barcode(v.text), "Barcode dibuat memakai layanan gambar publik tanpa API key."),
    textTool("word-counter", "Word Counter", "Utility", "Hitung kata, karakter, kalimat, dan paragraf.", [commonFields.text], (v) => wordCounter(v.text)),
    textTool("character-counter", "Character Counter", "Utility", "Hitung jumlah karakter teks.", [commonFields.text], (v) => characterCounter(v.text, {})),
    textTool("text-case-converter", "Text Case Converter", "Utility", "Ubah uppercase, lowercase, title case, dan sentence case.", [commonFields.text, field("mode", "Mode", "select", "", { options: ["UPPERCASE", "lowercase", "Title Case", "Sentence case"] })], (v) => caseConvert(v)),
    textTool("remove-duplicate-lines", "Remove Duplicate Lines", "Utility", "Hapus baris duplikat dari daftar teks.", [commonFields.text], (v) => unique(String(v.text || "").split(/\r?\n/).map((x) => x.trim())).join("\n")),
    textTool("sort-text-lines", "Sort Text Lines", "Utility", "Urutkan baris teks A-Z atau Z-A.", [commonFields.text, field("order", "Urutan", "select", "", { options: ["A-Z", "Z-A"] })], (v) => sortLines(v)),
    textTool("random-number-generator", "Random Number Generator", "Utility", "Buat angka acak dari rentang tertentu.", [field("min", "Nilai minimum", "number", "", { value: "1" }), field("max", "Nilai maksimum", "number", "", { value: "100" }), field("count", "Jumlah", "number", "", { value: "5", min: "1", max: "100" })], (v) => randomNumbers(v)),
    textTool("age-calculator", "Age Calculator", "Utility", "Hitung umur dari tanggal lahir.", [field("birth", "Tanggal lahir", "date", "")], (v) => ageCalculator(v.birth)),
    textTool("bmi-calculator", "BMI Calculator", "Utility", "Hitung Body Mass Index.", [field("weight", "Berat badan kg", "number", "", { value: "60" }), field("height", "Tinggi badan cm", "number", "", { value: "165" })], (v) => bmi(v)),
    textTool("unit-converter", "Unit Converter", "Utility", "Konversi satuan panjang dan berat.", [field("value", "Nilai", "number", "", { value: "1" }), field("unit", "Satuan asal", "select", "", { options: ["meter", "kilometer", "centimeter", "gram", "kilogram", "pound"] })], (v) => unitConvert(v)),
    textTool("color-converter", "Color Converter HEX RGB HSL", "Utility", "Konversi warna HEX ke RGB dan HSL.", [field("color", "HEX Color", "text", "Contoh: #743fde")], (v) => colorConvert(v.color)),
    textTool("css-gradient-generator", "CSS Gradient Generator", "Utility", "Buat kode CSS gradient.", [field("color1", "Warna 1", "text", "#743fde"), field("color2", "Warna 2", "text", "#3423d1"), field("angle", "Angle", "number", "", { value: "140" })], (v) => gradient(v)),
    textTool("online-notepad", "Online Notepad", "Utility", "Catatan lokal yang tersimpan di browser.", [field("note", "Catatan", "textarea", "Tulis catatan di sini")], (v) => saveNotepad(v.note), "Catatan disimpan di localStorage browser pengguna."),
    textTool("text-to-slug-converter", "Text to Slug Converter", "Utility", "Ubah teks menjadi slug URL SEO friendly.", [commonFields.text], (v) => slugify(v.text))
  ];



  const categoryMeta = {
    "All": { icon: "🧰", title: "All Tools", desc: "Semua tools gratis dalam satu katalog." },
    "AI Tools": { icon: "✨", title: "AI Tools", desc: "Generator konten, caption, FAQ, dan ide digital." },
    "Security": { icon: "🔐", title: "Security", desc: "Password, hash, encoder, token, dan enkripsi teks." },
    "Developer": { icon: "💻", title: "Developer", desc: "JSON, minifier, URL encoder, UUID, regex, dan timestamp." },
    "SEO": { icon: "📈", title: "SEO", desc: "Meta tag, robots.txt, schema, slug, keyword, dan UTM." },
    "Social Media": { icon: "📱", title: "Social Media", desc: "Facebook, Instagram, TikTok, YouTube, dan kalender konten." },
    "Utility": { icon: "⚙️", title: "Utility", desc: "QR, barcode, counter, konversi warna, BMI, umur, dan notepad." }
  };

  const toolIcons = {
    "ai-blog-title": "📝",
    "ai-meta-description": "🏷️",
    "ai-product-description": "🛒",
    "ai-caption": "💬",
    "ai-hashtag": "#️⃣",
    "ai-email-reply": "📧",
    "ai-faq": "❓",
    "ai-blog-outline": "📑",
    "ai-youtube-title": "▶️",
    "ai-instagram-bio": "📸",
    "text-encrypt-decrypt": "🔏",
    "aes-text-encrypt-decrypt": "🛡️",
    "base64-encoder-decoder": "🧬",
    "md5-hash-generator": "🔢",
    "sha256-hash-generator": "🔐",
    "password-generator": "🔑",
    "password-strength-checker": "🧪",
    "random-token-generator": "🎲",
    "secure-note-generator": "🗒️",
    "jwt-decoder": "🎫",
    "json-formatter-validator": "🧩",
    "html-minifier": "📄",
    "css-minifier": "🎨",
    "javascript-minifier": "⚡",
    "url-encoder-decoder": "🔗",
    "html-entity-encoder-decoder": "🔣",
    "uuid-generator": "🆔",
    "timestamp-converter": "⏱️",
    "regex-tester": "🔎",
    "lorem-ipsum-generator": "📜",
    "meta-tag-generator": "🏷️",
    "robots-txt-generator": "🤖",
    "sitemap-url-generator": "🗺️",
    "slug-generator": "🔤",
    "keyword-density-checker": "📊",
    "title-length-checker": "📏",
    "meta-description-length-checker": "✂️",
    "open-graph-preview": "🖼️",
    "schema-markup-generator": "🧾",
    "utm-link-builder": "🎯",
    "facebook-uid-live-checker": "👤",
    "facebook-uid-to-profile-link": "🔵",
    "facebook-profile-url-cleaner": "🧹",
    "facebook-share-link-generator": "📤",
    "facebook-caption-formatter": "🧾",
    "instagram-bio-generator": "📷",
    "instagram-username-generator": "🔠",
    "instagram-character-counter": "🔢",
    "instagram-engagement-rate-calculator": "❤️",
    "tiktok-bio-generator": "🎵",
    "tiktok-username-generator": "🎶",
    "tiktok-caption-counter": "💬",
    "youtube-tag-generator": "🏷️",
    "youtube-channel-description": "📺",
    "content-calendar-generator": "🗓️",
    "qr-code-generator": "▦",
    "barcode-generator": "||||",
    "word-counter": "🔡",
    "character-counter": "🔠",
    "text-case-converter": "Aa",
    "remove-duplicate-lines": "🧼",
    "sort-text-lines": "↕️",
    "random-number-generator": "🎲",
    "age-calculator": "🎂",
    "bmi-calculator": "⚖️",
    "unit-converter": "📐",
    "color-converter": "🎨",
    "css-gradient-generator": "🌈",
    "online-notepad": "📝",
    "text-to-slug-converter": "🔤"
  };

  function getCategoryMeta(category) {
    return categoryMeta[category] || { icon: "🧰", title: category, desc: "Tools gratis siap pakai." };
  }

  function getToolIcon(tool) {
    return toolIcons[tool.id] || getCategoryMeta(tool.category).icon;
  }


  const ADS_DEFAULTS = {
    enabled: false,
    testMode: true,
    publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
    showPlaceholderWhenEmpty: true,
    loadAdsenseScript: true,
    positions: {
      homeTop: { label: "Homepage Top Ad", slotId: "", format: "auto", responsive: true },
      homeMiddle: { label: "Homepage Middle Ad", slotId: "", format: "auto", responsive: true },
      homeBottom: { label: "Homepage Bottom Ad", slotId: "", format: "auto", responsive: true },
      catalogInline: { label: "Catalog Inline Ad", slotId: "", format: "auto", responsive: true, afterEvery: 8 },
      toolTop: { label: "Tool Top Ad", slotId: "", format: "auto", responsive: true },
      toolMiddle: { label: "Tool Middle Ad", slotId: "", format: "auto", responsive: true },
      toolBottom: { label: "Tool Bottom Ad", slotId: "", format: "auto", responsive: true }
    }
  };

  function mergeAdsConfig() {
    const user = window.GUIDORA_ADSENSE || {};
    const config = Object.assign({}, ADS_DEFAULTS, user);
    config.positions = Object.assign({}, ADS_DEFAULTS.positions, user.positions || {});
    Object.keys(config.positions).forEach((key) => {
      config.positions[key] = Object.assign({}, ADS_DEFAULTS.positions[key] || {}, (user.positions || {})[key] || {});
    });
    return config;
  }

  function isRealAdReady(config, position) {
    return Boolean(config.enabled && !config.testMode && config.publisherId && config.publisherId.indexOf("ca-pub-") === 0 && position && position.slotId);
  }

  function adPlaceholder(key, position) {
    const label = position.label || key;
    return `<div class="guidora-ad-box is-placeholder" data-ad-placeholder="${esc(key)}">
      <div class="guidora-ad-inner">
        <span>📢</span>
        <strong>${esc(label)}</strong>
        <small>Isi publisherId dan slotId di <code>assets/ads-config.js</code> untuk menampilkan Google AdSense.</small>
      </div>
    </div>`;
  }

  function createAdBox(key, className) {
    const config = mergeAdsConfig();
    const position = config.positions[key] || {};
    const classes = `guidora-ad-box ${className || ""}`.trim();

    if (!isRealAdReady(config, position)) {
      return config.showPlaceholderWhenEmpty ? adPlaceholder(key, position) : "";
    }

    const responsive = position.responsive === false ? "false" : "true";
    const format = position.format || "auto";
    return `<div class="${esc(classes)}" data-ad-position="${esc(key)}">
      <span class="guidora-ad-label">Advertisement</span>
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${esc(config.publisherId)}"
        data-ad-slot="${esc(position.slotId)}"
        data-ad-format="${esc(format)}"
        data-full-width-responsive="${esc(responsive)}"></ins>
    </div>`;
  }

  function loadAdsenseScript(config) {
    if (!config.loadAdsenseScript || !config.publisherId || config.publisherId.indexOf("ca-pub-") !== 0) return;
    if (document.querySelector("script[data-guidora-adsense]")) return;
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.guidoraAdsense = "true";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.publisherId)}`;
    document.head.appendChild(script);
  }

  function refreshAds(scope) {
    const config = mergeAdsConfig();
    if (!config.enabled || config.testMode) return;
    loadAdsenseScript(config);
    const root = scope || document;
    root.querySelectorAll("ins.adsbygoogle:not([data-guidora-rendered])").forEach((ad) => {
      ad.dataset.guidoraRendered = "true";
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn("Guidora AdSense render skipped:", err);
      }
    });
  }

  function renderStaticAdSlots() {
    document.querySelectorAll("[data-guidora-ad]").forEach((slot) => {
      const key = slot.getAttribute("data-guidora-ad");
      slot.innerHTML = createAdBox(key, `guidora-ad-home guidora-ad-${key}`);
    });
    refreshAds(document);
  }

  function renderField(f) {
    const value = f.value ? ` value="${esc(f.value)}"` : "";
    const min = f.min ? ` min="${esc(f.min)}"` : "";
    const max = f.max ? ` max="${esc(f.max)}"` : "";
    const placeholder = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
    const help = f.help ? `<span class="help">${esc(f.help)}</span>` : "";
    if (f.type === "textarea") {
      return `<div class="field full"><label class="field-label" for="input-${f.id}">${esc(f.label)}</label><textarea class="textarea" id="input-${f.id}"${placeholder}>${esc(f.value || "")}</textarea>${help}</div>`;
    }
    if (f.type === "select") {
      const options = (f.options || []).map((opt) => `<option value="${esc(opt)}">${esc(opt)}</option>`).join("");
      return `<div class="field"><label class="field-label" for="input-${f.id}">${esc(f.label)}</label><select class="select" id="input-${f.id}">${options}</select>${help}</div>`;
    }
    return `<div class="field"><label class="field-label" for="input-${f.id}">${esc(f.label)}</label><input class="input" id="input-${f.id}" type="${esc(f.type)}"${placeholder}${value}${min}${max}>${help}</div>`;
  }

  function getValues(fields) {
    const values = {};
    fields.forEach((f) => {
      const el = $(`input-${f.id}`);
      values[f.id] = el ? el.value : "";
    });
    return values;
  }

  function renderCategoryCards() {
    const box = $("categoryCards");
    const cats = APP.categories.filter((cat) => cat !== "All");
    box.innerHTML = cats.map((cat) => {
      const count = tools.filter((tool) => tool.category === cat).length;
      const meta = getCategoryMeta(cat);
      return `<button class="category-card" type="button" data-category-open="${esc(cat)}">
        <span class="category-icon" aria-hidden="true">${esc(meta.icon)}</span>
        <strong>${esc(meta.title)}</strong>
        <small>${count} tools</small>
        <span>${esc(meta.desc)}</span>
      </button>`;
    }).join("");
  }

  function renderPills() {
    const box = $("filterPills");
    box.innerHTML = APP.categories.map((cat) => {
      const meta = getCategoryMeta(cat);
      return `<button class="pill ${cat === APP.activeCategory ? "active" : ""}" type="button" data-category="${esc(cat)}"><span aria-hidden="true">${esc(meta.icon)}</span>${esc(meta.title)}</button>`;
    }).join("");
  }


  function renderCatalog() {
    const search = clean($("toolSearch")?.value || "").toLowerCase();
    const list = tools.filter((tool) => {
      const matchCat = APP.activeCategory === "All" || tool.category === APP.activeCategory;
      const matchSearch = !search || `${tool.title} ${tool.desc} ${tool.category}`.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });

    if (!list.length) {
      $("toolCatalog").innerHTML = `<div class="note-box">Tidak ada tools yang cocok dengan pencarian.</div>`;
      $("statTools").textContent = tools.length;
      return;
    }

    const config = mergeAdsConfig();
    const inlineEvery = clamp(parseInt(config.positions.catalogInline?.afterEvery || 8, 10), 3, 24);
    const cards = [];
    list.forEach((tool, index) => {
      const meta = getCategoryMeta(tool.category);
      cards.push(`
      <article class="tool-card">
        <div class="tool-card-top">
          <span class="tool-icon" aria-hidden="true">${esc(getToolIcon(tool))}</span>
          <span class="tag"><span aria-hidden="true">${esc(meta.icon)}</span>${esc(meta.title)}</span>
        </div>
        <h3>${esc(tool.title)}</h3>
        <p>${esc(tool.desc)}</p>
        <button class="btn btn-primary" type="button" data-open-tool="${esc(tool.id)}"> <span aria-hidden="true">🚀</span> Open Tool</button>
      </article>`);

      if ((index + 1) % inlineEvery === 0 && index + 1 < list.length) {
        cards.push(`<div class="guidora-ad-catalog">${createAdBox("catalogInline", "guidora-ad-catalog-box")}</div>`);
      }
    });

    $("toolCatalog").innerHTML = cards.join("");
    $("statTools").textContent = tools.length;
    refreshAds($("toolCatalog"));
  }

  function openTool(id) {
    const tool = tools.find((item) => item.id === id) || tools[0];
    location.hash = tool.id;
    APP.lastOutput = "";
    $("catalogControls").classList.add("hidden");
    $("toolCatalog").classList.add("hidden");
    $("backToCatalog").classList.remove("hidden");
    const workspace = $("toolWorkspace");
    workspace.classList.remove("hidden");
    const meta = getCategoryMeta(tool.category);
    workspace.innerHTML = `
      <div class="tool-head">
        <div class="tool-head-icon" aria-hidden="true">${esc(getToolIcon(tool))}</div>
        <span class="tag"><span aria-hidden="true">${esc(meta.icon)}</span>${esc(meta.title)}</span>
        <h2>${esc(tool.title)}</h2>
        <p>${esc(tool.desc)}</p>
      </div>
      ${createAdBox("toolTop", "guidora-ad-tool guidora-ad-tool-top")}
      <div class="tool-body">
        <div class="form-grid">${tool.fields.map(renderField).join("")}</div>
        <div class="actions">
          <button id="runTool" class="btn btn-primary" type="button">Generate</button>
          <button id="copyTool" class="btn btn-soft" type="button">Copy Result</button>
          <button id="downloadTool" class="btn btn-soft" type="button">Download TXT</button>
          <button id="resetTool" class="btn btn-danger" type="button">Reset</button>
        </div>
        ${createAdBox("toolMiddle", "guidora-ad-tool guidora-ad-tool-middle")}
        <div id="toolOutput" class="output-box">Hasil akan muncul di sini.</div>
        <div class="note-box">${esc(tool.note || "Tools berjalan secara lokal di browser.")}</div>
        ${createAdBox("toolBottom", "guidora-ad-tool guidora-ad-tool-bottom")}
      </div>
    `;
    $("runTool").addEventListener("click", async () => {
      try {
        const result = await tool.run(getValues(tool.fields));
        if (typeof result === "object" && result.html) setOutput(result.html, result.text || "");
        else setOutput(esc(result || ""), String(result || ""));
      } catch (err) {
        setOutput(`<span class="bad">Error:</span> ${esc(err.message || err)}`, "");
      }
    });
    $("copyTool").addEventListener("click", () => copyToClipboard(APP.lastOutput));
    $("downloadTool").addEventListener("click", () => downloadText(`${tool.id}.txt`, APP.lastOutput || ""));
    $("resetTool").addEventListener("click", () => openTool(tool.id));
    refreshAds(workspace);
    window.scrollTo({ top: $("tools").offsetTop - 80, behavior: "smooth" });
  }

  function showCatalog() {
    location.hash = "tools";
    $("catalogControls").classList.remove("hidden");
    $("toolCatalog").classList.remove("hidden");
    $("toolWorkspace").classList.add("hidden");
    $("backToCatalog").classList.add("hidden");
    renderCatalog();
  }

  function bindUI() {
    $("toolSearch").addEventListener("input", renderCatalog);
    $("backToCatalog").addEventListener("click", showCatalog);
    document.addEventListener("click", (e) => {
      const open = e.target.closest("[data-open-tool]");
      if (open) openTool(open.dataset.openTool);
      const cat = e.target.closest("[data-category]");
      if (cat) {
        APP.activeCategory = cat.dataset.category;
        renderPills();
        renderCatalog();
      }
      const catOpen = e.target.closest("[data-category-open]");
      if (catOpen) {
        APP.activeCategory = catOpen.dataset.categoryOpen;
        renderPills();
        renderCatalog();
        location.hash = "tools";
      }
    });
  }

  function setMeta(name, content, attr) {
    const key = attr || "name";
    let el = document.querySelector(`meta[${key}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(key, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function ensureSeoMeta() {
    const description = "Kumpulan tools online gratis untuk AI, SEO, security, developer, social media, QR, password, JSON, dan utilitas harian.";
    document.title = "Guidora Free Online Tools | AI, SEO, Security, Developer & Social Media Tools";
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("og:title", "Guidora Free Online Tools", "property");
    setMeta("og:description", description, "property");
    setMeta("twitter:title", "Guidora Free Online Tools");
    setMeta("twitter:description", description);
  }

  function ensureBacklink() {
    const holder = $("guidoraCreditBox") || document.body;
    let link = $("guidoraBacklink");
    if (!link) {
      const p = document.createElement("p");
      p.className = "credit";
      p.innerHTML = `Desain dan tools by <a id="guidoraBacklink" href="https://www.guidora.my.id" target="_blank" rel="noopener dofollow">guidora.my.id</a>`;
      holder.appendChild(p);
      link = $("guidoraBacklink");
    }
    link.href = "https://www.guidora.my.id";
    link.rel = "noopener dofollow";
    link.target = "_blank";
    link.textContent = "guidora.my.id";
  }

  function encodeBase64(text) {
    return btoa(unescape(encodeURIComponent(text || "")));
  }

  function decodeBase64(text) {
    try { return decodeURIComponent(escape(atob(text || ""))); }
    catch (e) { throw new Error("Base64 tidak valid."); }
  }

  function decodeURIComponentSafe(text) {
    try { return decodeURIComponent(text || ""); }
    catch (e) { throw new Error("URL encoding tidak valid."); }
  }

  function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text || "";
    return textarea.value;
  }

  function simpleCipher(v) {
    const text = v.text || "";
    const key = v.key || "guidora";
    let result = "";
    if (v.mode === "Decrypt") {
      const raw = decodeBase64(text);
      for (let i = 0; i < raw.length; i += 1) result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      return result;
    }
    for (let i = 0; i < text.length; i += 1) result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return encodeBase64(result);
  }

  async function aesCipher(v) {
    if (!v.password) throw new Error("Password wajib diisi.");
    if (v.mode === "Decrypt") return aesDecrypt(v.text, v.password);
    return aesEncrypt(v.text || "", v.password);
  }

  async function getAesKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }

  async function aesEncrypt(text, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getAesKey(password, salt);
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    return encodeBase64(JSON.stringify({ salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(cipher)) }));
  }

  async function aesDecrypt(payload, password) {
    try {
      const parsed = JSON.parse(decodeBase64(payload));
      const salt = new Uint8Array(parsed.salt);
      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);
      const key = await getAesKey(password, salt);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      return new TextDecoder().decode(plain);
    } catch (e) {
      throw new Error("Gagal dekripsi. Periksa password atau teks terenkripsi.");
    }
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function md5(input) {
    function cmn(q, a, b, x, s, t) { return add32(rotl(add32(add32(a, q), add32(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function rotl(n, c) { return (n << c) | (n >>> (32 - c)); }
    function add32(a, b) { return (a + b) & 0xffffffff; }
    function md5cycle(x, k) {
      let [a, b, c, d] = x;
      a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function md5blk(s) { const out = []; for (let i = 0; i < 64; i += 4) out[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24); return out; }
    function md51(s) { let n = s.length; const state = [1732584193, -271733879, -1732584194, 271733878]; let i; for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i))); s = s.substring(i - 64); const tail = new Array(16).fill(0); for (i = 0; i < s.length; i += 1) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3); tail[i >> 2] |= 0x80 << ((i % 4) << 3); if (i > 55) { md5cycle(state, tail); tail.fill(0); } tail[14] = n * 8; md5cycle(state, tail); return state; }
    function rhex(n) { let s = ""; for (let j = 0; j < 4; j += 1) s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16); return s; }
    return md51(unescape(encodeURIComponent(input))).map(rhex).join("");
  }

  function generatePassword(v) {
    const length = clamp(parseInt(v.length || 16, 10), 6, 64);
    const sets = {
      "Semua karakter": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.?",
      "Huruf dan angka": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      "Angka saja": "0123456789",
      "Mudah dibaca": "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
    };
    const chars = sets[v.include] || sets["Semua karakter"];
    let out = "";
    const random = new Uint32Array(length);
    crypto.getRandomValues(random);
    for (let i = 0; i < length; i += 1) out += chars[random[i] % chars.length];
    return out;
  }

  function passwordStrength(password) {
    let score = 0;
    if (!password) return "Masukkan password terlebih dahulu.";
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    const label = score >= 80 ? "Strong" : score >= 55 ? "Medium" : "Weak";
    const cls = score >= 80 ? "good" : score >= 55 ? "warn" : "bad";
    return { html: `<div class="progress"><span style="width:${score}%"></span></div><p>Score: <strong>${score}/100</strong></p><p>Status: <span class="${cls}">${label}</span></p>`, text: `Score: ${score}/100\nStatus: ${label}` };
  }

  function randomToken(length) {
    const chars = "abcdef0123456789";
    const n = clamp(parseInt(length || 32, 10), 8, 128);
    let out = "";
    const random = new Uint8Array(n);
    crypto.getRandomValues(random);
    for (let i = 0; i < n; i += 1) out += chars[random[i] % chars.length];
    return out;
  }

  function jwtDecode(token) {
    try {
      const parts = String(token || "").split(".");
      if (parts.length < 2) throw new Error("Token tidak lengkap.");
      const decode = (part) => JSON.stringify(JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))), null, 2);
      return `Header:\n${decode(parts[0])}\n\nPayload:\n${decode(parts[1])}`;
    } catch (e) {
      throw new Error("JWT tidak valid atau bukan JSON.");
    }
  }

  function jsonFormat(text) {
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch (e) { throw new Error("JSON tidak valid: " + e.message); }
  }

  function simpleMinify(text, type) {
    let out = String(text || "");
    if (type !== "html") out = out.replace(/\/\*[\s\S]*?\*\//g, "");
    if (type === "js") out = out.replace(/(^|[^:])\/\/.*$/gm, "$1");
    out = out.replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").trim();
    return out;
  }

  function timestampConvert(value) {
    const raw = clean(value);
    if (/^\d+$/.test(raw)) {
      const num = parseInt(raw, 10);
      const date = new Date(raw.length === 10 ? num * 1000 : num);
      return `Local: ${date.toString()}\nISO: ${date.toISOString()}`;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new Error("Tanggal atau timestamp tidak valid.");
    return `Unix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}\nISO: ${date.toISOString()}`;
  }

  function regexTest(v) {
    const pattern = v.pattern || "";
    const flags = v.flags || "g";
    const text = v.text || "";
    const re = new RegExp(pattern, flags);
    const matches = Array.from(text.matchAll(re)).map((m) => m[0]);
    return matches.length ? `Ditemukan ${matches.length} match:\n${matches.join("\n")}` : "Tidak ada match.";
  }

  function lorem(paragraphs) {
    const base = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae neque vitae sem dignissim consequat. Donec facilisis, purus non elementum cursus, massa justo luctus lorem, vitae volutpat risus augue sed nisi.";
    const n = clamp(parseInt(paragraphs || 3, 10), 1, 20);
    return Array.from({ length: n }, () => base).join("\n\n");
  }

  function metaTags(v) {
    const title = esc(v.title || "Judul Halaman");
    const desc = esc(v.description || "Deskripsi halaman.");
    const url = esc(v.url || "https://www.guidora.my.id");
    return `<title>${title}</title>\n<meta name="description" content="${desc}">\n<link rel="canonical" href="${url}">\n<meta property="og:title" content="${title}">\n<meta property="og:description" content="${desc}">\n<meta property="og:url" content="${url}">`;
  }

  function robotsTxt(v) {
    const base = clean(v.url || "https://www.guidora.my.id").replace(/\/$/, "");
    const disallow = v.allow === "Tidak" ? "/" : "";
    return `User-agent: *\nDisallow: ${disallow}\n\nSitemap: ${base}/sitemap.xml`;
  }

  function sitemapUrls(url) {
    const base = clean(url || "https://www.guidora.my.id").replace(/\/$/, "");
    return `${base}/sitemap.xml\n${base}/sitemap-pages.xml\n${base}/feeds/posts/default?orderby=updated`;
  }

  function keywordDensity(v) {
    const keyword = clean(v.keyword).toLowerCase();
    const text = clean(v.text).toLowerCase();
    if (!keyword || !text) return "Keyword dan teks wajib diisi.";
    const totalWords = words(text).length;
    const count = (text.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    const density = totalWords ? ((count / totalWords) * 100).toFixed(2) : "0.00";
    return `Total kata: ${totalWords}\nKeyword muncul: ${count}\nDensity: ${density}%`;
  }

  function lengthCheck(text, min, max, label) {
    const len = String(text || "").length;
    let status = `<span class="warn">Perlu disesuaikan</span>`;
    if (len >= min && len <= max) status = `<span class="good">Ideal</span>`;
    if (len > max) status = `<span class="bad">Terlalu panjang</span>`;
    return { html: `<p>Panjang ${esc(label)}: <strong>${len}</strong> karakter.</p><p>Status: ${status}</p><p>Rekomendasi: ${min}-${max} karakter.</p>`, text: `Panjang ${label}: ${len} karakter. Rekomendasi: ${min}-${max}.` };
  }

  function ogPreview(v) {
    const html = `<div style="max-width:520px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--bg)">${v.image ? `<img src="${esc(v.image)}" alt="Preview" style="width:100%;max-width:100%;display:block;margin:0;padding:0;border-radius:0">` : ""}<div style="padding:14px"><strong>${esc(v.title || "Judul Preview")}</strong><p class="small">${esc(v.description || "Deskripsi preview akan tampil di sini.")}</p><span class="small">${esc(v.url || "https://www.guidora.my.id")}</span></div></div>`;
    return { html, text: `${v.title}\n${v.description}\n${v.url}` };
  }

  function schemaMarkup(v) {
    const url = v.url || "https://www.guidora.my.id";
    if (v.type === "FAQPage") {
      return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: v.title || "Pertanyaan utama", acceptedAnswer: { "@type": "Answer", text: v.description || "Jawaban singkat." } }] }, null, 2);
    }
    return JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: v.title || "Judul Artikel", description: v.description || "Deskripsi artikel", mainEntityOfPage: url }, null, 2);
  }

  function utmBuilder(v) {
    const url = new URL(v.url || "https://www.guidora.my.id");
    url.searchParams.set("utm_source", v.source || "source");
    url.searchParams.set("utm_medium", v.medium || "medium");
    url.searchParams.set("utm_campaign", v.campaign || "campaign");
    return url.toString();
  }

  function facebookUidLink(uid) {
    const cleanUid = clean(uid).replace(/[^0-9]/g, "");
    if (!cleanUid) return "Masukkan UID angka terlebih dahulu.";
    return `https://www.facebook.com/profile.php?id=${cleanUid}`;
  }

  function facebookUidCheck(v) {
    const link = facebookUidLink(v.uid);
    const status = esc(v.status || "Unknown");
    return { html: `<p>Profile Link:</p><p><a href="${esc(link)}" target="_blank" rel="noopener nofollow">${esc(link)}</a></p><p>Status manual: <strong>${status}</strong></p><p class="small">Buka link untuk mengecek profil secara manual. Tool ini tidak melakukan scraping.</p>`, text: `Profile Link: ${link}\nStatus manual: ${v.status}` };
  }

  function cleanUrl(input) {
    try { const url = new URL(input); url.search = ""; url.hash = ""; return url.toString(); }
    catch (e) { throw new Error("URL tidak valid."); }
  }

  function usernameIdeas(brand, niche, prefix) {
    const base = slugify(brand || "guidora").replace(/-/g, "");
    const ni = slugify(niche || "digital").replace(/-/g, "");
    return unique([base, `${base}.${ni}`, `${base}_${ni}`, `${prefix}.${base}`, `${base}official`, `${base}daily`, `${base}id`, `${base}.studio`, `${theYear()}${base}`, `${base}hq`]).join("\n");
  }

  function characterCounter(text, limits) {
    const chars = String(text || "").length;
    const noSpace = String(text || "").replace(/\s/g, "").length;
    let out = `Karakter: ${chars}\nKarakter tanpa spasi: ${noSpace}\nKata: ${words(text).length}`;
    Object.keys(limits || {}).forEach((key) => {
      out += `\nSisa ${key}: ${limits[key] - chars}`;
    });
    return out;
  }

  function engagementRate(v) {
    const likes = Number(v.likes || 0);
    const comments = Number(v.comments || 0);
    const followers = Number(v.followers || 0);
    if (!followers) return "Follower tidak boleh 0.";
    const rate = (((likes + comments) / followers) * 100).toFixed(2);
    return `Engagement Rate: ${rate}%\nFormula: (likes + comments) / followers x 100`;
  }

  function youtubeTags(v) {
    const list = unique(words(v.topic).concat(["tutorial", "tips", "review", "guide", "indonesia", "pemula", "cara", "belajar"]));
    return list.slice(0, clamp(parseInt(v.count || 10, 10), 1, 30)).join(", ");
  }

  function contentCalendar(v) {
    const days = parseInt(v.days || 7, 10);
    const topic = clean(v.topic || "konten digital");
    const formats = ["Tips", "Tutorial", "Checklist", "Mistake", "Behind the scenes", "FAQ", "Case study"];
    const rows = [];
    for (let i = 1; i <= days; i += 1) rows.push(`Hari ${i}: ${formats[(i - 1) % formats.length]} tentang ${topic}`);
    return rows.join("\n");
  }

  function qrCode(text) {
    const data = encodeURIComponent(text || "https://www.guidora.my.id");
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${data}`;
    return { html: `<p>QR Code:</p><img src="${src}" alt="QR Code"><p><a href="${src}" target="_blank" rel="noopener nofollow">Buka gambar QR</a></p>`, text: src };
  }

  function barcode(text) {
    const data = encodeURIComponent(text || "guidora.my.id");
    const src = `https://barcode.tec-it.com/barcode.ashx?data=${data}&code=Code128&translate-esc=on`;
    return { html: `<p>Barcode:</p><img src="${src}" alt="Barcode"><p><a href="${src}" target="_blank" rel="noopener nofollow">Buka gambar barcode</a></p>`, text: src };
  }

  function wordCounter(text) {
    const value = String(text || "");
    const w = words(value).length;
    const chars = value.length;
    const sentences = value.split(/[.!?]+/).filter((x) => clean(x)).length;
    const paragraphs = value.split(/\n+/).filter((x) => clean(x)).length;
    return `Kata: ${w}\nKarakter: ${chars}\nKalimat: ${sentences}\nParagraf: ${paragraphs}`;
  }

  function caseConvert(v) {
    const text = v.text || "";
    if (v.mode === "UPPERCASE") return text.toUpperCase();
    if (v.mode === "lowercase") return text.toLowerCase();
    if (v.mode === "Title Case") return titleCase(text);
    return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase());
  }

  function sortLines(v) {
    const lines = String(v.text || "").split(/\r?\n/).filter(Boolean).sort((a, b) => a.localeCompare(b));
    if (v.order === "Z-A") lines.reverse();
    return lines.join("\n");
  }

  function randomNumbers(v) {
    const min = Number(v.min || 1);
    const max = Number(v.max || 100);
    const count = clamp(parseInt(v.count || 5, 10), 1, 100);
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(Math.floor(Math.random() * (max - min + 1)) + min);
    return out.join("\n");
  }

  function ageCalculator(date) {
    if (!date) return "Pilih tanggal lahir terlebih dahulu.";
    const birth = new Date(date);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return `Umur: ${years} tahun, ${months} bulan, ${days} hari`;
  }

  function bmi(v) {
    const weight = Number(v.weight || 0);
    const height = Number(v.height || 0) / 100;
    if (!weight || !height) return "Berat dan tinggi wajib diisi.";
    const score = weight / (height * height);
    let status = "Normal";
    if (score < 18.5) status = "Underweight";
    else if (score >= 25 && score < 30) status = "Overweight";
    else if (score >= 30) status = "Obesity";
    return `BMI: ${score.toFixed(2)}\nStatus: ${status}`;
  }

  function unitConvert(v) {
    const value = Number(v.value || 0);
    const unit = v.unit;
    const map = {
      meter: { meter: value, kilometer: value / 1000, centimeter: value * 100 },
      kilometer: { meter: value * 1000, kilometer: value, centimeter: value * 100000 },
      centimeter: { meter: value / 100, kilometer: value / 100000, centimeter: value },
      gram: { gram: value, kilogram: value / 1000, pound: value / 453.59237 },
      kilogram: { gram: value * 1000, kilogram: value, pound: value * 2.2046226218 },
      pound: { gram: value * 453.59237, kilogram: value / 2.2046226218, pound: value }
    };
    const result = map[unit] || {};
    return Object.keys(result).map((k) => `${k}: ${result[k].toFixed(4)}`).join("\n");
  }

  function colorConvert(color) {
    let hex = clean(color || "#743fde").replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
    if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error("HEX color tidak valid.");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      h /= 6;
    }
    return `HEX: #${hex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  function gradient(v) {
    const css = `background: linear-gradient(${v.angle || 140}deg, ${v.color1 || "#743fde"}, ${v.color2 || "#3423d1"});`;
    return { html: `<div style="height:120px;border-radius:14px;${css}"></div><pre>${esc(css)}</pre>`, text: css };
  }

  function saveNotepad(note) {
    localStorage.setItem("guidora_notepad", note || "");
    return `Catatan tersimpan di browser.\n\n${note || ""}`;
  }

  function theYear() { return new Date().getFullYear(); }

  function boot() {
    $("yearNow").textContent = theYear();
    ensureSeoMeta();
    ensureBacklink();
    renderStaticAdSlots();
    renderCategoryCards();
    renderPills();
    renderCatalog();
    bindUI();
    const hash = location.hash.replace("#", "");
    if (hash && tools.some((tool) => tool.id === hash)) openTool(hash);
  }

  boot();
})();
