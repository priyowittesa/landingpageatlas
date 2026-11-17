# Capacity Analytic — Panduan Integrasi FE

Acuan desain: Figma **Capacity Analytic → halaman "Capacity Analytic 2"**
(section: upload marketing data and master part, loading vs capacity,
contingency plan and bridging line, capacity trend, Product Structure,
Configuration).

Semua endpoint ada di gateway, di bawah:

```
/v1/manufacturing/line-balancing
```

Daftar lengkap beserta parameter ada di Swagger gateway (`/docs/`, tag
`manufacturing-line-balancing-*`). Dokumen ini menjelaskan cara memakainya
per layar.

> Status: route dan Swagger sudah ada di `atlas-api-gateway` (working tree).
> Bentuk URL dan nama field ditentukan dari sisi BE dan belum pernah
> disepakati dengan FE — kalau ada yang menyulitkan, sebutkan sebelum
> integrasi dimulai.

---

## 0. Apa itu Capacity Analytic

Capacity Analytic menjawab satu pertanyaan pabrik: **apakah line produksi
sanggup membuat barang sebanyak yang diminta marketing, bulan ini dan beberapa
bulan ke depan?** Kalau tidak sanggup, ia menunjukkan line mana yang kelebihan
beban dan apa yang bisa dilakukan.

### Idenya

Tiap line produksi dibandingkan dari dua sisi:

- **Loading (beban)**: berapa pieces yang *diminta* dari line itu dalam satu
  bulan. Angkanya datang dari file marketing (order pasti + forecast tentatif)
  untuk semua part yang dibuat di line tersebut.
- **Available capacity (kemampuan)**: berapa pieces yang *bisa* dibuat line itu
  dalam sebulan. Dihitung dari hari kerja, jumlah shift, jam per shift, cycle
  time, efisiensi, dan seterusnya.

```
capacity % = loading ÷ available capacity × 100
```

Contoh: diminta 28.033 pcs, sanggup 11.059 pcs → 253%. Artinya line itu
diminta mengerjakan 2,5 kali kemampuannya.

Persentase itu diberi status menurut ambang batas per tenant (default 200 dan
300): **Normal**, **Warning**, atau **NG** (overload).

### Bagian-bagiannya

| Bagian | Fungsinya |
|---|---|
| Upload master part | Mendaftarkan part: dibuat di line mana, cycle time-nya berapa |
| Upload marketing data | Memasukkan permintaan per part per bulan. Part yang belum terdaftar "menunggu" sampai master part-nya ada |
| Dashboard | Ringkasan: jumlah line, line mana yang NG, kapasitas keseluruhan, part yang jadi bottleneck |
| Loading vs Capacity | Per line, dari bulan lalu sampai tiga bulan ke depan (N-1 … N+3), supaya masalah terlihat sebelum terjadi |
| Capacity Trend | Satu line sepanjang tahun, dibanding tahun lalu, plus simulasi "kalau jalan 1, 2 atau 3 shift" |
| Contingency Plan | Dua cara menurunkan beban: **overtime** (menambah jam kerja, kapasitas naik) dan **bridging** (memindahkan sebagian produksi satu part ke line lain, beban turun) |
| Formula Configuration | Cara menghitung kapasitas tidak dikunci; bisa diatur sendiri |
| Activity Plan | Catatan tindak lanjut dan audit line |

### Kenapa ada formula

Tidak semua line dihitung dengan cara yang sama. Line mesin dibatasi cycle
time, line manual dibatasi jam orang, dan ada line yang dibatasi mana pun yang
lebih kecil. Karena itu rumus kapasitas bisa disusun sendiri, dengan aturan:

- **Berlaku per cakupan**: global, per produk, per grup line, atau per line.
  Yang paling spesifik menang.
