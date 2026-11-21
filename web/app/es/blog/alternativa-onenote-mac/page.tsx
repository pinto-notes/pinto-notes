import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-onenote-mac");

// Traducción de /blog/onenote-alternative-for-mac, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "alternativa a onenote para mac" no dio sugerencias;
// "alternativas a onenote" dio esa frase, "alternativas a onenote gratis",
// "alternativas a onenote en linux" y "alternativas a onenote open source".
// El original no cita pasos de Notas de Apple. Los menús de OneNote y Pinto siguen el original
// y sus guías de Microsoft. No se probó una conversión de cuadernos.

const ui = UI.es;
const CHECK = `Comprobación del traslado desde OneNote
Conserva el acceso al cuaderno original.
Elige cinco páginas de texto que hayas usado esta semana.
Copia cada una a una nota o archivo de texto separado.
Comprueba el orden de lectura y las tablas.
Compara enlaces, imágenes y adjuntos con los originales.
Guarda dibujos y diseños de página en el original o en un PDF.
Prueba las notas nuevas en Mac y iPhone antes de mover más.`;
const FAQ = [
  { q: "¿Puede Pinto Notes abrir archivos .one o .onepkg?", a: ["No. No tiene un importador directo de OneNote. Puede importar una carpeta o un ZIP de archivos Markdown o de texto, pero la descarga de un cuaderno OneNote no tiene ese formato. Copia las páginas escritas que necesites o prepara tú los archivos."] },
  { q: "¿Qué puedo guardar desde OneNote en un Mac?", a: ["Microsoft documenta File, Save as PDF para la página actual. La exportación web de un cuaderno completo solo sirve para cuentas personales de OneDrive, no para cuentas de trabajo o centros educativos ni SharePoint. Ninguna vía crea notas editables en Pinto."] },
  { q: "¿Un PDF de OneNote se convierte en una nota editable?", a: ["No. El importador Markdown y de texto de Pinto no convierte páginas PDF en notas editables. Guarda el PDF como referencia. Para seguir editando el texto, cópialo a una nota o prepara un archivo Markdown o de texto."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="alternativa-onenote-mac"
    intro={<>Pinto Notes puede ser una alternativa a OneNote para apuntes personales escritos en Mac. Se parece a Notas de Apple y permite conectar una IA. Como no importa OneNote directamente, empieza con notas nuevas o unas pocas páginas que todavía uses.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#elegir", label: "Qué mover" }, { href: "#guardar", label: "Guardar los originales" },
      { href: "#trasladar", label: "Pasar el texto" }, { href: "#pinto", label: "Usarlo con IA" },
    ]}>
      <p>Pinto Notes sirve para apuntes personales escritos en Mac y iPhone. Una vez conectados, ChatGPT o Claude pueden leerlos y editarlos. Mantén en OneNote los cuadernos que necesiten diseño libre, dibujos o páginas compartidas. Pinto no importa cuadernos completos ni archivos nativos de OneNote.</p>
      <PostCta slug="es/alternativa-onenote-mac" path="/es/blog/alternativa-onenote-mac" position="answer" ui={ui.cta} title="Prueba Pinto Notes con tu próxima nota"><p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. La descarga para Mac es gratuita y puedes conectar ChatGPT o Claude a tus notas.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="elegir">Elige las notas que todavía utilizas</h2>
    <p>Empieza por un proyecto actual o unas páginas de consulta personal. Deja el archivo en OneNote mientras pruebas la nueva app. Copiar las palabras de una página con dibujos alrededor de un diagrama no conserva su diseño.</p>
    <p>OneNote organiza cuadernos, secciones y páginas. En Mac permite dibujar en cualquier parte de la página con ratón o trackpad; los cuadernos compartidos permiten colaborar. Microsoft documenta la <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/create-pages-sections-or-notebooks-in-onenote-for-mac">estructura</a>, los <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/draw-and-annotate-with-ink-in-onenote-for-mac">dibujos</a> y las <a href="https://support.microsoft.com/en-us/onenote/onenote-for-mac-help-and-learning/share-your-notes-in-onenote-for-mac">notas compartidas</a>.</p>
    <p>OneNote también funciona en Windows, Android y el navegador, según la <a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions">guía de Microsoft</a>. Pinto Notes solo funciona en iPhone y Mac. Para comparar la app de Apple, lee <a href="/es/blog/notas-apple-vs-onenote">Notas de Apple frente a OneNote</a>.</p>
    <h2 id="guardar">Guarda los originales antes de mover el texto</h2>
    <p>En un Mac, abre una página de OneNote y usa File, Save as PDF. Elige un nombre y guarda el archivo. La <a href="https://support.microsoft.com/en-gb/onenote/onenote-for-mac-help-and-learning/export-notes-as-a-pdf-file-in-onenote-for-mac">guía de Microsoft</a> describe una copia fija de esa página: los cambios posteriores no actualizan el PDF. Ábrelo y compruébalo.</p>
    <p>Para un cuaderno completo, OneNote para la web ofrece otra exportación. Haz clic derecho en el cuaderno, elige Export notebook y confirma con Export. Según su <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks">guía</a>, solo funciona con OneDrive personal, no con cuentas de trabajo o de centros educativos ni con SharePoint. Guarda la descarga como copia de seguridad, no como archivo para importar en Pinto.</p>
    <h2 id="trasladar">Qué puede importar Pinto desde OneNote</h2>
    <p>No hay importación directa. Pinto no convierte <code>.one</code> ni <code>.onepkg</code> en notas. Su importador Markdown y de texto tampoco convierte los PDF de OneNote en notas editables. Meter la exportación de un cuaderno en un ZIP no cambia su formato.</p>
    <p>Para unas pocas páginas, copia el texto a notas nuevas, una por página. Empieza por una corta y compara el orden de los bloques, las tablas y los enlaces. Trae las imágenes y los adjuntos aparte si los necesitas; la copia del texto no garantiza que vengan incluidos.</p>
    <p>Para más páginas, prepara tú una carpeta de archivos Markdown o de texto, uno por nota. Las guías de Microsoft citadas no presentan esto como una opción de exportación de OneNote. En Pinto para Mac, elige File, Import Markdown or Text y selecciona la carpeta. La <a href="/blog/import-your-notes" hrefLang="en">guía de Pinto</a> indica que acepta una carpeta o un ZIP y que cada carpeta se convierte en una carpeta.</p>
    <Keep title="Revisa unas pocas páginas antes de mover más" text={CHECK} copyLabel={ui.copy} note="Es una lista para un traslado manual, no una conversión automática del cuaderno." />
    <p>Conserva en el cuaderno original o en un PDF comprobado las páginas que dependan de dibujos, escaneos o diseños libres. Este método pasa texto escrito, no reproduce esas partes como contenido editable.</p>
    <h2 id="pinto">Usa tus apuntes con ChatGPT o Claude</h2>
    <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, tu IA puede leer y editar las notas. Al aprobar la conexión das ambos permisos. Pinto guarda las versiones anteriores.</p>
    <p>Prueba con una petición concreta: «Lee mis notas del proyecto de la cocina y añade una lista de decisiones pendientes». Comprueba el resultado. La conexión solo da acceso al texto que trajiste a Pinto; no importa el resto de OneNote.</p>
    <p>Escribe tus próximos apuntes personales en Pinto y comprueba si cubre tu trabajo diario. Puedes mantener los cuadernos compartidos en OneNote y trasladar más páginas después.</p>
  </LocalPostPage>;
}
