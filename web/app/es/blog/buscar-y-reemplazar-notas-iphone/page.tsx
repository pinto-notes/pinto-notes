import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "buscar-y-reemplazar-notas-iphone");

// Spanish version of /blog/apple-notes-find-and-replace, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "buscar y reemplazar en notas" returned itself,
// "buscar y reemplazar en bloc de notas" and a shortcut variant; "buscar y reemplazar notas iphone"
// returned []. The title keeps the broader words, with iPhone to name the device.
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/search-your-notes-not18ab658ed/mac
// (Comando + F within a note), /es-es/guide/iphone/iphb8628c6b8/ios (Acciones de nota,
// Buscar en la nota, botón Buscar), /es-es/guide/notes/not9474646a9/mac (edit and paste),
// /es-es/guide/iphone/iph1a9cae52c/ios (select and edit text),
// /es-es/guide/textedit/find-and-replace-text-txtef6cfde1a/mac (Edición > Buscar > Buscar,
// casilla Reemplazar, botones Reemplazar, Todo, Aceptar). Notes guides do not verify a
// replacement control, so none is named here. No picture.

const ui = UI.es;
const RENAME = `En mi carpeta Lanzamiento de Pinto Notes, busca las notas que contienen "prueba del puerto".
Lee cada nota y enséñame los fragmentos que cambiarías por "vista previa del puerto".
No cambies citas de reuniones anteriores ni direcciones web. Todavía no edites nada.
Cuando apruebe los fragmentos, actualiza esas notas y enumera las que has cambiado.`;
const FAQ = [
  { q: "¿Qué explica Apple sobre buscar y reemplazar en Notas?", a: ["Sus guías actuales explican Comando + F dentro de una nota en el Mac y Acciones de nota, Buscar en la nota, en el iPhone. No detallan los controles de reemplazo. Eso no demuestra que Notas carezca de ellos."] },
  { q: "¿Cómo busco dentro de una sola nota en el Mac?", a: ["Abre la nota, pulsa Comando + F y escribe el texto. Apple distingue esta búsqueda de la que encuentra notas en toda la cuenta."] },
  { q: "¿Dónde está Buscar en la nota en el iPhone?", a: ["Abre una nota, toca Acciones de nota y luego Buscar en la nota. El botón Buscar de esa vista abre las opciones de búsqueda."] },
  { q: "¿Puede una IA cambiar una frase en varias notas de Pinto?", a: ["Sí. Tras conectarla, ChatGPT o Claude puede buscar y leer las notas coincidentes y editar cada una. La herramienta cambia texto exacto en una nota por llamada; varias notas requieren varias ediciones."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="buscar-y-reemplazar-notas-iphone" hero={<></>}
    intro={<>Para buscar texto dentro de una nota, pulsa Comando + F en el Mac o toca Acciones de nota y Buscar en la nota en el iPhone. Las guías actuales de Apple explican la búsqueda, pero no detallan los controles de reemplazo.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Buscar en el Mac" }, { href: "#iphone", label: "Buscar en el iPhone" },
      { href: "#reemplazo", label: "Reemplazar en bloque" }, { href: "#limites", label: "Varias notas" },
      { href: "#pinto-notes", label: "Cambiar con IA" },
    ]}><p>Busca primero dentro de la nota y corrige a mano los casos que encuentres. Si necesitas cambiar muchas apariciones, puedes trabajar con una copia del texto en TextEdit. Apple sí documenta allí la casilla Reemplazar y el botón Todo.</p>
      <PostCta slug="es/buscar-y-reemplazar-notas-iphone" path="/es/blog/buscar-y-reemplazar-notas-iphone" position="answer" ui={ui.cta} title="Cambia un término en varias notas">
        <p>En Pinto Notes, ChatGPT o Claude, una vez conectado, puede encontrar una frase y editar cada nota correspondiente. Se conservan las versiones anteriores.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="mac">Busca texto dentro de una nota en el Mac</h2>
    <Steps><li>Abre la nota que quieres revisar.</li><li>Pulsa Comando + F para abrir la búsqueda.</li><li>Escribe la palabra o frase.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Abrir una nota", "Buscar dentro de la nota"], keys: "⌘F" }]} />
    <p>Apple explica este paso en su <a href="https://support.apple.com/es-es/guide/notes/search-your-notes-not18ab658ed/mac">guía de búsqueda de Notas para Mac</a>. Es distinto de buscar notas en toda una cuenta. Busca la frase completa que quieres cambiar, no solo una palabra que también aparezca en otros contextos.</p>
    <p>La guía no da un atajo ni una secuencia para reemplazar. Por eso aquí no se atribuye a Notas un menú de reemplazo sin verificar. Para pocos cambios, edita cada coincidencia. Para un bloque largo de texto, usa una copia en TextEdit.</p>
    <h2 id="iphone">Busca texto en Notas del iPhone</h2>
    <Steps><li>Abre la nota y toca el botón Acciones de nota.</li><li>Toca Buscar en la nota.</li><li>Escribe la frase. El botón Buscar de esta vista abre las opciones.</li></Steps>
    <Paths rows={[{ on: "iPhone", steps: ["Acciones de nota", "Buscar en la nota"] }]} />
    <p>Apple recoge estos pasos en <a href="https://support.apple.com/es-es/guide/iphone/iphb8628c6b8/ios">Buscar en las notas en el iPhone</a>. La página no explica una secuencia de botones para buscar y reemplazar.</p>
    <p>Para corregir a mano, vuelve a editar la nota. Toca dos veces una palabra, ajusta los tiradores de selección y escribe el texto nuevo. La <a href="https://support.apple.com/es-es/guide/iphone/iph1a9cae52c/ios">guía de edición de texto</a> explica la selección. Revisa la frase que rodea cada coincidencia.</p>
    <h2 id="reemplazo">Reemplazo en bloque documentado para Mac</h2>
    <p>Si es un fragmento largo de texto normal, cópialo a TextEdit, haz el cambio y devuelve el texto revisado a la nota. Conserva la nota original hasta comprobar el resultado. Este método no traslada adjuntos ni preserva un diseño complejo.</p>
    <Steps><li>Copia el fragmento desde Notas a un documento de TextEdit.</li><li>En TextEdit, elige Edición, Buscar, Buscar y escribe la frase anterior.</li><li>Activa la casilla Reemplazar junto a Aceptar e introduce la frase nueva en el campo inferior.</li><li>Pulsa Reemplazar para una coincidencia o Todo para todas las de ese documento.</li><li>Pulsa Aceptar. Revisa el texto y cópialo al lugar adecuado de la nota.</li></Steps>
    <Paths rows={[{ on: "TextEdit en Mac", steps: ["Edición", "Buscar", "Buscar", "Casilla Reemplazar"] }]} />
    <p>Los nombres vienen de la <a href="https://support.apple.com/es-es/guide/textedit/find-and-replace-text-txtef6cfde1a/mac">guía de TextEdit</a>. «Todo» es un botón de TextEdit, no un nombre de menú comprobado en Notas.</p>
    <h2 id="limites">Cambiar varias notas</h2>
    <p>Encontrar todas las notas con un nombre y decidir dónde cambiarlo son tareas distintas. Las guías de búsqueda de Notas revisadas no documentan un solo reemplazo para varias notas. Busca la frase, abre cada nota y comprueba el contexto. Un nombre nuevo puede corresponder a un plan actual, pero una cita antigua debe conservar su texto.</p>
    <p>Si no aparece una nota que sabes que existe, consulta las <a href="/es/blog/buscar-en-notas-iphone-no-funciona">comprobaciones de búsqueda</a>.</p>
    <h2 id="pinto-notes">Cambia una frase con una IA conectada</h2>
    <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), puede buscar, leer y editar notas. Pide primero una propuesta de cambios.</p>
    <Keep title="Petición para cambiar un nombre" text={RENAME} copyLabel={ui.copy} note="Cambia la carpeta y las frases. Es una forma de pedir la revisión, no una regla automática." />
    <p>La herramienta de Pinto reemplaza texto exacto en una nota identificada. Puede cambiar todas sus apariciones, pero la IA debe leer la versión actual antes de editar. Varias notas requieren búsquedas, lecturas y ediciones separadas.</p>
    <p>Después de aprobar los fragmentos, dile cuáles debe cambiar. Revisa el resultado y las excepciones. Se conservan las versiones anteriores; consulta la <a href="/blog/apple-notes-version-history" hrefLang="en">guía del historial</a> (en inglés). Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
