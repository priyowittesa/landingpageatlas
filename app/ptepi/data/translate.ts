/**
 * English display text for the free-text fields of the generated demo data.
 * The source workbook is in Indonesian. The JSON is never edited by hand, so the
 * translation is applied once when the data is loaded (see ./index.ts).
 * Keys, status codes and document types are left as they are.
 */

const MONTHS: Record<string, string> = {
  Januari: "January",
  Februari: "February",
  Maret: "March",
  April: "April",
  Mei: "May",
  Juni: "June",
  Juli: "July",
  Agustus: "August",
  September: "September",
  Oktober: "October",
  November: "November",
  Desember: "December"
};

const EXACT: Record<string, string> = {
  // Project descriptions
  "Pekerjaan pengadaan dan pemasangan 1 (satu) unit generator set kapasitas 27.5 kva berikut komponen kelengkapannya sebagai backup server di pt ipc terminal petikemas":
    "Supply and installation of 1 generator set (27.5 kVA) with accessories as server backup at PT IPC Terminal Petikemas",
  "Pekerjaan Perbaikan Panel Kapasitor Bank dan Pemasangan Trafo PT Graha Segara di Pelabuhan Tanjung Priok":
    "Capacitor bank panel repair and transformer installation for PT Graha Segara at Tanjung Priok Port",
  "Pengadaan Lampu Penerangan Jalan Nusantara II": "Supply of street lighting for Nusantara II",
  "Pekerjaan Pelayanan Gangguan Dan Pemeliharaan Jaringan Listrik, Serta Pelayanan Gangguan Jaringan Air Bersih Dan Air Kotor Di Area Kantor Pusat Dan Cabang Tanjung Priok Pt Pelabuhan Tanjung Priok Tahun 2025 - 2026":
    "Fault service and maintenance of the electrical network, and fault service of the clean and waste water network, at the head office and Tanjung Priok branch of PT Pelabuhan Tanjung Priok, 2025 - 2026",
  "Pekerjaan Penerangan Lampu Gudang Pombo Tanjung Priok": "Warehouse lighting at Pombo warehouse, Tanjung Priok",
  "Pekerjaan Purifikasi dan Pemeliharaan Trafo dan Kubikel Building Substation 2":
    "Purification and maintenance of transformers and cubicles, Building Substation 2",
  "Pekerjaan Pengadaan Kapasitor Bank di PT Prima Nur Panurjwan Dermaga DSN Pelabuhan Tanjung Priok":
    "Supply of capacitor banks at PT Prima Nur Panurjwan, DSN Quay, Tanjung Priok Port",
  "Pekerjaan Pengadaan Panel Pompa dan Aksesoris di Terminal Kijing PT Pelabuhan Tanjung Priok Cabang Kijing":
    "Supply of pump panels and accessories at Kijing Terminal, PT Pelabuhan Tanjung Priok, Kijing branch",
  "Pekerjaan Pengadaan Kubikel RMU PS (Package Substation) 14 ERTG Container Terminal 1 Kalibaru":
    "Supply of RMU cubicles for package substation 14, ERTG, Container Terminal 1 Kalibaru",
  "Pekerjaan Rekonfigurasi Trafo 10 MVA": "10 MVA transformer reconfiguration",
  "Pekerjaan ACTS dan Pemasangan Baterai": "ACTS works and battery installation",
  "Pekerjaan Pelayanan Gangguan dan Pemeliharaan Jaringan Listrik, Serta Pelayanan Gangguan Jaringan Air Bersih dan Air Kotor di Area Tanjung Priok PT IPC Terminal Petikemas Tahun 2026":
    "Fault service and maintenance of the electrical network, and fault service of the clean and waste water network, in the Tanjung Priok area of PT IPC Terminal Petikemas, 2026",
  "Pekerjaan Manage Service Utilitas ME PT Indonesia Kendaraan Terminal Tbk Periode 2026":
    "Mechanical and electrical utilities managed service for PT Indonesia Kendaraan Terminal Tbk, 2026",
  "Pekerjaan Penggantian Panel LVMDP Gedung Administrasi PT Jakarta Internasional Container Terminal":
    "LVMDP panel replacement, administration building, PT Jakarta Internasional Container Terminal",
  "Pekerjaan Pemeliharaan Kubikel 20 kV dan Trafo PT Graha Segara Tahun 2027":
    "Maintenance of 20 kV cubicles and transformers for PT Graha Segara, 2027",
  "Pekerjaan Instalasi Listrik Sementara dan Penerangan Area Proyek Pengembangan Dermaga (Subkontrak PT Nindya Karya)":
    "Temporary electrical installation and lighting for the quay development project area (subcontract of PT Nindya Karya)",

  // Cost lines
  "Pengadaan 1 unit genset silent untuk backup server gedung TO3": "Supply of 1 silent generator set for TO3 building server backup",
  "Jasa pemasangan genset silent untuk backup server gedung TO3": "Installation of silent generator set for TO3 building server backup",
  "Pembelian Panel ATS": "Purchase of ATS panel",
  "Kas kecil operasional lapangan": "Site operations petty cash",
  "Pembelian kabel dan MCB": "Purchase of cables and MCBs",
  "Material pemasangan fiber kerangkeng genset": "Fibre enclosure installation material for generator set",
  "Perbaikan panel kapasitor bank dan pemasangan trafo": "Capacitor bank panel repair and transformer installation",
  "Biaya transport dan konsumsi lapangan": "Site transport and meals",
  "Pembelian material penggantian lampu PJ Nusantara II": "Purchase of replacement lamp material, Nusantara II street lighting",
  "Pembelian alat kerja yantek PT PTP": "Purchase of fault-service tools for PT PTP",
  "Pembelian blower tangan alat kerja yantek": "Purchase of handheld blower, fault-service tool",
  "Pembelian tang ampere alat kerja yantek": "Purchase of clamp meter, fault-service tool",
  "Pembelian tangga teleskopik 5 meter": "Purchase of 5 metre telescopic ladder",
  "Pengisian pulsa HP operasional yantek (4 kali)": "Mobile phone credit for fault-service staff (4 top-ups)",
  "Pembayaran Google Drive akun kontraktor": "Google Drive subscription for the contractor account",
  "Pembelian lampu LED highbay 200W (80 unit)": "Purchase of 200 W LED highbay lamps (80 units)",
  "Pembelian kabel NYM dan NYY instalasi gudang": "Purchase of NYM and NYY cables for warehouse installation",
  "Jasa pemasangan lampu dan instalasi": "Lamp and installation labour",
  "Sewa scissor lift 12 meter": "12 metre scissor lift rental",
  "Jasa purifikasi minyak trafo dan pemeliharaan kubikel": "Transformer oil purification and cubicle maintenance service",
  "Pembelian minyak trafo tambahan": "Purchase of additional transformer oil",
  "Sewa genset portable selama pemadaman": "Portable generator rental during the outage",
  "Kas kecil konsumsi dan transport": "Meals and transport petty cash",
  "Mobilisasi, JSA dan perizinan kerja pelabuhan": "Mobilisation, JSA and port work permits",
  "Jasa engineering, approval drawing dan master schedule": "Engineering, drawing approval and master schedule",
  "Sewa area workshop lapangan": "Site workshop area rental",
  "Uang muka 20% PO Panel SVGm 400 kVAr (2 unit)": "20% advance on PO for SVGm 400 kVAr panel (2 units)",
  "Uang muka vendor; SES saat material diterima": "Vendor advance; SES when material is received",
  "Uang muka 30% PO Outgoing Cubicle SM6 DM1W": "30% advance on PO for SM6 DM1W outgoing cubicle",
  "Uang muka 50% PO Kontainer 40 Ft modifikasi gardu": "50% advance on PO for 40 ft container substation conversion",
  "Uang muka 30% PO Panel LVMDP 1000 kVA": "30% advance on PO for 1000 kVA LVMDP panel",
  "Uang muka 30% PO Trafo daya 1000 kVA dan kabel": "30% advance on PO for 1000 kVA power transformer and cable",
  "Kas kecil operasional proyek": "Project operations petty cash",
  "Pembelian panel pompa 3 x 45 kW dengan VSD": "Purchase of 3 x 45 kW pump panel with VSD",
  "Pembelian aksesoris pipa, kabel dan terminasi": "Purchase of pipe accessories, cables and terminations",
  "Kas kecil pengiriman material ke Kijing": "Petty cash for material delivery to Kijing",
  "Pembelian kubikel RMU 20 kV (3 unit)": "Purchase of 20 kV RMU cubicles (3 units)",
  "Pembelian kabel N2XSEFGbY 20 kV dan terminasi": "Purchase of N2XSEFGbY 20 kV cable and terminations",
  "Jasa instalasi kubikel dan penarikan kabel": "Cubicle installation and cable pulling service",
  "Pekerjaan ulang terminasi kabel setelah gagal uji tahanan isolasi": "Cable termination rework after a failed insulation resistance test",
  "Pengujian ulang VLF dan tahanan isolasi": "VLF and insulation resistance retest",
  "Sewa crane 25 ton untuk pemasangan RMU": "25 tonne crane rental for RMU installation",
  "Lembur tenaga kerja pengejaran jadwal": "Labour overtime to recover the schedule",
  "Kas kecil operasional lapangan Kalibaru": "Kalibaru site operations petty cash",
  "Jasa engineering studi koordinasi proteksi": "Protection coordination study engineering service",
  "Uang muka 30% PO relay proteksi dan panel kontrol": "30% advance on PO for protection relays and control panel",
  "Uang muka 30% PO CT/VT dan busbar tembaga": "30% advance on PO for CT/VT and copper busbar",
  "Kas kecil survey dan koordinasi pemadaman": "Petty cash for survey and outage coordination",
  "Survey lokasi dan pengukuran ruang baterai": "Site survey and battery room measurement",
  "Belum diposting di SAP per tanggal posisi": "Not yet posted in SAP at the as-at date",
  "Sewa kendaraan operasional yantek Jan-Jun": "Fault-service vehicle rental, Jan-Jun",
  "Sewa kendaraan operasional yantek Jul-Sep": "Fault-service vehicle rental, Jul-Sep",
  "Kas kecil operasional yantek": "Fault-service operations petty cash",
  "Material lampu dan komponen panel penggantian": "Replacement lamp and panel component material",
  "Sewa alat ukur partial discharge (3 bulan)": "Partial discharge meter rental (3 months)",
  "Kas kecil operasional manage service": "Managed service operations petty cash",
  "Survey lapangan dan penyusunan RAB penawaran": "Site survey and offer budget (RAB) preparation",
  "Survey kondisi kubikel dan trafo": "Cubicle and transformer condition survey",
  "Survey lokasi dan desain awal": "Site survey and initial design",

  // Service scope and inspections
  "Inspeksi visual panel tegangan menengah": "Visual inspection of medium voltage panels",
  "Notulen Rapat Manage Service IKT 10 Jun 2025 (lingkup asli)": "IKT managed service meeting minutes, 10 Jun 2025 (original scope)",
  "Inspeksi visual transformator": "Visual inspection of transformers",
  "Inspeksi panel tegangan rendah": "Inspection of low voltage panels",
  "Inspeksi panel distribusi": "Inspection of distribution panels",
  "Inspeksi jaringan kabel tegangan menengah dan rendah (KHA)": "Inspection of medium and low voltage cable network (KHA)",
  "Inspeksi penerangan kantor dan lapangan": "Inspection of office and site lighting",
  "Pengukuran beban jaringan dan penerangan": "Network and lighting load measurement",
  "Pembersihan bangunan gardu": "Substation building cleaning",
  "Pembersihan panel distribusi": "Distribution panel cleaning",
  "Pembersihan tahanan pentanahan": "Earthing resistance cleaning",
  "Inspeksi partial discharge panel tegangan menengah dan trafo": "Partial discharge inspection of medium voltage panels and transformers",
  "Patroli dan inspeksi visual gardu distribusi": "Patrol and visual inspection of distribution substations",
  "Lingkup kontrak (synthetic)": "Contract scope (synthetic)",
  "Inspeksi panel TR dan panel distribusi": "Inspection of LV and distribution panels",
  "Inspeksi pompa air bersih dan air kotor": "Inspection of clean and waste water pumps",
  "Thermography panel TR": "Thermography of LV panels",
  "Pengukuran beban dan kualitas daya": "Load and power quality measurement",
  "Pemeliharaan pompa dan panel pompa": "Pump and pump panel maintenance",
  "Pengukuran tahanan pentanahan": "Earthing resistance measurement",
  "Inspeksi panel distribusi kantor pusat dan cabang": "Inspection of distribution panels at head office and branch",
  "Inspeksi jaringan air bersih dan air kotor": "Inspection of clean and waste water network",
  "Pemeliharaan panel dan pengencangan terminal": "Panel maintenance and terminal tightening",
  "Pengukuran beban panel": "Panel load measurement",
  "Pemeriksaan pompa transfer dan ground tank": "Check of transfer pump and ground tank",
  "Area utama IKT": "IKT main area",
  "Teknisi EPI": "EPI technician",
  "Pengawas IKT": "IKT supervisor",
  "Lampu indikator mati, diganti": "Indicator lamp out, replaced",
  Ditindaklanjuti: "Followed up",
  "Baut terminal kendor, dikencangkan": "Loose terminal bolt, tightened",
  "Suhu terminal 68 C, dijadwalkan perbaikan": "Terminal temperature 68 C, repair scheduled",
  "Area utama PTP": "PTP main area",
  "Pengawas PTP": "PTP supervisor",
  "Debu tebal pada panel, dibersihkan": "Thick dust on panel, cleaned",
  "Area utama IPC TPK": "IPC TPK main area",
  "Pengawas IPC TPK": "IPC TPK supervisor",

  // BA register notes and billing blockers
  "Tautan OneDrive pribadi (perlu dipindah ke repositori resmi)": "Personal OneDrive link (to be moved to the official repository)",
  "Tidak ada di EVIDENCE PROJECT asli": "Not in the original EVIDENCE PROJECT",
  "Jatuh tempo 6 Nov 2026 (6 bulan setelah BAST I)": "Due 6 Nov 2026 (6 months after BAST I)",
  "BAST I belum ditandatangani pemberi pekerjaan": "BAST I not yet signed by the customer",
  "Nomor berakhiran PTP-24 tampak disalin dari dokumen lain; perlu konfirmasi": "Number ending PTP-24 looks copied from another document; needs confirmation",
  "Nomor tidak lengkap; laporan mingguan mencatat mulai 7 Jul 2026": "Incomplete number; the weekly report records a start from 7 Jul 2026",
  "Salinan PO belum ditandatangani pemberi kerja; bobot 1,560% sudah diakui di laporan": "PO copy not yet signed by the customer; weight of 1,560% is already counted in the report",
  "Belum disetujui: inspeksi mingguan jaringan kabel TM/TR (KHA) tidak dilaksanakan": "Not approved: the weekly MV/LV cable network (KHA) inspection was not carried out",
  "BAMK direncanakan 16 Nov 2026": "BAMK planned for 16 Nov 2026",
  "Progres fisik 28,50% belum mencapai syarat 50%": "Physical progress of 28,50% has not reached the 50% condition",
  "Laporan bulanan belum disetujui (lingkup inspeksi KHA tidak dilaksanakan)": "Monthly report not approved (the KHA inspection scope was not carried out)",

  // Signatory roles
  "Direktur Utama IPC TPK": "President Director, IPC TPK",
  "Direktur Utama EPI": "President Director, EPI",
  "Engineering Manager IPC TPK": "Engineering Manager, IPC TPK",
  "SM Operasi dan Teknik EPI": "Operations and Engineering Senior Manager, EPI",
  "Direktur Utama Graha Segara": "President Director, Graha Segara",
  "Engineering Manager Graha Segara": "Engineering Manager, Graha Segara",
  "Project Manager EPI": "Project Manager, EPI",
  "Direktur Utama PTP": "President Director, PTP",
  "Engineering Manager PTP": "Engineering Manager, PTP",
  "Direktur Utama PSL": "President Director, PSL",
  "Engineering Manager PSL": "Engineering Manager, PSL",
  "Direktur Utama PT PNP": "President Director, PT PNP",
  "Kadiv Operasional PT PNP": "Head of Operations Division, PT PNP",
  "Engineering Manager PT PNP": "Engineering Manager, PT PNP",
  "Direktur Utama IKT": "President Director, IKT",
  "Engineering Manager IKT": "Engineering Manager, IKT"
};

