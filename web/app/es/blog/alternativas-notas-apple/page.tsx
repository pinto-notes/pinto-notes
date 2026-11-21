import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "alternativas-notas-apple");
// Versión de /blog/apple-notes-alternatives. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "alternativas a notas de apple" no ofrece sugerencias; "apple notes vs" ofrece Obsidian, OneNote,
// Google Keep y Notion; "mejores aplicaciones de notas para" ofrece "iphone" y "windows".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/icloud/mm6704cac5/icloud
// (Notas de iCloud en navegador), /es-es/105119 (iCloud.com en PC). Datos de otras apps del post inglés.
// Las capturas originales están en inglés.
const ui=UI.es;
const ROWS=[
 ["Obsidian","Mac, Windows, Linux, iPhone, Android","Gratis; Sync de pago","Archivos Markdown","Archivos, enlaces y complementos"],
 ["Google Keep","Android, iPhone, navegador","Gratis","Cuenta de Google","Notas y listas rápidas"],
 ["Notion","Mac, Windows, iPhone, Android, web","Plan gratis","Espacio de Notion","Equipos y bases de datos"],
 ["Evernote","Mac, Windows, iPhone, Android, web","50 notas y un dispositivo gratis","Cuenta de Evernote","Recortes y archivos antiguos"],
 ["Bear","Mac, iPhone","Gratis; sincronización con Pro","Dispositivo o iCloud con Pro","Escribir en Markdown"],
 ["Pinto Notes","Mac, iPhone","Descarga gratis","Markdown cifrado y sincronizado","Notas con ChatGPT o Claude"],
];
const FAQ=[
 {q:"¿Hay Notas de Apple para Windows?",a:["No hay app nativa. En un PC puedes abrir las notas de iCloud en el navegador. Obsidian, Notion, Evernote y Joplin tienen app para Windows."]},
 {q:"¿Y para Android?",a:["Apple no ofrece una app de Notas para Android. Google Keep, Obsidian, Notion, Evernote y Joplin sí tienen una."]},
 {q:"¿Qué alternativa gratuita funciona en varios sistemas?",a:["Obsidian y Joplin funcionan en Mac, Windows, Linux, iPhone y Android. Google Keep funciona en móviles y navegador. Obsidian Sync es de pago; Joplin puede sincronizar con varios servicios."]},
 {q:"¿Hay una alternativa de código abierto?",a:["Joplin es gratuita y de código abierto. Obsidian guarda archivos Markdown, pero su web no presenta la app como código abierto."]},
 {q:"¿Cambiar de app borra mis notas de Apple?",a:["No. Exportar e importar hace una copia. Las notas originales siguen en Notas hasta que las borres."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="alternativas-notas-apple"
 intro={<>Si pasas a Windows o Android, o quieres guardar tus apuntes como archivos, necesitas otra app. Estas alternativas cubren dispositivos, precios de entrada y las funciones que más importan al cambiar.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"Comparación"},{href:"#obsidian",label:"Apps disponibles"},{href:"#windows",label:"Windows y Android"},{href:"#mover",label:"Mover notas"}]}>
  <p>Para Windows y Android, mira Obsidian si quieres archivos, Google Keep para listas rápidas o Notion para equipos. Evernote también funciona en esos sistemas. Joplin es de código abierto. En iPhone y Mac, Bear favorece la escritura y Pinto Notes permite trabajar con ChatGPT o Claude.</p>
  <PostCta slug="es/alternativas-notas-apple" path="/es/blog/alternativas-notas-apple" position="answer" ui={ui.cta} title="¿Sigues con iPhone y Mac?"><p>Pinto Notes importa tus Notas de Apple en un Mac y permite que ChatGPT o Claude las lea y edite. No funciona en Windows ni Android.</p></PostCta>
 </Answer>} faq={FAQ}>
 <h2 id="comparacion">De un vistazo</h2><div className="tableWrap"><table><thead><tr><th>App</th><th>Dispositivos</th><th>Gratis</th><th>Dónde están las notas</th><th>Para qué sirve</th></tr></thead><tbody>{ROWS.map(r=><tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td></tr>)}</tbody></table></div>
 <h2 id="obsidian">Obsidian</h2>
 <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} maxWidth={600} alt="Obsidian en un Mac, en inglés, con carpetas y una lista de la compra." caption="Obsidian guarda cada nota en un archivo Markdown. Captura: Pinto Notes." />
 <p>Es gratis y no pide registro. Tus notas son archivos Markdown locales, con enlaces, gráfico y complementos. Funciona en Mac, Windows, Linux, iPhone y Android. Sync cuesta desde 4 USD por usuario y mes con pago anual, o 5 USD mensuales. Puedes usar otros servicios para sincronizar. <a href="/es/blog/notas-apple-vs-obsidian">Comparación con Notas</a>.</p>
 <h2 id="keep">Google Keep</h2>
 <p>Es gratis y rápido para listas. Funciona en Android, iPhone y navegador. Ordena con colores, notas fijadas y hasta 50 etiquetas, pero no carpetas. Tiene recordatorios, colaboración e historial de cambios de texto desde un Mac o PC. <a href="/es/blog/notas-apple-vs-google-keep">Comparación con Notas</a>.</p>
 <h2 id="notion">Notion</h2>
 <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} maxWidth={600} alt="Página de reunión de equipo en Notion, en inglés." caption="Notion combina páginas y bases de datos. Imagen: Notion." />
 <p>Reúne páginas, bases de datos y trabajo de equipo. Funciona en Mac, Windows, móviles y navegador. El plan gratuito guarda siete días de historial y permite probar Notion AI de forma limitada; sus funciones completas de IA se ofrecen en planes superiores. Su organización requiere más preparación que una lista simple. <a href="/es/blog/notas-apple-vs-notion">Comparación con Notas</a>.</p>
 <h2 id="evernote">Evernote</h2>
 <p>Permite recortar páginas web y mantener un archivo grande de notas. Funciona en Mac, Windows, iPhone, Android y web. Su plan Gratis tiene 50 notas, un cuaderno y un dispositivo. No se indican precios porque el artículo de planes consultado no los mostraba. <a href="/es/blog/evernote-a-notas-apple">Cómo pasar de Evernote a Notas</a>.</p>
 <h2 id="bear">Bear</h2>
 <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} maxWidth={600} alt="Bear en Mac y iPhone, en inglés, con notas organizadas por etiquetas." caption="Bear está pensado para escribir en dispositivos Apple. Imagen: Bear." />
 <p>Bear funciona en Mac y iPhone. La versión gratis guarda notas locales. Pro sincroniza mediante iCloud y cuesta 2,99 USD al mes o 29,99 USD al año, tras una prueba de siete días. No tiene versión para Windows ni Android.</p>
 <h2 id="pinto">Pinto Notes</h2>
 <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} maxWidth={600} alt="Pinto Notes en un Mac, en inglés, con una edición de ChatGPT resaltada." caption="ChatGPT puede editar una nota conectada; el cambio se puede deshacer." />
 <p>Pinto Notes se parece a Notas, con carpetas, listas y tablas. Guarda Markdown cifrado, conserva versiones e importa Notas de Apple, Obsidian, Evernote, Google Keep, Bear y carpetas de texto o Markdown. ChatGPT, Claude, Claude Code y Codex pueden leer y editar notas tras conectarse. Solo funciona en iPhone y Mac.</p>
 <h2 id="windows">Si usas Windows o Android</h2>
 <p>Obsidian, Notion y Evernote tienen apps para ambos. Google Keep tiene app para Android y web para Windows. iCloud.com muestra en el navegador las notas guardadas en iCloud, pero no sustituye una app nativa. Para código abierto, Joplin funciona en los cinco sistemas principales, usa Markdown y ofrece sincronización cifrada mediante Nextcloud, Dropbox, OneDrive o Joplin Cloud.</p>
 <h2 id="mover">Mover tus notas de Apple</h2>
 <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={460} kind="plain" alt="Menú de importación de Pinto Notes en un Mac, en inglés." caption="La importación crea una copia; las notas de origen permanecen." />
 <p>Exporta tus notas antes de cambiar de app y comprueba el formato de una muestra. <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">Esta guía explica la exportación a Markdown</a>. Importar a Pinto Notes desde un Mac copia la biblioteca sin borrar las notas de Apple.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-version-history" hrefLang="en">historial de versiones de Notas</a>, <a href="/blog/best-notes-app-for-mac" hrefLang="en">apps de notas para Mac</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/import-your-notes" hrefLang="en">importar notas de otras apps</a>, <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">mover Notas a Obsidian, Notion o Keep</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