- **Punya versi dan tanggal berlaku**: rumus baru bisa dijadwalkan mulai bulan
  tertentu, dan versi yang sudah aktif tidak bisa diubah, sehingga angka bulan
  lalu tetap bisa dipertanggungjawabkan.
- **Dicek satuannya**: hasil rumus harus berupa pieces, jadi rumus yang salah
  secara logika ditolak sebelum dipakai.
- **Bisa dilihat dampaknya dulu**: sebelum diaktifkan, terlihat line mana yang
  berubah dan menjadi berapa persen.

### Before dan After

Tiap angka punya dua versi: **Before** (tanpa overtime dan bridging) dan
**After** (dengan keduanya). Selisihnya menunjukkan apakah tindakan yang
diambil cukup, misalnya line yang tadinya NG 320% turun ke Warning 240%.

Semua angka dihitung saat diminta dan tidak disimpan. Begitu ada upload baru,
overtime baru, atau rumus baru, hasilnya langsung berubah — jadi FE cukup
memanggil ulang endpoint terkait setelah aksi semacam itu.

---

## 1. Aturan umum

### 1.1 Auth dan tenant

- Header `Authorization: Bearer <token>`.
- Tenant diambil dari tenant aktif pengguna; FE **tidak** mengirim tenant.
- Field pelaku (`created_by`, `updated_by`, `deleted_by`, `activated_by`,
  `reviewed_by`, `cancelled_by`, `uploaded_by`) selalu diisi gateway dari
  kredensial. Nilai yang dikirim FE diabaikan — tidak perlu dikirim.

### 1.2 Bentuk respons

Sukses:

```json
{ "status": true, "code": 200, "message": "Line capacities fetched successfully", "data": { } }
```

- Respons yang isinya satu objek (get / create / update) → `data` adalah
  objek itu langsung.
- List → `data = { "items": [], "next_page_token": "", "total_count": 0 }`.
- Respons gabungan (dashboard, trend, preview) → `data` berisi beberapa field.

Gagal:

```json
{ "error": { "code": "InvalidArgument", "message": "hours must be more than 0 and at most 24" } }
```

| `error.code` | HTTP | Arti untuk FE |
|---|---|---|
| `InvalidArgument` | 400 | Input salah; `message` bisa ditampilkan di form |
| `NotFound` | 404 | Data tidak ada (atau milik tenant lain) |
| `AlreadyExists` | 409 | Bentrok, mis. dua versi formula satu scope di tanggal yang sama |
| `FailedPrecondition` | 412 | Aturan bisnis tidak terpenuhi; `message` layak ditampilkan apa adanya |
| lainnya | 5xx | Pesan generik; detailnya tidak dikirim ke klien. Satu kasus yang wajar terjadi: dua orang mengaktifkan formula untuk scope yang sama pada saat bersamaan — cukup ulangi request |

### 1.3 Konvensi field

- Nama field **snake_case**.
- **Tanggal**: string `"YYYY-MM-DD"` (`effective_from`, `work_date`,
  `due_date`). **Bulan**: dua angka `year` + `month` (1–12).
- **Timestamp** (`created_at`, dst.): string RFC 3339.
- **Angka 64-bit** (`file_size_bytes`) datang sebagai **string**.
- **Enum** di respons berupa nama lengkap, mis. `"CAPACITY_STATUS_WARNING"`.
  Di **query** boleh nama pendek (`status=ng`, `plan=prototype`). Di **body
  JSON** harus nama lengkap atau angkanya.
- **Angka yang tidak bisa dihitung tidak dikirim sama sekali.** `capacity_pct`,
  `daily_capacity_pcs`, `overall_capacity_pct`, `absorbed_loading_pct`,
  `before_cap_pct`, `after_cap_pct` bisa **tidak ada** di JSON. Jangan anggap
  0. Tampilkan "–" dan pakai field `problem` sebagai penjelasan.

### 1.4 List