/** Cost categories of the RAP and cost lines. */
const CATEGORIES: Record<string, string> = {
  Material: "Material",
  "Jasa Subkon": "Subcontract services",
  "Tenaga Kerja": "Labour",
  "Overhead & Perizinan": "Overhead and permits",
  "Sewa Alat": "Equipment rental",
  "Operasional & Kas Kecil": "Operations and petty cash",
  "Kas Kecil": "Petty cash"
};

/** English cost category. Unknown text is returned unchanged. */
export function toEnglishCategory(category: string): string {
  return CATEGORIES[category] ?? category;
}

const MONTH_PATTERN = Object.keys(MONTHS).join("|");

const PATTERNS: Array<[RegExp, (match: RegExpExecArray) => string]> = [
  [
    new RegExp(`^Kontraktor kelistrikan PTP \\(ACS\\) (${MONTH_PATTERN}) (\\d{4})$`),
    (m) => `PTP electrical contractor (ACS), ${MONTHS[m[1]]} ${m[2]}`
  ],
  [
    new RegExp(`^Tenaga kerja yantek TPK \\(ACS\\) (${MONTH_PATTERN}) (\\d{4})$`),
    (m) => `TPK fault-service labour (ACS), ${MONTHS[m[1]]} ${m[2]}`
  ],
  [
    new RegExp(`^Tenaga kerja manage service IKT \\(ACS\\) (${MONTH_PATTERN}) (\\d{4})$`),
    (m) => `IKT managed service labour (ACS), ${MONTHS[m[1]]} ${m[2]}`
  ],
  [/^Material consumable pemeliharaan triwulan (I+)$/, (m) => `Maintenance consumables, quarter ${m[1]}`],
  [/^BA pemeriksaan bulanan (\w{3}) (\d{4})$/, (m) => `Monthly inspection BA, ${m[1]} ${m[2]}`],
  [/^BAST II \(6 bulan setelah BAST I\)$/, () => "BAST II (6 months after BAST I)"],
  [/^BAST I \(progres 100%\)$/, () => "BAST I (progress 100%)"],
  [/^Material on site \(progres >= 60%\)$/, () => "Material on site (progress >= 60%)"],
  [/^Progres fisik >= 50%$/, () => "Physical progress >= 50%"],
  [/^BAMK dan jaminan uang muka$/, () => "BAMK and advance payment guarantee"]
];

