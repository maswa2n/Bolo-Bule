export type ResponseSupportGuide = {
  english: string;
  ejaan: string;
  meaningId: string;
};

const KNOWN_RESPONSE_GUIDES: Record<string, Pick<ResponseSupportGuide, "ejaan" | "meaningId">> = {
  "Please share the latest tracking status.": {
    ejaan: "Plis ser da let-est trek-king sta-tus.",
    meaningId: "Tolong bagikan status pelacakan terbaru.",
  },
  "Could you confirm where the shipment is right now?": {
    ejaan: "Kud yu kon-firm wer da ship-ment is rait nau?",
    meaningId: "Bisakah Anda konfirmasi di mana pengiriman berada saat ini?",
  },
  "We need factual status before we update operations.": {
    ejaan: "Wi nid fak-tu-el sta-tus bi-for wi ap-det o-pe-rei-shens.",
    meaningId: "Kami butuh status faktual sebelum memperbarui operasional.",
  },
  "This delay is affecting planned maintenance.": {
    ejaan: "Dis de-lei is a-fek-ting planed men-ten-ens.",
    meaningId: "Keterlambatan ini memengaruhi perawatan yang sudah dijadwalkan.",
  },
  "Our operations are on standby without this part.": {
    ejaan: "Aur o-pe-rei-shens ar on stand-bai wi-daut dis part.",
    meaningId: "Operasional kami standby karena suku cadang ini belum tersedia.",
  },
  "The project schedule may shift if it arrives late.": {
    ejaan: "Da pro-jek ske-jul mei shift if it a-raivs leit.",
    meaningId: "Jadwal proyek bisa bergeser jika barang datang terlambat.",
  },
  "Can you commit delivery before 3 PM today?": {
    ejaan: "Ken yu ko-mit de-li-vri bi-for tiri pi-em tu-dei?",
    meaningId: "Bisakah Anda komit pengiriman sebelum pukul 15.00 hari ini?",
  },
  "Please provide a specific confirmed delivery time.": {
    ejaan: "Plis pro-vaid a spe-si-fik kon-firmd de-li-vri taim.",
    meaningId: "Tolong berikan waktu pengiriman spesifik yang sudah dikonfirmasi.",
  },
  "We need a firm commitment for today's arrival.": {
    ejaan: "Wi nid a ferm ko-mit-ment for tu-deis a-rai-val.",
    meaningId: "Kami butuh komitmen tegas untuk kedatangan hari ini.",
  },
  "Let's agree on a written update at 2 PM.": {
    ejaan: "Lets a-gri on a ri-ten ap-det et tiu pi-em.",
    meaningId: "Mari sepakat update tertulis pada pukul 14.00.",
  },
  "Please send a tracking update in our coordination group.": {
    ejaan: "Plis send a trek-king ap-det in aur ko-or-di-nei-shen grup.",
    meaningId: "Tolong kirim update pelacakan di grup koordinasi kami.",
  },
  "Call immediately if there is any change in commitment.": {
    ejaan: "Kol i-mi-di-et-li if der is e-ni cheinj in ko-mit-ment.",
    meaningId: "Segera telepon jika ada perubahan pada komitmen.",
  },
  "Could you confirm the latest status first?": {
    ejaan: "Kud yu kon-firm da let-est sta-tus ferst?",
    meaningId: "Bisakah Anda konfirmasi status terbaru terlebih dahulu?",
  },
  "This is affecting our operations, so we need a clear commitment.": {
    ejaan: "Dis is a-fek-ting aur o-pe-rei-shens, so wi nid a klir ko-mit-ment.",
    meaningId: "Ini memengaruhi operasional kami, jadi kami butuh komitmen yang jelas.",
  },
  "Please provide the follow-up time and communication channel.": {
    ejaan: "Plis pro-vaid da fo-lou-ap taim end ko-myu-ni-kei-shen cha-nel.",
    meaningId: "Tolong berikan waktu follow-up dan kanal komunikasi.",
  },
};

