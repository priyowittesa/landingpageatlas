import type { TextLine } from "./types";

const ENGLISH_STOPWORDS = `
a about above after again against all almost also although always am among an and another any anybody anyone anything
anyway anywhere are aren around as at back be became because become becomes been before being below between both
but by can cannot could couldn did didn do does doesn doing don done down during each either else enough etc even ever
every everyone everything few for from further get gets getting given gives go goes going got had hadn has hasn have
haven having he her here hers herself him himself his how however i if in into is isn it its itself just keep least
less let like made make makes many may maybe me might mine more most mostly much must my myself near need neither never
new next no nobody none nor not nothing now of off often on once one only onto or other others otherwise our ours
ourselves out over own per perhaps please put quite rather really same see seem seemed seems several shall she should
shouldn since so some somebody someone something sometimes somewhere still such than that the their theirs them
themselves then there therefore these they thing things this those though through thus to together too toward towards
under until up upon us use used uses using very via was wasn way ways we well were weren what whatever when whenever
where whereas wherever whether which while who whoever whole whom whose why will with within without won would wouldn
yet you your yours yourself yourselves also able across already else ever etc inc ltd yes
`;

const INDONESIAN_STOPWORDS = `
ada adalah adanya agak agar akan akhirnya aku akulah amat amatlah anda andalah antar antara antaranya apa apaan apabila
apakah apalagi apatah atau ataukah ataupun awal bagai bagaikan bagaimana bagaimanakah bagaimanapun bagi bagian bahkan
bahwa bahwasanya baik bakal bakalan balik banyak bapak baru bawah beberapa begini beginian beginikah beginilah begitu
begitukah begitulah begitupun bekerja belakang belakangan belum belumlah benar benarkah benarlah berada berakhir
berapa berbagai bergabung berikan berikut berikutnya berjumlah berkali berkata berkehendak berkeinginan berlainan
berlalu berlangsung bermacam bermaksud bermula bersama bersiap bertanya berturut bertutur berupa besar betul betulkah
biasa biasanya bila bilakah bisa bisakah boleh bolehkah buat bukan bukankah bukanlah bukannya bulan bung cara caranya
cukup cukupkah cukuplah cuma dahulu dalam dan dapat dari daripada datang dekat demi demikian demikianlah dengan depan
di dia diakhiri diakhirinya dialah diantara diantaranya diberi diberikan diberikannya dibuat dibuatnya didapat
didatangkan digunakan diibaratkan diingat diingatkan diinginkan dijawab dijelaskan dijelaskannya dikarenakan dikatakan
dikatakannya dikerjakan diketahui diketahuinya dilakukan dilalui dilihat dimaksud dimaksudkan dimaksudkannya dimaksudnya
diminta dimintai dimisalkan dimulai dimulailah dimulainya dimungkinkan dini dipastikan diperbuat diperbuatnya
dipergunakan diperkirakan diperlihatkan diperlukan diperlukannya dipersoalkan dipertanyakan dipunyai diri dirinya
disampaikan disebut disebutkan disebutkannya disini disinilah ditambahkan ditandaskan ditanya ditanyai ditanyakan
ditegaskan ditujukan ditunjuk ditunjuki ditunjukkan ditunjukkannya ditunjuknya dong dua dulu empat enggak enggaknya
entah entahlah guna gunakan hal hampir hanya hanyalah hari harus haruslah harusnya hendak hendaklah hendaknya hingga ia
ialah ibarat ibaratkan ibaratnya ibu ikut ingat ingin inginkah inginkan ini inikah inilah itu itukah itulah jadi
jadilah jadinya jangan jangankan janganlah jauh jawab jawaban jawabnya jelas jelaskan jelaslah jelasnya jika jikalau
juga jumlah jumlahnya justru kala kalau kalaulah kalaupun kalian kami kamilah kamu kamulah kan kapan kapankah
kapanpun karena karenanya kasus kata katakan katakanlah katanya ke keadaan kebetulan kecil kedua keduanya keinginan
kelamaan kelihatan kelihatannya kelima keluar kembali kemudian kemungkinan kemungkinannya kenapa kepada kepadanya
kesampaian keseluruhan keseluruhannya keterlaluan ketika khususnya kini kinilah kira kiranya kita kitalah kok kurang
lagi lagian lah lain lainnya lalu lama lamanya lanjut lanjutnya lebih lewat lima luar macam maka makanya makin malah
malahan mampu mampukah mana manakala manalagi masa masalah masalahnya masih masihkah masing mau maupun melainkan
melakukan melalui melihat melihatnya memang memastikan memberi memberikan membuat memerlukan memihak meminta memintakan
memisalkan memperbuat mempergunakan memperkirakan memperlihatkan mempersiapkan mempersoalkan mempertanyakan mempunyai
memulai memungkinkan menaiki menambahkan menandaskan menanti menantikan menanya menanyai menanyakan mendapat
mendapatkan mendatang mendatangi mendatangkan menegaskan mengakhiri mengapa mengatakan mengatakannya mengenai
mengerjakan mengetahui menggunakan menghendaki mengibaratkan mengibaratkannya mengingat mengingatkan menginginkan
mengira mengucapkan mengucapkannya mengungkapkan menjadi menjawab menjelaskan menuju menunjuk menunjuki menunjukkan
menunjuknya menurut menuturkan menyampaikan menyangkut menyatakan menyebutkan menyeluruh menyiapkan merasa mereka
merekalah merupakan meski meskipun meyakini meyakinkan minta mirip misal misalkan misalnya mula mulai mulailah mulanya
mungkin mungkinkah nah naik namun nanti nantinya nyaris nyatanya oleh olehnya pada padahal padanya pak paling panjang
pantas para pasti pastilah penting pentingnya per percuma perlu perlukah perlunya pernah persoalan pertama pertanyaan
pertanyakan pihak pihaknya pukul pula pun punya rasa rasanya rata rupanya saat saatnya saja sajalah saling sama
sambil sampai sampaikan sana sangat sangatlah satu saya sayalah se sebab sebabnya sebagai sebagaimana sebagainya
sebagian sebaik sebaiknya sebaliknya sebanyak sebegini sebegitu sebelum sebelumnya sebenarnya seberapa sebesar sebetulnya
sebisanya sebuah sebut sebutlah sebutnya secara secukupnya sedang sedangkan sedemikian sedikit sedikitnya seenaknya
segala segalanya segera seharusnya sehingga seingat sejak sejauh sejenak sejumlah sekadar sekadarnya sekali sekalian
sekaligus sekalipun sekarang sekecil seketika sekiranya sekitar sekitarnya sekurangnya sela selain selaku selalu
selama selamanya selanjutnya seluruh seluruhnya semacam semakin semampu semampunya semasa semasih semata semaunya
sementara semisal semisalnya sempat semua semuanya semula sendiri sendirian sendirinya seolah seorang sepanjang
sepantasnya sepantasnyalah seperlunya seperti sepertinya sepihak sering seringnya serta serupa sesaat sesama sesampai
sesegera sesekali seseorang sesuatu sesuatunya sesudah sesudahnya setelah setempat setengah seterusnya setiap setiba
setibanya setidaknya setinggi seusai sewaktu siap siapa siapakah siapapun sini sinilah soal soalnya suatu sudah
sudahkah sudahlah supaya tadi tadinya tahu tahun tak tambah tambahnya tampak tampaknya tandas tandasnya tanpa tanya
tanyakan tanyanya tapi tegas tegasnya telah tempat tengah tentang tentu tentulah tentunya tepat terakhir terasa
terbanyak terdahulu terdapat terdiri terhadap terhadapnya teringat terjadi terjadilah terjadinya terkira terlalu
terlebih terlihat termasuk ternyata tersampaikan tersebut tersebutlah tertentu tertuju terus terutama tetap tetapi
tiap tiba tidak tidakkah tidaklah tiga tinggi toh tunjuk turut tutur tuturnya ucap ucapnya ujar ujarnya umum umumnya
ungkap ungkapnya untuk usah usai waduh wah wahai waktu waktunya walau walaupun wong yaitu yakin yakni yang
`;

