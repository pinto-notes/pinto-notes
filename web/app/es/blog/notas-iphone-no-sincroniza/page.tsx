import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-no-sincroniza");

// Spanish version of /blog/apple-notes-not-syncing (language pilot, 17 Nov 2026). Apple's own Spanish words for
// every menu, button and setting, all read on 17 Nov: support.apple.com/es-es/121669 ("Si no ves tus notas de
// iCloud en la app Notas"), /es-es/108922 (almacenamiento de iCloud), /es-es/102462 ("Si no puedes colaborar en
// la app Notas"), the iCloud guide /es-es/guide/icloud/mm8685520792/icloud ("Configurar iCloud para Notas en
// todos los dispositivos": Ver todo, Sincronizar este Mac, Guardado en iCloud), the Notes guide for Mac
// /es-es/guide/notes/apd97da26aed/mac (Cuenta por omisión) and /es-es/guide/notes/aside/glosedbd72f8 (Notas de
// iCloud actualizadas, botón Actualizar), the iPhone guide /es-es/guide/iphone/iph92579feda/ios (Ajustes, Apps,
// Notas, Cuenta por omisión), and the Notes app's own Spanish strings on macOS 27.2 (Localizable.loctable in
// Notes.app and NotesShared.framework: the unsupported features message, the owner's full storage, the account
// security upgrade, Recién eliminado). The System Status row is "Notas iCloud" (system_status_es_ES.js). Spain
// says Ajustes and Ajustes del Sistema; Latin America says Configuración and Configuración del Sistema, so the
// post names both once. Facts are the English post's; the screenshots are its English ones, described in
// Spanish. The SyncChooser is English-only and left out.

const ui = UI.es;

