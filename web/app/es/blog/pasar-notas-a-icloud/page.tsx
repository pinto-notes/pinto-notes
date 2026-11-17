import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import s from "@/lib/post-parts.module.css";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "pasar-notas-a-icloud");

// Spanish version of /blog/move-apple-notes-to-icloud (language pilot, 17 Nov 2026). Apple's own Spanish words for
// every menu, button and setting, all read on 17 Nov: support.apple.com/es-es/118442 ("Usar Notas en el iPhone":
// botón Más, Seleccionar notas, botón Carpeta), /es-es/102476 ("Si has perdido notas": Cuentas de Notas, Papelera),
// /es-es/102537 (bloquear notas: Ver nota, Eliminar, IMAP), /es-es/108770 (copia de seguridad de iCloud), the
// iPhone guide /es-es/guide/iphone/iph7262fd4fe/ios (cuentas, En mi iPhone), /ipha61270292/ios (carpetas,
// Trasladar) and /iph92579feda/ios (Cuenta por omisión), the Notes guide for Mac /es-es/guide/notes/notc3b2d538b/mac
// (cuentas y carpetas: lo que se puede perder, notas bloqueadas y compartidas), /apd558a85438/mac (tecla Opción),
// /apd97da26aed/mac (Cuenta por omisión, Activar la cuenta "En mi Mac") and /apd8b73d28be/mac for macOS 27 and 26
// (Visualización, Mostrar barra lateral, Mostrar carpetas), and the Notes app's own Spanish strings on macOS 27.2
// (Localizable.loctable: Trasladar a, Transferir a in es_419, the IMAP messages, turning off local notes). Spain
// says Ajustes; Latin America says Configuración, so the post names both once. Facts are the English post's; the
// screenshots are its English ones, described in Spanish.

const ui = UI.es;

const CHECKLIST = {
  title: "Después de pasar las notas a iCloud",
  items: [
    "Pon iCloud como cuenta por omisión, para que Siri y el widget dejen de usar la antigua",
    "Abre algunas notas trasladadas y revisa el formato, los archivos adjuntos y los dibujos",
    "Vuelve a bloquear las notas que desbloqueaste para trasladarlas",
    "Desactiva Notas en la cuenta de Gmail, o En mi Mac, cuando esté vacía",
  ],
};

