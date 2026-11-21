import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-desaparecieron");

// Versión española de /blog/apple-notes-disappeared, 21 Nov 2026. Google autocomplete (hl=es, 21 Nov):
// "notas iphone desaparecieron" devuelve esa misma frase; "notas iphone desaparecidas" propone
// "notas desaparecidas iphone"; "notas icloud desaparecieron" propone "mis notas de icloud desaparecieron";
// "desaparecieron mis notas del iphone" devuelve esa frase y "porque desaparecieron mis notas del iphone".
// Páginas de Apple en español leídas el 21 Nov 2026: support.apple.com/es-es/102476 (cuentas, Buscar,
// Todas las cuentas, Papelera y la carpeta llamada allí "Eliminado recientemente"), /es-es/121669
// (Sincronizar este dispositivo y reinicio), /es-es/118582 (Volver a descargar); Manual del iPhone,
// /es-es/guide/iphone/iph7262fd4fe/ios (Cuentas de Notas y En mi iPhone), /iph904eee369/ios
// ("Recién eliminado", Trasladar y 30 días), /iph92579feda/ios (Cuenta por omisión),
// /iph87abad19a/ios (biblioteca de apps), /iph248b543ca/ios (eliminar y recuperar apps);
// Manual de Notas para Mac, /es-es/guide/notes/not85d6f7b58/mac (Notas > Cuentas),
// /notc3b2d538b/mac (cuentas y carpetas), /not5585d71a8/mac (notas eliminadas),
// /apd8b73d28be/mac (Visualización > Mostrar barra lateral); Manual de iCloud,
// /es-es/guide/icloud/mm8685520792/icloud (Ver todo y Sincronizar este Mac).
// La guía actual del iPhone y la del Mac llaman "Recién eliminado" a la carpeta de la app, aunque
// el artículo 102476 dice "Eliminado recientemente". Se usa el nombre de la guía de la app.
// Ajustes se llama Configuración en Latinoamérica; Ajustes del Sistema se llama Configuración
// del Sistema. Las capturas originales muestran la interfaz en inglés y aquí se describen en español.

const ui = UI.es;