Query: `page_size` (default 20, maks 500), `page_token` (ambil dari
`next_page_token` halaman sebelumnya; kosong = halaman terakhir), `sort_by`,
`sort_dir` (`asc`; selain itu descending), `search`.

"Showing 1-4 of 16 results" → pakai `total_count`.

### 1.5 Enum yang dipakai UI

| Enum | Nilai | Tampilan |
|---|---|---|
| `CapacityStatus` | `CAPACITY_STATUS_NORMAL` / `_WARNING` / `_NG` / `_UNSPECIFIED` | badge Normal / Warning / NG / (tanpa badge) |
| `PlanType` | `PLAN_TYPE_PRODUCTION` (default) / `PLAN_TYPE_PROTOTYPE` | Production Plan / Prototype Plan |
| `FormulaScopeLevel` | `FORMULA_SCOPE_LEVEL_GLOBAL` / `_PRODUCT` / `_LINE_GROUP` / `_LINE` | tab Level |
| `FormulaVersionStatus` | `FORMULA_VERSION_STATUS_DRAFT` / `_SCHEDULED` / `_ACTIVE` / `_SUPERSEDED` | badge Draft / Scheduled / Active / (lama) |
| `BridgingStatus` | `BRIDGING_STATUS_PENDING_REVIEW` / `_APPROVED` / `_REJECTED` / `_CANCELLED` | |
| `DataUploadStatus` | `DATA_UPLOAD_STATUS_SUCCESS` / `_SUCCESS_WITH_WARNINGS` / `_FAILED` | badge Success / Warning / Failed |
| `ActivityPlanStatus` | `ACTIVITY_PLAN_STATUS_PENDING` / `_IN_PROGRESS` / `_COMPLETED` | Pending / In Progress / Completed |

Batas status: Normal < `warning_pct`, Warning sampai sebelum `ng_pct`, NG
≥ `ng_pct`. Default 200 / 300, bisa beda per tenant — ambil dari field
`thresholds` yang ikut di respons analytics (untuk garis threshold di chart),
jangan di-hardcode. Status selalu dihitung BE; FE tidak menghitung sendiri.

### 1.6 Objek yang sering muncul

`line` (di hampir semua respons analytics):

```json
{ "line_id": "…", "line_code": "ASCC 03", "line_name": "…",
  "group_id": "…", "group_code": "ASCC", "group_name": "…",
  "product_id": "…", "product_code": "PRD-001", "product_name": "…" }
```

`LineCapacity` (satu line, satu bulan):

```json
{
  "line": { }, "year": 2026, "month": 12,
  "loading_pcs": 28033, "available_pcs": 11059,
  "capacity_pct": 253, "status": "CAPACITY_STATUS_WARNING", "problem": "",
  "formula": { "scope_level": "FORMULA_SCOPE_LEVEL_LINE", "scope_code": "ASCC 03", "version_no": 1, "name": "…", "is_system_default": false },
  "substituted": "(22 × 1 × 8 + 16) × 3,600 ÷ 50 × 0.8",
  "values": [ { "code": "working_days", "label": "Working days", "unit": "day", "value": 22, "source": "Production calendar" } ],
  "cycle_time_seconds": 50, "pcs_per_hour": 57.6, "efficiency_pct": 80,
  "working_days": 22, "daily_capacity_pcs": 502
}
```

Filter line untuk endpoint analytics: `filter.product_id`,
`filter.line_group_id`, `filter.line_id` (query). Isi dropdown Product /
Production Line dari endpoint master data (`/products`,
`/production-line-groups`, `/production-lines`).

---

## 2. Dashboard

| Elemen | Endpoint |
|---|---|
| 4 kartu KPI + banner "Unmapped Parts Found" | `GET /capacity/dashboard?year=&month=` |
| Production Parts List | `GET /capacity/production-parts?year=&month=` |
| Activity Plan & Line Audits | `GET /activity-plans` (+ CRUD) |
| Tombol Upload Master Part / Upload Marketing Data | lihat bagian 3 |

