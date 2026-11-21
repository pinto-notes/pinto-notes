import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "buscar-en-notas-iphone-no-funciona");

// Spanish version of /blog/apple-notes-search-not-working (batch 3, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es) on 21 Nov: "buscar en notas iphone" is a suggestion of its own, with "como buscar notas en mi iphone"
// and "donde buscar notas en iphone"; "no encuentro una nota" gives "no encuentro una nota en mi iphone" and "no
// encuentro mis notas en mi iphone"; "notas iphone no aparecen" is suggested too. "buscar en notas iphone no funciona"
// and "notas iphone no busca" give nothing, so the slug pairs the suggested "buscar en notas iphone" with "no funciona"
// and the title says what people see. Apple's own Spanish words, all read on 21 Nov 2026, the same pages the English
// post cites: the iPhone guide (iOS 27) support.apple.com/es-es/guide/iphone/iphb8628c6b8/ios ("Buscar en tus notas en
// el iPhone": etiquetas, texto escrito a mano en idiomas compatibles, objetos en imágenes, documentos escaneados; a
// locked note shows only its title; Buscar en la nota, Incluir archivos adjuntos), /iph3c511548/ios ("Buscar con
// Spotlight": Ajustes > Buscar, una app, "Mostrar la app en la búsqueda"), /iph92579feda/ios (Ajustes > Apps > Notas >
// Buscar), /iph83bfec492/ios (selector de app, desliza hacia arriba), /iph841379c3d/ios (apagar y encender),
// /iph3e504502/ios (General > Actualización de software); the Notes guide for Mac (macOS 27)
// /es-es/guide/notes/not18ab658ed/mac ("Buscar en tus notas en el Mac": what search finds, Cuenta actual and Todas las
// cuentas next to the magnifying glass, only with more than one account, natural language search with "notas creadas
// la semana pasada" and "modificada hoy", Mejores resultados, locked notes show only the title even when unlocked,
// Recién eliminado notes are in the results, Comando + F, Visualización > Mostrar explorador de archivos adjuntos, notes
// in Spotlight, some features not available in other providers' accounts); support.apple.com/es-es/102476 ("Si has
// perdido notas", published 26 May 2026: update first, Ajustes > Apps > Notas > Cuentas de Notas, Todas las cuentas,
// scroll to find the barra de búsqueda, try another word); /es-es/102321 ("Acerca de la indexación y los resultados de
// búsqueda de Spotlight", published 1 Sep 2026: after a software update, horas o incluso días, faster when not in use,
// on power and on wifi, the Ajustes notification, the progress indicator with Comando + Barra espaciadora, the rebuild
// steps under Privacidad de búsqueda are for a disk or folder); /es-es/102586 ("Cómo forzar la salida de una app en
// Mac", published 11 Dec 2025: Comando + Q, Opción + Comando + Esc, Forzar salida, menú Apple > Reiniciar); the Mac
// guide /es-es/guide/mac-help/mchl54d95e8a/mac (Ajustes del Sistema > Spotlight, Resultados de apps) and
// /mchlpx1065/mac (updates improve built-in apps like Notas; General > Actualización de software). Sync paths as in
// notas-iphone-no-sincroniza. Apple's page writes "selector de app"; the post says "selector de apps". Facts are the English post's;
// the screenshot is Apple's English one, described in Spanish.

const ui = UI.es;

