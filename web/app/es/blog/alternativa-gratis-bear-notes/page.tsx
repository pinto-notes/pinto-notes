import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-gratis-bear-notes");

// Traducción de /blog/bear-notes-alternative-free, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "alternativa a bear notes gratis" y "alternativas a bear notas"
// no devolvieron sugerencias; "alternativas a bear" devolvió Foreo Bear y Pull and Bear.
// Título descriptivo, sin inferir demanda. Guía de Apple leída el 21 Nov 2026:
// https://support.apple.com/es-es/guide/notes/not201900c07/mac (Archivo > Importar formato Markdown;
// la opción para mantener la estructura de carpetas no aparece con un nombre fijo).
// Los pasos de Bear y las afirmaciones sobre Pinto proceden del original inglés. La importación
// de Pinto usa los nombres de su interfaz en inglés. No se probó una migración nueva.

const ui = UI.es;
const CHECK = `Comprobación de la importación desde Bear
- [ ] Compara el texto con la nota original de Bear
- [ ] Abre una imagen en la copia importada
- [ ] Revisa una lista de comprobación y una tabla
- [ ] Sigue un enlace a otra nota
- [ ] Mira cómo aparecen las etiquetas
- [ ] Conserva la exportación original mientras pruebas la nueva app`;

const FAQ = [
  { q: "¿Se puede usar Bear sin pagar Pro?", a: ["Sí. La versión gratuita permite escribir notas locales y exportarlas en Markdown. Para sincronizarlas con iCloud necesitas Bear Pro. Si escribes en un solo dispositivo, puede que la versión gratuita te baste."] },
  { q: "¿Necesito Bear Pro para exportar Markdown?", a: ["No. Bear incluye Markdown y TextBundle entre los formatos gratuitos. En un Mac, selecciona las notas y usa File, Export Notes. Prueba la importación con unas pocas antes de mover el resto."] },
  { q: "¿Se conservan todas las funciones de Bear al cambiar a Pinto?", a: ["No se promete una equivalencia completa. Pinto importa Markdown con adjuntos, incluidas imágenes, desde un Mac. Comprueba tus etiquetas y enlaces. No se promete importar los ajustes ni las versiones anteriores de Bear."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="alternativa-gratis-bear-notes"
    intro={<>Pinto Notes es una alternativa gratuita a Bear para iPhone y Mac. Puedes importar una exportación de Bear desde un Mac. Notas de Apple es otra opción gratuita si quieres carpetas y notas compartidas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#opciones", label: "Opciones gratuitas" }, { href: "#bear", label: "Cuándo quedarte en Bear" },
      { href: "#exportar", label: "Exportar e importar" }, { href: "#comprobar", label: "Revisar las notas" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Elige Pinto Notes si quieres una app parecida a Notas de Apple que importe tus archivos de Bear y permita a ChatGPT o Claude leer y editar tus notas al conectarlos. Notas de Apple ofrece carpetas y notas compartidas en iCloud. Bear permite escribir gratis en local; sincronizar requiere Pro.</p>
      <PostCta slug="es/alternativa-gratis-bear-notes" path="/es/blog/alternativa-gratis-bear-notes" position="answer" ui={ui.cta} title="Prueba tus notas de Bear en Pinto Notes"><p>Descarga Pinto Notes gratis en tu Mac e importa primero unas pocas notas de Bear. Después, si conectas ChatGPT o Claude, podrán leerlas y editarlas.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="opciones">Qué ofrece cada opción gratuita</h2>
    <div className="tableWrap"><table><thead><tr><th>App</th><th>Para qué elegirla</th><th>Qué comprobar</th></tr></thead><tbody>
      <tr><th>Bear Free</th><td>Escribir en Markdown en local</td><td>La sincronización con iCloud requiere Pro</td></tr>
      <tr><th>Notas de Apple</th><td>Carpetas y notas compartidas</td><td>Cómo queda tu Markdown importado</td></tr>
      <tr><th>Pinto Notes</th><td>Una experiencia parecida a Notas de Apple y conexión con ChatGPT o Claude</td><td>Solo funciona en iPhone y Mac</td></tr>
    </tbody></table></div>
    <p>Apple ofrece <a href="https://apps.apple.com/us/app/notes/id1110145109">Notas gratis</a>, con sincronización por iCloud y colaboración. Cada persona que comparte una nota necesita una Cuenta de Apple. Para comparar la edición y la organización, lee <a href="/es/blog/notas-apple-vs-bear">Notas de Apple frente a Bear</a>.</p>
    <p>Pinto Notes no tiene app para Windows o Android ni versión web. Si usas iPhone y Mac, prueba primero las notas que más consultas.</p>
    <h2 id="bear">Cuándo quedarte en Bear</h2>
    <p>Bear tiene un editor Markdown con etiquetas y encabezados plegables. Si te gusta y solo necesitas notas locales, puedes seguir con el plan gratuito. Su <a href="https://bear.app/#pricing">página de precios</a>, consultada el 21 de noviembre de 2026, reserva la sincronización con iCloud y la búsqueda en imágenes y PDF para Pro.</p>
    <p>Bear también permite trabajar con IA. Su <a href="https://bear.app/faq/command-line-interface/">guía oficial</a> describe un conector para Claude de escritorio, un servidor MCP local y una herramienta de línea de comandos en Bear 2.8 o posterior para Mac. Permiten buscar, leer, crear y editar notas. Si solo quieres acceso desde una IA, prueba esa vía.</p>
    <h2 id="exportar">Exporta unas notas antes de mover toda la biblioteca</h2>
    <p>En un Mac, selecciona varias notas de Bear con Comando y haz clic. Después, usa File, Export Notes. La <a href="https://bear.app/faq/export-your-notes/">guía de Bear</a> incluye Markdown y TextBundle entre los formatos gratuitos. Añade una nota con una imagen para comprobar los adjuntos.</p>
    <p>Para Pinto Notes, exporta Markdown con adjuntos y selecciona la carpeta exportada. También se importan las imágenes. En el menú File de Pinto Notes, elige Bear y sigue los pasos de la <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a>. Bear permanece intacto.</p>
    <p>Si prefieres Notas de Apple, su <a href="https://support.apple.com/es-es/guide/notes/not201900c07/mac">guía para Mac</a> indica Archivo &gt; Importar formato Markdown. Selecciona los archivos o la carpeta. Si importas una carpeta, activa la opción para conservar su estructura. Revisa el resultado antes de importar todo.</p>
    <h2 id="comprobar">Revisa lo que importa en tus notas</h2>
    <p>Abre la nota original y la copia importada una junto a otra. Puede llegar el texto mientras un enlace apunta a otro sitio. Comprueba lo que usas de verdad.</p>
    <Keep title="Comprobación de la importación desde Bear" text={CHECK} copyLabel={ui.copy} note="Guarda esta lista junto a la exportación mientras pruebas la nueva app." />
    <p>Bear ofrece Keep tags during export. Actívalo si necesitas el texto de las etiquetas y revisa cómo lo interpreta la otra app. Que aparezcan en el texto no significa que conserven la organización de la barra lateral. Los ajustes y las versiones anteriores de Bear no forman parte de la nota exportada.</p>
    <h2 id="pinto">Usa las notas importadas con tu IA</h2>
    <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac y guarda todas las versiones anteriores de cada nota creada o editada allí. Eso no significa que importe el historial de Bear.</p>
    <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leer y editar las notas. Pide que busquen una nota importada de un proyecto y resuman el trabajo pendiente. Después, pídeles que añadan el siguiente paso y comprueba el resultado en Pinto Notes.</p>
  </LocalPostPage>;
}