`/capacity/dashboard`:

| Field | Kartu |
|---|---|
| `total_lines` | Total Production Lines |
| `ng_lines[]` (pakai `.length` dan `line_code`) | NG Lines (Overloaded) + "Action required on …" |
| `warning_lines[]`, `unknown_lines` | tambahan; `unknown_lines` = line yang belum bisa dihitung |
| `overall_capacity_pct`, `overall_status` | Overall Capacity + badge |
| `uploads_today`, `latest_upload_at` | Recent Uploads Today (dihitung sejak 00:00 **UTC**) |
| `unmapped_part_count` | banner "N parts could not be mapped"; sembunyikan kalau 0 |

`/capacity/production-parts` → item: `part_number`, `part_name`, `model`,
`line.line_code` (Assigned Line), `loading_pcs` (Order Volume; rinciannya
`order_pcs` + `tentative_pcs`), `line_status`, `bottleneck`.

Label badge kartu (desain tidak mendefinisikannya; ini usulan BE):

| `line_status` | `bottleneck` | Label |
|---|---|---|
| NORMAL | – | Normal |
| WARNING / NG | `true` | "NG Bottleneck" |
| WARNING / NG | `false` | "NG Overload" |

Query tambahan: `search`, `status` (`normal`/`warning`/`ng`),
`bottleneck_only=true`, `page_size`, `page_token`, `filter.*`.

Activity plan: body `activity` (wajib), `production_line_id`, `pic`,
`due_date`, `status`. `PUT` mengganti semua field: `production_line_id` atau
`due_date` kosong berarti dihapus, dan `status` wajib dikirim.

---

## 3. Upload (panel Upload Marketing Data / Upload Master Part)

| Aksi | Endpoint |
|---|---|
| Unduh contoh file | `GET /uploads/templates/marketing-data` atau `/master-part` → **file .xlsx**, bukan JSON |
| Upload | `POST /uploads/marketing-data` atau `/uploads/master-part` |
| Riwayat | `GET /uploads?kind=marketing|master_part`, `GET /uploads/{id}` |
| Part belum terpetakan | `GET /unmatched-parts` (`state=waiting|resolved|all`) |
| Petakan ulang manual | `POST /unmatched-parts/remap` |

Upload: `multipart/form-data`, file di field **`file`**, `.xlsx`, maks 10 MB.

```js
const form = new FormData();
form.append("file", file);
await fetch(`${base}/uploads/marketing-data`, { method: "POST", headers: { Authorization }, body: form });
```

Respons (HTTP 201):

```json
{
  "id": "…", "kind": "DATA_UPLOAD_KIND_MARKETING", "file_name": "marketing_forecast.xlsx",
  "file_size_bytes": "5154", "status": "DATA_UPLOAD_STATUS_SUCCESS_WITH_WARNINGS",
  "total_rows": 10, "imported_rows": 5, "unmatched_count": 2,
  "log": [
    { "level": "warning", "message": "PN: 11213-0C020 - not found in SUB COMPONENT (GNP)" },
    { "level": "success", "message": "insert capacity order done" }
  ],
  "uploaded_by": "…", "created_at": "2026-11-12T03:04:05Z"
}
```

- Panel "Processing Output" / "Mapping Output" = `log`, urut apa adanya.
  `level`: `success` (✓ hijau), `warning` (⚠ kuning), `error` (merah).
- **File yang tidak terbaca tetap HTTP 201** dengan `status` FAILED dan
  alasannya di `log`. Cek `status`, bukan hanya kode HTTP.
- HTTP 400 hanya untuk request yang salah: tidak ada field `file`, atau file
  lebih dari 10 MB.
- Setelah upload master part, panggil ulang dashboard: `unmapped_part_count`
  turun otomatis.

Kolom file (urutan bebas, dicari dari nama header):

