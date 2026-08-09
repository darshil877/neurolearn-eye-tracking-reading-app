// Phonics exercise generator.
// In production this would call the Supabase `generate-story` Edge Function,
// which proxies to Gemini/Claude with the API key hidden server-side, and
// caches results in Postgres. For the single-file demo we return a
// deterministic, hand-authored set keyed off the story's language so the
// phonics game works without network.

import type { LangCode } from "./config";

export type PhonicsQuestion = {
  prompt: string;
  // four options, one is the target word that was struggled with
  options: string[];
  answer: string;
};

export type PhonicsExercise = {
  title: string;
  instructions: string;
  questions: PhonicsQuestion[];
};

const PHONICS_BANK: Record<LangCode, Record<string, PhonicsQuestion[]>> = {
  en: {
    Chinki: [
      {
        prompt: "Which word is 'Chinki'?",
        options: ["Chinki", "Chimney", "Camel", "Chilli"],
        answer: "Chinki",
      },
    ],
    rabbit: [
      {
        prompt: "Which word is 'rabbit'?",
        options: ["rabbit", "radish", "rocket", "ribbon"],
        answer: "rabbit",
      },
    ],
    rolled: [
      {
        prompt: "Which word matches 'rolled'?",
        options: ["rolled", "robin", "ruler", "rowboat"],
        answer: "rolled",
      },
    ],
    picked: [
      {
        prompt: "Which word is 'picked'?",
        options: ["picked", "picnic", "piano", "pocket"],
        answer: "picked",
      },
    ],
    happy: [
      {
        prompt: "Which word is 'happy'?",
        options: ["happy", "hammer", "honey", "harbor"],
        answer: "happy",
      },
    ],
  },
  hi: {
    गेंद: [
      {
        prompt: "कौन सा शब्द 'गेंद' है?",
        options: ["गेंद", "गमला", "गाड़ी", "घर"],
        answer: "गेंद",
      },
    ],
    खरगोश: [
      {
        prompt: "'खरगोश' कौन सा है?",
        options: ["खरगोश", "खरबूज", "खाना", "खेल"],
        answer: "खरगोश",
      },
    ],
    लुढ़क: [
      {
        prompt: "कौन सा शब्द 'लुढ़क' से मेल खाता है?",
        options: ["लुढ़क", "लड़का", "लाल", "लेख"],
        answer: "लुढ़क",
      },
    ],
    उठा: [
      {
        prompt: "'उठा' कौन सा है?",
        options: ["उठा", "उल्लू", "ऊंट", "उदास"],
        answer: "उठा",
      },
    ],
    खुश: [
      {
        prompt: "'खुश' कौन सा है?",
        options: ["खुश", "खबर", "खाना", "खेल"],
        answer: "खुश",
      },
    ],
  },
  ta: {
    பந்த: [
      {
        prompt: "இந்த வார்த்தை 'பந்து' எது?",
        options: ["பந்து", "பட்டம்", "பசு", "பழம்"],
        answer: "பந்து",
      },
    ],
  },
  mr: {
    चेंडू: [
      {
        prompt: "'चेंडू' कोणता शब्द आहे?",
        options: ["चेंडू", "चमचा", "चहा", "चांदण"],
        answer: "चेंडू",
      },
    ],
  },
};

const FALLBACK_EN: PhonicsQuestion[] = [
  {
    prompt: "Which word is 'rabbit'?",
    options: ["rabbit", "radish", "rocket", "ribbon"],
    answer: "rabbit",
  },
  {
    prompt: "Choose the word that is 'rolled':",
    options: ["robin", "rolled", "ruler", "rocket"],
    answer: "rolled",
  },
  {
    prompt: "Which word is 'Chinki'?",
    options: ["Chimney", "Chinki", "Camel", "Chilli"],
    answer: "Chinki",
  },
];

const FALLBACK_HI: PhonicsQuestion[] = [
  {
    prompt: "कौन सा शब्द 'खरगोश' है?",
    options: ["खरगोश", "खरबूज", "खिड़की", "खाना"],
    answer: "खरगोश",
  },
  {
    prompt: "जो शब्द 'गेंद' है उसे चुनो:",
    options: ["गमला", "गेंद", "गाड़ी", "गीत"],
    answer: "गेंद",
  },
];

export async function generatePhonics(
  lang: LangCode,
  struggledWords: string[]
): Promise<PhonicsExercise> {
  // 600ms delay to simulate API call
  await new Promise((r) => setTimeout(r, 600));
  const bank = PHONICS_BANK[lang] || PHONICS_BANK.hi;
  const fallback = lang === "en" ? FALLBACK_EN : FALLBACK_HI;
  const questions: PhonicsQuestion[] = [];
  for (const w of struggledWords) {
    if (bank[w]) questions.push(...bank[w]);
  }
  if (questions.length === 0) {
    questions.push(...(Object.values(bank).flat().slice(0, 3) || fallback));
  }
  // Ensure at least 3 questions
  if (questions.length < 3) {
    questions.push(...fallback);
  }
  return {
    title:
      lang === "ta"
        ? "ஒலி பயிற்சி"
        : lang === "mr"
          ? "ध्वनी सराव"
          : lang === "en"
            ? "Phonics Fun"
            : "ध्वनि अभ्यास",
    instructions:
      lang === "ta"
        ? "சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்"
        : lang === "mr"
          ? "योग्य शब्द निवडा"
          : lang === "en"
            ? "Pick the matching word. Don't worry — getting it wrong is totally fine!"
            : "सही शब्द चुनो — चिंता मत करो, गलती होना सामान्य है!",
    questions: questions.slice(0, 5),
  };
}
