import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "apps-notas-escritores");

// Versión de /blog/notes-app-for-writers. Autocomplete, hl=es, gl=es,
// 21 Nov 2026: "app de notas para escritores" devolvió la misma frase;
// "notas para escritores" devolvió "bloc de notas para escritores".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/
// not9474646a9/mac (guardado automático, Archivo > Duplicar nota),
// /not201900c07/mac (Archivo > Exportar como > PDF o Markdown),
// /apde615d29c2/mac (Edición > Añadir enlace). Los datos de Bear, Obsidian,
// Ulysses y Scrivener siguen las fuentes oficiales del original inglés.
// Captura inglesa reutilizada del historial de versiones de Pinto Notes.
const ui = UI.es;
const FAQ = [
  { q: "¿Puedo escribir una novela en Notas de Apple?", a: ["Sí. Usa una nota por escena y otra como índice con enlaces. En el Mac, Archivo, Duplicar nota conserva un borrador antes de reescribir. Si necesitas objetivos de palabras y montar capítulos en un libro, compara Ulysses y Scrivener."] },
  { q: "¿Qué apps muestran el número de palabras?", a: ["Bear lo muestra en su panel de información. Obsidian tiene un complemento integrado de recuento. Ulysses y Scrivener son apps de escritura con recuentos y objetivos de palabras."] },
  { q: "¿Basta una app de notas para escribir artículos?", a: ["Puede bastar. Escribe y exporta un artículo entero antes de mover tu biblioteca. Comprueba cómo conservarás borradores anteriores y si el archivo exportado funciona en el editor o sistema donde publicarás."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="apps-notas-escritores"
    intro={<>Notas de Apple sirve para ideas y borradores breves. Bear añade estadísticas de escritura, Pinto Notes conserva versiones y conecta la IA, y Obsidian guarda la investigación en archivos enlazados. Para un manuscrito completo, mira Ulysses o Scrivener.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Comparar las seis" }, { href: "#apple", label: "Escribir en Notas" },
      { href: "#pinto", label: "Pinto Notes" }, { href: "#escritura", label: "Ulysses y Scrivener" },
      { href: "#probar", label: "Probar un borrador" },
    ]}>
      <p>Elige Notas de Apple para apuntar ideas y escribir en la app que ya usas, Bear para Markdown con recuento de palabras u Obsidian para investigar en archivos enlazados. Pinto Notes conserva versiones anteriores con el estilo de Notas y da acceso a una IA conectada. Ulysses y Scrivener son apps de escritura con herramientas para manuscritos.</p>
      <PostCta slug="es/apps-notas-escritores" path="/es/blog/apps-notas-escritores" position="answer" ui={ui.cta} title="Conserva borradores anteriores"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac, guarda versiones anteriores y permite a ChatGPT o Claude leer y editar tus notas una vez conectados.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="comparar">Seis apps para distintas formas de escribir</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Para qué sirve</th><th scope="col">Borradores anteriores</th><th scope="col">Cómo sacar el texto</th></tr></thead><tbody>
        <tr><th scope="row">Notas de Apple</th><td>Ideas y borradores breves</td><td>Duplicar antes de reescribir</td><td>Una nota como PDF o Markdown en Mac</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>El estilo de Notas con acceso de IA</td><td>Historial con restauración</td><td>Biblioteca Markdown en ZIP; PDF en Mac</td></tr>
        <tr><th scope="row">Bear</th><td>Borradores Markdown con recuento</td><td>Copias manuales de la biblioteca</td><td>Markdown; DOCX, PDF y ePub necesitan Pro</td></tr>
        <tr><th scope="row">Obsidian</th><td>Investigación enlazada con borradores</td><td>Copias locales de recuperación; Sync tiene otro historial</td><td>Las notas ya son archivos Markdown</td></tr>
        <tr><th scope="row">Ulysses</th><td>Escritura concentrada con objetivos</td><td>Copias locales automáticas</td><td>DOCX, PDF, ePub, HTML o texto</td></tr>
        <tr><th scope="row">Scrivener</th><td>Capítulos e investigación en un proyecto</td><td>Snapshots antes de revisar</td><td>Compilar como Word, PDF o ePub</td></tr>
      </tbody></table></div>
      <p>Son maneras distintas de conservar trabajo. Una copia de toda la biblioteca, una instantánea de recuperación y un duplicado manual no son intercambiables.</p>
      <h2 id="apple">Notas de Apple para empezar a escribir</h2>
      <p>Notas guarda los cambios mientras escribes. Una carpeta por proyecto y una nota por escena o artículo bastan para empezar. Guarda las fuentes en notas aparte para encontrarlas sin recorrer el borrador. Etiquetas y notas fijadas mantienen visible el esquema.</p>
      <p>Para hacer un índice en el Mac, escribe los títulos de las escenas en una nota. Selecciona uno, elige Edición, Añadir enlace y busca su nota. Antes de reescribir mucho, elige Archivo, Duplicar nota, y pon a la copia una fecha y un nombre claro. Es una forma manual de conservar el borrador. La <a href="/blog/apple-notes-version-history" hrefLang="en">guía del historial de Notas</a> (en inglés) explica los límites para recuperar texto anterior.</p>
      <p>Para entregar un borrador desde el Mac, selecciona la nota y elige Archivo, Exportar como, PDF o Markdown. La <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">guía para exportar Markdown</a> (en inglés) explica qué comprobar en el archivo. Si necesitas objetivos de palabras o un libro terminado, compara las apps de escritura de abajo.</p>
      <h2 id="pinto">Pinto Notes para borradores e IA conectada</h2>
      <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Guarda las notas en Markdown y conserva el historial. En el Mac, abre File, Version History, elige una versión anterior y pulsa Restore This Version. El texto reemplazado también queda guardado como otra versión.</p>
      <Figure shot={SHOTS.history} caption="Historial de una nota de la compra en Pinto Notes para Mac. Se ve una versión anterior y el botón de restauración. Captura en inglés." />
      <p>Cuando <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT o Claude</a> (guía en inglés), pueden leer y editar tus notas. Puedes pedirles que lean las fuentes antes de proponer un esquema. Revisa después las citas y los datos con las notas originales.</p>
      <p>En el Mac, File, Export All Notes guarda un ZIP de archivos Markdown ordenados en carpetas. Para incluir notas bloqueadas, ábrelas antes con contraseña, Face ID o Touch ID. File, Export as PDF guarda la nota abierta. Si necesitas entregar un Word o un libro electrónico, Ulysses y Scrivener exportan esos formatos directamente.</p>
      <p>Pinto Notes solo funciona en iPhone y Mac, sin app para Windows, Android ni web. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> (guía en inglés) de una vez desde el Mac. Las originales no cambian.</p>
      <h2 id="bear">Bear para Markdown con recuento de palabras</h2>
      <p>Bear combina Markdown y etiquetas. Su panel de información muestra el número de palabras y el tiempo estimado de lectura. En Mac, Edit, Typewriter Mode mantiene centrada la línea que escribes. También puedes ocultar la barra lateral y la lista de notas. Consulta su <a href="https://blog.bear.app/2023/07/get-started-with-bear/">guía inicial</a> y las <a href="https://bear.app/faq/typewriter-mode/">instrucciones del modo máquina de escribir</a>.</p>
      <p>La versión gratuita exporta Markdown. DOCX, PDF y ePub requieren Pro. Bear documenta copias manuales de toda la biblioteca. Restaurar una reemplaza la biblioteca actual, algo distinto de recuperar un párrafo. Revisa los <a href="https://bear.app/faq/export-your-notes/">formatos de exportación</a> y las <a href="https://bear.app/faq/backup-restore/">copias de seguridad</a> antes de mover borradores.</p>
      <h2 id="obsidian">Obsidian para investigación en archivos enlazados</h2>
      <p>Obsidian guarda las notas como archivos Markdown en una carpeta normal. Puedes enlazar una fuente a un borrador y abrir los archivos en otro editor. Su complemento integrado Word count muestra palabras y caracteres de la nota activa. Consulta su <a href="https://obsidian.md/help/data-storage">almacenamiento</a> y el <a href="https://obsidian.md/help/plugins/word-count">contador</a>.</p>
      <p>File recovery guarda instantáneas locales durante siete días por defecto. Permanecen en el dispositivo que las creó y Obsidian advierte que no sustituyen una copia completa. Obsidian Sync tiene otro historial de versiones. Lee sus <a href="https://obsidian.md/help/plugins/file-recovery">límites de recuperación</a> y guarda otra copia de tu trabajo.</p>
      <h2 id="escritura">Ulysses y Scrivener para textos largos</h2>
      <h3>Ulysses para borradores y objetivos</h3>
      <p>Ulysses es una app de escritura. Su editor y sus proyectos sirven para artículos o manuscritos por secciones. Puedes fijar objetivos de palabras para una hoja, grupo o proyecto, también diarios. Exporta DOCX, PDF, ePub, HTML y texto. Consulta los <a href="https://help.ulysses.app/goals">objetivos</a> y la <a href="https://help.ulysses.app/export">guía de exportación</a>.</p>
      <p>Sus copias automáticas guardan la biblioteca localmente. No se sincronizan entre dispositivos y excluyen External Folders. Si guardas borradores fuera de la biblioteca, lee la <a href="https://help.ulysses.app/en_US/backups">guía de copias</a>.</p>
      <h3>Scrivener para montar un manuscrito</h3>
      <p>Scrivener también es una app de escritura. Permite escribir por secciones, reordenarlas y guardar la investigación junto al borrador. El modo de composición oculta el resto de la interfaz. Hay objetivos de palabras para el manuscrito, una sección o una sesión. Antes de reescribir, crea un Snapshot para comparar o recuperar el texto.</p>
      <p>Compile reúne las secciones en un Word, PDF o ePub. Sirve cuando varias escenas deben convertirse en un manuscrito. Prueba a compilar un ejemplo antes de pasarle todo el proyecto. La <a href="https://www.literatureandlatte.com/scrivener/overview">página de Scrivener</a> describe estas herramientas.</p>
      <h2 id="probar">Prueba un borrador completo antes de cambiar</h2>
      <p>Elige un texto breve en el que ya trabajes. Escribe veinte minutos, revisa un párrafo y recupera su versión anterior. Exporta el borrador y ábrelo donde vayas a entregarlo o publicarlo. Quédate con la app que te facilite esos pasos para el tipo de escritura que haces.</p>
    </LocalPostPage>;
}
