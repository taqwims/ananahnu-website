package seeder

import (
	"ananahnu/internal/domain"
	"log"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedNewsData inserts high-quality, SEO-optimized sample articles into the database.
func SeedNewsData(db *gorm.DB) error {
	log.Println("Seeding Sample News / Articles for SEO...")

	articles := []domain.News{
		{
			Title:           "Panduan Lengkap Sertifikasi Halal Gratis (SEHATI) 2026 untuk Pelaku UMKM",
			Slug:            "panduan-sertifikasi-halal-gratis-sehati-2026-umkm",
			Excerpt:         "Panduan langkah demi langkah cara mendaftar program Sertifikasi Halal Gratis (SEHATI) BPJPH tahun 2026 bagi pelaku usaha mikro dan kecil (UMKM) di seluruh Indonesia.",
			Category:        "Sertifikasi Halal",
			ThumbnailURL:    "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=1200",
			Tags:            "sehati, bpjph, sertifikasi halal gratis, umkm, sihalal, self declare",
			AuthorName:      "Tim Redaksi Halal Core",
			ReadingTime:     4,
			MetaTitle:       "Panduan Lengkap Sertifikasi Halal Gratis (SEHATI) 2026 untuk UMKM",
			MetaDescription: "Pelajari syarat, alur pendaftaran, dan tips lolos program Sertifikasi Halal Gratis (SEHATI) BPJPH 2026 untuk pelaku usaha mikro & kecil di Indonesia.",
			MetaKeywords:    "sertifikasi halal gratis 2026, program sehati bpjph, syarat halal self declare, daftar halal umkm online",
			IsPublished:     true,
			IsFeatured:      true,
			ShowOnLanding:   true,
			Views:           0,
			PublishedAt:     time.Now().Add(-48 * time.Hour),
			Content: `Kewajiban sertifikasi halal tahap pertama di Indonesia telah resmi diberlakukan. Bagi para pelaku Usaha Mikro dan Kecil (UMKM), Badan Penyelenggara Jaminan Produk Halal (BPJPH) kembali menyelenggarakan program **Sertifikasi Halal Gratis (SEHATI)**.

Melalui program ini, pelaku usaha makanan dan minuman dengan kategori *Self-Declare* dapat mengurus sertifikat halal resmi tanpa dipungut biaya pendampingan maupun biaya sertifikasi.

## Apa Itu Program SEHATI BPJPH?

Program SEHATI (Sertifikasi Halal Gratis) merupakan inisiatif strategis pemerintah melalui Kementerian Agama dan BPJPH untuk mempercepat terwujudnya ekosistem halal nasional. Program ini ditujukan khusus bagi UMKM dengan kriteria bahan baku yang sudah dipastikan kehalalannya serta proses produksi yang sederhana.

![Pendamping Halal Core saat melakukan verifikasi proses produk halal](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200)

> 💡 **Tips Halal Core:** Pastikan seluruh bahan baku yang Anda gunakan telah memiliki sertifikat halal atau termasuk dalam daftar bahan positif (positive list) BPJPH agar proses verifikasi lapangan berjalan cepat tanpa kendala.

## Matriks Perbandingan Skema Sertifikasi

Berikut adalah tabel perbandingan antara skema **Self-Declare (SEHATI)** dan **Skema Reguler**:

| Kriteria Penilaian | Skema Self-Declare (SEHATI) | Skema Reguler LPH |
|---|---|---|
| Target Pelaku Usaha | Usaha Mikro dan Kecil (UMKM) | Usaha Menengah dan Besar / Pabrik |
| Biaya Sertifikasi | **100% Gratis (Subsidi BPJPH)** | Berbayar sesuai tarif LPH |
| Verifikator / Auditor | Pendamping PPH (LP3H) | Auditor Halal & Uji Lab LPH |
| Kriteria Bahan Baku | Bahan Sederhana / Positive List | Semua Jenis Bahan Baku & Kimia |
| Waktu Proses Rata-rata | ~12 Hari Kerja | ~21 Hari Kerja |

## Syarat Wajib Pengajuan Self-Declare

Sebelum melakukan pendaftaran di platform Sihalal, pastikan usaha Anda telah memenuhi kriteria berikut:

- Memiliki **Nomor Induk Berusaha (NIB)** berbasis risiko mikro atau kecil.
- Memiliki outlet, dapur, atau fasilitas produksi yang bersih dan terpisah dari potensi kontaminasi najis.
- Menggunakan bahan baku yang 100% halal dan dapat dibuktikan asal-usulnya.
- Telah menunjuk minimal satu orang sebagai **Penyelia Halal internal** (bisa pemilik usaha sendiri).
- Produk yang didaftarkan berupa makanan/minuman non-daging olahan komersial berisiko tinggi.

## Alur Proses Pendaftaran Langkah demi Langkah

1. **Pembuatan Akun Sihalal**: Daftarkan usaha Anda di portal resmi ptsp.halal.go.id menggunakan data NIB.
2. **Pemilihan Pendamping PPH**: Pilih Lembaga Pendamping Proses Produk Halal (LP3H) resmi dari Halal Core untuk mendampingi verifikasi lapangan.
3. **Verifikasi dan Validasi (Verval)**: Pendamping akan melakukan audit lapangan dan validasi dokumen matriks bahan baku.
4. **Sidang Komite Fatwa**: Komite Fatwa Produk Halal akan menggelar sidang penetapan kehalalan produk.
5. **Penerbitan Sertifikat Halal**: BPJPH menerbitkan dokumen Sertifikat Halal resmi yang berlaku seumur hidup selama tidak ada perubahan komposisi bahan.

Dengan mengantongi sertifikat halal resmi, nilai jual dan kepercayaan konsumen terhadap produk UMKM Anda akan meningkat drastis di pasar ritel modern dan ekspor!`,
		},
		{
			Title:           "Regulasi Wajib Halal 2026: Aturan BPJPH, Tahapan, dan Sanksi Bagi Pelaku Usaha",
			Slug:            "regulasi-wajib-halal-2026-bpjph-tahapan-sanksi",
			Excerpt:         "Penjelasan mendalam mengenai aturan wajib sertifikasi halal sesuai UU JPH, batas penahapan, serta sanksi administratif dan denda bagi produk tanpa sertifikat halal.",
			Category:        "Regulasi BPJPH",
			ThumbnailURL:    "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200",
			Tags:            "regulasi halal, bpjph, sanksi halal, uu jph, hukum halal indonesia",
			AuthorName:      "Ahmad Fauzi, S.H. (Legal Halal Core)",
			ReadingTime:     5,
			MetaTitle:       "Regulasi Wajib Halal 2026: Aturan BPJPH & Sanksi Pelanggaran",
			MetaDescription: "Ketahui ketentuan regulasi wajib sertifikasi halal BPJPH 2026, sanksi administratif, penarikan produk, dan denda bagi pelaku usaha yang belum bersertifikat.",
			MetaKeywords:    "regulasi wajib halal bpjph 2026, undang undang jph, sanksi produk tanpa halal, batas waktu sertifikasi halal",
			IsPublished:     true,
			IsFeatured:      false,
			ShowOnLanding:   true,
			Views:           0,
			PublishedAt:     time.Now().Add(-96 * time.Hour),
			Content: `Pemerintah Indonesia melalui Badan Penyelenggara Jaminan Produk Halal (BPJPH) menegaskan kembali penegakan hukum kewajiban sertifikasi halal untuk seluruh produk makanan, minuman, jasa sembelihan, dan bahan baku pendukung.

Bagi para pemilik brand makanan, kafe, restoran, dan industri FMCG, memahami implikasi hukum dari regulasi ini sangat penting untuk kelangsungan operasional bisnis.

## Landasan Hukum Wajib Sertifikasi Halal

Kewajiban sertifikasi halal diatur secara tegas dalam **Undang-Undang Nomor 33 Tahun 2014** tentang Jaminan Produk Halal (JPH) yang kemudian diselaraskan melalui Peraturan Pemerintah No. 39 Tahun 2021.

Prinsip utamanya menyatakan bahwa seluruh produk yang masuk, beredar, dan diperdagangkan di wilayah Negara Kesatuan Republik Indonesia wajib bersertifikat halal, kecuali produk yang secara jelas berasal dari bahan yang diharamkan syariat Islam (wajib mencantumkan keterangan tidak halal).

## Sanksi Hukum Bagi Pelanggar Regulasi

Bagi pelaku usaha yang tidak memenuhi kewajiban sertifikasi setelah berakhirnya masa penahapan, pemerintah memberlakukan sanksi bertingkat:

- **Peringatan Tertulis**: Surat teguran resmi dari pengawas jaminan produk halal BPJPH.
- **Denda Administratif**: Pengenaan sanksi denda finansial sesuai skala kapasitas usaha.
- **Penarikan Produk dari Peredaran**: Produk dilarang didistribusikan di supermarket, minimarket modern, etalase toko, maupun marketplace online.
- **Penutupan Usaha / Pencabutan Izin**: Penangguhan izin edar atau penutupan sementara fasilitas produksi.

> 💡 **Rekomendasi Halal Core:** Segera lakukan *Halal Readiness Assessment* pada seluruh lini produk Anda bersama tim konsultan Halal Core agar tidak terkendala saat operasi pengawasan pasar dilakukan secara serentak.`,
		},
		{
			Title:           "7 Tips Menyusun Dokumen SJPH (Sistem Jaminan Produk Halal) Agar Cepat Lolos Audit",
			Slug:            "7-tips-menyusun-dokumen-sjph-audit-halal-cepat-lolos",
			Excerpt:         "Kumpulan tips praktis dan checklist penting dalam menyusun manual Sistem Jaminan Produk Halal (SJPH) agar permohonan sertifikat halal Anda disetujui tanpa revisi berulang.",
			Category:        "Edukasi & Tips",
			ThumbnailURL:    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200",
			Tags:            "sjph, manual halal, audit halal, dokumen halal, penyelia halal",
			AuthorName:      "Siti Rahmawati, S.Pt., M.Si.",
			ReadingTime:     4,
			MetaTitle:       "7 Tips Menyusun Dokumen SJPH Agar Cepat Lolos Audit Halal",
			MetaDescription: "Panduan lengkap menyusun manual Sistem Jaminan Produk Halal (SJPH) yang tepat dan rapi agar permohonan sertifikasi halal disetujui auditor LPH tanpa revisi.",
			MetaKeywords:    "dokumen sjph sistem jaminan produk halal, tips lolos audit lph, manual sjph bpjph, tugas penyelia halal",
			IsPublished:     true,
			IsFeatured:      false,
			ShowOnLanding:   true,
			Views:           0,
			PublishedAt:     time.Now().Add(-120 * time.Hour),
			Content: `Banyak pengajuan sertifikasi halal mengalami penundaan hingga berminggu-minggu bukan karena bahan baku yang tidak halal, melainkan karena dokumen **Manual Sistem Jaminan Produk Halal (SJPH)** yang tidak lengkap, tidak konsisten, atau tidak memenuhi standar HAS 23000 / Kriteria SJPH BPJPH.

Berikut adalah 7 tips praktis dari tim auditor Halal Core agar dokumen SJPH perusahaan Anda langsung disetujui oleh LPH dan BPJPH:

## 1. Komitmen Manajemen yang Tertulis Jelas
Pastikan pimpinan perusahaan telah menandatangani Kebijakan Halal dan menyosialisasikannya ke seluruh staf produksi, purchasing, dan gudang.

## 2. Struktur Tim Manajemen Halal yang Sah
Bentuk tim manajemen halal internal dengan Surat Keputusan (SK) resmi yang mencantumkan pembagian tugas yang jelas antara Penyelia Halal, Purchasing, dan Quality Control.

## 3. Matriks Bahan Baku yang Rinci
Buat daftar seluruh bahan baku, bahan tambahan, dan bahan penolong secara detail. Sertakan nomor sertifikat halal yang masih aktif beserta masa berlakunya.

## 4. SOP Pembelian dan Pemeriksaan Bahan Masuk
Dokumentasikan prosedur standar saat tim purchasing membeli bahan baku baru. Pastikan ada verifikasi bahwa bahan yang datang sesuai dengan daftar bahan yang disetujui.

## 5. Prosedur Sanitasi & Pencegahan Kontaminasi Silang
Jelaskan secara tertulis bagaimana fasilitas, mesin produksi, dan peralatan pencucian dibersihkan untuk memastikan tidak ada kontaminasi bahan haram/najis.

## 6. Prosedur Mampu Telusur (Traceability)
Sistem harus mampu melacak asal muasal bahan baku dari setiap *batch* produk jadi yang siap dikirim ke konsumen.

## 7. Audit Internal dan Kaji Ulang Manajemen
Lakukan simulasi audit internal minimal satu kali setahun dan dokumentasikan notulen rapat kaji ulang manajemen.`,
		},
		{
			Title:           "Potensi Pasar Halal Global 2026: Mengapa Bisnis Indonesia Harus Segera Ekspansi?",
			Slug:            "potensi-pasar-halal-global-2026-peluang-ekspor-indonesia",
			Excerpt:         "Laporan terkini mengenai pertumbuhan industri halal dunia yang diproyeksikan menembus triliunan dolar, membuka peluang ekspor masif bagi produk makanan dan kosmetik Indonesia.",
			Category:        "Berita Industri",
			ThumbnailURL:    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200",
			Tags:            "pasar halal global, ekspor halal, bisnis halal, fmcg halal, ekonomi syariah",
			AuthorName:      "Budi Santoso, MBA",
			ReadingTime:     3,
			MetaTitle:       "Potensi Pasar Halal Global 2026: Peluang Ekspor Bisnis Indonesia",
			MetaDescription: "Analisis potensi pasar halal dunia 2026 di sektor makanan, kosmetik, dan pariwisata. Pelajari strategi menembus pasar ekspor dengan sertifikasi halal.",
			MetaKeywords:    "pasar halal global 2026, peluang ekspor produk halal indonesia, tren industri halal dunia, sgie report",
			IsPublished:     true,
			IsFeatured:      false,
			ShowOnLanding:   false,
			Views:           0,
			PublishedAt:     time.Now().Add(-160 * time.Hour),
			Content: `Industri halal dunia saat ini bukan lagi sekadar pemenuhan kaidah religius, melainkan telah bertransformasi menjadi standar kualitas hidup global (*global lifestyle and quality benchmark*) yang digemari oleh konsumen muslim maupun non-muslim di seluruh dunia.

Berdasarkan laporan *State of the Global Islamic Economy (SGIE)*, perputaran ekonomi halal global diperkirakan terus melonjak menembus angka USD 3 triliun.

## Sektor Unggulan Produk Halal Indonesia

Beberapa kategori produk Indonesia yang memiliki keunggulan kompetitif tinggi di pasar internasional meliputi:

- **Makanan & Minuman Olahan**: Rempah-rempah, kopi spesialti, bumbu instan, dan makanan ringan khas nusantara.
- **Kosmetik & Skincare Halal**: Tren *clean beauty* dan sertifikasi halal menjadi magnet kuat di pasar Asia Tenggara dan Timur Tengah.
- **Farmasi & Produk Herbal**: Suplemen kesehatan alami berbasis herbal terstandar halal.

> 💡 **Wawasan Strategis:** Memiliki sertifikat halal resmi yang terakreditasi internasional merupakan paspor utama untuk meloloskan produk Anda ke jaringan ritel global di Timur Tengah, Eropa, dan Asia.`,
		},
		{
			Title:           "Cara Memilih Lembaga Pemeriksa Halal (LPH) yang Tepat untuk Skema Sertifikasi Reguler",
			Slug:            "cara-memilih-lembaga-pemeriksa-halal-lph-skema-reguler",
			Excerpt:         "Panduan memilih Lembaga Pemeriksa Halal (LPH) dan auditor halal yang kompeten, responsif, dan sesuai dengan skala industri bisnis Anda.",
			Category:        "Sertifikasi Halal",
			ThumbnailURL:    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
			Tags:            "lph, lembaga pemeriksa halal, audit reguler halal, auditor halal bpjph",
			AuthorName:      "Tim Redaksi Halal Core",
			ReadingTime:     3,
			MetaTitle:       "Cara Memilih Lembaga Pemeriksa Halal (LPH) Skema Reguler",
			MetaDescription: "Panduan praktis memilih Lembaga Pemeriksa Halal (LPH) terbaik untuk audit sertifikasi halal skema reguler pabrik dan industri skala menengah-besar.",
			MetaKeywords:    "cara memilih lph halal, biaya audit lph reguler, daftar lembaga pemeriksa halal bpjph, mandays audit halal",
			IsPublished:     true,
			IsFeatured:      false,
			ShowOnLanding:   false,
			Views:           0,
			PublishedAt:     time.Now().Add(-200 * time.Hour),
			Content: `Bagi pelaku usaha industri skala menengah, besar, maupun usaha yang menggunakan bahan baku berisiko tinggi (misalnya daging sembelihan dan produk biologi), proses sertifikasi halal wajib dilakukan melalui **Skema Reguler** dengan melibatkan Lembaga Pemeriksa Halal (LPH).

LPH bertugas melakukan audit lapangan, pemeriksaan laboratorium (bila diperlukan), dan memverifikasi penerapan manual SJPH di fasilitas produksi.

## Kriteria Kunci dalam Memilih Mitra LPH

1. **Akreditasi dan Ruang Lingkup Resmi**: Pastikan LPH terdaftar resmi di BPJPH dan memiliki ruang lingkup pengujian yang relevan dengan produk Anda.
2. **Ketersediaan Auditor Kompeten**: Memiliki jumlah auditor halal yang memadai di wilayah fasilitas produksi Anda guna menghemat biaya akomodasi.
3. **Transparansi Biaya dan Jadwal**: Perhitungan mandays audit yang jelas, transparan, dan tanpa pungutan liar.
4. **Dukungan Integrasi Digital**: Kemudahan koordinasi sistem informasi antara perusahaan, konsultan pendamping, dan auditor.

Halal Core bermitra dengan jaringan LPH dan Auditor halal terakreditasi di seluruh Indonesia untuk mendampingi perusahaan Anda meraih sertifikasi halal dengan lancar dan tepat waktu.`,
		},
	}

	for _, article := range articles {
		article.CreatedAt = article.PublishedAt
		article.UpdatedAt = article.PublishedAt
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "excerpt", "content", "category", "thumbnail_url", "tags", "author_name", "reading_time", "meta_title", "meta_description", "meta_keywords", "is_published", "is_featured", "show_on_landing", "views", "published_at", "updated_at"}),
		}).Create(&article).Error; err != nil {
			log.Printf("Failed to seed article %s: %v", article.Slug, err)
		}
	}

	log.Println("✓ Sample News & SEO Articles seeded successfully.")
	return nil
}