const FAQ = [
  { q: "¿Por qué algunas de mis notas están en En mi iPhone?", a: [
    "En mi iPhone es una cuenta para notas que solo se guardan en ese teléfono. Aparece cuando la activas en Ajustes, Apps, Notas, y las notas nuevas que crean Siri o el widget de Notas van a la cuenta que esté elegida ahí como Cuenta por omisión.",
  ] },
  { q: "¿Pasar las notas a iCloud las quita de mi iPhone?", a: [
    "No. Las notas de iCloud siguen en tu iPhone y además aparecen en todos los demás dispositivos con la misma Cuenta de Apple y Notas activado para iCloud.",
  ] },
  { q: "¿Puedo pasar las notas de Gmail a iCloud?", a: [
    "Sí. Las notas de Gmail aparecen como su propia cuenta en Notas, y se trasladan a una carpeta de iCloud igual que las de En mi iPhone. Después puedes desactivar Notas en la cuenta de Gmail.",
  ] },
  { q: "¿Por qué no puedo bloquear mis notas de Gmail?", a: [
    "Apple dice que las notas que se sincronizan por IMAP, con cuentas como Gmail y Yahoo, no se pueden bloquear. Cuando una nota está en iCloud ya puedes bloquearla, salvo que tenga etiquetas o un archivo adjunto, como un PDF o una grabación.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="pasar-notas-a-icloud"
      intro={<>Cómo pasar tus notas a iCloud: algunas están en En mi iPhone o en Gmail, y por eso nunca aparecen en tus otros dispositivos. Moverlas de iPhone a iCloud son unos pocos toques, y en un Mac basta con arrastrarlas.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#donde", label: "Dónde están tus notas" },
          { href: "#antes", label: "Qué se puede perder" },
          { href: "#iphone", label: "En el iPhone" },
          { href: "#mac", label: "En un Mac" },
          { href: "#gmail", label: "Notas de Gmail" },
          { href: "#despues", label: "Después del traslado" },
        ]}>
          <p>
            En el iPhone, abre la carpeta que está bajo En mi iPhone o Gmail, toca el botón Más, toca Seleccionar Notas, elige las notas,
            toca el botón Carpeta y elige una carpeta bajo iCloud. En un Mac, arrastra las notas a una carpeta de iCloud en la barra
            lateral, y mantén pulsada la tecla Opción para copiarlas en lugar de trasladarlas. Quita antes el bloqueo de las notas
            bloqueadas, y luego pon iCloud como cuenta por omisión, o las notas nuevas seguirán yendo a la cuenta antigua.
          </p>
          <PostCta slug="es/pasar-notas-a-icloud" path="/es/blog/pasar-notas-a-icloud" position="answer" ui={ui.cta}
            title="¿Quieres notas sin cuentas que ordenar?">
            <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac: inicias sesión una vez y cada nota se sincroniza entre tus dispositivos. Importa tus notas de Apple en un paso, sin cambiarlas.</p>
          </PostCta>
        </Answer>
      }
      // Nothing above the intro, as in the English post. The Cuenta por omisión capture sits in "Después del traslado".
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="donde">Mira dónde están tus notas</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La lista de carpetas de Notas en un iPhone con iOS 27, en inglés: Quick Notes y Shared arriba, luego un encabezado iCloud con sus carpetas, y Tags debajo."
        caption="El encabezado sobre una carpeta, aquí iCloud, es la cuenta en la que están sus notas. Imagen: Apple." />
      <p>
        Notas agrupa las carpetas por cuenta, bajo encabezados como iCloud, En mi iPhone y Gmail. El encabezado bajo el que está una nota
        decide si llega a tus otros dispositivos: solo lo hacen las notas de iCloud, con todas las funciones.
      </p>
      <p>En el iPhone, vuelve a la lista de carpetas de Notas. En un Mac, los mismos grupos están en la barra lateral. Si está oculta:</p>
      <Paths rows={[
        { on: "Mac, macOS 27", steps: ["Visualización", "Mostrar barra lateral"] },
        { on: "Mac, macOS 26", steps: ["Visualización", "Mostrar carpetas"] },
      ]} />
      <p>Si no hay ningún encabezado iCloud, Notas está desactivado para iCloud. Actívalo aquí, en Ajustes (Configuración en Latinoamérica):</p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo", "Notas"] },
        { on: "iPhone, iOS 26", steps: ["Ajustes", "Tu nombre", "iCloud", "Notas"] },
      ]} />
      <p>
        Si tus notas ya están bajo iCloud y aun así no llegan a tus otros dispositivos, el problema está en otro sitio:{" "}
        <a href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza entre iPhone y Mac</a> te ayuda a encontrarlo.
      </p>

      <h2 id="antes">Antes de mover nada: qué se puede perder</h2>
      <p>
        La guía de Apple avisa de que, si trasladas notas de una cuenta a otra, el formato y los archivos adjuntos pueden perderse de forma
        permanente. Así que guarda los originales hasta que hayas revisado las notas trasladadas.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">En la nota</th><th scope="col">Lo que dice Apple</th><th scope="col">Qué hacer antes</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Formato y archivos adjuntos</th><td>Pueden perderse para siempre al trasladarlos</td><td>En un Mac, mantén pulsada la tecla Opción al arrastrar. Notas copia en lugar de trasladar</td></tr>
            <tr><th scope="row">Dibujos</th><td>Pueden convertirse en imágenes que ya no se editan como dibujos</td><td>Lo mismo: copia primero y luego revisa</td></tr>
            <tr><th scope="row">Un bloqueo</th><td>Las notas bloqueadas solo se mueven entre iCloud y la cuenta de tu Mac, y puede que haya que desbloquearlas antes</td><td>Quita el bloqueo, traslada la nota y vuelve a bloquearla en iCloud</td></tr>
            <tr><th scope="row">Compartir</th><td>Solo se pueden compartir las notas de iCloud, así que una nota compartida ya está ahí</td><td>Nada</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        La guía del iPhone de Apple solo describe cómo trasladar, sin forma de copiar. Así que en el iPhone, haz antes una copia de
        seguridad: las notas de En mi iPhone forman parte de la copia de seguridad del iPhone, y <a href="/blog/back-up-apple-notes"
        hrefLang="en">cómo hacer una copia de seguridad de Notas</a> (en inglés) explica el resto.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="El menú Más de una nota desbloqueada en Notas en el iPhone, en inglés, con Remove resaltado arriba junto a Scan y Pin Note."
        caption="Desbloquea la nota y luego Más, Eliminar, antes de trasladarla. Imagen: Apple." />
      <p>
        Para quitar el bloqueo de una nota en el iPhone, toca la nota bloqueada, toca Ver nota y desbloquéala, luego toca el botón Más y
        elige Eliminar. Cada cuenta puede tener su propia contraseña de notas. Si perdiste la contraseña de una nota bloqueada, nadie puede
        abrirla, y <a href="/es/blog/olvide-contrasena-notas-iphone">qué hacer si olvidaste la contraseña de Notas</a> explica por qué.
      </p>
      <p>
        Una cosa más si usas dos Cuentas de Apple: la guía de Apple para Mac dice que una nota compartida solo se puede mover entre carpetas
        de la misma cuenta de iCloud.
      </p>

      <h2 id="iphone">Trasladar notas en el iPhone</h2>
      <Steps>
        <li>
          <strong>Abre la carpeta que contiene las notas</strong>
          Por ejemplo, Notas bajo En mi iPhone, o Notas bajo Gmail.
        </li>
        <li>
          <strong>Toca el botón Más y luego Seleccionar Notas</strong>
          Toca cada nota que quieras trasladar.
        </li>
        <li>
          <strong>Toca el botón Carpeta y elige una carpeta bajo iCloud</strong>
          Las notas salen de la cuenta antigua y aparecen en esa carpeta.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notas en un iPhone con iOS 27 en modo de selección, en inglés: 3 Selected, tres notas marcadas y un botón Carpeta abajo a la izquierda para trasladarlas."
        caption="Seleccionar Notas y luego el botón Carpeta, abajo a la izquierda. Imagen: Apple." />
      <p>
        Para una sola nota, mantenla pulsada, toca Trasladar y elige la carpeta. Para pasar una carpeta entera, crea una carpeta con el mismo
        nombre bajo iCloud y traslada ahí sus notas.
      </p>

      <h2 id="mac">Trasladar notas en un Mac</h2>
      <Steps>
        <li>
          <strong>Selecciona las notas en la lista</strong>
          Pueden venir de En mi Mac, de Gmail o de cualquier otra cuenta de la barra lateral.
        </li>
        <li>
          <strong>Arrástralas a una carpeta bajo iCloud en la barra lateral, o haz clic con la tecla Control pulsada y elige Trasladar a</strong>
          Mantén pulsada la tecla Opción al soltarlas para obtener copias y conservar los originales. En Latinoamérica, Trasladar a se llama
          Transferir a.
        </li>
      </Steps>
      <PostFigure src="/blog/macos27/notes27-note-context-move-to-submenu" width={1416} height={960} maxWidth={600}
        alt="Notas de Apple en macOS 27, en inglés: clic con la tecla Control pulsada en una nota, Move to, y la lista de carpetas a las que trasladarla."
        caption="Sin arrastrar: haz clic con la tecla Control pulsada en una nota, elige Trasladar a y luego la carpeta." />
      <p>
        En mi Mac es la cuenta local del propio Mac, como En mi iPhone. Cuando esté vacía puedes desactivarla desmarcando Activar la cuenta
        &ldquo;En mi Mac&rdquo; en Notas, Ajustes. Notas no la desactiva mientras todavía tenga notas, y te pide que antes las traslades o
        las elimines.
      </p>

      <h2 id="gmail">Las notas de Gmail son distintas</h2>
      <p>
        Las notas de una cuenta de Gmail se guardan en tu cuenta de Google y se sincronizan con Notas por IMAP, el protocolo que usa Mail.
        Apple dice que muchas funciones de Notas no funcionan ahí. En la práctica:
      </p>
      <ul>
        <li>No se pueden bloquear.</li>
        <li>En macOS 26, Notas no acepta etiquetas ni notas fijadas en una cuenta IMAP, y muestra un mensaje que dice que no son compatibles.</li>
        <li>Cuando eliminas una, Gmail suele guardarla en la Papelera de esa cuenta en la app Mail, no en Recién eliminado.</li>
      </ul>
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Los ajustes de una cuenta de Gmail en un iPhone, en inglés, con interruptores para Mail, Contacts, Calendars y Notes, todos activados."
        caption="Desactiva Notas aquí cuando la cuenta de Gmail ya no tenga notas. Mail sigue funcionando. Imagen: Apple." />
      <p>
        Apple dice que las notas trasladadas desde otra cuenta a iCloud pueden usar todas las funciones. Para que la cuenta de Gmail deje de
        sincronizar notas cuando esté vacía, desactiva Notas en ella. Mail sigue funcionando, y las notas que queden en Gmail siguen en tu
        cuenta de Google.
      </p>
      <Paths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Cuentas de Notas", "Gmail", "Notas"] },
      ]} />

      <h2 id="despues">Después del traslado</h2>
      <p>Cuatro cosas, y la primera es la que la gente se salta.</p>
      <Keep title={CHECKLIST.title} text={[CHECKLIST.title, ...CHECKLIST.items].join("\n")} copyLabel={ui.copy}
        note="Copiar te da líneas sencillas. En Notas, selecciónalas y toca el botón de lista de comprobación.">
        <ul className={s.ticks}>{CHECKLIST.items.map((it) => <li key={it}>{it}</li>)}</ul>
      </Keep>
      <p>La cuenta por omisión se elige aquí:</p>
      <Paths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Cuenta por omisión"] },
        { on: "Mac", steps: ["Notas", "Ajustes", "Cuenta por omisión"] },
      ]} />
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Los ajustes generales de Notas de Apple en un Mac con macOS 26, en inglés: Sort notes by Date Edited, New notes start with Title y Default account en iCloud, la cuenta que usa Siri al crear notas." }}
        ground="sky" caption="Notas, Ajustes en un Mac con macOS 26. Cuenta por omisión es donde van las notas nuevas, y Notas dice que Siri la usa al crear notas." />
      <p>
        Trasladar también cambia lo que guarda la copia de seguridad de iCloud de tu iPhone. Las notas de En mi iPhone forman parte de ella,
        y <a href="https://support.apple.com/es-es/108770" rel="noopener">Apple deja fuera</a> las notas que ya están guardadas en iCloud.
        Eliminar una nota en iCloud la quita de todos los dispositivos tras 30 días en Recién eliminado, así que guarda también tu propia
        copia.
      </p>
      <p>
        Los pasos son de Apple: <a href="https://support.apple.com/es-es/118442" rel="noopener">Usar Notas en el iPhone</a>, <a
        href="https://support.apple.com/es-es/guide/iphone/iph7262fd4fe/ios" rel="noopener">Añadir o eliminar cuentas en Notas en el
        iPhone</a> y <a href="https://support.apple.com/es-es/guide/notes/notc3b2d538b/mac" rel="noopener">Acerca de las cuentas y las
        carpetas en Notas en el Mac</a>.
      </p>

      <h2 id="pinto-notes">Una app de notas sin cuentas que ordenar</h2>
      <Figure shot={{ ...SHOTS.consent, alt: "Pinto Notes pregunta, en inglés, \"Allow ChatGPT to use your notes?\": las notas que abre ChatGPT van a OpenAI, las notas bloqueadas siguen privadas, un número para comparar y los botones Allow y Don't Allow." }}
        caption="Una IA accede a tus notas solo después de que lo permitas en tu dispositivo." />
      <p>
        Pinto Notes, la app de notas para iPhone y Mac que hago yo, no tiene En mi iPhone ni cuentas de correo. Inicias sesión una vez y
        cada nota se sincroniza entre tus dispositivos. ChatGPT y Claude pueden leer y editar esas notas después de que lo apruebes.
      </p>
      <p>
        No ordena Notas de Apple por ti, y no tiene versión para Windows, Android ni web. Pasarte desde Notas de Apple es una sola
        importación en tu Mac, y Notas se queda como estaba. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
