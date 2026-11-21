import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-salta-al-principio");

// Versión de /blog/apple-notes-keeps-jumping-to-top. Búsqueda local, 21 Nov 2026:
// "notas iphone salta al principio", "notas iphone vuelve arriba al escribir" y
// "notas iphone se van arriba" se buscaron en español. Autocomplete hl=es, gl=es
// no devolvió sugerencias para esas frases; "salta al principio" describe el síntoma.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/119876 (cerrar, reiniciar,
// actualizar, riesgo al eliminar), /es-es/guide/iphone/iph83bfec492/ios (selector de app),
// /es-es/118259 (reinicio), /es-es/guide/mac-help/mchlp2579/mac y /mchlp2522/mac
// (reiniciar Mac), /es-es/118575 y /108382 (Ajustes > General > Actualización de
// software; Ajustes del Sistema > General > Actualización de software), /es-es/121669
// (solo si faltan notas), /es-es/guide/icloud/-mm8685520792/icloud (Sincronizar este
// iPhone/Mac, Ver todo o Mostrar todo, icloud.com/notes). Apple no da una solución
// específica para este salto. Captura inglesa de un aviso de iCloud, no del problema.
const ui = UI.es;
const RECORD = `Notas salta al principio
Dispositivo y versión de iOS o macOS:
¿Pasa en una nota o en varias?:
¿Qué hice justo antes del salto?:
¿Se mueve la página, el cursor o ambos?:
¿Escribir también va lento?:
¿Qué pasó después de reiniciar?:
¿Qué pasó después de actualizar?:
¿Qué ocurre con la misma nota en otro dispositivo?:
`;
const FAQ = [
  { q: "¿Apple ha publicado una solución para las notas que saltan al principio?", a: ["Apple no documenta una solución para este fallo concreto en las páginas consultadas. Su consejo general es cerrar y abrir la app, reiniciar el dispositivo y buscar actualizaciones. No garantiza que esos pasos resuelvan el salto."] },
  { q: "¿Desactivar iCloud evita que Notas suba sola?", a: ["Las páginas consultadas no señalan iCloud como causa ni aconsejan desactivarlo para arreglar el desplazamiento. Apple pide comprobar la sincronización cuando faltan notas. Es otro síntoma."] },
  { q: "¿Qué puedo probar si Notas va lenta y pierdo el punto de lectura?", a: ["Prueba a escribir esa sección en una nota nueva sin tocar la original. También puedes probar la misma nota de iCloud en otro dispositivo o en icloud.com/notes. Son alternativas para probar, sin garantía de que eliminen el salto."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="notas-iphone-salta-al-principio"
    intro={<>Apple no documenta una solución para cuando Notas salta al principio. Empieza por sus pasos generales de reinicio y actualización. Si sigue ocurriendo, prueba otra forma de continuar escribiendo.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#reiniciar", label: "Reiniciar Notas" }, { href: "#actualizar", label: "Buscar actualizaciones" },
      { href: "#icloud", label: "Comprobar iCloud" }, { href: "#seguir", label: "Seguir escribiendo" },
    ]}>
      <p>Cierra y vuelve a abrir Notas, reinicia el iPhone o el Mac y busca una actualización de iOS o macOS. Apple recomienda esos pasos cuando una app falla, pero no promete que solucionen este salto. Si además faltan notas en otro dispositivo, comprueba que Notas esté activado en iCloud.</p>
      <PostCta slug="es/notas-iphone-salta-al-principio" path="/es/blog/notas-iphone-salta-al-principio" position="answer" ui={ui.cta} title="Prueba una copia en Pinto Notes"><p>Pinto Notes <a href="/blog/move-from-apple-notes" hrefLang="en">importa Notas de Apple desde el Mac</a> (guía en inglés) sin cambiar las originales. Prueba allí una copia de la nota afectada antes de decidir si te conviene cambiar. No hay garantía de que evite el mismo problema.</p></PostCta>
    </Answer>} faq={FAQ}>
      <h2 id="reiniciar">Cierra Notas y reinicia el dispositivo</h2>
      <p>En el iPhone, abre el selector de app, busca Notas y deslízala hacia arriba. Toca Notas para volver a abrirla. Apple lo explica en su <a href="https://support.apple.com/es-es/guide/iphone/iph83bfec492/ios">guía para cerrar y volver a abrir apps</a>. Si vuelve a saltar, <a href="https://support.apple.com/es-es/118259">reinicia el iPhone según tu modelo</a>.</p>
      <p>En el Mac, cierra Notas y ábrela otra vez. Para reiniciar el Mac, usa Reiniciar en el menú Apple. Apple incluye este paso en su <a href="https://support.apple.com/es-es/guide/mac-help/mchlp2579/mac">guía general para apps con problemas</a>. Vuelve a la nota y repite la acción que provocaba el salto.</p>
      <p>Si Notas se congela o se cierra, consulta <a href="/es/blog/notas-iphone-no-funciona">qué probar cuando Notas no funciona</a>.</p>
      <h2 id="actualizar">Busca actualizaciones de iOS o macOS</h2>
      <p>Apple recomienda actualizar el software si una app no funciona bien. Haz antes una copia de seguridad. En el iPhone, conéctalo a la corriente y a una red Wi-Fi. En el Mac, las actualizaciones de macOS incluyen Notas.</p>
      <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "General", "Actualización de software"] }, { on: "Mac", steps: ["Menú Apple", "Ajustes del Sistema", "General", "Actualización de software"] }]} />
      <p>Sigue las instrucciones de Apple para <a href="https://support.apple.com/es-es/118575">actualizar el iPhone</a> o <a href="https://support.apple.com/es-es/108382">actualizar macOS</a>. Vale la pena probar una actualización disponible, pero eso no demuestra que Apple haya corregido este fallo.</p>
      <h2 id="icloud">Comprueba iCloud si también faltan notas</h2>
      <p>Que la página salte al escribir no demuestra un fallo de sincronización. Si la nota tampoco aparece en otro dispositivo, comprueba ese problema por separado. Los dos dispositivos deben usar la misma Cuenta de Apple y tener activada la sincronización de Notas.</p>
      <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo o Mostrar todo", "Notas", "Sincronizar este iPhone"] }, { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas", "Sincronizar este Mac"] }]} />
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Aviso de Notas en un Mac con macOS 27, en inglés, para activar iCloud." caption="Un aviso de iCloud en Notas. Sirve para comprobar la sincronización, no para arreglar el salto de la página." />
      <p>El <a href="https://support.apple.com/es-es/121669">artículo de Apple sobre notas de iCloud que faltan</a> pide reiniciar si siguen sin aparecer y volver a revisar el ajuste. La <a href="https://support.apple.com/es-es/guide/icloud/-mm8685520792/icloud">guía de iCloud para Notas</a> confirma estas rutas. Hay más comprobaciones en <a href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza</a>.</p>
      <h2 id="seguir">Cómo seguir escribiendo mientras ocurre</h2>
      <p>Estas son opciones para probar, no soluciones documentadas por Apple. Conserva la nota original mientras comparas.</p>
      <ul>
        <li>Crea una nota para la sección que estás escribiendo. Copia solo el fragmento necesario. Si ahí no salta, termina y reúne el texto después.</li>
        <li>Prueba la misma nota en otro dispositivo, si tienes uno. Repite la misma edición para comparar.</li>
        <li>Si la nota está en iCloud, ábrela en <a href="https://www.icloud.com/notes">icloud.com/notes</a>. Apple documenta el acceso desde un navegador. Si puedes editarla ahí, úsalo por ahora.</li>
      </ul>
      <p>Que una nota nueva se comporte mejor no demuestra que el problema fuera su longitud. Que funcione en el navegador tampoco explica el fallo de la app. Lo útil es saber si puedes acabar el texto.</p>
      <h2 id="persiste">Si sigue saltando o escribir va lento</h2>
      <p>Antes de eliminar la app o cambiar cuentas, conserva una copia aparte de las notas importantes. Apple avisa en su <a href="https://support.apple.com/es-es/119876">guía general de apps</a> de que eliminar una app puede borrar datos guardados en ella. Consulta <a href="/blog/back-up-apple-notes" hrefLang="en">cómo hacer una copia de Notas</a> (en inglés).</p>
      <p>Anota cuándo salta y si se mueve la página o el cursor. Si continúa, lleva esos datos al <a href="https://support.apple.com/es-es/contact">Soporte de Apple</a>. No hace falta incluir el contenido de la nota.</p>
      <Keep title="Datos para el Soporte de Apple" text={RECORD} copyLabel={ui.copy} />
    </LocalPostPage>;
}
