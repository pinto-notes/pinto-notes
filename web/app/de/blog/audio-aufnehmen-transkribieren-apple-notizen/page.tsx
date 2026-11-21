import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "audio-aufnehmen-transkribieren-apple-notizen");

// German version of /blog/apple-notes-record-and-transcribe, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „apple notizen audio transkribieren“,
// „iphone notizen audio transkribieren“, „mac notizen audio transkribieren“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios,
// https://support.apple.com/de-de/guide/notes/record-and-transcribe-audio-apdb5106e334/mac
// („Audio aufnehmen“, „In Transkript suchen“, „Transkript zu Notiz hinzufügen“, „Transkript kopieren“, „Zusammenfassung“),
// https://support.apple.com/de-de/guide/iphone/record-and-transcribe-a-call-iph57c6590e9/ios,
// https://support.apple.com/de-de/121115. Icon-only controls are described by their action.

const ui = UI.de;
const FOLLOW_UP = `Nutze meine Notiz "Meeting-Protokoll" in Pinto Notes. Ich füge gleich ein Transkript ein.
Trage Name und Datum des Meetings, eine Zusammenfassung in zwei Zeilen und die Beschlüsse unter "Meetings" ein, das neueste zuerst.
Schreibe jede Aufgabe als Checklistenpunkt unter "Aufgaben": "Verantwortlich: Aufgabe (Termin)".
Frag nach, bevor du etwas einträgst, wenn eine Angabe unklar ist.`;
const faq = [
  { q: "Braucht die Transkription Apple Intelligence?", a: ["Nein. Sie funktioniert ab iPhone 12 oder auf einem Mac mit M1 und einer unterstützten Gerätesprache. Für eine automatische Zusammenfassung brauchst du Apple Intelligence."] },
  { q: "Wo landen Aufnahmen von Telefonaten?", a: ["Im Ordner für Anrufaufnahmen in Notizen. Die Aufnahme beginnt in der Telefon-App. Beide Personen hören einen Hinweis. Die Funktion ist nicht in jeder Region verfügbar, auch nicht in der EU."] },
  { q: "Kann ich während der Aufnahme schreiben?", a: ["Ja. Auf dem iPhone streichst du vom oberen Rand des Aufnahmebildschirms nach unten. Auf dem Mac bearbeitest du die Notiz während der Aufnahme."] },
  { q: "Bleibt das Transkript erhalten, wenn ich Audio lösche?", a: ["Nein. Apple löscht mit der Audioaufnahme auch das Transkript. Füge es vorher zur Notiz hinzu oder kopiere es."] },
];