export const STOPWORDS: ReadonlySet<string> = new Set(`${ENGLISH_STOPWORDS} ${INDONESIAN_STOPWORDS}`.split(/\s+/).filter(Boolean));

// Words the plural rule would damage (mostly Indonesian words ending in -s).
const LEMMA_EXCEPTIONS = new Set([
  "atlas", "alias", "bias", "canvas", "gas", "news", "series", "species", "lens", "proses", "kelas", "jelas", "bebas",
  "keras", "panas", "emas", "tugas", "kas", "ras", "beras", "teras", "lemas", "pantas", "tegas", "lepas", "batas", "tas",
  "das", "pas", "nanas", "berkas", "lugas", "kuras", "ruas", "tulus", "khas", "kertas", "paras", "puas", "luas", "naas",
]);

/** Simple plural lemmatisation: …ies → …y, strip a trailing -s except after -ss/-us/-is/-ous. */
export function lemmatize(word: string) {
  if (word.length <= 3 || LEMMA_EXCEPTIONS.has(word) || word.endsWith("itas")) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

const isWordUsable = (word: string) => word.length >= 3 && !/^\d+$/.test(word) && !STOPWORDS.has(word);

/** Lowercase, strip punctuation, drop short tokens / numbers / stopwords and lemmatise. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(isWordUsable)
    .map(lemmatize)
    .filter(isWordUsable);
}

/** Normalises input into lines; the co-occurrence window never crosses a line. */
export function toLines(input: string | TextLine[]): TextLine[] {
  const lines = typeof input === "string" ? [{ text: input }] : input;
  return lines.flatMap((line) => line.text.split(/\r?\n/).map((text) => ({ text, sourceId: line.sourceId })));
}

export function tokenizeLines(input: string | TextLine[]) {
  return toLines(input)
    .map((line) => ({ tokens: tokenize(line.text), sourceId: line.sourceId }))
    .filter((line) => line.tokens.length > 0);
}
