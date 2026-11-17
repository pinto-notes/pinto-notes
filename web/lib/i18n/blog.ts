/// Translated blog posts, a pilot (17 November 2026). The English post stays the original; a translation
/// lives at /<lang>/blog/<its own slug>, written for the words people search in that language, and both
/// point at each other with hreflang. The app and the rest of the site stay in English, and every
/// translation says so where it offers the download. Read in blog-growth/BACKLOG.md (Languages).

import { de } from "./translations/de";
import { es } from "./translations/es";
import { fr } from "./translations/fr";
import { it } from "./translations/it";
import { pt } from "./translations/pt";

export const LANGS = ["es", "pt", "de", "fr", "it"] as const;
export type Lang = (typeof LANGS)[number];

/// What a translation is: the English post it translates, the language, its own slug, and its search
/// title and description in that language.
export type Translation = {
  of: string;
  lang: Lang;
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
};

/// Each language keeps its translations in its own file, lib/i18n/translations/<lang>.ts.
export const TRANSLATIONS: Translation[] = [...es, ...pt, ...de, ...fr, ...it];

export const localPath = (t: Pick<Translation, "lang" | "slug">) => `/${t.lang}/blog/${t.slug}`;

export function translation(lang: Lang, slug: string): Translation {
  const t = TRANSLATIONS.find((x) => x.lang === lang && x.slug === slug);
  if (!t) throw new Error(`No ${lang} translation with slug ${slug}`);
  return t;
}

export const translationsOf = (enSlug: string) => TRANSLATIONS.filter((t) => t.of === enSlug);

/// hreflang for a post and its translations: English, every translation, and English as x-default.
export function languagesFor(enSlug: string): Record<string, string> | undefined {
  const ts = translationsOf(enSlug);
  if (!ts.length) return undefined;
  return {
    en: `/blog/${enSlug}`,
    ...Object.fromEntries(ts.map((t) => [t.lang, localPath(t)])),
    "x-default": `/blog/${enSlug}`,
  };
}

export const OG_LOCALE: Record<Lang, string> = { es: "es_ES", pt: "pt_BR", de: "de_DE", fr: "fr_FR", it: "it_IT" };

/// The words around a translated post: the page's own frame, the download card and the closing band.
export type Ui = {
  blog: string;
  jumpTo: string;
  shortAnswer: string;
  questions: string;
  checked: (date: string) => string;
  writtenBy: string;
  maker: string;
  original: string;
  share: string;
  shareOn: (name: string) => string;
  copy: string;
  cta: {
    mac: string;
    iphone: string;
    send: string;
    iphoneSoon: string;
    iphoneSoonRest: string;
    other: string;
    otherRest: string;
    fineMac: string;
    fineIos: string;
    english: string;
  };
  closing: { title: string; text: string };
};