const TRANSLATION_LEXICON: Record<string, string> = {
  a: "",
  an: "",
  the: "",
  i: "saya",
  we: "kami",
  you: "Anda",
  he: "dia",
  she: "dia",
  they: "mereka",
  it: "ini",
  my: "saya",
  our: "kami",
  your: "Anda",
  their: "mereka",
  me: "saya",
  us: "kami",
  please: "tolong",
  could: "bisakah",
  can: "bisakah",
  would: "apakah",
  will: "akan",
  do: "",
  does: "",
  did: "",
  am: "",
  is: "adalah",
  are: "adalah",
  was: "",
  were: "",
  be: "adalah",
  been: "telah",
  have: "memiliki",
  has: "memiliki",
  had: "memiliki",
  need: "butuh",
  needs: "butuh",
  needed: "butuh",
  want: "ingin",
  wanted: "ingin",
  get: "mendapatkan",
  got: "mendapatkan",
  make: "membuat",
  made: "membuat",
  take: "mengambil",
  took: "mengambil",
  give: "memberikan",
  gave: "memberikan",
  keep: "menjaga",
  let: "mari",
  lets: "mari",
  confirm: "konfirmasi",
  confirmed: "dikonfirmasi",
  share: "bagikan",
  provide: "berikan",
  send: "kirim",
  call: "telepon",
  agree: "sepakat",
  commit: "komit",
  update: "pembaruan",
  follow: "tindak lanjut",
  up: "",
  latest: "terbaru",
  current: "saat ini",
  status: "status",
  delivery: "pengiriman",
  shipment: "pengiriman",
  commitment: "komitmen",
  expectation: "ekspektasi",
  expectations: "ekspektasi",
  operation: "operasional",
  operations: "operasional",
  maintenance: "perawatan",
  schedule: "jadwal",
  project: "proyek",
  impact: "dampak",
  delay: "keterlambatan",
  team: "tim",
  vendor: "vendor",
  part: "suku cadang",
  tracking: "pelacakan",
  communication: "komunikasi",
  channel: "kanal",
  coordination: "koordinasi",
  group: "grup",
  arrival: "kedatangan",
  time: "waktu",
  today: "hari ini",
  tomorrow: "besok",
  before: "sebelum",
  after: "setelah",
  from: "dari",
  to: "ke",
  for: "untuk",
  with: "dengan",
  without: "tanpa",
  in: "di",
  on: "pada",
  at: "pada",
  about: "tentang",
  if: "jika",
  when: "ketika",
  where: "di mana",
  why: "mengapa",
  how: "bagaimana",
  what: "apa",
  which: "yang mana",
  this: "ini",
  that: "itu",
  these: "ini",
  those: "itu",
  there: "ada",
  here: "di sini",
  now: "sekarang",
  first: "terlebih dahulu",
  then: "kemudian",
  so: "jadi",
  and: "dan",
  or: "atau",
  but: "tetapi",
  because: "karena",
  any: "ada",
  some: "beberapa",
  all: "semua",
  not: "tidak",
  no: "tidak ada",
  clear: "jelas",
  unclear: "tidak jelas",
  specific: "spesifik",
  firm: "tegas",
  factual: "faktual",
  planned: "terencana",
  written: "tertulis",
  immediate: "segera",
  immediately: "segera",
  late: "terlambat",
  right: "tepat",
  affecting: "memengaruhi",
  change: "perubahan",
  may: "bisa",
  might: "bisa",
  still: "masih",
  already: "sudah",
  just: "baru saja",
  only: "hanya",
  very: "sangat",
  more: "lebih",
  most: "paling",
  new: "baru",
  old: "lama",
  good: "baik",
  bad: "buruk",
  high: "tinggi",
  low: "rendah",
  work: "pekerjaan",
  properly: "dengan benar",
  prioritize: "memprioritaskan",
  think: "rasa",
  thought: "rasa",
  overwhelmed: "kewalahan",
  overwhelm: "kewalahan",
  task: "tugas",
  tasks: "tugas",
  workload: "beban kerja",
  busy: "sibuk",
  feel: "merasa",
  felt: "merasa",
  stand: "standby",
  standby: "standby",
  shift: "bergeser",
  arrives: "datang",
  arrive: "datang",
};

const EXACT_SENTENCE_TRANSLATIONS: Record<string, string> = {
  "i had unclear expectations from the team": "Saya memiliki ekspektasi yang tidak jelas dari tim.",
  "i think i was overwhelmed with tasks": "Saya rasa saya kewalahan dengan tugas.",
  "this is affecting our operations so we need a clear commitment":
    "Ini memengaruhi operasional kami, jadi kami butuh komitmen yang jelas.",
};

function normalizeTranslationKey(text: string): string {
  return normalizePhraseKey(text);
}

const ADJECTIVE_MARKERS = new Set([
  "jelas",
  "tidak jelas",
  "spesifik",
  "terbaru",
  "tegas",
  "faktual",
  "terencana",
  "tertulis",
  "segera",
  "tepat",
  "baru",
  "lama",
  "baik",
  "buruk",
  "tinggi",
  "rendah",
  "terlambat",
]);