export default function Page() {
  return <LocalPostPage lang="de" slug="audio-aufnehmen-transkribieren-apple-notizen"
    intro={<>In Apple Notizen kannst du Audio direkt in einer Notiz aufnehmen. Tippe auf die Anhang-Taste und „Audio aufnehmen“. Für ein Transkript brauchst du mindestens ein iPhone 12 oder einen Mac mit M1 sowie eine unterstützte Sprache.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#iphone", label: "iPhone" }, { href: "#mac", label: "Mac" },
      { href: "#voraussetzungen", label: "Voraussetzungen" }, { href: "#transkript", label: "Transkript nutzen" },
      { href: "#anrufe", label: "Anrufe" }, { href: "#pinto", label: "Meeting-Protokoll" },
    ]}>
      <p>Starte die Aufnahme in einer Notiz. Unterstützte Sprache wird transkribiert. Den Text kannst du in die Notiz übernehmen oder kopieren. Für die Transkription ist Apple Intelligence nicht nötig, für eine Zusammenfassung schon.</p>
      <PostCta slug="de/audio-aufnehmen-transkribieren-apple-notizen" path="/de/blog/audio-aufnehmen-transkribieren-apple-notizen" position="answer" ui={ui.cta} template="meeting-notes" title="Aus dem Transkript Aufgaben machen">
        <p>Pinto Notes ist auf Englisch und hat eine kostenlose Vorlage für Meeting-Protokolle. Füge das Transkript ein. Verbundenes ChatGPT oder Claude kann daraus Zusammenfassung, Beschlüsse und Aufgaben mit Namen und Terminen schreiben.</p>
      </PostCta>
    </Answer>} hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Apple Notizen auf dem Mac mit Audioaufnahme, Transkriptvorschau und Zusammenfassung einer Vorlesung." caption="Audioaufnahme und Transkriptvorschau in Apple Notizen auf dem Mac. Bild: Apple." />} faq={faq}>
    <h2 id="iphone">Auf dem iPhone aufnehmen und transkribieren</h2>
    <Steps><li>Öffne eine Notiz. Tippe auf die Anhang-Taste und „Audio aufnehmen“.</li><li>Tippe auf die Aufnahmetaste. Über die Transkript-Taste siehst du den Text während der Aufnahme.</li><li>Streiche von oben nach unten, wenn du gleichzeitig etwas in die Notiz schreiben willst.</li><li>Pausiere die Aufnahme und beende sie danach über die angezeigte Taste.</li></Steps>
    <p>Apples <a href="https://support.apple.com/de-de/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios">iPhone-Anleitung</a> zeigt die Tasten. Notiere Beschlüsse während des Gesprächs und prüfe Namen später gegen das Audio.</p>
    <h2 id="mac">Auf dem Mac aufnehmen</h2>
    <Steps><li>Klicke in einer Notiz in der Symbolleiste auf die Anhang-Taste und wähle „Audio aufnehmen“.</li><li>Starte die Aufnahme. Du kannst die Notiz dabei weiter bearbeiten.</li><li>Öffne bei Bedarf das Live-Transkript. Pausiere und beende anschließend die Aufnahme.</li></Steps>
    <p>Um das Transkript später zu öffnen, doppelklicke die Aufnahme und klicke auf die Transkript-Taste. Apple beschreibt das in der <a href="https://support.apple.com/de-de/guide/notes/record-and-transcribe-audio-apdb5106e334/mac">Mac-Anleitung</a>. Bei Accounts anderer Anbieter können Funktionen fehlen; die Anleitung gilt vollständig für iCloud-Notizen.</p>
    <h2 id="voraussetzungen">Geräte und Sprachen</h2>
    <p>Apple nennt für die Transkription iPhone 12 oder neuer und Mac mit M1 oder neuer. Als Gerätesprachen nennt es Deutsch, Englisch, Spanisch, Portugiesisch, Italienisch, Französisch, Japanisch, Koreanisch sowie vereinfachtes und traditionelles Chinesisch. Für Englisch gelten auf dem Mac bestimmte Landesvarianten. Fehlt die Transkript-Taste, prüfe Gerät und erkannte Sprache.</p>
    <p>Für „Zusammenfassung“ brauchst du ein <a href="https://support.apple.com/de-de/121115">Apple Intelligence-fähiges Gerät</a> und passende Geräte- und Siri-Sprachen. Die verfügbaren Sprachen für Zusammenfassungen und Anruftranskripte sind nicht dieselbe Liste wie für Notiz-Audio. <a href="/de/blog/apple-notizen-ki">Apple Intelligence in Notizen</a> erklärt die Einrichtung.</p>
    <h2 id="transkript">Den aufgenommenen Text verwenden</h2>
    <p>Öffne die Aufnahme und ihr Transkript. Im Menü findest du „Transkript zu Notiz hinzufügen“, „Transkript kopieren“ und „In Transkript suchen“. Ein Klick auf eine Textstelle spielt die passende Audiostelle. Auf einem unterstützten Gerät öffnest du auch „Zusammenfassung“. Prüfe Namen und Beschlüsse am Audio, bevor du sie weitergibst.</p>
    <h2 id="anrufe">Telefonate aufnehmen</h2>
    <p>Telefonate startest du in der Telefon-App, nicht in Notizen. Apples <a href="https://support.apple.com/de-de/guide/iphone/record-and-transcribe-a-call-iph57c6590e9/ios">Anruf-Anleitung</a> nennt regionale Einschränkungen; in der EU ist die Funktion nicht verfügbar. Wo sie verfügbar ist, hören beide Beteiligten einen Hinweis. Nach dem Beenden landet die Aufnahme im Ordner für Anrufaufnahmen in Notizen. Ein Transkript kann etwas später erscheinen und unterscheidet die Sprecher. Für aufgezeichnete Telefon- und FaceTime-Anrufe nennt Apple mindestens iOS 18.1.</p>
    <h2 id="grenzen">Vor dem Löschen prüfen</h2>
    <p>Ein Transkript kann Fehler enthalten. Wenn du die Aufnahme löschst, verschwindet laut Apple auch ihr Transkript. Kopiere benötigten Text vorher. Für Entscheidungen und Aufgaben kannst du die <a href="/de/blog/meeting-protokoll-vorlage-apple-notizen">Vorlage für Meeting-Protokolle</a> verwenden.</p>
    <h2 id="pinto">Aus dem Transkript ein Meeting-Protokoll machen</h2>
    <p>Die kostenlose <a href="/templates/meeting-notes">Meeting-Vorlage</a> von Pinto Notes hält offene Aufgaben oben und neuere Meetings vor älteren. Kopiere den geprüften Text aus Apple Notizen. Gib ihn zusammen mit der Vorlage an verbundenes ChatGPT oder Claude. Die KI schreibt eine kurze Zusammenfassung, Beschlüsse und Aufgaben mit verantwortlicher Person und Termin. Unklares soll sie nachfragen.</p>
    <Keep title="Auftrag für verbundene KI" text={FOLLOW_UP} note="Füge zuerst die Meeting-Vorlage hinzu. Kopiere dann diesen Auftrag und dein Transkript in ChatGPT oder Claude." />
    <p>Später kannst du nach offenen Aufgaben fragen oder einen Eintrag abhaken lassen. Pinto Notes behält frühere Versionen. Apple Notizen kannst du auf dem Mac importieren; die Originale bleiben unverändert.</p>
  </LocalPostPage>;
}
