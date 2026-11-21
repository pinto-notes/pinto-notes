import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "pegar-sin-formato-notas-iphone");

// Spanish version of /blog/apple-notes-paste-without-formatting, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "pegar sin formato mac" returned itself,
// "pegar texto sin formato mac" and "atajo pegar sin formato mac";
// "pegar texto sin formato iphone" returned itself; "pegar sin formato notas mac" returned [].
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/not9474646a9/26/mac/26
// (Edición > Pegar con el mismo estilo, Pegar y conservar estilo), /es-es/102553
// (Opción + Mayús + Comando + V), /es-es/guide/notes/apd46c25187e/mac
// (Mayúsculas + Comando + B applies formato de cuerpo),
// /es-es/guide/iphone/iph1a9cae52c/ios (select and paste gestures),
// /es-es/guide/iphone/iph1ac0b3a2/ios (formatting controls). The iPhone pages do not
// document a universal paste-without-formatting command. No picture.

const ui = UI.es;
const FAQ = [
  { q: "¿Qué atajo pega con el estilo de la nota en el Mac?", a: ["Opción + Mayús + Comando + V. También puedes elegir Edición, Pegar con el mismo estilo. El texto adopta el estilo que lo rodea. Si el atajo varía en tu teclado, consulta el menú Edición."] },
  { q: "¿Apple documenta ese comando para Notas del iPhone?", a: ["Las guías del iPhone consultadas explican el pegado normal y los controles de formato, pero no un comando universal para pegar sin formato. Puedes seleccionar el texto pegado y ajustar su estilo."] },
  { q: "¿Por qué el texto pegado sigue siendo un encabezado?", a: ["Pegar con el mismo estilo toma el formato del lugar de destino. Si el cursor está en un encabezado, el texto puede seguir siéndolo. En el Mac, aplica formato de cuerpo con Mayús + Comando + B antes de pegar otra vez."] },
  { q: "¿Cómo quito el estilo de un fragmento ya pegado?", a: ["Copia solo el fragmento afectado, selecciónalo en la nota y aplica formato de cuerpo si lo quieres como párrafo. Luego usa Edición, Pegar con el mismo estilo para sustituir la selección."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="pegar-sin-formato-notas-iphone" hero={<></>}
    intro={<>Para pegar texto sin el formato de origen en Notas del Mac, elige Edición, Pegar con el mismo estilo o pulsa Opción + Mayús + Comando + V. Las guías de Apple para iPhone no documentan un comando equivalente.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#mac", label: "Atajo del Mac" }, { href: "#pegado", label: "Corregir texto pegado" },
      { href: "#iphone", label: "En el iPhone" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Pinto Notes" },
    ]}><p>En el Mac, Pegar con el mismo estilo aplica al texto copiado el formato que rodea al cursor. Usa Opción + Mayús + Comando + V en lugar de Comando + V. En el iPhone, Apple explica cómo pegar y dar formato después, sin indicar el mismo comando.</p>
      <PostCta slug="es/pegar-sin-formato-notas-iphone" path="/es/blog/pegar-sin-formato-notas-iphone" position="answer" ui={ui.cta} title="Prueba notas escritas en Markdown">
        <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, con Markdown por debajo. En el Mac, convierte el texto enriquecido compatible a Markdown y usa texto sin formato si esa conversión no produce Markdown.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="mac">Pega sin el formato de origen en el Mac</h2>
    <Steps><li>Selecciona el texto en la página o documento de origen y pulsa Comando + C.</li><li>Abre la nota y coloca el cursor donde quieres pegarlo.</li><li>Elige Edición, Pegar con el mismo estilo, o pulsa Opción + Mayús + Comando + V.</li></Steps>
    <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar con el mismo estilo"], keys: "⌥⇧⌘V" }]} />
    <p>La <a href="https://support.apple.com/es-es/guide/notes/not9474646a9/26/mac/26">guía de Notas para macOS 26</a> documenta el menú y el <a href="https://support.apple.com/es-es/102553">artículo sobre copiar y pegar en el Mac</a> da el atajo. Consulta el menú Edición si tu teclado usa otra combinación.</p>
    <p>Por ejemplo, puedes pegar un párrafo de una receta en tus notas de cocina. Así toma el estilo del texto cercano. Si quieres conservar el formato de origen, la guía de Notas indica Edición, Pegar y conservar estilo.</p>
    <h2 id="pegado">Corrige texto que ya has pegado</h2>
    <p>Selecciona solo el fragmento que vas a corregir para no cambiar el resto de la nota.</p>
    <Steps><li>Copia el texto afectado con Comando + C.</li><li>Mantén el fragmento seleccionado. Si quieres un párrafo normal, pulsa Mayús + Comando + B para aplicar formato de cuerpo.</li><li>Elige Edición, Pegar con el mismo estilo para sustituir la selección por el texto copiado.</li></Steps>
    <p>Apple incluye Mayúsculas + Comando + B en los <a href="https://support.apple.com/es-es/guide/notes/apd46c25187e/mac">atajos de Notas</a>. Si necesitas cambiar la tipografía o el tamaño, consulta la <a href="/es/blog/cambiar-letra-notas-iphone">guía de tipos de letra</a>.</p>
    <h2 id="iphone">Lo que documenta Apple para el iPhone</h2>
    <p>La <a href="https://support.apple.com/es-es/guide/iphone/iph1a9cae52c/ios">guía de edición de texto</a> explica cómo seleccionar, copiar y pegar. No describe Pegar con el mismo estilo. La <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de formato de Notas</a> muestra cómo cambiar el texto después de pegarlo.</p>
    <Steps><li>Toca la nota para colocar el cursor. Apple también documenta separar tres dedos para pegar.</li><li>Para seleccionar el texto pegado, toca dos veces una palabra y arrastra los tiradores hasta abarcar el fragmento.</li><li>Usa el botón Formato para ajustar la negrita, la cursiva u otro estilo que no quieras.</li></Steps>
    <p>Estos controles ajustan la selección, pero las páginas consultadas no los presentan como un solo comando que quite todos los estilos de origen. Si necesitas pegar con el estilo de destino, usa el comando del Mac cuando tengas acceso a Notas allí.</p>
    <h2 id="limites">Los límites de adaptar el estilo</h2>
    <p>El comando usa el formato del lugar donde pegas. Si el cursor está en un encabezado, el resultado también puede ser un encabezado. Para un párrafo normal en el Mac, aplica formato de cuerpo antes de pegar.</p>
    <p>Comprueba el resultado antes de sustituir un fragmento largo. Decide si necesitas conservar enlaces y listas además del texto. Para fragmentos con estilo propio, <a href="/es/blog/bloque-codigo-notas-iphone">Monoestilo en Notas</a> es otra opción. Si un comando de pegado aparece atenuado, Apple indica que la app no puede usarlo con el elemento o lugar actual. Coloca el cursor en el texto y copia una selección antes de repetirlo.</p>
    <h2 id="pinto-notes">Cómo pega Pinto Notes en el Mac</h2>
    <p>Pinto Notes guarda el texto como Markdown y lo muestra con formato. En el Mac, su editor trata primero archivos e imágenes. Después intenta convertir el texto enriquecido a Markdown. Si no obtiene Markdown, pega texto sin formato. Un pegado enriquecido puede conservar parte de su estructura, así que revisa el resultado.</p>
    <p>Este comportamiento corresponde al editor del Mac. Si solo te molesta el estilo de origen, prueba primero el comando de Notas del Mac. Si además quieres que ChatGPT o Claude lea y edite tus notas, puedes <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectarlo</a> (en inglés). Tus notas de Apple se <a href="/blog/move-from-apple-notes" hrefLang="en">importan una vez en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