const COMMON_WORD_EJAAN: Record<string, string> = {
  a: "a",
  an: "en",
  and: "end",
  are: "ar",
  at: "et",
  before: "bi-for",
  can: "ken",
  could: "kud",
  for: "for",
  if: "if",
  in: "in",
  is: "is",
  it: "it",
  lets: "lets",
  may: "mei",
  my: "mai",
  need: "nid",
  on: "on",
  or: "or",
  our: "aur",
  please: "plis",
  right: "rait",
  send: "send",
  share: "ser",
  so: "so",
  the: "da",
  there: "der",
  this: "dis",
  to: "tu",
  today: "tu-dei",
  todays: "tu-deis",
  we: "wi",
  where: "wer",
  without: "wi-daut",
  you: "yu",
  your: "yor",
  i: "ai",
};

function expandContractions(word: string): string {
  const lower = word.toLowerCase();
  const map: Record<string, string> = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "can't": "can not",
    "won't": "will not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "let's": "lets",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "you're": "you are",
    "i'm": "i am",
  };
  return map[lower] ?? lower;
}

function phoneticizeWord(rawWord: string): string {
  const exact = COMMON_WORD_EJAAN[rawWord.toLowerCase()];
  if (exact) return exact;

  let word = rawWord.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!word) return rawWord;

  const suffixRules: Array<[RegExp, string]> = [
    [/tion$/g, "syen"],
    [/sion$/g, "syen"],
    [/ture$/g, "cher"],
    [/ment$/g, "ment"],
    [/ness$/g, "nes"],
    [/able$/g, "e-bel"],
    [/ible$/g, "i-bel"],
    [/ing$/g, "ing"],
    [/ly$/g, "li"],
    [/ed$/g, "ed"],
  ];

  const coreRules: Array<[RegExp, string]> = [
    [/ough/g, "of"],
    [/ight/g, "ait"],
    [/eigh/g, "ei"],
    [/tion/g, "syen"],
    [/sion/g, "syen"],
    [/ture/g, "cher"],
    [/ph/g, "f"],
    [/wh/g, "w"],
    [/th/g, "t"],
    [/sh/g, "s"],
    [/ch/g, "c"],
    [/ck/g, "k"],
    [/wr/g, "r"],
    [/kn/g, "n"],
    [/mb$/g, "m"],
    [/oo/g, "u"],
    [/ee/g, "i"],
    [/ea/g, "i"],
    [/ou/g, "au"],
    [/ow/g, "au"],
    [/oi/g, "oi"],
    [/oy/g, "oi"],
    [/ai/g, "ei"],
    [/ay/g, "ei"],
    [/ey/g, "ei"],
    [/au/g, "o"],
    [/aw/g, "o"],
    [/c(?=[eiy])/g, "s"],
    [/c/g, "k"],
    [/gh/g, "g"],
    [/x/g, "ks"],
    [/qu/g, "kw"],
  ];

  for (const [pattern, replacement] of coreRules) {
    word = word.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of suffixRules) {
    word = word.replace(pattern, replacement);
  }

  return word;
}

function splitIntoSyllables(phonetic: string): string {
  const cleaned = phonetic.replace(/-/g, "");
  if (cleaned.length <= 2) return cleaned;

  const vowels = new Set(["a", "e", "i", "o", "u"]);
  const syllables: string[] = [];
  let index = 0;

  while (index < cleaned.length) {
    const syllableStart = index;

    while (index < cleaned.length && !vowels.has(cleaned[index])) {
      index += 1;
    }

    if (index >= cleaned.length) {
      if (syllables.length > 0) {
        syllables[syllables.length - 1] += cleaned.slice(syllableStart);
      } else {
        syllables.push(cleaned.slice(syllableStart));
      }
      break;
    }

    let vowelEnd = index;
    while (vowelEnd < cleaned.length && vowels.has(cleaned[vowelEnd])) {
      vowelEnd += 1;
    }

    let syllableEnd = vowelEnd;
    const trailing = cleaned.slice(vowelEnd);
    const consonantCluster = trailing.match(/^[bcdfghjklmnpqrstvwxyz]+/)?.[0] ?? "";

    if (consonantCluster.length >= 2) {
      syllableEnd = vowelEnd + 1;
    } else if (consonantCluster.length === 1 && vowelEnd + 1 < cleaned.length) {
      const nextChar = cleaned[vowelEnd + 1];
      if (vowels.has(nextChar)) {
        syllableEnd = vowelEnd;
      } else {
        syllableEnd = vowelEnd + 1;
      }
    } else {
      syllableEnd = cleaned.length;
    }

    syllables.push(cleaned.slice(syllableStart, syllableEnd));
    index = syllableEnd;
  }

  return syllables.filter(Boolean).join("-");
}