| File | Wajib | Opsional |
|---|---|---|
| Marketing data (tiap sheet = satu produk) | Part Number, Year, Month | Capacity Order, Capacity Tentative, Plan |
| Master part | Part Number, Assigned Line (kode line yang sudah ada) | Part Name, Back Number, Model, Cycle Time, SPM, Standard Labor Time, Status |

---

## 4. Loading vs Capacity

| Elemen | Endpoint |
|---|---|
| Chart per line (N-1 … N+3) | `GET /capacity/loading-vs-capacity?year=&month=&plan=&filter.*` |
| Tabel Resume | data yang sama, atau `GET /capacity/lines` untuk satu bulan |
| Additional Working Days (Overtime Logs) | `GET /overtime-logs?year=&month=` |
| Varian Add. Days / Temp Activity / Absorbed | `GET /overtime-logs/additional-working-days?year=&month=` |
| Bridging History | `GET /bridging-cases?year=&month=&status=` |

`/capacity/loading-vs-capacity` → `data.lines[]`, tiap line punya `points[]`
(5 titik, `offset` -1…3, `label` "N-1" … "N+3"). Tiap titik:

- `capacity` — dengan overtime dan bridging yang sudah di-approve → seri **After**
- `before` — tanpa keduanya → seri **Before**

Seri di legenda desain → sumber:

| Legenda | Ambil dari |
|---|---|
| N-1 | titik `offset=-1`, `capacity.capacity_pct` |
| N Before / N After | titik `offset=0`, `before.capacity_pct` / `capacity.capacity_pct` |
| N+1, N+3 | titik itu, `capacity.capacity_pct` |
| N+2 / N+2 After | titik `offset=2`, `before` / `capacity` |

Kalau belum ada overtime atau bridging, `before` = `capacity`.

Tabel Resume (per line, dari titik `offset=0`):

| Kolom | Field |
|---|---|
| Line | `line.line_code` |
| CT | `capacity.cycle_time_seconds` |
| Efficiency | `capacity.efficiency_pct` |
| Pcs/H | `capacity.pcs_per_hour` |
| Max Cap (CM / CD) | `capacity.available_pcs` (bulanan) / `capacity.daily_capacity_pcs` (harian) |
| N, N After, N+1, N+2, N+3 | `loading_pcs` dari `before` / `capacity` titik terkait |

Additional working days → item: `line`, `add_days` ("+2 Days"),
`activities[]` (Temp Activity), `overtime_hours`, `absorbed_loading_pct`
("15% Loading"; bisa tidak ada).

---

## 5. Contingency Plan

### Overtime Management

`POST /overtime-logs` body: `production_line_id`, `work_date`, `shift_type`
(teks bebas: "Weekend", "Night OT", "Saturday"), `hours` (>0, ≤24),
`workers`, `reason`. `GET`, `PUT /{id}`, `DELETE /{id}` tersedia. Kolom
Overtime ID = `code` ("OT-001").

### Bridging Management

| Elemen | Endpoint |
|---|---|
| 3 kartu KPI | `GET /bridging-cases/summary` → `active_cases`, `lines_resolved`, `pending_review` |
| Tabel | `GET /bridging-cases` |
| Hitung dampak sebelum submit | `POST /bridging-cases/preview` |
| Tombol "Submit Bridging" | `POST /bridging-cases` |
| Approve / reject | `POST /bridging-cases/{id}/review` body `{ "approve": true, "note": "" }` |
| Batalkan | `POST /bridging-cases/{id}/cancel` |

Body preview dan submit: `source_line_id`, `target_line_id`, `part_id` (part
milik line sumber), `year`, `month`, `qty`, opsional `plan`, `note`.

Preview → `source_before`, `source_after`, `target_before`, `target_after`
(masing-masing `LineCapacity`).

Kolom tabel: `code` (BR-0001), `source_line_code`, `target_line_code`,
`part_number`, `qty`, `before_cap_pct` + `before_status`, `after_cap_pct` +
`after_status`, `created_at`, `status`.