const FAQ = [
  { q: "¿Por qué no se sincronizan mis notas entre el iPhone y el Mac?", a: [
    "Casi siempre es porque Notas está desactivado para iCloud en uno de los dos dispositivos, o porque tienen la sesión iniciada con Cuentas de Apple distintas. Las notas guardadas en En mi iPhone o en Gmail nunca se sincronizan por iCloud, y un almacenamiento de iCloud lleno también detiene la sincronización. La solución de Apple es comprobar Sincronizar este iPhone en los ajustes de iCloud y reiniciar el dispositivo si siguen faltando notas.",
  ] },
  { q: "¿Cómo fuerzo a Notas a sincronizar?", a: [
    "Apple no documenta ningún botón para forzar la sincronización. Lo que Apple propone es comprobar que Notas está activado para iCloud y reiniciar el dispositivo. Abrir icloud.com/notes en un navegador te dice si una nota ha llegado a iCloud.",
  ] },
  { q: "¿Las notas de En mi iPhone se sincronizan con el Mac?", a: [
    "No. En mi iPhone es para notas que solo se guardan en ese teléfono, y En mi Mac es lo mismo en un Mac. Pasa las notas a una carpeta de iCloud y aparecerán en todos los dispositivos con la misma Cuenta de Apple.",
  ] },
  { q: "¿Por qué no se actualiza una nota compartida?", a: [
    "Comprueba que todos tienen la sesión iniciada en su Cuenta de Apple con Notas activado en iCloud, y que la nota no está bloqueada, porque las notas bloqueadas no se pueden compartir. Si el almacenamiento de iCloud del propietario está lleno, Notas guarda tus cambios en tu dispositivo y los carga cuando el propietario libera espacio.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="notas-iphone-no-sincroniza"
      intro={<>¿Notas no sincroniza entre tu iPhone y tu Mac? Una nota que escribiste en el iPhone no está en el Mac, o al revés. Un vistazo a icloud.com te dice cuál de los dos dispositivos hay que arreglar.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#que-notas", label: "Qué notas se sincronizan" },
          { href: "#comprobaciones", label: "Las comprobaciones en orden" },
          { href: "#compartidas", label: "Notas compartidas" },
          { href: "#desaparecidas", label: "Si las notas desaparecieron" },
        ]}>
          <p>
            Notas se sincroniza a través de iCloud. Una nota llega a tu otro dispositivo solo si está bajo el encabezado iCloud y los dos
            dispositivos tienen la sesión iniciada en la misma Cuenta de Apple, con Notas activado para iCloud. Comprueba primero esas tres
            cosas. Después vienen el almacenamiento de iCloud lleno y un Mac con un macOS más antiguo que el de tu iPhone.
          </p>
          <PostCta slug="es/notas-iphone-no-sincroniza" path="/es/blog/notas-iphone-no-sincroniza" position="answer" ui={ui.cta}
            title="¿Quieres notas que te digan cuándo se sincronizaron?">
            <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac, muestra cuándo se sincronizó por última vez y guarda cada versión de cada nota. Importa tus notas de Apple en un paso, sin cambiarlas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/notes-same-note-three-devices" width={814} height={412} maxWidth={600}
        alt="La misma nota escrita a mano, Urban planner, abierta a la vez en Notas en un MacBook, una tableta y un iPhone."
        caption="Así debería verse: una nota, igual en todos los dispositivos. Imagen: Apple." />}
      faq={FAQ}
    >
      <h2 id="que-notas">Qué notas se sincronizan, y adónde</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="La barra lateral de Notas de Apple en macOS 27 con solo una sección On My Mac: All on My Mac, Notes, una carpeta y Recently Deleted. No hay sección iCloud."
        caption="Si tus notas están bajo En mi Mac (o En mi iPhone en un teléfono), nunca salen de ese dispositivo. Es lo primero que hay que mirar." />
      <p>
        Notas agrupa las carpetas por cuenta, y el encabezado bajo el que está una nota decide adónde va. Las notas nuevas van a la cuenta
        por omisión: en un Mac es Cuenta por omisión en Notas, Ajustes, y en el iPhone es Cuenta por omisión en Ajustes (Configuración en
        Latinoamérica), Apps, Notas. Ponla en iCloud, o la próxima nota que cree Siri puede volver a acabar en el sitio equivocado.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">La nota está bajo</th><th scope="col">¿Llega a tus otros dispositivos?</th><th scope="col">Conviene saber</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">iCloud</th><td>Sí</td><td>A todos los dispositivos con la misma Cuenta de Apple y Notas activado para iCloud</td></tr>
            <tr><th scope="row">En mi iPhone</th><td>No</td><td>Se queda en ese iPhone. <a href="/es/blog/pasar-notas-a-icloud">Pásala a una carpeta de iCloud</a></td></tr>
            <tr><th scope="row">En mi Mac</th><td>No</td><td>Se queda en ese Mac</td></tr>
            <tr><th scope="row">Gmail u otra cuenta de correo</th><td>Solo a través de esa cuenta de correo</td><td>Nunca pasa por iCloud</td></tr>
            <tr><th scope="row">Una nota compartida contigo</th><td>Sí</td><td>Se guarda en el iCloud del propietario, así que cuenta su almacenamiento</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="comprobaciones">Las comprobaciones, en orden</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notas de Apple en macOS 27 sin iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botones System Settings y Cancel."
        caption="Lo que muestra Notas en un Mac con iCloud desactivado para Notas (en español: Activa iCloud). En Notas de macOS 27 no hay ningún otro estado de sincronización; lo busqué." />
      <Steps>
        <li id="icloud-activado">
          <strong>Notas está activado para iCloud, en los dos dispositivos</strong>{" "}
          El interruptor se llama Sincronizar este iPhone o Sincronizar este Mac. Apple dice que si siguen faltando notas después de
          activarlo, reinicies el dispositivo y vuelvas a comprobar el ajuste.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo", "Notas"] },
            { on: "iPhone, iOS 26", steps: ["Ajustes", "Tu nombre", "iCloud", "Notas"] },
            { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas"] },
          ]} />
          En Latinoamérica, Ajustes del Sistema se llama Configuración del Sistema.
        </li>
        <li id="misma-cuenta">
          <strong>Los dos dispositivos usan la misma Cuenta de Apple</strong>{" "}
          El nombre que ves arriba en Ajustes en el iPhone, y arriba en Ajustes del Sistema en un Mac, es la cuenta con la que sincroniza
          ese dispositivo. Un Mac del trabajo con la Cuenta de Apple de la empresa no mostrará las notas de tu iPhone personal.
        </li>
        <li id="icloud-la-tiene">
          <strong>iCloud tiene la nota</strong>{" "}
          Abre icloud.com/notes en un navegador e inicia sesión con la misma Cuenta de Apple. Si la nota está ahí, el dispositivo al que le
          falta es el que hay que arreglar. Si no está, el dispositivo donde la escribiste aún no la ha subido, así que empieza por ese.
        </li>
        <li id="estado">
          <strong>Notas iCloud funciona</strong>{" "}
          Apple incluye Notas iCloud en su página Estado del sistema, en apple.com/es/support/systemstatus. Si ahí aparece una
          incidencia, ningún ajuste en tu lado lo arreglará. Espera a que Apple la marque como resuelta.
        </li>
        <li id="almacenamiento">
          <strong>Tu almacenamiento de iCloud no está lleno</strong>{" "}
          Apple dice que, si te quedas sin almacenamiento en iCloud, las apps de iCloud no se actualizan en tus dispositivos, y Notas es una
          de ellas. Abre Ajustes, toca tu nombre y luego iCloud para ver cuánto usas. Liberar espacio o pasarte a un plan más grande hace
          que la sincronización siga.
        </li>
        <li id="actualizar">
          <strong>Ningún dispositivo va atrasado en actualizaciones</strong>{" "}
          Una nota hecha con una versión más nueva de Notas puede usar funciones que una versión antigua no tiene. En un Mac, Notas la
          muestra entonces con el mensaje &ldquo;Esta nota utiliza funciones no compatibles. Para visualizarla o editarla, actualiza macOS
          a la versión más reciente.&rdquo; La nota se ha sincronizado, pero ese Mac no puede abrirla. Desde que salió iOS 27, el 14 de
          septiembre, lo más probable es un iPhone con iOS 27 y un Mac que sigue en macOS 26, y la solución es actualizar el Mac a macOS 27.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250}
        alt="La pantalla iCloud en los ajustes del iPhone, en inglés: almacenamiento a 4,1 de 50 GB y, bajo Saved to iCloud, Photos, Drive, Passwords, Notes con 29 ítems, Messages y Mail."
        caption="Ajustes, tu nombre, iCloud: cuánto almacenamiento te queda y lo que Notas guarda ahí (Guardado en iCloud). Imagen: Apple." />
      <p>
        Apple no documenta ningún botón que fuerce la sincronización, así que no hay nada que pulsar. Para dispositivos mucho más antiguos,
        la <a href="https://support.apple.com/es-es/guide/notes/aside/glosedbd72f8/4.13/mac/27" rel="noopener">guía de Notas para Mac</a> dice
        que las notas de iCloud actualizadas no se pueden abrir en versiones anteriores a OS X 10.11 o iOS 9, y que la barra lateral de Notas
        muestra un botón Actualizar junto a iCloud hasta que las actualizas.
      </p>
      <p>
        Los pasos son de Apple: <a href="https://support.apple.com/es-es/121669" rel="noopener">Si no ves tus notas de iCloud en la app
        Notas</a>, <a href="https://support.apple.com/es-es/guide/icloud/mm8685520792/icloud" rel="noopener">Configurar iCloud para Notas en
        todos los dispositivos</a> y <a href="https://support.apple.com/es-es/108922" rel="noopener">el artículo sobre el almacenamiento de
        iCloud</a>.
      </p>

      <h2 id="compartidas">Cuando una nota compartida no se actualiza</h2>
      <PostFigure src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Dos iconos de notas dibujados, cada uno con una persona encima, unidos por una línea de puntos con un signo de pausa en medio."
        caption="Una nota compartida espera cuando uno de los lados no puede sincronizar." />
      <ul>
        <li>Todos tienen que tener la sesión iniciada en una Cuenta de Apple con Notas activado para iCloud. La <a href="https://support.apple.com/es-es/102462" rel="noopener">guía de Apple para colaborar en Notas</a> también pide la versión más reciente de iOS.</li>
        <li>No se puede colaborar en una nota bloqueada, ni en una carpeta que contenga una.</li>
        <li>Una nota compartida se guarda en el iCloud de su propietario. Si su almacenamiento está lleno, Notas en un Mac dice que tus cambios no pueden cargarse, que se han guardado en tu dispositivo y que se cargarán cuando el propietario libere espacio.</li>
        <li>Si Notas te pide &ldquo;Mejora la seguridad de tu cuenta para ver las modificaciones en tiempo real y usar las funciones de colaboración más avanzadas&rdquo;, no verás en directo los cambios de los demás hasta que lo hagas.</li>
      </ul>
      <p>
        En iOS 27, compartir ha cambiado de sitio: toca el botón Compartir, luego Compartir un enlace o Enviar una copia, y elige quién
        puede editar en Las personas que elijas pueden editar.
      </p>

      <h2 id="desaparecidas">Si las notas desaparecieron de todos los dispositivos</h2>
      <PostFigure src="/blog/macos27/notes-recently-deleted-window" width={1520} height={1003} maxWidth={560}
        alt="Notas de Apple en macOS 27 abierta en Recently Deleted con dos notas, Fresh pasta dough y Gift ideas, bajo una línea que dice que las notas eliminadas se borran de tus dispositivos a los 30 días."
        caption="Una nota eliminada en cualquier dispositivo espera aquí 30 días. En español, la carpeta se llama Recién eliminado." />
      <p>
        Eliminar una nota en un dispositivo la elimina en todos, y eso puede parecer un problema de sincronización. Las notas eliminadas
        se quedan en Recién eliminado durante 30 días en todos los dispositivos con la misma Cuenta de Apple. <a
        href="/blog/recover-deleted-apple-notes" hrefLang="en">Cómo recuperar notas eliminadas</a> (en inglés) explica esa carpeta y qué
        probar pasados los 30 días. Guardar tu propia copia también ayuda.
      </p>

      <h2 id="pinto-notes">Una app de notas que muestra su sincronización</h2>
      <PostFigure src="/blog/drawn/sync-ok" width={1200} height={750} maxWidth={560}
        alt="Una nube blanca dibujada con una marca verde y un pequeño reloj al lado."
        caption="Pinto Notes muestra cuándo se sincronizó por última vez, y por qué cuando no puede." />
      <p>
        Notas de Apple no muestra cuándo se sincronizó por última vez, y por eso hacen falta seis comprobaciones. Pinto Notes, la app de
        notas para iPhone y Mac, sincroniza con su propio servicio cifrado en lugar de iCloud, así que el almacenamiento de
        iCloud no le afecta. Sus ajustes muestran el estado de la sincronización, como la hora de la última vez o el motivo por el que
        ahora no puede sincronizar, junto a un botón Sync Now. Si la misma nota cambió en dos dispositivos antes de sincronizarse, gana la
        edición más reciente y la otra se guarda como copia en conflicto, así que no pierdes ninguna.
      </p>
      <p>
        No arregla Notas de Apple por ti, y no tiene versión para Windows, Android ni web. Pasarte desde Notas de Apple es una sola
        importación en tu Mac, y Notas se queda como estaba. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
