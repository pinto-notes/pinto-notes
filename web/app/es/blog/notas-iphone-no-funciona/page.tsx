import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-no-funciona");

// Spanish version of /blog/apple-notes-not-working (batch 3, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es) on 21 Nov: "notas iphone no funciona" is a suggestion of its own; "app notas no funciona" gives "app notas
// iphone no funciona" and "mi app de notas no funciona"; "la app de notas" gives "como recuperar la app de notas del
// iphone". "notas iphone se cierra", "notas mac no funciona" and "notas iphone no abre" give nothing in Spanish, so the
// title adds "se cierra" for what the English post covers. Apple's own Spanish words, all read on 21 Nov 2026, the same
// pages the English post cites: support.apple.com/es-es/119876 (on an app that stops responding, closes unexpectedly
// or won't open, published 31 Mar 2026: close and reopen, restart, Actualizaciones de apps in
// the App Store, then update the software, delete and download again); the iPhone guide (iOS 27)
// /es-es/guide/iphone/iph83bfec492/ios (selector de app, written "selector de apps" here; desliza hacia arriba, pantalla
// de inicio or biblioteca de apps)
// and /iph8903c3ee6/ios ("Forzar el reinicio del iPhone": subir volumen, bajar volumen, botón lateral, logotipo de
// Apple); /es-es/118575 (updating the iPhone: copia de seguridad, corriente y wifi, Ajustes > General >
// Actualización de Software); /es-es/118582 ("Eliminar las apps integradas de Apple", published 23 June 2026: Notes is on
// the list, user data goes with the app, the exact name, botón Volver a descargar); the Mac guide
// /es-es/guide/mac-help/mchlp2579/mac ("Si una app se bloquea o se cierra de manera inesperada en el Mac": menú Apple >
// Forzar salida, unsaved changes may be lost, Reiniciar in the dialog, open another file, disconnect a new device,
// uninstall other makers' módulos o mejoras); /es-es/102586 ("Cómo forzar la salida de una app en Mac", published 11 Dec
// 2025: Comando + Q, Opción + Comando + Esc, Reiniciar, hold the power button 10 seconds); /es-es/108382 ("Actualizar
// macOS en el Mac": back up first, Ajustes del Sistema > General > Actualización de Software, don't sleep the Mac or
// close the lid); /es-es/116946 ("Arrancar el Mac en modo seguro": whether software that loads at startup causes a
// problem; no apps named); /es-es/121669 ("Si no ves tus notas de iCloud en la app Notas", published 21 Mar 2025). The
// Notes guide for Mac has no troubleshooting topic, so no Notes-specific cause is claimed. From notas-iphone-no-sincroniza:
// the iOS 27 and Mac iCloud paths, icloud.com/notes, Notas iCloud on Apple's Estado del sistema page and the macOS
// unsupported features message in the app's own Spanish. Recién eliminado's 30 days from the iPhone guide
// /iph904eee369/ios. Facts are the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const FAQ = [
  { q: "¿Por qué la app Notas se cierra sola una y otra vez?", a: [
    "Apple no documenta ninguna causa propia de Notas. Sus pasos son los de cualquier app: ciérrala y vuelve a abrirla, reinicia el dispositivo y luego actualiza el software. En un Mac, Apple también propone desconectar un dispositivo que acabas de conectar y desinstalar módulos o mejoras de otros fabricantes.",
  ] },
  { q: "¿Si elimino la app Notas se borran mis notas?", a: [
    "Apple dice que al eliminar una app integrada también se eliminan sus datos de usuario en ese dispositivo. Las notas de iCloud también están en icloud.com/notes, así que compruébalas ahí primero. Las notas de En mi iPhone solo existen en ese teléfono, así que no elimines la app mientras tengas notas ahí.",
  ] },
  { q: "¿Cómo fuerzo la salida de Notas en un Mac?", a: [
    "Pulsa Opción + Comando + Esc, o elige Forzar salida en el menú Apple, selecciona Notas y haz clic en Forzar salida. Apple avisa de que puedes perder los cambios que no se hayan guardado.",
  ] },
  { q: "¿Por qué no se abre una nota en el Mac después de actualizar el iPhone?", a: [
    "Una nota hecha con una versión más nueva de Notas puede usar funciones que una versión antigua no tiene. El Mac dice entonces que la nota utiliza funciones no compatibles y te pide que actualices macOS a la versión más reciente. Al actualizar el Mac, ya puede abrir la nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="notas-iphone-no-funciona"
      intro={<>Notas se queda congelada, se cierra sola o no llega a abrirse. Aquí tienes los pasos de Apple, en el orden en que Apple los da, para iPhone y Mac.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "En el iPhone" },
          { href: "#mac", label: "En un Mac" },
          { href: "#no-cargan", label: "Las notas no cargan" },
          { href: "#tras-actualizar", label: "Después de actualizar" },
        ]}>
          <p>
            Cierra Notas y vuelve a abrirla, y luego reinicia el dispositivo. Si sigue congelándose o cerrándose, actualiza iOS o macOS.
            Son los pasos de Apple para cualquier app que deja de responder. Si Notas se abre pero tus notas no aparecen, comprueba que
            Notas está activado para iCloud en ese dispositivo.
          </p>
          <PostCta slug="es/notas-iphone-no-funciona" path="/es/blog/notas-iphone-no-funciona" position="answer" ui={ui.cta}
            title="¿Quieres una segunda copia de tus notas?">
            <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Importa tus notas de Apple de una vez en un Mac, como copia, y Notas de Apple no cambia. Guarda todas las versiones anteriores de cada nota.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="a-salvo">Primero, comprueba que tus notas están a salvo</h2>
      <p>
        Antes de probar nada más serio que un reinicio, abre icloud.com/notes en un navegador e inicia sesión con tu Cuenta de Apple. Si
        tus notas están ahí, están guardadas en iCloud, haga lo que haga la app de tu dispositivo. Apple también incluye Notas iCloud en
        su página Estado del sistema, en apple.com/es/support/systemstatus. Si ahí aparece una incidencia, espera a que Apple la marque
        como resuelta.
      </p>

      <h2 id="iphone">En el iPhone: Notas se cierra o no se abre</h2>
      <Steps>
        <li id="cerrar-iphone">
          <strong>Cierra Notas y vuelve a abrirla</strong>{" "}
          Abre el selector de apps, desliza hasta encontrar Notas y desliza hacia arriba sobre ella. Luego toca Notas en la pantalla de
          inicio o en la biblioteca de apps.
        </li>
        <li id="reiniciar-iphone">
          <strong>Reinicia el iPhone</strong>{" "}
          Es el siguiente paso de Apple si la app sigue sin responder. Si es el propio iPhone el que está bloqueado y no se apaga, fuerza
          el reinicio: pulsa y suelta rápidamente el botón para subir el volumen, pulsa y suelta rápidamente el de bajar el volumen, y
          mantén pulsado el botón lateral hasta que aparezca el logotipo de Apple.
        </li>
        <li id="actualizar-iphone">
          <strong>Actualiza iOS</strong>{" "}
          Apple propone mirar primero Actualizaciones de apps en el App Store y, si no hay nada para la app, actualizar el software del
          iPhone. Antes, haz una copia de seguridad del iPhone, conéctalo a la corriente y a una red wifi.
          <Paths rows={[
            { on: "iPhone", steps: ["Ajustes", "General", "Actualización de software"] },
          ]} />
          En Latinoamérica, Ajustes se llama Configuración.
        </li>
        <li id="volver-a-descargar">
          <strong>Elimina Notas y vuelve a descargarla, como último paso</strong>{" "}
          Notas es una de las apps integradas que Apple deja eliminar. Apple dice que al eliminar una también se eliminan sus datos de
          usuario en el dispositivo, así que comprueba antes icloud.com/notes, y sáltate este paso si guardas notas en En mi iPhone. Para
          recuperarla, busca Notas en el App Store con su nombre exacto y toca Volver a descargar.
        </li>
      </Steps>
      <p>
        Los pasos son del <a href="https://support.apple.com/es-es/119876" rel="noopener">artículo de Apple sobre apps del iPhone que
        dejan de responder, se cierran inesperadamente o no se abren</a>, con los detalles del Manual de uso del iPhone y de <a
        href="https://support.apple.com/es-es/118582" rel="noopener">Eliminar las apps integradas de Apple</a>.
      </p>

      <h2 id="mac">En un Mac: Notas se queda congelada o se cierra</h2>
      <Steps>
        <li id="forzar-salida">
          <strong>Sal de Notas, o fuerza la salida</strong>{" "}
          Prueba primero con Comando + Q. Si Notas no responde, pulsa Opción + Comando + Esc, o elige Forzar salida en el menú Apple,
          selecciona Notas y haz clic en Forzar salida. Apple avisa de que puedes perder los cambios que no se hayan guardado. Si Notas
          se cerró sola, haz clic en Reiniciar en el cuadro de diálogo que aparece.
          <Paths rows={[
            { on: "Mac", steps: ["Menú Apple", "Forzar salida"], keys: "⌥⌘⎋" },
          ]} />
        </li>
        <li id="reiniciar-mac">
          <strong>Reinicia el Mac</strong>{" "}
          Elige Reiniciar en el menú Apple. Si el Mac no se reinicia, Apple dice que mantengas pulsado el botón de encendido durante 10
          segundos, hasta que se apague, y que lo vuelvas a pulsar para encenderlo.
        </li>
        <li id="otra-nota">
          <strong>Abre otra nota</strong>{" "}
          La guía de Apple propone abrir otro archivo, porque el que estaba abierto puede ser el que da problemas. En Notas, eso es otra
          nota.
        </li>
        <li id="actualizar-mac">
          <strong>Actualiza macOS</strong>{" "}
          Apple dice que conviene hacer antes una copia de seguridad del Mac. No dejes que el Mac entre en reposo ni cierres la tapa
          hasta que termine la instalación.
          <Paths rows={[
            { on: "Mac", steps: ["Ajustes del Sistema", "General", "Actualización de software"] },
          ]} />
        </li>
        <li id="perifericos">
          <strong>Desconecta lo nuevo y quita complementos</strong>{" "}
          Apple propone desconectar un dispositivo que acabas de conectar, como una impresora, y desinstalar módulos o mejoras de otros
          fabricantes, que pueden dejar de funcionar después de actualizar una app o macOS.
        </li>
      </Steps>
      <p>
        Los pasos son de los artículos de Apple <a href="https://support.apple.com/es-es/guide/mac-help/mchlp2579/mac" rel="noopener">Si
        una app se bloquea o se cierra de manera inesperada en el Mac</a> y <a href="https://support.apple.com/es-es/102586"
        rel="noopener">Cómo forzar la salida de una app en Mac</a>. Si sigue pasando, el <a href="https://support.apple.com/es-es/116946"
        rel="noopener">artículo de Apple sobre el modo seguro</a> explica cómo saber si el problema lo causa el software que se carga al
        arrancar el Mac.
      </p>

      <h2 id="no-cargan">Notas se abre, pero tus notas no cargan</h2>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Notas de Apple en macOS 27 sin iCloud, en inglés: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. Botones System Settings y Cancel."
        caption="Lo que muestra Notas en un Mac con iCloud desactivado para Notas (en español: Activa iCloud)." />
      <p>
        Si la app funciona pero la lista está vacía, los pasos de Apple son comprobar que Sincronizar este iPhone (o Sincronizar este Mac)
        está activado para Notas y luego mirar en la app Notas. Si las notas siguen sin aparecer, reinicia el dispositivo y vuelve a
        comprobar el ajuste. Apple dice que, cuando termine la sincronización, deberían aparecer las notas que ya estaban en iCloud.
      </p>
      <Paths rows={[
        { on: "iPhone, iOS 27", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo", "Notas"] },
        { on: "iPhone, iOS 26", steps: ["Ajustes", "Tu nombre", "iCloud", "Notas"] },
        { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas"] },
      ]} />
      <p>
        Viene de <a href="https://support.apple.com/es-es/121669" rel="noopener">Si no ves tus notas de iCloud en la app Notas</a>. Si las
        notas aparecen en un dispositivo y en el otro no, <a href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza entre iPhone y
        Mac</a> repasa el resto de comprobaciones. Si falta una nota en todos, mira en Recién eliminado, donde las notas eliminadas se
        quedan 30 días: <a href="/es/blog/notas-iphone-desaparecieron">¿Desaparecieron tus notas del iPhone?</a> te dice dónde buscar en
        cada dispositivo.
      </p>

      <h2 id="tras-actualizar">No funciona después de una actualización</h2>
      <p>
        Cuando un dispositivo está actualizado y el otro no, una nota creada en el más nuevo puede usar funciones que la versión antigua
        de Notas no tiene. En un Mac, Notas muestra entonces &ldquo;Esta nota utiliza funciones no compatibles. Para visualizarla o
        editarla, actualiza macOS a la versión más reciente.&rdquo; La nota se ha sincronizado, pero ese Mac no puede abrirla. La solución
        es actualizar el dispositivo que va atrasado.
      </p>
      <p>
        Si la propia app Notas empezó a cerrarse después de una actualización, los pasos de arriba siguen siendo los que da Apple. Busca
        también una actualización más reciente, porque Apple incluye las actualizaciones de software entre las soluciones para una app que
        se cierra.
      </p>

      <h2 id="la-proxima-vez">Una copia, para la próxima vez</h2>
      <p>
        Tener una copia de tus notas fuera de la app Notas vale la pena pase lo que pase. <a href="/blog/back-up-apple-notes"
        hrefLang="en">How to back up Apple Notes</a> (en inglés) explica cómo guardarla.
      </p>

      <h2 id="pinto-notes">Un segundo sitio para tus notas</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={460}
        alt="La hoja Import from Apple Notes de Pinto Notes en un Mac, en inglés: copia las notas que eliges y no cambia nada en Notas de Apple. Cada nota aparece bajo su carpeta de Notas de Apple, todas marcadas, con el botón Import 8 Notes."
        caption="Import from Apple Notes en Pinto Notes en un Mac. Copia tus notas y deja Notas de Apple como estaba." />
      <p>
        Pinto Notes no arregla Notas de Apple. Es una app de notas que se parece a Notas de Apple y funciona igual en iPhone y Mac, y
        puede guardar una segunda copia de tus notas: <a href="/blog/move-from-apple-notes" hrefLang="en">pasarte desde Notas de
        Apple</a> (en inglés) es una sola importación en tu Mac, y Notas de Apple no cambia. La importación lee tus notas a través de Notas
        de Apple, así que Notas tiene que abrirse en ese Mac. A partir de ahí, Pinto Notes guarda todas las versiones anteriores de cada
        nota. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