Yang perlu diketahui UI:

- Kasus baru berstatus **pending review**; angka kapasitas **belum berubah**
  sampai di-approve. Toast desain ("… is now pending review") sesuai.
- `before/after_cap_pct` adalah potret saat submit, tidak berubah lagi.
- 412 dengan pesan seperti `only 20000 pcs of this part are left to move that
  month, not 20001` → tampilkan pesannya.
- Desain belum punya form pembuatan kasus maupun tombol approve; endpoint-nya
  sudah ada.

---

## 6. Capacity Trend

`GET /capacity/trend?year=2026&line_id=…&plan=`

```json
{
  "line": { },
  "months": [
    { "month": 6,
      "capacity": { "capacity_pct": 286, "status": "CAPACITY_STATUS_WARNING" },
      "previous_year": { "capacity_pct": 190 },
      "shift_capacities": [
        { "shifts_per_day": 1, "available_pcs": 10137, "capacity_pct": 286, "status": "CAPACITY_STATUS_WARNING" },
        { "shifts_per_day": 2, "available_pcs": 20275, "capacity_pct": 143, "status": "CAPACITY_STATUS_NORMAL" },
        { "shifts_per_day": 3, "available_pcs": 30412, "capacity_pct": 95,  "status": "CAPACITY_STATUS_NORMAL" } ] } ],
  "summary": "July and August exceed the NG threshold; June exceeds the warning threshold.",
  "ng_months": [7, 8], "warning_months": [6],
  "thresholds": { "warning_pct": 200, "ng_pct": 300, "is_default": true }
}
```

| Elemen | Field |
|---|---|
| Batang "Loading" | `months[].capacity.capacity_pct` |
| Batang "N-1" | `months[].previous_year.capacity_pct` (bulan yang sama tahun lalu) |
| Capacity 1 / 2 / 3 Shift | `months[].shift_capacities[]` |
| Garis Warning / NG | `thresholds.warning_pct` / `ng_pct` |
| Subjudul chart | `summary` |

Selalu 12 bulan. Bulan tanpa kalender kerja punya `capacity.problem` dan
tidak punya `capacity_pct` → jangan gambar batangnya.

---

## 7. Formula Configuration

### 7.1 Halaman utama

| Elemen | Endpoint |
|---|---|
| Kartu "Global default" | `GET /formulas/line-assignments?year=&month=` → `global_default`, `global_default_line_count`, `total_lines` ("6 of 8 lines") |
| "Which formula each line uses in <bulan>" | endpoint yang sama → `items[]` |
| Angka % dan badge di kartu line | `GET /capacity/lines?year=&month=` (gabungkan per `line.line_id`) |
| Tabel "Formula versions" | `GET /formulas` (`status`, `scope_level`, `scope_id`, `search`) |
| Aksi History | `GET /formulas/history?scope_level=&scope_id=` |
| Aksi Delete | `DELETE /formulas/{id}` (hanya draft dan scheduled) |
| Threshold | `GET` / `PUT` / `DELETE /capacity-threshold` |

`items[]` line-assignments: `line`, `formula` (versi yang berlaku), `own`
(true = formula milik line itu sendiri → label "(own)"), `upcoming` +
`upcoming_from` ("From 1 Oct 2026: ASCC group v1"; tidak ada kalau tidak ada
perubahan terjadwal).

`formula.is_system_default = true` berarti tenant belum punya formula global;
yang dipakai formula bawaan "Standard". Tidak punya `id`, tidak bisa diedit.

Label versi dirangkai FE: `scope_level` GLOBAL → "Global default v{version_no}";
lainnya → "{scope_code} v{version_no}" (tambah "group" untuk LINE_GROUP).

### 7.2 Token formula

Formula = array token:

```json
[ { "type": "lparen" },
  { "type": "variable", "value": "working_days" },
  { "type": "operator", "value": "*" },
  { "type": "variable", "value": "shifts_per_day" },
  { "type": "rparen" },
  { "type": "number", "number": 3600, "unit": "s/h" },
  { "type": "function", "value": "min" }, { "type": "comma" } ]
```

| `type` | Isi |
|---|---|
| `variable` | `value` = kode variabel dari katalog |
| `number` | `number`; `unit` hanya untuk konversi (`s/h`, `min/h`, `h/day`); `label` teks bebas (Custom Number) |
| `operator` | `value`: `+` `-` `*` `/` (boleh kirim `×`, `x`, `÷`, `−`; BE menormalkan) |
| `lparen`, `rparen`, `comma` | tanpa field lain |
| `function` | `value`: `min` atau `max`, harus diikuti `lparen`, minimal 2 nilai dipisah `comma` |

`GET /formulas/catalog` → `variables[]` (`code`, `label`, `unit`, `group`:
`time_available` / `output_rate` / `labour`, `description`, `source`),
`constants[]` (Quick actions: 3,600 / 60 / 24 / 100), `templates[]` (kartu
"Start from": `code`, `name`, `description`, `tokens`, `reads_as`).

- Toggle "Code names" → tampilkan `code` sebagai ganti `label`.
- Popover variabel (Definition / Source) → `description` dan `source`.
- Kartu "Current Formula" → bukan template; ambil dari `GET /formulas/scope-info`.

### 7.3 Form New / Edit Formula

**Langkah 1 — Scope.** `GET /formulas/scope-info?scope_level=&scope_id=&effective_from=`

| Field | UI |
|---|---|
| `current` | "… has its own formula now: {name} v{n}, in effect since …" (tidak ada kalau scope belum punya) |
| `inherited` | formula yang dipakai scope kalau belum punya sendiri → isi kartu "Current Formula" |
| `next_version_no` | "Saving creates v4" |
| `applies_to[]`, `total_lines` | "Applies to 2 of 8 lines" |
| `overridden[]` (`line`, `by`) | "… have a more specific formula and won't change" |

Hasilnya bergantung pada `effective_from` — panggil ulang saat tanggal diubah.

**Langkah 3 — Builder.** Tiap perubahan token: `POST /formulas/validate`
body `{ "tokens": [...] }`. Selalu 200:

```json
{ "valid": false,
  "error": { "code": "trailing_operator",
             "message": "The formula ends with “×”. Add a value after it, or remove it.",
             "token_index": 9,
             "suggestion": { "description": "Remove the trailing “×”", "tokens": [ ] } },
  "tokens": [ ], "reads_as": "Working days × Shifts per day × …", "variables": [ ] }
```

- `error.token_index` → token yang diberi tanda merah (-1 = seluruh formula).
- Tombol "Suggestion" → ganti token dengan `error.suggestion.tokens` (tidak
  selalu ada).
- "Reads as …" → `reads_as`.
- Hasil formula harus berupa pcs; kalau tidak, `error.code` =
  `wrong_result_unit`.

**Impact Preview (panel kanan).** `POST /formulas/preview-impact` body:
`scope_level`, `scope_ids[]`, `tokens`, `year`, `month`, `compare_line_ids[]`.

- `in_scope[]` → bagian IN SCOPE: `line`, `current`, `proposed`, `overridden_by`
- `compared[]` → bagian COMPARED: `line`, `current`
- `proposed` tidak ada kalau formula belum valid atau line itu memakai
  formula yang lebih spesifik (`overridden_by` terisi).
- Rincian per line: `proposed.substituted`, `proposed.values[]` (nilai +
  `source`), `proposed.loading_pcs`, `proposed.available_pcs`,
  `proposed.capacity_pct`.
- "Valid formula. The results is in pcs. SACC 01, Oct 2026: 38,016 pcs" →
  `in_scope[0].proposed.available_pcs`.

