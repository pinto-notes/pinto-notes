import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("de", "wo-werden-apple-notizen-gespeichert");

// German version of /blog/where-are-apple-notes-stored, read 21 Nov 2026.
// Google autocomplete (hl=de, gl=de): „wo werden apple notizen gespeichert“.
// Apple DE support, read 21 Nov 2026: https://support.apple.com/de-de/guide/iphone/iph7262fd4fe/ios, https://support.apple.com/de-de/guide/notes/not85d6f7b58/mac, https://support.apple.com/de-de/guide/icloud/mm8685520792/icloud, https://support.apple.com/de-de/guide/notes/not201900c07/mac, https://support.apple.com/de-de/102537, https://support.apple.com/de-de/102651.

const ui = UI.de;

export default function Page() {
  return (
    <LocalPostPage lang="de" slug="wo-werden-apple-notizen-gespeichert"
      intro={<>Apple Notizen speichert nicht jede Notiz am selben Ort. Der Account über ihrem Ordner entscheidet, ob sie in iCloud, auf einem Gerät oder bei einem Mailanbieter liegt.</>}
      answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
        { href: "#account", label: "Den Account einer Notiz finden" },
        { href: "#icloud", label: "Notizen in iCloud" },
        { href: "#lokal", label: "„Auf meinem iPhone“ und „Auf meinem Mac“" },
        { href: "#mail", label: "Gmail, Yahoo und andere Konten" },
        { href: "#vergleich", label: "Die Speicherorte im Vergleich" },
      ]}>
        <p>Öffne die Ordnerliste auf dem iPhone oder die Seitenleiste auf dem Mac. Steht der Ordner unter „iCloud“, liegt die Notiz in iCloud. Unter „Auf meinem iPhone“ oder „Auf meinem Mac“ bleibt sie auf diesem Gerät. Unter Gmail oder Yahoo liegt sie im jeweiligen Mailkonto.</p>
        <PostCta slug="de/wo-werden-apple-notizen-gespeichert" path="/de/blog/wo-werden-apple-notizen-gespeichert" position="answer" ui={ui.cta} title="Notizen als Dateien und für KI?">
          <p>Pinto Notes ist auf Englisch. Es läuft auf iPhone und Mac. Du kannst deine Notizen auf dem Mac importieren und danach ChatGPT oder Claude mit ihnen arbeiten lassen.</p>
        </PostCta>
      </Answer>}
    >
      <h2 id="account">Den Account einer Notiz finden</h2>
      <p>In der Ordnerliste stehen Bereiche für iCloud, lokale Notizen und verbundene Mailkonten. Der Bereich über dem Ordner zeigt den Speicherort. Fehlt ein ganzer Account, ist „Notizen“ für ihn möglicherweise ausgeschaltet; laut Apple bleiben seine Notizen beim Anbieter.</p>
      <p>Prüfe die aktivierten Accounts in den Einstellungen der App Notizen. Auf iPhone und Mac heißen die Wege teils unterschiedlich; suche dort nach den Accounts und dem Schalter für Notizen.</p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} alt="Ordnerliste von Apple Notizen auf dem iPhone mit iCloud und Tags." caption="An der Überschrift über dem Ordner erkennst du den Account." />
      <h2 id="icloud">Notizen in iCloud</h2>
      <p>iCloud-Notizen erscheinen auf Geräten mit demselben Apple Account und bei icloud.com/notes. Apple verschlüsselt sie beim Übertragen und auf seinen Servern. Beim Standardschutz hält Apple die Schlüssel; mit erweitertem Datenschutz liegen sie auf deinen vertrauenswürdigen Geräten.</p>
      <p>Synchronisierung ersetzt kein Backup. Gelöschte Notizen gehen auf allen Geräten in „Zuletzt gelöscht“ und werden nach 30 Tagen endgültig entfernt. <a href="/blog/back-up-apple-notes" hrefLang="en">Apple Notizen sichern</a> erklärt eine zusätzliche Kopie.</p>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} alt="iCloud-Einstellungen auf dem iPhone mit dem Schalter für Notizen." caption="iCloud kann Notizen zwischen deinen Geräten synchronisieren." />
      <h2 id="lokal">„Auf meinem iPhone“ und „Auf meinem Mac“</h2>
      <p>Diese Notizen bleiben auf dem jeweiligen Gerät. Sie erscheinen nicht auf den anderen Geräten oder auf iCloud.com. Lokale iPhone-Notizen können in der iPhone-Sicherung enthalten sein; lokale Mac-Notizen brauchen ein Backup des Macs.</p>
      <p>Apple nennt in seinen Anleitungen keinen Finder-Pfad für einzelne Notizen. Als Datei exportierst du auf dem Mac die gewählte Notiz über „Ablage“ &gt; „Exportieren als“ als PDF oder Markdown. Liegt eine erwartete Notiz unter „Auf meinem Mac“, erklärt das ihr Fehlen auf dem iPhone. <a href="/de/blog/notizen-synchronisieren-nicht">Notizen synchronisieren nicht</a> geht die Ursachen durch.</p>
      <PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} alt="Notizen-Einstellungen auf dem Mac mit dem lokalen Account." caption="Notizen unter „Auf meinem Mac“ bleiben auf diesem Mac." />
      <h2 id="mail">Gmail, Yahoo und andere Konten</h2>
      <p>Steht eine Notiz unter Gmail oder Yahoo, liegt sie in diesem Mailkonto und wird über IMAP synchronisiert. Apple sagt, dass sie beim Entfernen des Accounts vom iPhone beim Anbieter bleiben. Suche sie am besten in der App Notizen, denn Apple beschreibt keinen Ort in Gmail selbst.</p>
      <p>Dort fehlen manche Notizen-Funktionen; sperren lassen sich diese Notizen nicht. Gelöschte Notizen landen oft im Papierkorb des Mailkontos statt unter „Zuletzt gelöscht“. Sie erscheinen nur auf Geräten, auf denen der Account mit Notizen aktiviert ist.</p>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} alt="Google-Account auf dem iPhone mit aktiviertem Notizen-Schalter." caption="Ein Mailkonto kann eigene Apple-Notizen synchronisieren." />
      <h2 id="vergleich">Die Speicherorte im Vergleich</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">Account</th><th scope="col">Speicherort</th><th scope="col">Andere Geräte</th><th scope="col">Sperre</th></tr></thead><tbody>
        <tr><td>iCloud</td><td>iCloud</td><td>Apple-Geräte und iCloud.com</td><td>Ja</td></tr>
        <tr><td>Auf meinem iPhone oder Mac</td><td>Dieses Gerät</td><td>Keine</td><td>Ja</td></tr>
        <tr><td>Gmail und andere Mailkonten</td><td>Mailkonto</td><td>Geräte mit diesem Account</td><td>Nein</td></tr>
      </tbody></table></div>
      <p>Neue Notizen von Siri oder dem Widget landen im Standardaccount. Stelle ihn passend ein. Für einen Umzug hilft <a href="/de/blog/notizen-in-icloud-verschieben">Notizen in iCloud verschieben</a>.</p>
      <h2 id="pinto">Wo Pinto Notes speichert</h2>
      <p>Pinto Notes hat einen gemeinsamen Bestand für iPhone und Mac. Notizen werden auf dem Gerät verschlüsselt und über einen eigenen Dienst synchronisiert. Frühere Versionen bleiben erhalten. Jede Notiz ist eine Markdown-Datei in deinen Ordnern.</p>
      <p>Nach dem Verbinden können ChatGPT oder Claude die Notizen lesen und bearbeiten. Es gibt keine Windows-, Android- oder Web-App. Deine Apple Notizen kannst du auf dem Mac importieren, ohne den Originalbestand zu ändern.</p>
      <Figure shot={SHOTS.connectList} caption="In Pinto Notes kannst du ChatGPT, Claude, Claude Code oder Codex verbinden." />
    </LocalPostPage>
  );
}
