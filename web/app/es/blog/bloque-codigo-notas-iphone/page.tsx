import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "bloque-codigo-notas-iphone");

// Versión de /blog/apple-notes-code-block. Autocomplete, hl=es, gl=es, 21 Nov 2026:
// "bloque de codigo notas iphone" y "notas de apple codigo" no devolvieron sugerencias;
// se usa "bloque de código" para la pregunta y "Monoestilo" para el estilo de Apple.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apd1955d3b21/mac
// (botón de formato, bloque de cita), /apd46c25187e/mac (Monoestilo, Mayúsculas +
// Comando + M; Cuerpo, Mayúsculas + Comando + B; bloque de cita, Comando + apóstrofo),
// /es-es/guide/iphone/iph1ac0b3a2/ios (controles de formato). La página del iPhone
// no nombra Monoestilo ni bloque de cita: se describe el control sin inventar su opción.
// La guía inglesa de funciones de iOS 17 explica el cambio desde Monoespaciado.
const ui = UI.es;
const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;
const FAQ = [
  { q: "¿Qué es lo más parecido a un bloque de código en Notas?", a: ["Monoestilo. Usa una letra de ancho fijo y separa el texto del resto. Las guías de Apple describen este estilo y el bloque de cita, pero no un comando específico de bloque de código ni resaltado de sintaxis."] },
  { q: "¿Qué atajo da formato a un fragmento de código en Mac?", a: ["Selecciona el fragmento y pulsa Mayúsculas + Comando + M para aplicar Monoestilo. Apple también indica Comando + apóstrofo para bloque de cita y Mayúsculas + Comando + B para Cuerpo. Son estilos de texto."] },
  { q: "¿Por qué algunas guías dicen Monoespaciado?", a: ["La guía de funciones de iOS 17 de Apple explica que el antiguo estilo Monoespaciado pasó a Monoestilo, con el texto separado y otro fondo."] },
  { q: "¿El bloque de cita colorea código según el lenguaje?", a: ["Apple lo describe como un estilo para separar una cita con una barra. No documenta resaltado de sintaxis. Para un fragmento de código, usa Monoestilo."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="bloque-codigo-notas-iphone"
    intro={<>Para guardar un fragmento de código en Notas de Apple, usa Monoestilo. Apple documenta ese estilo y el bloque de cita, pero no un comando propio de bloque de código ni resaltado de sintaxis.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Atajo en Mac" }, { href: "#iphone", label: "En iPhone" },
      { href: "#cita", label: "Bloque de cita" }, { href: "#limites", label: "Límites" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>En el Mac, selecciona el código y pulsa Mayúsculas + Comando + M. Monoestilo es el nombre actual del estilo antes llamado Monoespaciado. En el iPhone, selecciona el fragmento y abre los controles de formato. Las guías de Apple no documentan coloreado automático según el lenguaje.</p>
      <PostCta slug="es/bloque-codigo-notas-iphone" path="/es/blog/bloque-codigo-notas-iphone" position="answer" ui={ui.cta} title="¿Quieres un comando para bloques de código?"><p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Su menú / incluye Code Block y Callout.</p></PostCta>
    </Answer>} faq={FAQ}>
      <h2 id="mac">Da formato al código en un Mac</h2>
      <p>Monoestilo usa una letra de ancho fijo, separa el texto y le da otro fondo. Sirve para distinguir un comando o una configuración breve dentro de una nota.</p>
      <Steps>
        <li><strong>Pega el fragmento en una nota.</strong> Deja la explicación encima o debajo para poder seleccionar solo el código.</li>
        <li><strong>Selecciona el código y aplica Monoestilo.</strong> Abre el botón de formato de la barra de herramientas y elige el estilo, o pulsa Mayúsculas + Comando + M.</li>
        <li><strong>Usa Cuerpo para la explicación.</strong> Selecciona el texto normal y pulsa Mayúsculas + Comando + B.</li>
      </Steps>
      <Paths rows={[{ on: "Mac, código", steps: ["Botón de formato", "Monoestilo"], keys: "⇧⌘M" }, { on: "Mac, explicación", steps: ["Botón de formato", "Cuerpo"], keys: "⇧⌘B" }]} />
      <p>Los atajos figuran en la <a href="https://support.apple.com/es-es/guide/notes/apd46c25187e/mac">guía de teclado de Apple</a>. Pueden variar según el idioma y la distribución del teclado. Los estilos de párrafo necesitan notas en iCloud o guardadas en el Mac.</p>
      <Keep title="Un fragmento para probar" text={SNIPPET} code copyLabel={ui.copy} note="Pégalo en Notas, selecciónalo y aplica Monoestilo. El formato de esta página web no representa el aspecto de Notas." />
      <h2 id="iphone">Da formato al código en el iPhone</h2>
      <p>Selecciona el fragmento, toca el botón de formato y recorre las opciones de estilo. La <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía del iPhone</a> explica esos controles, pero no enumera el nombre de este estilo en esa página. Si tu versión muestra Monoestilo, selecciónalo.</p>
      <Paths rows={[{ on: "iPhone", steps: ["Seleccionar texto", "Botón de formato", "Elegir el estilo de ancho fijo si aparece"] }]} />
      <p>Si sigues una guía antigua que dice Monoespaciado, busca Monoestilo. Apple explica el cambio en su <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf">guía de funciones de iOS 17</a> (en inglés).</p>
      <h2 id="cita">El bloque de cita es para texto citado</h2>
      <p>El bloque de cita separa un pasaje con una barra. Úsalo para palabras tomadas de una documentación y deja tu explicación fuera. Para el código, elige Monoestilo.</p>
      <Paths rows={[{ on: "Mac", steps: ["Seleccionar texto", "Botón de formato", "Bloque de cita"], keys: "⌘'" }, { on: "iPhone", steps: ["Seleccionar texto", "Botón de formato", "Elegir el estilo de cita si aparece"] }]} />
      <p>La <a href="https://support.apple.com/es-es/guide/notes/apd1955d3b21/mac">guía de formato del Mac</a> incluye el bloque de cita entre los estilos. Su guía de atajos indica Comando + apóstrofo.</p>
      <h2 id="limites">El resaltado de sintaxis</h2>
      <p>Las guías de formato y atajos de Apple documentan Monoestilo y el bloque de cita. No documentan un comando específico para bloques de código ni resaltado que reconozca un lenguaje de programación. Monoestilo ayuda con fragmentos breves, pero esas páginas no describen un editor de código.</p>
      <p>Notas sí permite resaltar texto a mano con un color. Eso es distinto de reconocer palabras clave y cadenas en el código. Conserva una copia ejecutable en tu proyecto y usa la nota para explicar qué hace el fragmento y por qué lo guardaste.</p>
      <h2 id="pinto">Code Block y Callout en Pinto Notes</h2>
      <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Escribe / al principio de una línea para abrir el menú. Elige Code Block para un fragmento o Callout para una advertencia. Ambos comandos están en iPhone y Mac.</p>
      <p>Una vez conectados, Claude Code y Codex pueden leer y editar tus notas. <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">La guía de Claude Code y Codex</a> (en inglés) explica la conexión.</p>
      <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus Notas de Apple</a> de una vez en el Mac. Las originales no cambian.</p>
    </LocalPostPage>;
}