/** English text for a source string. Unknown text is returned unchanged. */
export function toEnglish(text: string): string;
export function toEnglish(text: string | null): string | null;
export function toEnglish(text: string | null): string | null {
  if (text === null) return null;
  const exact = EXACT[text];
  if (exact !== undefined) return exact;
  for (const [pattern, build] of PATTERNS) {
    const match = pattern.exec(text);
    if (match) return build(match);
  }
  return text;
}

const NAME_REPLACEMENTS: Array<[string, string]> = [
  ["Pemeriksaan Pekerjaan Bulanan", "Monthly Work Inspection"],
  ["Testing dan Commissioning", "Testing and Commissioning"],
  ["Laporan Progres Fisik", "Physical Progress Report"],
  ["BA Progres Fisik", "BA Physical Progress"],
  ["Laporan Mingguan Minggu", "Weekly Report Week"],
  ["Kurva S", "S-curve"],
  ["Surat Perjanjian", "Agreement Letter"],
  ["Surat Penawaran", "Offer Letter"],
  ["Dokumen Pengadaan", "Procurement Documents"],
  ["BA Pembayaran", "Payment BA"],
  ["Trafo Daya", "Power Transformer"],
  ["(kabel)", "(cable)"],
  ["Kontainer 40 Ft", "40 Ft Container"],
  ["Gardu 20 kV", "20 kV Substation"],
  ["Pekerjaan Lainnya", "Other Works"]
];

/** English name of a document type or project component. Unknown text is returned unchanged. */
export function toEnglishName(name: string): string;
export function toEnglishName(name: string | null): string | null;
export function toEnglishName(name: string | null): string | null {
  if (name === null) return null;
  return NAME_REPLACEMENTS.reduce((text, [from, to]) => text.split(from).join(to), name);
}