const FAQ = [
  { q: "¿Por qué Notas no encuentra una nota que sé que existe?", a: [
    "Apple apunta a cuatro cosas: la nota está bloqueada y la búsqueda solo ve su título; la búsqueda mira una sola cuenta en vez de Todas las cuentas; Notas está desactivado en la cuenta donde está la nota; o la palabra que escribiste no es la que hay en la nota. Una nota que aún no se ha sincronizado con este dispositivo tampoco puede aparecer.",
  ] },
  { q: "¿Busca Notas de Apple dentro de los PDF y los documentos escaneados?", a: [
    "Sí. En un Mac, Apple incluye los PDF que adjuntaste, los nombres de los archivos adjuntos, el texto de los documentos escaneados, los dibujos y el texto escrito a mano, y lo que hay dentro de las imágenes. En el iPhone, la búsqueda cubre el texto escrito a mano en idiomas compatibles, los objetos en imágenes y los documentos escaneados. Dentro de una nota, Buscar en la nota con Incluir archivos adjuntos también busca en los PDF.",
  ] },
  { q: "¿Por qué mis notas no aparecen en Spotlight?", a: [
    "En el iPhone, abre Ajustes, toca Buscar y luego Notas, y comprueba Mostrar la app en la búsqueda. Ajustes, Apps, Notas, Buscar decide además si el contenido de Notas aparece en Buscar. En un Mac, las apps desactivadas en Resultados de apps, en Ajustes del Sistema, Spotlight, no aparecen en los resultados de Spotlight.",
  ] },
  { q: "¿Por qué dejó de funcionar la búsqueda de Notas después de actualizar?", a: [
    "Apple no documenta ningún problema de búsqueda en Notas ligado a las actualizaciones. Sí dice que Spotlight vuelve a crear su índice después de una actualización de software y que puede tardar horas o incluso días. El artículo de Apple sobre notas perdidas empieza por actualizar todos los dispositivos al software más reciente y buscar después con Todas las cuentas seleccionado.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="buscar-en-notas-iphone-no-funciona"
      intro={<>Escribiste una palabra que sabes que está en una nota, y Notas no encontró nada. Casi siempre es porque la nota está bloqueada, está en otra cuenta o todavía no ha llegado a este dispositivo. Estas son las comprobaciones de Apple, de la más probable a la menos.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#que-busca", label: "Qué cubre la búsqueda" },
          { href: "#comprobaciones", label: "Las comprobaciones en orden" },
          { href: "#en-una-nota", label: "Dentro de una nota o un PDF" },
          { href: "#spotlight", label: "Spotlight" },
          { href: "#tras-actualizar", label: "Después de actualizar" },
        ]}>
          <p>
            Busca con Todas las cuentas seleccionado, y ten en cuenta que una nota bloqueada solo aparece por su título. Luego comprueba que
            Notas está activado en la cuenta donde está la nota y que la nota ya se ha sincronizado con este dispositivo. Si la búsqueda
            sigue sin encontrarla, cierra y vuelve a abrir Notas, reinicia y actualiza a la última versión de iOS o macOS.
          </p>
          <PostCta slug="es/buscar-en-notas-iphone-no-funciona" path="/es/blog/buscar-en-notas-iphone-no-funciona" position="answer" ui={ui.cta}
            title="¿Quieres encontrar una nota por su tema?">
            <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y su búsqueda lee cada palabra de cada nota. Conecta ChatGPT o Claude y podrás pedirle que encuentre una nota por lo que trata.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-search-results" width={760} height={894} maxWidth={300}
        alt="Notas en el iPhone buscando Home, en inglés: un mejor resultado, Home renovation project, otra nota, Kitchen remodel ideas, con la etiqueta #Home, y ningún archivo adjunto encontrado."
        caption="La búsqueda de Notas en el iPhone, con Mejores resultados, Notas y Archivos adjuntos. Imagen: Apple." />}
      faq={FAQ}
    >
      <h2 id="que-busca">Qué cubre la búsqueda de Notas</h2>
      <p>
        Antes de dar la búsqueda por rota, conviene saber qué lee. En un Mac, Apple dice que la búsqueda encuentra coincidencias en:
      </p>
      <ul>
        <li>el cuerpo de cada nota</li>
        <li>los nombres de los archivos adjuntos y los PDF que adjuntaste</li>
        <li>los dibujos y el texto escrito a mano</li>
        <li>lo que hay dentro de una imagen (busca &ldquo;bicicleta&rdquo; para encontrar la foto de una)</li>
        <li>el texto de un documento escaneado</li>
      </ul>
      <p>
        En el iPhone, Apple enumera las etiquetas, el texto escrito con el teclado, el texto escrito a mano en idiomas compatibles, los
        objetos en imágenes y el texto de los documentos escaneados. Hay dos límites que importan en los dos. Una nota bloqueada solo
        muestra su título en los resultados, aunque esté desbloqueada. Y la guía de Apple para Mac dice que algunas funciones no están
        disponibles en las cuentas de otros proveedores, como una cuenta de Gmail. Las notas de Recién eliminado sí aparecen en los
        resultados en un Mac.
      </p>

      <h2 id="comprobaciones">Las comprobaciones, en orden</h2>
      <Steps>
        <li id="todas-las-cuentas">
          <strong>Busca en todas las cuentas</strong>
          En el iPhone, toca el icono atrás hasta ver la lista de notas, toca la barra de búsqueda (puede que tengas que desplazarte para
          verla) y asegúrate de que Todas las cuentas está seleccionado. En un Mac, haz clic en el botón de búsqueda, haz clic en el menú
          junto a la lupa y elige Todas las cuentas. Esa opción solo aparece si tienes más de una cuenta, como iCloud y En mi Mac.
        </li>
        <li id="bloqueada">
          <strong>La nota puede estar bloqueada</strong>
          La búsqueda solo ve el título de una nota bloqueada. Si buscaste una palabra del texto, abre tus notas bloqueadas con la
          contraseña, Face ID o Touch ID y revísalas a mano. ¿Has olvidado la contraseña? Mira <a
          href="/es/blog/olvide-contrasena-notas-iphone">¿Olvidaste la contraseña de Notas?</a>.
        </li>
        <li id="cuenta-activada">
          <strong>Notas está activado en cada cuenta</strong>
          Una nota de una cuenta de Gmail, Yahoo u otra solo aparece mientras Notas está activado para esa cuenta. Toca la cuenta,
          asegúrate de que Notas está activado y repite con cada cuenta.
          <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Cuentas de Notas"] }]} />
          En Latinoamérica, Ajustes se llama Configuración.
        </li>
        <li id="otras-palabras">
          <strong>Prueba otras palabras y luego busca a mano</strong>
          El consejo de la propia Apple es que quizá no estás usando la palabra, la frase o el título que hay en la nota. Prueba con otra
          y luego abre cada carpeta y desplázate. En un Mac también puedes escribir como lo dirías, por ejemplo &ldquo;notas creadas la
          semana pasada&rdquo; o &ldquo;modificada hoy&rdquo;.
        </li>
        <li id="sincronizada">
          <strong>La nota ha llegado a este dispositivo</strong>
          Si escribiste la nota en otro iPhone o Mac, tiene que llegar a este antes de que la búsqueda pueda encontrarla. Comprueba que
          Sincronizar este iPhone o Sincronizar este Mac está activado para Notas en los ajustes de iCloud, en los dos. <a
          href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza entre iPhone y Mac</a> tiene el resto de comprobaciones.
          <Paths rows={[
            { on: "iPhone, iOS 27", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo", "Notas"] },
            { on: "Mac", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas"] },
          ]} />
        </li>
        <li id="reiniciar">
          <strong>Cierra y vuelve a abrir Notas, y luego reinicia</strong>
          En el iPhone, abre el selector de apps, desliza Notas hacia arriba y vuelve a abrirla. Si no sirve, Apple propone apagar el
          iPhone y volver a encenderlo. En un Mac, pulsa Comando + Q en Notas y vuelve a abrirla; si Notas no responde, pulsa Opción +
          Comando + Esc y haz clic en Forzar salida. Si eso tampoco funciona, elige Reiniciar en el menú Apple.
        </li>
        <li id="actualizar">
          <strong>Actualiza al software más reciente</strong>
          El artículo de Apple sobre notas perdidas empieza aquí: actualiza todos los dispositivos a la última versión de iOS y macOS.
          Apple dice que las actualizaciones de macOS incluyen mejoras para apps integradas como Notas.
          <Paths rows={[
            { on: "iPhone", steps: ["Ajustes", "General", "Actualización de software"] },
            { on: "Mac", steps: ["Ajustes del Sistema", "General", "Actualización de software"] },
          ]} />
        </li>
      </Steps>
      <p>
        Si la búsqueda encuentra la nota en Recién eliminado, devuélvela a una carpeta antes de que pasen los 30 días. <a
        href="/blog/recover-deleted-apple-notes" hrefLang="en">How to recover deleted Apple Notes</a> (en inglés) tiene los pasos.
      </p>

      <h2 id="en-una-nota">Buscar dentro de una nota, o de un PDF que contiene</h2>
      <p>
        Las notas largas y los PDF adjuntos tienen su propia búsqueda. En el iPhone, abre la nota, abre el menú de la nota y toca Buscar en
        la nota. Para buscar también en los PDF y otros archivos adjuntos, abre las opciones de búsqueda y selecciona Incluir archivos
        adjuntos, y escribe lo que buscas. En un Mac, abre la nota y pulsa Comando + F. Con las notas de iCloud o de En mi Mac,
        Visualización, Mostrar explorador de archivos adjuntos te deja recorrer todos los archivos adjuntos.
      </p>

      <h2 id="spotlight">Cuando las notas no aparecen en Spotlight</h2>
      <p>
        Spotlight es la búsqueda de todo el dispositivo, y la guía de Apple para Mac dice que sus resultados incluyen las notas. Si no
        aparecen:
      </p>
      <ul>
        <li><strong>iPhone:</strong> abre Ajustes, toca Buscar, desplázate hacia abajo, toca Notas y activa Mostrar la app en la búsqueda. En Ajustes, Apps, Notas, el ajuste Buscar decide si el contenido de Notas aparece en Buscar y en los widgets.</li>
        <li><strong>Mac:</strong> abre Ajustes del Sistema, haz clic en Spotlight y mira Resultados de apps. Las apps desactivadas ahí no aparecen en los resultados de Spotlight.</li>
      </ul>
      <p>
        Apple también tiene pasos para reconstruir parte del índice de Spotlight en un Mac, en Privacidad de búsqueda. Están pensados para
        archivos de un disco o una carpeta, y Apple no dice que ayuden con Notas.
      </p>

      <h2 id="tras-actualizar">Si empezó después de una actualización</h2>
      <p>
        Apple dice que Spotlight vuelve a crear su índice después de instalar una actualización de software, y que puede tardar horas o
        incluso días. Va más rápido cuando el dispositivo no está en uso, está conectado a la corriente y tiene wifi. Mientras tanto, el
        iPhone muestra en Ajustes una notificación de que se están optimizando la búsqueda y Siri, y en un Mac, al pulsar Comando + Barra
        espaciadora aparece un indicador de progreso arriba en Spotlight.
      </p>
      <p>
        Apple no dice si la búsqueda dentro de la app Notas espera a ese índice, así que las comprobaciones de arriba siguen yendo primero.
      </p>

      <h2 id="pinto-notes">Encontrar una nota por lo que trata</h2>
      <p>
        Todas las comprobaciones de arriba dan por hecho que recuerdas una palabra que está en la nota. Cuando solo recuerdas de qué iba,
        buscar palabras no ayuda. Pinto Notes, la app de notas para iPhone y Mac, se parece a Notas de Apple y funciona igual, y su
        búsqueda lee cada palabra de cada nota. Cuando <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT o
        Claude</a> (en inglés), algo que lleva un minuto, también puedes pedirle que encuentre la nota por lo que trata, con tus propias
        palabras.
      </p>
      <p>
        No arregla la búsqueda de Notas de Apple. <a href="/blog/move-from-apple-notes" hrefLang="en">Pasarte desde Notas de Apple</a> (en
        inglés) es una sola importación en tu Mac, y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