function wordToEjaan(rawWord: string): string {
  const trailingPunctuation = rawWord.match(/[.,!?;:]+$/)?.[0] ?? "";
  const wordBody = rawWord.replace(/[.,!?;:]+$/, "");
  const expanded = expandContractions(wordBody);

  if (/\s/.test(expanded)) {
    return expanded
      .split(/\s+/)
      .map((part) => wordToEjaan(part))
      .join(" ")
      .concat(trailingPunctuation);
  }

  const exact = COMMON_WORD_EJAAN[expanded.toLowerCase()];
  if (exact) return exact + trailingPunctuation;

  const phonetic = phoneticizeWord(expanded);
  const syllabified = splitIntoSyllables(phonetic);
  return syllabified + trailingPunctuation;
}

export function englishToIndonesianEjaan(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => (token.trim() ? wordToEjaan(token) : token))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeEnglish(text: string): string[] {
  const expanded = text
    .replace(/\bfollow-up\b/gi, "follow up")
    .replace(/\btoday's\b/gi, "today")
    .replace(/[.,!?;:]+/g, " ");

  return expanded
    .split(/\s+/)
    .flatMap((token) => expandContractions(token).split(/\s+/))
    .filter(Boolean);
}

function translateToken(token: string): string {
  const lower = token.toLowerCase();
  if (TRANSLATION_LEXICON[lower] !== undefined) {
    return TRANSLATION_LEXICON[lower];
  }

  if (lower.endsWith("ing") && TRANSLATION_LEXICON[lower.slice(0, -3)]) {
    return TRANSLATION_LEXICON[lower.slice(0, -3)];
  }
  if (lower.endsWith("ed") && TRANSLATION_LEXICON[lower.slice(0, -2)]) {
    return TRANSLATION_LEXICON[lower.slice(0, -2)];
  }
  if (lower.endsWith("s") && lower.length > 3 && TRANSLATION_LEXICON[lower.slice(0, -1)]) {
    return TRANSLATION_LEXICON[lower.slice(0, -1)];
  }

  return "";
}

function polishIndonesianWords(words: string[]): string[] {
  const polished: string[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const current = words[index];
    const next = words[index + 1];
    const afterNext = words[index + 2];

    if (current === "adalah" && next && !["saya", "kami", "anda", "ini", "itu", "mereka"].includes(next)) {
      continue;
    }

    if (current === "tidak" && next === "jelas" && afterNext) {
      polished.push(`${afterNext} yang tidak jelas`);
      index += 2;
      continue;
    }

    if (ADJECTIVE_MARKERS.has(current) && next) {
      polished.push(`${next} yang ${current}`);
      index += 1;
      continue;
    }

    polished.push(current);
  }

  return polished.filter(Boolean);
}

export function normalizePhraseKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.!?;:]+$/g, "")
    .replace(/\s+/g, " ");
}

export function getKnownPhraseMeaning(english: string): string | null {
  const trimmed = english.trim();
  if (!trimmed) return null;

  const known = KNOWN_RESPONSE_GUIDES[trimmed];
  if (known?.meaningId) return known.meaningId;

  const exact = EXACT_SENTENCE_TRANSLATIONS[normalizeTranslationKey(trimmed)];
  return exact ?? null;
}

export function translateEnglishToIndonesian(text: string): string {
  const key = normalizeTranslationKey(text);
  const exact = EXACT_SENTENCE_TRANSLATIONS[key];
  if (exact) return exact;

  const rawWords = tokenizeEnglish(text);
  const translated = rawWords.map(translateToken).filter(Boolean);
  const polished = polishIndonesianWords(translated);
  const sentence = polished.join(" ").replace(/\s+/g, " ").trim();

  if (!sentence) {
    return text.trim();
  }

  const endsWithQuestion = text.trim().endsWith("?");
  const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return endsWithQuestion ? `${capitalized}?` : `${capitalized}.`;
}

export function getResponseSupportGuide(english: string): ResponseSupportGuide {
  const trimmed = english.trim();
  const known = KNOWN_RESPONSE_GUIDES[trimmed];

  if (known) {
    return {
      english: trimmed,
      ejaan: known.ejaan,
      meaningId: known.meaningId,
    };
  }

  return {
    english: trimmed,
    ejaan: englishToIndonesianEjaan(trimmed),
    meaningId: translateEnglishToIndonesian(trimmed),
  };
}
