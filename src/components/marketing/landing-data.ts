export type AuthMode = "signin" | "signup";

export const roleSignals = [
  "Sales Team",
  "Customer Support",
  "HR Interview Prep",
  "Operations",
  "Business Development",
];

export const socialProof = [
  {
    quote:
      "Tim kami akhirnya punya pola latihan speaking yang konsisten dan mudah dievaluasi setiap minggu.",
    person: "Rina — Learning Lead",
  },
  {
    quote:
      "Feedback writing-nya jelas, jadi anggota tim tahu apa yang harus diperbaiki di sesi berikutnya.",
    person: "Dimas — Team Supervisor",
  },
  {
    quote:
      "Case-based flow membuat belajar bahasa asing terasa relevan dengan tantangan kerja harian.",
    person: "Tari — Program Manager",
  },
];

export const signupSteps = [
  {
    num: "01",
    title: "Setup team flow",
    description: "Buat akun pertama, siapkan case belajar, lalu tetapkan ritme latihan tim.",
  },
  {
    num: "02",
    title: "Activate practice",
    description: "Tim berlatih speaking dan writing dengan coach response yang adaptif.",
  },
  {
    num: "03",
    title: "Measure impact",
    description: "Pantau progres objective dan rekomendasi next drill tiap member.",
  },
];

export const signinSteps = [
  {
    num: "01",
    title: "Resume session",
    description: "Lanjutkan dari case dan target yang terakhir Anda kerjakan.",
  },
  {
    num: "02",
    title: "Practice deep",
    description: "Latihan speaking dan writing dengan respons coach adaptif di setiap turn.",
  },
  {
    num: "03",
    title: "Improve fast",
    description: "Lihat progres objective, skor, dan rekomendasi latihan lanjutan yang personal.",
  },
];

export function getHeroCopy(mode: AuthMode) {
  if (mode === "signup") {
    return {
      headline: "Bangun kultur belajar bahasa asing yang konsisten untuk tim Anda.",
      description:
        "Mulai dari satu akun admin, susun skenario latihan kerja nyata, lalu bantu tim berkembang lewat feedback speaking dan writing yang terstruktur.",
    };
  }

  return {
    headline: "Kembali lanjutkan latihan bahasa asing dari progres terbaik Anda.",
    description:
      "Masuk kembali ke Bolo Bule untuk melanjutkan turn latihan, membaca feedback terbaru, dan menjaga momentum peningkatan bahasa Anda setiap hari.",
  };
}
