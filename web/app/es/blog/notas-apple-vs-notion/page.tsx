import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-apple-vs-notion");
// Versión de /blog/apple-notes-vs-notion. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "apple notes vs" ofrece "apple notes vs notion"; "notas iphone vs notion" no ofrece sugerencias.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/102223 (importación de notas),
// /es-es/102484 (Recordatorios), /es-es/HT210402 (Notas en iCloud.com),
// /es-es/guide/notes/not201900c07/mac (Archivo > Importar formato Markdown). Capturas inglesas.
// Datos y precios de Notion conservados del artículo inglés.
const ui = UI.es;
const ROWS = [
  ["Precio", "Gratis", "Gratis; Plus, 10 USD por miembro al mes con pago anual"],
  ["Dispositivos", "iPhone, Mac e iCloud.com", "Mac, Windows, iPhone, Android y web"],
  ["Organización", "Carpetas, etiquetas y carpetas inteligentes", "Páginas y bases de datos"],
  ["Tablas", "Sencillas, sin sumas ni ordenación", "Vistas, filtros, ordenación y fórmulas"],
  ["Plantillas", "Duplicar una nota", "Galería de la comunidad"],
  ["Recordatorios", "App Recordatorios aparte", "@remind o fecha en una base de datos"],
  ["Versiones", "Sin historial", "7 días gratis; 30 en Plus; 90 en Business"],
  ["IA", "Apple Intelligence en dispositivos compatibles", "Notion AI en Business; prueba limitada en Gratis y Plus"],
];
const FAQ = [
  {q:"¿Notion es mejor que Notas de Apple?",a:["Para bases de datos, proyectos y documentación de equipo, ofrece más. Para notas y listas rápidas en iPhone y Mac, Notas requiere menos trabajo."]},
  {q:"¿Notion es gratis para uso personal?",a:["Sí. El plan Gratis es para una persona, admite archivos de hasta 5 MB y guarda siete días de historial. El límite de bloques se aplica con dos miembros o más."]},
  {q:"¿Notion sustituye a Recordatorios?",a:["Puedes usar @remind o una fecha y recibir avisos. Notion todavía no tiene recordatorios recurrentes, por ubicación ni con Siri."]},
  {q:"¿Puedo pasar páginas de Notion a Notas?",a:["Exporta las páginas en Markdown y CSV e importa los archivos Markdown en Notas para Mac. Una base de datos se exporta como CSV, formato que Notas no importa."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="notas-apple-vs-notion"
  intro={<>Notas sirve para escribir y guardar ideas enseguida. Notion organiza páginas, proyectos y bases de datos, también con otras personas. Esta comparación te ayuda a decidir cuál necesitas.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"De un vistazo"},{href:"#notas",label:"Notas"},{href:"#notion",label:"Notion"},{href:"#recordatorios",label:"Recordatorios"},{href:"#elegir",label:"Cuál elegir"}]}>
    <p>Elige <strong>Notas</strong> para apuntes, listas y tareas sencillas en iPhone y Mac. Elige <strong>Notion</strong> si necesitas bases de datos, tableros de proyectos, documentación de equipo o acceso desde Windows y Android.</p>
    <PostCta slug="es/notas-apple-vs-notion" path="/es/blog/notas-apple-vs-notion" position="answer" ui={ui.cta} title="Notas con acceso para tu IA"><p>Pinto Notes se parece a Notas. Puedes conectar ChatGPT o Claude para que lean y editen tus notas, y recuperar versiones anteriores.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="comparacion">De un vistazo</h2>
  <div className="tableWrap"><table><thead><tr><th>Aspecto</th><th>Notas</th><th>Notion</th></tr></thead><tbody>{ROWS.map(r=><tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
  <p>Precios de Notion en USD según su página del 21 de noviembre de 2026. Consulta el importe de tu región antes de contratar.</p>
  <h2 id="notas">Cuándo conviene Notas</h2>
  <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notas en un Mac, en inglés, con carpetas y una lista de la compra." caption="Una lista en Notas para Mac. Captura: Pinto Notes." />
  <p>Ya viene instalada y sincroniza con iCloud. Tiene listas de comprobación, etiquetas, carpetas inteligentes, búsqueda, notas fijadas, sumas escritas en una nota y bloqueo con contraseña, Face ID o Touch ID. En equipos compatibles, Apple Intelligence transcribe y resume grabaciones.</p>
  <p>Sus tablas no ordenan ni calculan. No hay plantillas propias ni historial de versiones. Para repetir un formato puedes duplicar una nota en el Mac. Cada persona con quien compartas necesita una Cuenta de Apple. En Windows puedes entrar en iCloud.com; Apple no ofrece una app de Notas para Android.</p>
  <h2 id="notion">Cuándo conviene Notion</h2>
  <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} alt="Página de reunión semanal de equipo en Notion, en inglés, con participantes y tareas." caption="Una reunión de equipo en Notion. Imagen: Notion." />
  <p>Una base de datos de Notion puede verse como tabla, lista, tablero, calendario o galería, con filtros, grupos y fórmulas. Su galería tiene plantillas de la comunidad. Funciona en Mac, Windows, iPhone, Android y web. Para trabajar sin conexión debes marcar cada página en cada dispositivo.</p>
  <p>Notion AI redacta, resume, busca y toma notas de reuniones en los planes que lo incluyen. Notion MCP deja que Claude, ChatGPT y Cursor lean y escriban páginas con los permisos de tu cuenta. El plan Gratis limita cada archivo a 5 MB y pone un límite de bloques si hay dos miembros o más.</p>
  <h2 id="recordatorios">Notas, Recordatorios y Notion</h2>
  <p>En Apple, Notas guarda el texto y Recordatorios avisa por fecha, hora o ubicación. Puedes añadir tareas con Siri, compartir listas y ver las programadas en Calendario desde iOS 18. Notion permite escribir @remind o poner una fecha en una base de datos, con aviso en la app o por correo. Sus recordatorios recurrentes aún no están disponibles.</p>
  <h2 id="mover">Mover tus notas</h2>
  <p>Notion no incluye un importador de Notas de Apple. Exporta primero las notas como Markdown, comprímelas e importa el ZIP desde los ajustes de Notion. <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">Esta guía explica el proceso</a>. En sentido contrario, exporta páginas de Notion en Markdown y usa Archivo, Importar formato Markdown en Notas para Mac. Notas también importa texto, RTF, HTML y ENEX, pero no CSV.</p>
  <h2 id="elegir">Cuál elegir</h2>
  <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes en un Mac, en inglés: ChatGPT añadió una línea a una nota de viaje y aparece el botón para deshacer." caption="Una edición de ChatGPT aparece marcada y se puede deshacer." />
  <p>Usa Notas para apuntes personales; Notion para proyectos y equipos; Recordatorios para avisos. Pinto Notes encaja si te gusta Notas y quieres que ChatGPT o Claude trabajen con tus notas. Guarda Markdown cifrado, conserva versiones e importa Notas, Obsidian, Evernote, Google Keep y Bear en un Mac. También acepta carpetas o ZIP de Markdown de Notion. Solo funciona en iPhone y Mac; no sustituye las bases de datos ni las vistas de Notion.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-tables" hrefLang="en">tablas en Notas</a>, <a href="/blog/apple-notes-version-history" hrefLang="en">historial de versiones de Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/import-your-notes" hrefLang="en">importar notas de otras apps</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