export const UI: Record<Lang, Ui> = {
  es: {
    blog: "Blog",
    jumpTo: "Ir a",
    shortAnswer: "La respuesta corta",
    questions: "Preguntas",
    checked: (d) => `Comprobado con la app el ${d}.`,
    writtenBy: "Escrito por",
    maker: "El creador de Pinto Notes.",
    original: "Leer en inglés",
    share: "Compartir este artículo",
    shareOn: (n) => `Compartir en ${n}`,
    copy: "Copiar",
    cta: {
      mac: "Descargar Pinto Notes para Mac",
      iphone: "Descargar para iPhone",
      send: "Enviarme el enlace",
      iphoneSoon: "La app para iPhone llegará pronto al App Store.",
      iphoneSoonRest: "Pinto Notes ya está en Mac: envíate el enlace para abrirlo allí.",
      other: "Pinto Notes es para iPhone y Mac.",
      otherRest: "Envíate el enlace para abrirlo en uno de ellos.",
      fineMac: "Gratis, para macOS 26 o posterior. Importar desde Notas solo lee tus notas; allí no cambia nada.",
      fineIos: "Gratis, para iOS 26 o posterior.",
      english: "La app está en inglés.",
    },
    closing: { title: "Trae tus notas de Apple contigo.", text: "Pinto Notes las importa en tu Mac de una vez y deja Notas tal como estaba." },
  },
  pt: {
    blog: "Blog",
    jumpTo: "Ir para",
    shortAnswer: "A resposta curta",
    questions: "Perguntas",
    checked: (d) => `Verificado no app em ${d}.`,
    writtenBy: "Escrito por",
    maker: "O criador do Pinto Notes.",
    original: "Ler em inglês",
    share: "Compartilhar este post",
    shareOn: (n) => `Compartilhar no ${n}`,
    copy: "Copiar",
    cta: {
      mac: "Baixar o Pinto Notes para Mac",
      iphone: "Baixar para iPhone",
      send: "Enviar o link para mim",
      iphoneSoon: "O app para iPhone chega em breve à App Store.",
      iphoneSoonRest: "O Pinto Notes já está no Mac: envie o link para você e abra lá.",
      other: "O Pinto Notes é para iPhone e Mac.",
      otherRest: "Envie o link para você e abra em um deles.",
      fineMac: "Grátis, para macOS 26 ou posterior. A importação do app Notas só lê suas notas; nada muda lá.",
      fineIos: "Grátis, para iOS 26 ou posterior.",
      english: "O app está em inglês.",
    },
    closing: { title: "Leve suas notas do Apple Notas com você.", text: "O Pinto Notes importa tudo no seu Mac de uma vez e deixa o app Notas como estava." },
  },
  de: {
    blog: "Blog",
    jumpTo: "Springe zu",
    shortAnswer: "Die kurze Antwort",
    questions: "Fragen",
    checked: (d) => `Mit der App geprüft am ${d}.`,
    writtenBy: "Geschrieben von",
    maker: "Der Entwickler von Pinto Notes.",
    original: "Auf Englisch lesen",
    share: "Diesen Beitrag teilen",
    shareOn: (n) => `Auf ${n} teilen`,
    copy: "Kopieren",
    cta: {
      mac: "Pinto Notes für Mac laden",
      iphone: "Für iPhone laden",
      send: "Link an mich senden",
      iphoneSoon: "Die iPhone-App kommt bald in den App Store.",
      iphoneSoonRest: "Pinto Notes gibt es schon für Mac: Schick dir den Link und öffne ihn dort.",
      other: "Pinto Notes ist für iPhone und Mac.",
      otherRest: "Schick dir den Link und öffne ihn auf einem davon.",
      fineMac: "Kostenlos, für macOS 26 oder neuer. Der Import aus Notizen liest nur; dort ändert sich nichts.",
      fineIos: "Kostenlos, für iOS 26 oder neuer.",
      english: "Die App ist auf Englisch.",
    },
    closing: { title: "Nimm deine Apple Notizen mit.", text: "Pinto Notes importiert sie auf deinem Mac in einem Schritt und lässt Notizen, wie es war." },
  },
  fr: {
    blog: "Blog",
    jumpTo: "Aller à",
    shortAnswer: "La réponse courte",
    questions: "Questions",
    checked: (d) => `Vérifié avec l’app le ${d}.`,
    writtenBy: "Écrit par",
    maker: "Le créateur de Pinto Notes.",
    original: "Lire en anglais",
    share: "Partager cet article",
    shareOn: (n) => `Partager sur ${n}`,
    copy: "Copier",
    cta: {
      mac: "Télécharger Pinto Notes pour Mac",
      iphone: "Télécharger pour iPhone",
      send: "M’envoyer le lien",
      iphoneSoon: "L’app iPhone arrive bientôt sur l’App Store.",
      iphoneSoonRest: "Pinto Notes est déjà sur Mac : envoyez-vous le lien pour l’ouvrir là-bas.",
      other: "Pinto Notes est fait pour iPhone et Mac.",
      otherRest: "Envoyez-vous le lien pour l’ouvrir sur l’un d’eux.",
      fineMac: "Gratuit, pour macOS 26 ou ultérieur. L’import depuis Notes ne fait que lire ; rien n’y change.",
      fineIos: "Gratuit, pour iOS 26 ou ultérieur.",
      english: "L’app est en anglais.",
    },
    closing: { title: "Emportez vos notes Apple avec vous.", text: "Pinto Notes les importe sur votre Mac en une fois et laisse Notes tel quel." },
  },
  it: {
    blog: "Blog",
    jumpTo: "Vai a",
    shortAnswer: "La risposta breve",
    questions: "Domande",
    checked: (d) => `Verificato con l’app il ${d}.`,
    writtenBy: "Scritto da",
    maker: "Il creatore di Pinto Notes.",
    original: "Leggi in inglese",
    share: "Condividi questo articolo",
    shareOn: (n) => `Condividi su ${n}`,
    copy: "Copia",
    cta: {
      mac: "Scarica Pinto Notes per Mac",
      iphone: "Scarica per iPhone",
      send: "Inviami il link",
      iphoneSoon: "L’app per iPhone arriva presto sull’App Store.",
      iphoneSoonRest: "Pinto Notes è già su Mac: inviati il link per aprirlo lì.",
      other: "Pinto Notes è per iPhone e Mac.",
      otherRest: "Inviati il link per aprirlo su uno dei due.",
      fineMac: "Gratis, per macOS 26 o successivo. L’importazione da Note legge soltanto; lì non cambia nulla.",
      fineIos: "Gratis, per iOS 26 o successivo.",
      english: "L’app è in inglese.",
    },
    closing: { title: "Porta con te le tue note di Apple.", text: "Pinto Notes le importa sul tuo Mac in un colpo solo e lascia Note com’era." },
  },
};

/// A date the way the language writes it: "17 de noviembre de 2026", "17. November 2026".
export function localDate(lang: Lang, iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
}
