import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "mejor-app-notas-iphone");
// Versión de /blog/best-note-taking-app-for-iphone. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "mejor app de notas iphone" ofrece la frase completa; "mejores aplicaciones de notas para"
// ofrece "iphone". Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/iphone/iphf177bb154/ios
// (bloqueo), /iphbe11247b5/ios (transcripción), /guide/icloud/mm6704cac5/icloud (Notas web).
// Precios y requisitos de otras apps son los del artículo inglés; capturas inglesas.
const ui=UI.es;
const ROWS=[
 ["Pinto Notes","Gratis","Mac","Carpetas, tablas y archivos","Tu ChatGPT o Claude"],
 ["Notas de Apple","Incluida","Mac e iCloud.com","Carpetas y etiquetas","Apple Intelligence"],
 ["Bear","Gratis; Pro para sincronizar","Mac","Etiquetas","Claude solo en Mac"],
 ["Obsidian","Gratis; Sync de pago","Mac, Windows, Linux, Android","Archivos y enlaces","Complementos, con preparación"],
 ["Notion","Gratis; Plus de pago","Mac, Windows, Android y web","Páginas y bases de datos","Notion AI y MCP"],
 ["Google Keep","Gratis","Android y web","Etiquetas, colores y notas fijadas","Sin IA en la ficha consultada"],
 ["Evernote","50 notas gratis en un dispositivo","Mac, Windows, Android y web","Cuadernos y etiquetas","Asistente, transcripción y MCP"],
];
const FAQ=[
 {q:"¿Cuál es la mejor app gratis de notas para iPhone?",a:["Notas de Apple, Pinto Notes y Google Keep son gratis y sincronizan sin coste. Obsidian también es gratis, con iCloud o su Sync de pago. Bear gratis guarda notas en un dispositivo; Evernote gratis limita a 50 notas."]},
 {q:"¿Qué app de notas tiene mejor IA?",a:["Notion y Evernote integran su propia IA. Notas de Apple resume grabaciones en iPhone compatibles. Pinto Notes permite que ChatGPT o Claude lean y editen tus notas tras conectarlos."]},
 {q:"¿Cuál funciona también en Windows o Android?",a:["Obsidian, Notion y Evernote tienen apps para ambos. Google Keep tiene app Android y web. Notas abre las notas de iCloud en un navegador de Windows. Bear y Pinto Notes son solo para dispositivos Apple."]},
 {q:"¿Qué versión de iOS necesita cada una?",a:["Las fichas consultadas el 21 de noviembre de 2026 indican iOS 26 para Pinto Notes, iOS 18 para Notion y Keep, iOS 16 para Bear, iOS 15.6 para Obsidian e iOS 15.1 para Evernote. Notas viene con el iPhone."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="mejor-app-notas-iphone"
 intro={<>Una lista apuntada en la calle o una idea antes de dormir solo sirve si luego la encuentras. Estas siete apps de notas para iPhone resuelven necesidades distintas. Pinto Notes figura en la lista y por eso conviene leer también sus límites.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"De un vistazo"},{href:"#pinto",label:"Las siete apps"},{href:"#ia",label:"IA"},{href:"#elegir",label:"Cuál elegir"}]}>
  <p>Para la mayoría, <strong>Notas de Apple</strong> ya cumple y es gratis. <strong>Pinto Notes</strong> sirve si quieres que ChatGPT o Claude editen tus notas. <strong>Bear</strong> favorece la escritura, <strong>Obsidian</strong> guarda archivos, <strong>Notion</strong> organiza equipos, <strong>Keep</strong> facilita listas entre sistemas y <strong>Evernote</strong> incluye más IA propia.</p>
  <PostCta slug="es/mejor-app-notas-iphone" path="/es/blog/mejor-app-notas-iphone" position="answer" ui={ui.cta} title="Pinto Notes es gratis en iPhone y Mac"><p>Se usa como Notas. Conecta ChatGPT o Claude y los cambios aparecen en el teléfono con una opción para deshacerlos.</p></PostCta>
 </Answer>} faq={FAQ}>
 <h2 id="comparacion">De un vistazo</h2><div className="tableWrap"><table><thead><tr><th>App</th><th>Precio</th><th>También en</th><th>Organización</th><th>IA</th></tr></thead><tbody>{ROWS.map(r=><tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td></tr>)}</tbody></table></div>
 <p>Los importes del artículo inglés son de fichas estadounidenses. Bear Pro cuesta 2,99 USD al mes o 29,99 al año; Obsidian Sync, 4 USD mensuales con pago anual; Notion Plus, 11,99 USD al mes o 119,99 al año. Pueden variar en tu región. Evernote no mostraba precios.</p>
 <h2 id="pinto">1. Pinto Notes</h2>
 <PostFigure src="/blog/launch/iphone-chatgpt-changed-groceries" width={660} height={1434} maxWidth={300} alt="Lista de la compra en Pinto Notes para iPhone, en inglés, con cinco líneas añadidas por ChatGPT y el botón para deshacer." caption="Las líneas que añadió ChatGPT quedan marcadas. Captura: Pinto Notes." />
 <p>Gratis en iPhone y Mac. Tiene carpetas, listas, tablas, fotos, PDF, archivos, uso sin conexión y notas bloqueadas con contraseña, Face ID o Touch ID. ChatGPT y Claude pueden leer y editar notas desde el teléfono, el Mac o la web, con los cambios marcados y versiones recuperables. La biblioteca completa de Notas, Obsidian, Evernote, Keep o Bear se importa en un Mac; desde iPhone se traen notas una a una. No tiene app para Windows ni Android.</p>
 <h2>2. Notas de Apple</h2>
 <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280} alt="Lista de carpetas de Notas en un iPhone, en inglés, bajo la cuenta iCloud." caption="Notas ya viene con el iPhone. Imagen: Apple." />
 <p>Gratis y ya instalada. Ofrece listas, tablas, etiquetas, carpetas inteligentes, dibujos, escaneos, cálculos y grabaciones. En dispositivos compatibles, Apple Intelligence resume transcripciones. Puedes bloquear notas con contraseña, Face ID o Touch ID, aunque ciertas notas con etiquetas o archivos adjuntos no admiten bloqueo. iCloud.com permite abrirlas en un navegador.</p>
 <h2>3. Bear</h2>
 <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} alt="Bear en Mac y iPhone, en inglés, con notas agrupadas por etiquetas." caption="Bear se centra en la escritura. Imagen: Bear." />
 <p>Es cómoda para escribir y organizar con etiquetas. La versión gratis guarda notas locales; Pro añade sincronización por iCloud, temas y búsqueda en PDF e imágenes. Su conector de Claude, MCP y línea de comandos funcionan en Mac, no en iPhone.</p>
 <h2>4. Obsidian</h2><p>Guarda Markdown en una carpeta local, con enlaces entre notas. Es gratis en iPhone y Android; también funciona en Mac, Windows y Linux. Puedes sincronizar por iCloud entre dispositivos Apple o contratar Sync. Los complementos amplían la app, aunque requieren prepararla. <a href="/es/blog/notas-apple-vs-obsidian">Comparación con Notas</a>.</p>
 <h2>5. Notion</h2><p>Reúne páginas, bases de datos y equipos. Tiene apps móviles y de escritorio, trabajo sin conexión y Notion AI. Su servidor MCP deja acceder a páginas desde Claude, ChatGPT o Cursor. La organización lleva más tiempo que una nota rápida. <a href="/es/blog/notas-apple-vs-notion">Comparación con Notas</a>.</p>
 <h2>6. Google Keep</h2><p>Es gratis y funciona en iPhone, Android y navegador. Tiene listas compartidas, notas de voz, recordatorios, colores y hasta 50 etiquetas, pero no carpetas. <a href="/es/blog/notas-apple-vs-google-keep">Comparación con Notas</a>.</p>
 <h2>7. Evernote</h2><p>Incluye recortes web, búsqueda, transcripción, edición con IA y una conexión MCP. Su plan Gratis permite 50 notas, un cuaderno y un dispositivo. Funciona también en Windows y Android.</p>
 <h2 id="ia">Qué IA puede usar tus notas</h2><p>Apple Intelligence trabaja dentro de Notas en dispositivos compatibles. Notion y Evernote incluyen su propia IA. Pinto Notes no trae una IA propia: conectas ChatGPT o Claude para trabajar con tus notas desde otro dispositivo, con historial y opción de deshacer. Bear ofrece acceso a Claude desde Mac; Obsidian necesita complementos o más configuración.</p>
 <h2 id="elegir">Cuál elegir</h2><p>Si no necesitas ninguna función concreta, empieza con Notas. Para escribir, Bear; para archivos propios, Obsidian; para equipos, Notion; para listas entre iPhone y Android, Keep; para archivo e IA propia, Evernote; para trabajar con ChatGPT o Claude en notas que se parecen a las de Apple, Pinto Notes.</p>
 <p>También puedes consultar <a href="/es/blog/alternativas-notas-apple">alternativas a Notas de Apple</a>, <a href="/blog/best-notes-app-for-mac" hrefLang="en">apps de notas para Mac</a>, <a href="/blog/claude-and-apple-notes" hrefLang="en">Claude y Notas de Apple</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/import-your-notes" hrefLang="en">importar notas de otras apps</a> y <a href="/blog/pinto-notes-for-iphone" hrefLang="en">Pinto Notes en iPhone</a>.</p>
</LocalPostPage>}
