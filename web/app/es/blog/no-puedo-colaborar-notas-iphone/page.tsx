import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "no-puedo-colaborar-notas-iphone");

// Spanish version of /blog/apple-notes-unable-to-start-collaboration (batch 3, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es) on 21 Nov: "no puedo colaborar" gives "no puedo colaborar notas iphone"; "colaborar notas
// iphone" and "notas iphone colaborar" are suggestions of their own; "no puedo compartir notas iphone" gives "porque no
// puedo compartir notas iphone"; "compartir notas iphone" gives "compartir notas iphone no funciona"; "notas compartidas
// iphone" gives "notas compartidas iphone no se actualiza" and "como ver notas compartidas iphone". "no se puede iniciar
// la colaboracion" gives nothing, and Apple documents no Spanish wording for the English message (not in Notes.app's
// Spanish strings on macOS 27.2 either), so the post describes the message and doesn't quote it. Apple's own Spanish
// words, all read on 21 Nov 2026, the same pages the English post cites: support.apple.com/es-es/102462 ("Si no puedes
// colaborar en la app Notas", published 13 Nov 2026: Guardado en iCloud, Sincronizar este [dispositivo], carpeta Todo
// iCloud, botón Compartir, "Compartir un enlace" o "Enviar una copia" on iOS 27, "Las personas que elijas pueden
// editar", Solicitudes de acceso, botón Colaborar, "Gestionar nota compartida", "Añadir participante"; on iOS 18 to 26
// Colaborar o Enviar Copia and "Solo las personas invitadas pueden editar"; pending requests, locked notes, iOS 26
// Apple devices only, 100 people); the iPhone guide (iOS 27) /es-es/guide/iphone/iphe4d04f674/ios (participants signed
// in with Notas on in iCloud; "Las personas que selecciones", "Cualquiera que tenga el enlace", Editar o "Solo lectura y
// descarga"; a request emails the owner's Apple Account address; Dejar de compartir removes the note from the others'
// devices) and /iphf177bb154/ios (remove a lock: the note's button, then Eliminar; notes shared in iCloud can't be
// locked; Face ID, Touch ID, code or password open a locked note); the Notes guide for Mac (macOS 27)
// /es-es/guide/notes/apd4e6e2c9a6/mac (upgraded iCloud notes, menú desplegable, "Compartir un enlace", "Las personas que
// selecciones podrán editar el contenido", "Puede editar" o "Puede ver y descargar", "Compartir carpeta", click the link
// then Abrir, the invitation address must be on your Apple Account, two-factor and llavero de iCloud for instant
// changes), /apd881ec5518/mac ("Dejar de compartir"), /aside/glosedbd72f8/mac (botón Actualizar next to iCloud, no
// people added before upgrading, OS X 10.11 and iOS 9), /apd5be85b5ce/mac (tags, mentions and note links need iOS 14.5
// or macOS 11.3); the Mac guide /es-es/guide/mac-help/mchl267b6234/mac (Ajustes del Sistema, "Enviar enlace de
// verificación"); the iCloud guide /es-es/guide/icloud/mmc0cd6c83/icloud (participants need an Apple Account) and
// /mmf181271571/icloud ("Aceptar invitación", ask for the invitation again). Apple's two pages word the iOS 27
// permission row differently ("Las personas que elijas pueden editar" in 102462, "Las personas que selecciones podrán
// editar el contenido" in the iPhone guide); the iPhone steps quote 102462, which gives them, and the Mac steps quote
// the Mac guide. The Mac Turn On iCloud prompt, its Spanish wording and the owner's full storage message are from
// notas-iphone-no-sincroniza (Notes.app strings). Pinto's own UI is in English and keeps its English names. Facts are
// the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const FAQ = [
  { q: "¿Qué significa que Notas no puede iniciar la colaboración?", a: [
    "Apple no explica ese mensaje. Su artículo sobre problemas para colaborar enumera qué comprobar: las dos personas con la última versión de iOS, con la sesión iniciada en una Cuenta de Apple y Notas activado para iCloud, la nota en iCloud y sin bloquear, y menos de 100 personas en ella.",
  ] },
  { q: "¿Por qué no aparece la opción Colaborar en Notas con iOS 27?", a: [
    "En iOS 27 se llama Compartir un enlace. Toca el botón Compartir, luego el menú que hay debajo del título de la nota, y elige Compartir un enlace. La opción Colaborar es la que muestran iOS 18 a iOS 26 en el mismo sitio.",
  ] },
  { q: "¿Puedo colaborar en una nota con alguien que no tiene iPhone?", a: [
    "Apple dice que los participantes necesitan una Cuenta de Apple para ver y editar una nota compartida. En iOS 26 o anterior, solo puedes colaborar con alguien que tenga un dispositivo Apple con la sesión iniciada en una Cuenta de Apple. Si no, envía una copia de la nota por correo o en un mensaje.",
  ] },
  { q: "¿Por qué no puedo abrir una nota que alguien compartió conmigo?", a: [
    "Casi siempre es porque la invitación se envió a una dirección de correo o un número de teléfono que no está en tu Cuenta de Apple. Añádelo a tu cuenta cuando Notas te lo pida, o pide al propietario que vuelva a enviar la invitación a la dirección que usa tu Cuenta de Apple.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="no-puedo-colaborar-notas-iphone"
      intro={<>Tocas Compartir en una nota y Notas dice que no puede iniciar la colaboración, o la opción Colaborar ni siquiera está. Estas son las comprobaciones de Apple, de la más probable a la menos.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#comprobaciones", label: "Las comprobaciones en orden" },
          { href: "#iphone", label: "Empezar en el iPhone" },
          { href: "#mac", label: "Empezar en un Mac" },
          { href: "#no-se-abre", label: "Una nota compartida no se abre" },
        ]}>
          <p>
            Para colaborar en Notas de Apple hace falta una nota en iCloud que no esté bloqueada, y que todos tengan la sesión iniciada
            en una Cuenta de Apple con Notas activado para iCloud. Apple también pide que las dos personas tengan la última versión de
            iOS. En iOS 27 la opción se llama Compartir un enlace, así que si buscas Colaborar, es esa.
          </p>
          <PostCta slug="es/no-puedo-colaborar-notas-iphone" path="/es/blog/no-puedo-colaborar-notas-iphone" position="answer" ui={ui.cta}
            title="¿Quieres compartir una nota con un solo enlace?">
            <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Envía el enlace de una nota y las personas que invites escriben en ella contigo, con sus cursores a la vista mientras escriben. Las notas compartidas van cifradas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Dos iconos de notas dibujados, cada uno con una persona encima, unidos por una línea de puntos con un signo de pausa en medio."
        caption="Una nota compartida necesita lo mismo en los dos lados antes de empezar." />}
      faq={FAQ}
    >
      <h2 id="comprobaciones">Las comprobaciones, en orden</h2>
      <p>
        Apple no documenta el mensaje que dice que no se puede iniciar la colaboración, así que nadie puede decirte solo por el mensaje
        qué comprobación ha fallado. Estos son los requisitos que Apple sí enumera, en el orden en que vale la pena probarlos.
      </p>
      <Steps>
        <li id="opcion">
          <strong>Estás eligiendo la opción correcta</strong>
          En iOS 27, toca el botón Compartir, luego el menú que hay debajo del título de la nota, y elige Compartir un enlace. Enviar una
          copia manda una copia que nadie más puede editar. En iOS 18 a iOS 26, el mismo menú dice Colaborar o Enviar Copia.
        </li>
        <li id="en-icloud">
          <strong>La nota está en iCloud</strong>
          Los pasos de Apple empiezan en la carpeta Todo iCloud, y su guía para Mac dice que para colaborar tienes que usar las notas de
          iCloud actualizadas. Una nota bajo En mi iPhone, En mi Mac o una cuenta de Gmail no está en iCloud. <a
          href="/es/blog/pasar-notas-a-icloud">Pásala primero a una carpeta de iCloud</a>.
        </li>
        <li id="bloqueada">
          <strong>La nota no está bloqueada</strong>
          No se puede colaborar en una nota bloqueada, ni en una carpeta que contenga una. Abre la nota y desbloquéala con la contraseña,
          Face ID o Touch ID; luego toca el botón de acciones de la nota y toca Eliminar para quitarle el bloqueo.
        </li>
        <li id="icloud-activado">
          <strong>Tienes la sesión iniciada, con Notas activado para iCloud</strong>
          Abre Ajustes (Configuración en Latinoamérica), toca tu nombre y luego iCloud. En Guardado en iCloud, toca Notas y comprueba que
          Sincronizar este iPhone está activado. Apple dice que las personas que invites también lo necesitan.
        </li>
        <li id="actualizar">
          <strong>Las dos personas tienen la última versión de iOS</strong>
          Apple pide la versión más reciente de iOS en tu iPhone y en el de la otra persona. Los pasos de Colaborar para iOS 26 y
          anteriores necesitan iOS 18 o posterior.
        </li>
        <li id="otra-persona">
          <strong>La otra persona tiene una Cuenta de Apple</strong>
          Los participantes necesitan una Cuenta de Apple para ver y editar una nota compartida. En iOS 26 o anterior, Apple dice que
          solo puedes colaborar con alguien que tenga un dispositivo Apple con la sesión iniciada en una Cuenta de Apple. Si no la tiene,
          envíale una copia.
        </li>
        <li id="pendiente">
          <strong>Tu solicitud no sigue pendiente</strong>
          Si pediste acceso a la nota de otra persona en iOS 27, puede que la solicitud esté pendiente. El propietario la ve tocando el
          botón Colaborar, y Apple dice que la solicitud también envía un correo a la dirección de la Cuenta de Apple del propietario.
        </li>
        <li id="limite">
          <strong>Cabe más gente en la nota</strong>
          Pueden colaborar hasta 100 personas en una nota.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="El menú Más de una nota desbloqueada en Notas en el iPhone, en inglés, con Remove resaltado arriba junto a Scan y Pin Note."
        caption="Eliminar (Remove en la imagen) le quita el bloqueo a una nota desbloqueada, para que se pueda compartir. Imagen: Apple." />
      <p>
        La guía de Apple para iPhone también dice que las notas compartidas en iCloud no se pueden bloquear, así que no podrás volver a
        bloquearla mientras esté compartida.
      </p>

      <h2 id="iphone">Empezar a colaborar en el iPhone</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>En Notas, ve a la carpeta Todo iCloud y abre la nota.</li>
        <li>Toca el botón Compartir de la parte superior de la pantalla.</li>
        <li>Debajo del título de la nota, elige Compartir un enlace.</li>
        <li>Para cambiar quién puede entrar, toca &ldquo;Las personas que elijas pueden editar&rdquo;. Elige Las personas que selecciones o Cualquiera que tenga el enlace, y Editar o Solo lectura y descarga.</li>
        <li>Elige cómo enviar la invitación. La primera persona se une automáticamente. Para añadir más, toca el botón Colaborar, luego Gestionar nota compartida y luego Añadir participante.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>iOS 18 a iOS 26</strong></p>
      <Steps>
        <li>En Notas, ve a la carpeta Todo iCloud y abre la nota.</li>
        <li>Toca el botón Compartir y elige Colaborar debajo del título de la nota.</li>
        <li>Toca &ldquo;Solo las personas invitadas pueden editar&rdquo; para elegir quién tiene acceso, qué puede hacer y si puede invitar a otros.</li>
        <li>Envía la invitación con Mensajes o Mail.</li>
      </Steps>
      <p>
        Los pasos son de los artículos de Apple <a href="https://support.apple.com/es-es/102462" rel="noopener">Si no puedes colaborar en
        la app Notas</a> y <a href="https://support.apple.com/es-es/guide/iphone/iphe4d04f674/ios" rel="noopener">Compartir notas y
        colaborar en el iPhone</a>.
      </p>

      <h2 id="mac">Empezar a colaborar en un Mac</h2>
      <Steps>
        <li>Abre la nota y haz clic en el botón Compartir de la barra de herramientas.</li>
        <li>Haz clic en el menú desplegable y elige Compartir un enlace.</li>
        <li>Haz clic en &ldquo;Las personas que selecciones podrán editar el contenido&rdquo; para elegir quién tiene acceso, y Puede editar o Puede ver y descargar.</li>
        <li>Envía el enlace como prefieras. Para compartir una carpeta entera, haz clic en ella con la tecla Control pulsada y elige Compartir carpeta.</li>
      </Steps>
      <p>
        Si junto a iCloud, en la barra lateral de Notas, hay un botón Actualizar, tus notas de iCloud no están actualizadas, y Apple dice
        que no puedes añadir personas a las notas hasta que las actualices. Las notas actualizadas no se pueden abrir en dispositivos con
        versiones anteriores a OS X 10.11 o iOS 9.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notas de Apple en macOS 27 sin iCloud, en inglés: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botones System Settings y Cancel."
        caption="Lo que muestra Notas en un Mac con iCloud desactivado para Notas (en español: Activa iCloud). Actívalo antes de compartir." />
      <Paths rows={[
        { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas"] },
      ]} />
      <p>En Latinoamérica, Ajustes del Sistema se llama Configuración del Sistema.</p>

      <h2 id="no-se-abre">Cuando no puedes abrir una nota compartida contigo</h2>
      <ul>
        <li><strong>Ábrela desde el enlace.</strong> En un Mac, haz clic en el enlace que recibiste y luego en Abrir. En icloud.com/notes, selecciona el enlace y luego Aceptar invitación. Después de la primera vez, la nota se queda en tu lista de notas en todos los iPhone y Mac con la misma Cuenta de Apple.</li>
        <li><strong>Comprueba a qué dirección se envió.</strong> Solo puedes abrir una nota compartida si la dirección de correo o el número de teléfono al que llegó la invitación está en tu Cuenta de Apple. Notas te pide que lo añadas, y en un Mac, Ajustes del Sistema envía antes un enlace de verificación a esa dirección. También puedes pedir al propietario que vuelva a enviar la invitación a la dirección que usas.</li>
        <li><strong>Actualiza el dispositivo.</strong> Una nota con una etiqueta, una mención o un enlace que muestra el título de otra nota solo se puede ver con iOS 14.5, macOS 11.3 o posterior. En dispositivos más antiguos queda oculta, para ti y para todos con quienes está compartida.</li>
        <li><strong>Pregunta al propietario.</strong> Cuando el propietario deja de compartirla, Apple dice que la nota se elimina de los dispositivos de los demás.</li>
      </ul>

      <h2 id="no-se-actualiza">Cuando se abre pero no se actualiza</h2>
      <p>
        La guía de Apple para Mac dice que quienes tienen activados la autenticación de doble factor y el llavero de iCloud ven los cambios
        de los demás al momento. Una nota compartida se guarda en el iCloud de su propietario, así que cuando su almacenamiento está
        lleno, Notas en un Mac dice que tus cambios se han guardado en tu dispositivo y se cargarán cuando el propietario libere espacio. <a
        href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza entre iPhone y Mac</a> tiene el resto de comprobaciones de la
        sincronización.
      </p>

      <h2 id="pinto-notes">Compartir una nota en Pinto Notes</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="La hoja Share de Pinto Notes en el iPhone, en inglés: el propietario, Sara, que puede editar, y Jonas, que puede ver, un botón Invite People y Join by Link en Can edit."
        caption="Share y luego Collaborate, en Pinto Notes en el iPhone." />
      <p>
        Pinto Notes, una app de notas que se parece a Notas de Apple y funciona igual en iPhone y Mac, comparte una nota con un enlace. En
        el iPhone, toca Share, luego Collaborate y luego Invite People, y envía el enlace como quieras. Join by Link decide si el enlace
        deja editar o solo ver, y Off significa que solo pueden abrirla las personas que ya están en la nota. El cursor de cada persona se
        ve en la nota con su nombre mientras escribe, y la nota va cifrada con una clave propia. Si alguien de la nota ha <a
        href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectado ChatGPT o Claude</a> (en inglés), su IA también puede escribir
        en ella, marcada con el nombre de quien la usa.
      </p>
      <p>
        Tiene sus propios límites. Todos escriben en ella desde Pinto Notes en iPhone o Mac; quien abre el enlace sin tener la app ve cómo
        conseguirla y unirse. Una nota con archivos, fotos o una app dentro todavía no se puede compartir, y una nota compartida no se
        puede bloquear. <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">Share a note and edit it together</a> (en inglés)
        tiene los detalles. Tus notas de Apple se pasan con una sola importación en tu Mac (<a href="/blog/move-from-apple-notes"
        hrefLang="en">moving from Apple Notes</a>, en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