const FAQ = [
  { q: "¿Por qué desaparecieron todas mis notas del iPhone?", a: [
    "Apple dice que pueden haberse borrado por error o que quizá haya que cambiar un ajuste. Comprueba que Notas esté activado para iCloud en Ajustes, tu nombre, iCloud. Después busca en Recién eliminado y revisa las demás cuentas, como Gmail o Yahoo.",
  ] },
  { q: "Mis notas desaparecieron tras una actualización. ¿Qué hago?", a: [
    "Apple recomienda actualizar todos los dispositivos a la última versión de iOS o macOS. Comprueba después que Notas siga activado para iCloud y que hayas iniciado sesión en la misma Cuenta de Apple. Si aún faltan notas, reinicia el iPhone y vuelve a comprobar el ajuste.",
  ] },
  { q: "¿Cómo recupero la app Notas en el iPhone?", a: [
    "Desliza hacia la izquierda hasta pasar la última página de la pantalla de inicio y busca Notas en la biblioteca de apps. Si está ahí, mantenla pulsada para llevarla a la pantalla de inicio. Si la eliminaste, búscala en el App Store y toca el botón Volver a descargar.",
  ] },
  { q: "¿Al eliminar la app Notas se borran mis notas?", a: [
    "Apple dice que eliminar una app integrada también borra sus datos relacionados en ese dispositivo. Los datos guardados en iCloud no se borran con la app. Puedes ver las notas de iCloud en icloud.com/notes.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="notas-iphone-desaparecieron"
      intro={<>Ayer estaban tus notas y hoy la lista está vacía o falta una carpeta. Según Apple, puede que se hayan borrado por error o que haya que cambiar un ajuste. Estas comprobaciones cubren ambas posibilidades, empezando por las más rápidas.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#comprobaciones", label: "Las comprobaciones en orden" },
          { href: "#en-mac", label: "En el Mac" },
          { href: "#app-desaparecida", label: "Si falta la app" },
          { href: "#pinto-notes", label: "Guardar otra copia" },
        ]}>
          <p>
            Comprueba primero que Notas esté activado para iCloud. Después abre Recién eliminado, donde una nota borrada permanece 30 días.
            Revisa también las demás cuentas, como Gmail, y que todos tus dispositivos usen la misma Cuenta de Apple. Si falta la propia
            app Notas, búscala en la biblioteca de apps o en el App Store.
          </p>
          <PostCta slug="es/notas-iphone-desaparecieron" path="/es/blog/notas-iphone-desaparecieron" position="answer" ui={ui.cta}
            title="¿Quieres conservar todas las versiones de tus notas?">
            <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac y guarda cada versión anterior de cada nota. En el Mac puede importar tus notas de Apple de una vez para tener otra copia. Las notas originales no cambian.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notas de Apple en macOS 27 muestra en inglés un aviso para activar iCloud para Notas, con botones para abrir los ajustes del sistema o cancelar."
        caption="Lo que muestra Notas en un Mac con iCloud desactivado para esta app. Las notas siguen en iCloud, pero este Mac no las muestra." />}
      faq={FAQ}
    >
      <h2 id="comprobaciones">Las comprobaciones, en orden</h2>
      <p>
        El <a href="https://support.apple.com/es-es/102476" rel="noopener">artículo de Apple sobre las notas perdidas</a> empieza con un paso
        previo: actualizar todos tus dispositivos a la última versión de iOS o macOS para descartar un problema de software antiguo. Después,
        sigue esta lista.
      </p>
      <Steps>
        <li id="icloud-activado">
          <strong>Notas está activado para iCloud</strong>{" "}
          Si faltan notas de iCloud, Apple recomienda comprobar que Sincronizar este iPhone esté activado. Luego abre Notas. Si las notas
          siguen sin aparecer, reinicia el iPhone y comprueba de nuevo el ajuste. El contenido que ya estaba sincronizado con iCloud debería
          aparecer cuando termine la sincronización.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo", "Notas", "Sincronizar este iPhone"] },
            { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas", "Sincronizar este Mac"] },
          ]} />
          En Latinoamérica, Ajustes y Ajustes del Sistema se llaman Configuración y Configuración del Sistema.
        </li>
        <li id="recien-eliminado">
          <strong>Recién eliminado</strong>{" "}
          Una nota borrada va a Recién eliminado en el iPhone, icloud.com y los otros dispositivos con la misma Cuenta de Apple. Permanece
          allí 30 días. En el iPhone, vuelve a la lista de carpetas, abre Recién eliminado, desliza la nota hacia la izquierda y toca
          Trasladar. La carpeta solo aparece si contiene alguna nota. <a href="/blog/recover-deleted-apple-notes" hrefLang="en">Cómo recuperar
          notas eliminadas</a> (en inglés) explica las demás opciones, incluso después de los 30 días.
        </li>
        <li id="buscar">
          <strong>Busca con Todas las cuentas seleccionado</strong>{" "}
          En la lista de notas, toca la barra de búsqueda y escribe una palabra o el título, con Todas las cuentas seleccionado. Buscar
          solo ve el título de las notas bloqueadas. Abre a mano las que puedan contener lo que buscas, con su contraseña, Face ID o Touch ID.
          Si no aparece nada, vuelve a la lista de carpetas y abre cada una: la nota puede estar en otra carpeta.
        </li>
        <li id="otras-cuentas">
          <strong>Notas está activado en Gmail, Yahoo y las otras cuentas</strong>{" "}
          Las notas guardadas en una cuenta de correo solo aparecen mientras Notas esté activado para esa cuenta. Revisa cada cuenta. Las
          notas borradas de estas cuentas no van a Recién eliminado: busca en la carpeta Papelera de esa cuenta en Mail y copia el contenido
          en una nota nueva.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Apps", "Notas", "Cuentas de Notas", "La cuenta", "Notas"] },
            { on: "Mac", steps: ["Notas", "Cuentas", "La cuenta", "Notas"] },
          ]} />
        </li>
        <li id="misma-cuenta">
          <strong>Todos los dispositivos usan la misma Cuenta de Apple</strong>{" "}
          Apple indica que no puedes ver tus notas de iCloud en un dispositivo donde no hayas iniciado sesión en tu Cuenta de Apple. En el
          iPhone, la cuenta aparece arriba en Ajustes. En el Mac, aparece arriba en la barra lateral de Ajustes del Sistema. Para ver qué
          hay guardado en iCloud, inicia sesión con esa misma cuenta en icloud.com/notes.
        </li>
        <li id="en-este-dispositivo">
          <strong>Las notas estaban guardadas en un solo dispositivo</strong>{" "}
          Las notas de En mi iPhone solo aparecen en ese iPhone, y las de En mi Mac solo en ese Mac. Si falta una nota en el otro dispositivo,
          mira bajo qué encabezado está su carpeta en el dispositivo donde sí aparece. <a href="/es/blog/pasar-notas-a-icloud">Pasar notas a
          iCloud</a> hace que aparezcan en todos tus dispositivos.
        </li>
        <li id="reiniciar">
          <strong>Reinicia y comprueba otra vez</strong>{" "}
          Si aún faltan notas después de revisar los ajustes, Apple recomienda reiniciar y comprobar una vez más el ajuste de iCloud.
          Si las notas están en un dispositivo pero no en otro, consulta <a href="/es/blog/notas-iphone-no-sincroniza">por qué Notas no se
          sincroniza</a>.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-recently-deleted" width={760} height={894} maxWidth={300}
        alt="La carpeta Recently Deleted en Notas de un iPhone con cuatro notas. La captura en inglés indica que las notas se quitan tras 30 días y que su borrado definitivo de iCloud puede tardar hasta 40 días más."
        caption="Recién eliminado en el iPhone. Solo aparece cuando contiene alguna nota. Imagen: Apple." />
      <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300}
        alt="Ajustes de una cuenta de Gmail en un iPhone, en inglés, con los interruptores de Mail, Contactos, Calendario y Notas activados."
        caption="Las notas de una cuenta de correo solo aparecen mientras Notas está activado para esa cuenta. Imagen: Apple." />

      <h2 id="en-mac">Si faltan notas o carpetas en el Mac</h2>
      <PostFigure src="/blog/macos27/notes27-sidebar-on-my-mac-only" width={1336} height={720} maxWidth={600}
        alt="Barra lateral de Notas de Apple en macOS 27, en inglés, con solo la sección On My Mac y sin ninguna sección iCloud."
        caption="Si no aparece iCloud en la barra lateral, este Mac no muestra tus notas de iCloud. Comprueba primero Sincronizar este Mac." />
      <ul>
        <li><strong>No ves la barra lateral.</strong> Elige Visualización, Mostrar barra lateral.</li>
        <li><strong>Una cuenta aparece sin carpetas debajo.</strong> Pon el puntero sobre el nombre de la cuenta en la barra lateral hasta que aparezca un botón y haz clic en él.</li>
        <li><strong>Falta una cuenta entera.</strong> Elige Notas, Cuentas, selecciona la cuenta y activa Notas. Apple indica que las notas de esa cuenta dejan de estar disponibles mientras Notas esté desactivado.</li>
        <li><strong>Borraste una nota.</strong> Abre Recién eliminado y arrastra la nota a otra carpeta de la barra lateral. Si tus notas de iCloud no están actualizadas, o la nota pertenecía a otra clase de cuenta, no habrá carpeta Recién eliminado. Apple indica que, en ese caso, las notas borradas desaparecen de todos los dispositivos que usan esa cuenta.</li>
        <li><strong>Era una nota compartida.</strong> Si el propietario borra una nota compartida, también desaparece de los dispositivos de los participantes. Si tú borraste una nota que otra persona compartió contigo, quizá puedas abrirla de nuevo desde el enlace original, salvo que el propietario haya dejado de compartirla.</li>
      </ul>

      <h2 id="app-desaparecida">Si ha desaparecido la propia app Notas</h2>
      <p>
        Una app quitada de la pantalla de inicio no está borrada. Sigue en la biblioteca de apps y puedes usarla desde allí.
      </p>
      <Steps>
        <li>En la pantalla de inicio, desliza hacia la izquierda hasta pasar todas las páginas y llegar a la biblioteca de apps.</li>
        <li>Toca el campo de búsqueda de arriba y escribe Notas.</li>
        <li>Para volver a ponerla en la pantalla de inicio, mantén pulsado su icono hasta que los iconos empiecen a temblar y la app se traslade a la pantalla de inicio. Después, levanta el dedo.</li>
      </Steps>
      <p>
        Notas es una de las apps integradas que Apple permite eliminar. Si no está en la biblioteca de apps, abre el App Store, busca Notas
        por su nombre exacto, toca el botón Volver a descargar y ábrela desde la pantalla de inicio cuando termine. Apple indica que eliminar
        una app integrada también borra los datos relacionados en ese dispositivo, pero no los datos guardados en iCloud. Las notas de
        En mi iPhone se incluyen en las copias de seguridad del iPhone en iCloud.
      </p>

      <h2 id="proxima-vez">Para que no vuelva a pasar</h2>
      <ul>
        <li>Pon iCloud como Cuenta por omisión en Ajustes, Apps, Notas, Cuenta por omisión. Así eliges dónde van las notas creadas con Siri y el widget de Notas.</li>
        <li>Guarda una copia propia de las notas que no puedas perder. <a href="/blog/back-up-apple-notes" hrefLang="en">Cómo hacer una copia de seguridad de Notas</a> (en inglés) propone una rutina.</li>
      </ul>

      <h2 id="pinto-notes">Otra copia, con todas las versiones</h2>
      <p>
        Recién eliminado sirve cuando borras una nota. No recupera un párrafo cambiado dentro de una nota, porque Notas de Apple no guarda{" "}
        <a href="/blog/apple-notes-version-history" hrefLang="en"> un historial de versiones</a> (en inglés). Pinto Notes, una app de notas
        para iPhone y Mac, conserva cada versión anterior de cada nota. Así puedes recuperar un párrafo que desapareció de una nota.
      </p>
      <p>
        No recupera notas que ya se perdieron en Notas de Apple. <a href="/blog/move-from-apple-notes" hrefLang="en">Importar desde Notas de
        Apple</a> (en inglés) crea otra copia en un solo paso en tu Mac, sin cambiar las notas originales. La app está en inglés.
      </p>
      <Figure shot={SHOTS.history} caption="Historial de versiones en Pinto Notes en un Mac: cada versión anterior, quién la hizo y el botón para restaurarla." />
    </LocalPostPage>
  );
}
