import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativas-evernote");

// Versión de /blog/evernote-alternative. Autocomplete, hl=es, gl=es,
// 21 Nov 2026: "alternativa a evernote" devolvió "alternativa a evernote",
// "alternativa a evernote gratis", "mejor alternativa a evernote",
// "alternativa evernote open source" y "app alternativa a evernote".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/102223 y
// /es-es/guide/notes/not201900c07/mac (Archivo > Importar a Notas, ENEX,
// etiquetas en macOS 13+, adjuntos incompatibles omitidos, En mi Mac o iCloud).
// Los hechos sobre Evernote, Obsidian, Notion, Bear y Joplin proceden de los
// enlaces de sus fabricantes en el original. Rutas documentadas, no pruebas de importación.
// Captura inglesa reutilizada: menú Archivo de Pinto Notes.
const ui = UI.es;
const FAQ = [
  { q: "¿Qué alternativas gratuitas importan mis libretas de Evernote?", a: ["Notas de Apple, Pinto Notes, Obsidian y Joplin aceptan archivos .enex. Obsidian Sync es un servicio aparte de pago. En Joplin puedes elegir dónde sincronizar. Evernote permite exportar desde cuentas gratuitas."] },
  { q: "¿Puedo importar una copia ENEX en Notion?", a: ["El importador oficial de Notion se conecta a tu cuenta de Evernote. Su guía no documenta la subida de un archivo .enex. Si solo conservas ese archivo, Notas de Apple, Pinto Notes, Obsidian, Bear y Joplin documentan importación de archivos."] },
  { q: "¿Puedo salir de Evernote usando solo un iPhone?", a: ["Evernote indica que exportar solo funciona en su app de escritorio para Mac o Windows. Bear permite importar un .enex existente en iPhone, pero primero tienes que obtener el archivo. La importación de Notion desde la cuenta se hace en escritorio o web."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="alternativas-evernote"
    intro={<>Notas de Apple es una alternativa sencilla a Evernote para notas personales en Mac y iPhone. Elige Pinto Notes si quieres acceso de IA, Obsidian para archivos Markdown, Notion para trabajar en equipo, Bear para escribir o Joplin para libretas de código abierto.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Comparar las seis" }, { href: "#exportar", label: "Exportar de Evernote" },
      { href: "#apple", label: "Importar en otras apps" }, { href: "#comprobar", label: "Revisar la importación" },
    ]}>
      <p>Notas de Apple, Pinto Notes, Obsidian y Joplin son opciones gratuitas que aceptan los archivos .enex de Evernote. Bear también los importa, pero necesita Pro para sincronizar con iCloud. Notion sirve para el trabajo compartido; su importador se conecta a tu cuenta de Evernote en vez de leer el archivo .enex.</p>
      <PostCta slug="es/alternativas-evernote" path="/es/blog/alternativas-evernote" position="answer" ui={ui.cta} title="Trae tus libretas de Evernote a Pinto Notes"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Importa las libretas en el Mac y conecta ChatGPT o Claude para leer y editar tus notas.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menú Archivo de Pinto Notes en un Mac, en inglés, con Import from Evernote y otras opciones." caption="Pinto Notes ofrece importar desde Evernote en el menú Archivo de Mac. Captura: Pinto Notes." />}
    faq={FAQ}>
      <h2 id="comparar">Qué alternativa a Evernote te conviene</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Úsala para</th><th scope="col">Importar Evernote</th><th scope="col">Comprueba antes</th></tr></thead><tbody>
        <tr><th scope="row">Notas de Apple</th><td>Notas personales en dispositivos Apple</td><td>.enex en Mac</td><td>Se omiten adjuntos o funciones incompatibles</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>El estilo de Notas de Apple con acceso de ChatGPT o Claude</td><td>.enex en Mac; cada libreta se convierte en carpeta</td><td>Solo iPhone y Mac</td></tr>
        <tr><th scope="row">Obsidian</th><td>Archivos Markdown locales e investigación enlazada</td><td>.enex mediante el complemento Importer oficial</td><td>La sincronización se elige por separado</td></tr>
        <tr><th scope="row">Notion</th><td>Páginas y bases de datos para equipos</td><td>Conecta tu cuenta de Evernote en escritorio o web</td><td>No documenta subir .enex</td></tr>
        <tr><th scope="row">Bear</th><td>Escritura en Markdown con etiquetas</td><td>.enex en Mac o iPhone</td><td>iCloud necesita Pro</td></tr>
        <tr><th scope="row">Joplin</th><td>Libretas de código abierto y capturador web</td><td>.enex en la app de escritorio</td><td>Elige servicio de sincronización y formato</td></tr>
      </tbody></table></div>
      <p>Las rutas de importación siguen las guías de cada fabricante consultadas el 21 de noviembre de 2026.</p>
      <h2 id="exportar">Empieza exportando desde Evernote</h2>
      <p>En la app de Evernote para Mac o Windows, selecciona una libreta, elige Exportar y después ENEX. Deja marcadas las etiquetas y los demás atributos que quieras conservar. Exporta cada libreta por separado y guarda los archivos como copia de seguridad. Evernote permite exportar con una cuenta gratuita, pero no desde Evernote Web. Consulta su <a href="https://help.evernote.com/hc/en-us/articles/209005557-Export-Notes-and-Notebooks-as-ENEX-or-HTML">guía de exportación</a>.</p>
      <h2 id="apple">Notas de Apple para el día a día</h2>
      <p>Notas de Apple sirve para apuntes personales, listas de comprobación e información guardada. Puedes usar carpetas y etiquetas, y buscar dentro de las notas. iCloud las muestra en los dispositivos con la misma Cuenta de Apple.</p>
      <p>En el Mac, selecciona una carpeta de iCloud o En mi Mac. Elige Archivo, Importar a Notas y selecciona tus .enex. Usa iCloud si quieres verlas en el iPhone. Desde macOS 13 también se importan etiquetas, según la <a href="https://support.apple.com/es-es/guide/notes/not201900c07/mac">guía del Mac</a>. Apple advierte que no traerá adjuntos ni funciones incompatibles. La <a href="/es/blog/evernote-a-notas-apple">guía para pasar de Evernote a Notas</a> explica los pasos con las <a href="https://support.apple.com/es-es/102223">instrucciones de Apple</a>.</p>
      <h2 id="pinto">Pinto Notes para el estilo de Notas con IA</h2>
      <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Las notas son archivos Markdown y se conservan todas sus versiones anteriores. Una vez que <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT o Claude</a> (guía en inglés), pueden leer y editar tus notas.</p>
      <p>En el Mac, exporta cada libreta como .enex y arrástralas todas a la vez. Cada libreta se convierte en carpeta y las etiquetas también se importan. Elige Import from Evernote en el menú File de Pinto Notes, como muestra la imagen. <a href="/blog/import-your-notes" hrefLang="en">Importar tus notas</a> (en inglés) explica el proceso. Evernote no cambia.</p>
      <p>Pinto Notes solo funciona en iPhone y Mac. No tiene app para Windows, Android ni web.</p>
      <h2 id="obsidian">Obsidian para archivos Markdown e investigación enlazada</h2>
      <p>Obsidian guarda notas como archivos Markdown locales. Los enlaces, la vista de grafo y los complementos comunitarios sirven para organizar una biblioteca de investigación. Funciona en Mac, iPhone, Windows, Linux y Android. La app es gratuita; Obsidian Sync es un servicio opcional de pago.</p>
      <p>Instala y activa el Importer oficial en Settings, Community Plugins. Ábrelo, elige Evernote (.enex), selecciona el archivo y pulsa Import para ver una vista previa. Pulsa Import otra vez para terminar. La <a href="https://obsidian.md/help/import/evernote">guía de Obsidian</a> explica cómo conservar grupos de libretas mediante nombres de archivo y jerarquías de etiquetas mediante etiquetas renombradas. Una exportación normal no guarda esas estructuras.</p>
      <h2 id="notion">Notion para notas del equipo</h2>
      <p>Notion convierte las libretas en páginas y las notas en elementos de base de datos. Así cambia la organización de la biblioteca, pero puedes trabajar con esas notas junto al equipo. Funciona en Mac, iPhone, Windows, Android y web.</p>
      <p>En escritorio o web, ve a Settings, Import, Third party imports, Evernote. Inicia sesión en Evernote, autoriza la conexión y elige las libretas. Su <a href="https://www.notion.com/help/import-data-into-notion">guía oficial</a> documenta esta conexión, no la subida de un .enex. Excluye Evernote Teams y avisa de que algunas imágenes pueden necesitar ajustes. Conserva el acceso a Evernote hasta comprobar el resultado.</p>
      <h2 id="bear">Bear para escribir con Markdown y etiquetas</h2>
      <p>Bear tiene un editor Markdown con tablas y listas de tareas. Funciona en Mac y iPhone. Según su <a href="https://bear.app/">página de funciones</a>, sincronizar por iCloud requiere Pro. Si necesitas las notas en ambos dispositivos, ten en cuenta la suscripción.</p>
      <p>En un Mac, elige File, Import From, Evernote y selecciona el .enex. En iPhone, abre el menú de tres puntos de la barra lateral y toca Import. La <a href="https://bear.app/faq/migrate-from-evernote/">guía de Bear</a> dice que .enex no contiene información de las libretas. Sugiere añadir etiquetas antes de exportar para conservar sus nombres como referencia.</p>
      <h2 id="joplin">Joplin para libretas abiertas y capturas web</h2>
      <p>Joplin es gratuito y de código abierto. Tiene libretas, etiquetas y capturador web, y permite trabajar sin conexión. Funciona en Mac, iPhone, Windows, Linux y Android. Puedes elegir Dropbox o OneDrive en lugar de Joplin Cloud. Configura la sincronización por separado.</p>
      <p>En la app de escritorio, elige File, Import, ENEX. Joplin acepta un archivo o una carpeta de archivos y crea una libreta por archivo. Importa etiquetas y adjuntos. Su <a href="https://joplinapp.org/help/apps/import_export/">guía</a> explica la elección entre Markdown y HTML. La conversión a Markdown puede perder colores y formato de letra; HTML sirve si eso importa. Quizá tengas que reparar enlaces entre notas.</p>
      <h2 id="comprobar">Prueba una libreta pequeña antes de moverlo todo</h2>
      <p>Elige una libreta con los tipos de notas que sueles guardar. Antes de dejar Evernote:</p>
      <ul><li>Compara el número de notas y abre algunas con adjuntos o tablas.</li><li>Comprueba etiquetas, organización y enlaces entre notas.</li><li>Busca una nota conocida y ábrela en el iPhone después de configurar la sincronización.</li><li>Guarda los archivos .enex originales hasta quedar conforme con el traslado.</li></ul>
    </LocalPostPage>;
}