**Simpan.**

| Tombol | Endpoint |
|---|---|
| Save draft (baru) | `POST /formulas` body `scope_level`, `scope_ids[]` (kosong untuk GLOBAL), `name`, `tokens`, `effective_from` → `data.formula_versions[]`, satu per target |
| Save draft (edit) | `PUT /formulas/{id}` body `name`, `tokens`, `effective_from` |
| Review and activate | simpan draft dulu, lalu `GET /formulas/{id}/review` + `GET /formulas/{id}/impact` |
| "Scheduled for 1 Oct 2026" | `POST /formulas/{id}/activate` body `{ "reason": "…" }` |

Draft boleh berisi formula yang belum selesai. Versi yang sudah aktif tidak
bisa diedit: "Edit" pada versi aktif = buat draft baru untuk scope yang sama.

**Modal Review.** `GET /formulas/{id}/review`:

| Field | UI |
|---|---|
| `formula_version`, `replaces` | "Formula change": nama lama → baru |
| `replaces_tokens[]`, `new_tokens[]` (`token`, `changed`) | chip; `changed=true` di sisi lama = Removed (merah), di sisi baru = Added (hijau) |
| `applies_to[]` | "Where it applies" |
| `activation_blocker` | kalau terisi, nonaktifkan tombol dan tampilkan teksnya |

`GET /formulas/{id}/impact` → `year`, `month`, `items[]` (`line`, `current`,
`proposed`) → tabel "Impact in Oct 2026": `available_pcs` dan `capacity_pct`
lama → baru, badge dari `proposed.status`.

Aktivasi bisa gagal dengan: 400 (reason kosong), 412 (formula belum valid,
nama kosong, tanggal efektif sebelum bulan berjalan, sudah aktif, atau draft
diubah orang lain), 409 (sudah ada versi scope itu di tanggal yang sama).

**Panel History.** `GET /formulas/history` → `items[]` (terbaru dulu) +
`in_effect_version_id`. "Compare with in effect":
`GET /formulas/compare?base_id=<in effect>&target_id=<versi ini>` →
`base_tokens[]`, `target_tokens[]` dengan flag `changed`.

---

## 8. Product Structure

Memakai endpoint master data yang sudah ada (`/products`,
`/production-line-groups`, `/production-lines`, `/parts`, `/assembly-parts`,
`/statuses`). Yang baru:

- Production line: `shifts_per_day` (1–4), `hours_per_shift` (>0, ≤24),
  `parallel_stations` (≥1). Pada `PUT`, field yang tidak dikirim tidak berubah.
- Part: `standard_labor_time_minutes`. Pada `PUT`, tidak dikirim = tidak
  berubah; kirim 0 = dikosongkan.
- Badge status di tabel Part ("NG Overload", dst.) tidak ada di `/parts`;
  ambil dari `/capacity/production-parts`.

Input bulanan per line (planned downtime, man-hours) — belum ada layarnya di
desain: `PUT /line-monthly-inputs` body `production_line_id`, `year`, `month`,
`planned_downtime_hours`, `man_hours_available`.

---

## 9. Hal yang belum final

- **Format file Excel** ditentukan BE; belum dicocokkan dengan file asli.
- **Asumsi perhitungan** belum dikonfirmasi PO: loading = order + tentative;
  threshold default 200 / 300; "N-1" di trend = tahun sebelumnya; label "NG
  Overload" vs "NG Bottleneck" (lihat bagian 2).
- **Level scope formula**: Global, Product, Line group, Line. Level Part dan
  Assembly part yang disebut di teks desain belum ada.
- **Approve bridging** belum punya pengecekan role.
- **Efficiency** diambil dari master line, bukan "last 3 months" seperti di desain.
- Baris log "capacity recalculation complete" di desain tidak dikirim BE.
- Belum diuji lewat gateway dengan login sungguhan.
