import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "notas-apple-vs-onenote");
// Versión de /blog/apple-notes-vs-onenote. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "apple notes vs" ofrece "apple notes vs onenote"; "notas iphone vs onenote" no ofrece sugerencias.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/102537 (bloqueo), /108047 (iCloud),
// /102223 (importación), /HT210402 (iCloud.com), /guide/iphone/iphd939f0a1c/ios (dibujos).
// Los datos de Microsoft son los del artículo inglés. Las capturas están en inglés.
const ui=UI.es;
const ROWS=[
 ["Precio","Gratis","Gratis; algunas funciones en Mac necesitan Microsoft 365"],
 ["Dispositivos","iPhone, Mac e iCloud.com","Windows, Mac, iPhone, Android y web"],
 ["Cuenta","Cuenta de Apple e iCloud","Cuenta Microsoft y OneDrive"],
 ["Espacio gratuito","5 GB de iCloud","5 GB compartidos con otros servicios Microsoft"],
 ["Orden","Carpetas, etiquetas y carpetas inteligentes","Blocs, secciones y páginas"],
 ["Página","Texto de arriba abajo","Escribir o dibujar en cualquier lugar"],
 ["Bloqueo","Nota individual","Sección completa, no página"],
 ["Versiones","Sin historial","Versiones de página"],
 ["Notas borradas","30 días","60 días"],
 ["IA","Apple Intelligence en dispositivos compatibles","Copilot con los planes Microsoft 365 correspondientes"],
];
const FAQ=[
 {q:"¿OneNote es mejor que Notas de Apple?",a:["Para páginas libres, escritura y dibujo en cualquier lugar, Windows y Android, OneNote tiene ventaja. Notas es más directa para apuntes y listas en iPhone y Mac."]},
 {q:"¿OneNote es gratis en Mac y iPhone?",a:["Sí. Microsoft indica que las versiones compatibles se descargan y usan gratis. Algunas funciones requieren Microsoft 365. Para sincronizar necesitas una cuenta Microsoft y OneDrive."]},
 {q:"¿Puedo importar un bloc de OneNote a Notas?",a:["No en bloque con una opción oficial. OneNote para Mac guarda una página en PDF; Notas para Mac importa texto, RTF, HTML, ENEX y Markdown, pero no tiene importación de OneNote."]},
 {q:"¿Se puede bloquear una página de OneNote?",a:["OneNote protege secciones completas con contraseña, no páginas sueltas. Notas bloquea cada nota por separado."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="notas-apple-vs-onenote"
 intro={<>OneNote sirve como un cuaderno con páginas en las que puedes escribir y dibujar donde quieras. Notas de Apple favorece apuntes y listas rápidos. Si usas OneNote en el trabajo y Notas en casa, esta comparación aclara qué puede hacer cada una.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"Comparación"},{href:"#notas",label:"Notas"},{href:"#onenote",label:"OneNote"},{href:"#mover",label:"Mover notas"}]}>
  <p>Elige <strong>Notas</strong> para apuntes y listas en iPhone y Mac sin configurar nada. Elige <strong>OneNote</strong> si necesitas Windows o Android, ya usas Microsoft 365 o quieres páginas libres donde escribir y dibujar.</p>
  <PostCta slug="es/notas-apple-vs-onenote" path="/es/blog/notas-apple-vs-onenote" position="answer" ui={ui.cta} title="Notas con acceso para tu IA"><p>Pinto Notes conserva el uso familiar de Notas en iPhone y Mac, deja trabajar con ChatGPT o Claude y guarda versiones anteriores.</p></PostCta>
 </Answer>} faq={FAQ}>
 <h2 id="comparacion">De un vistazo</h2><div className="tableWrap"><table><thead><tr><th>Aspecto</th><th>Notas</th><th>OneNote</th></tr></thead><tbody>{ROWS.map(r=><tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>
 <p>Apple y Microsoft ofrecen 5 GB gratuitos en sus respectivas nubes. Microsoft comparte ese espacio con otros servicios. El precio de iCloud+ del artículo inglés corresponde a Estados Unidos; aquí se omite porque varía por región.</p>
 <h2 id="notas">Lo que hace mejor Notas</h2>
 <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} alt="Notas en un Mac, en inglés, con carpetas y una lista de la compra." caption="Notas organiza el texto en una columna. Captura: Pinto Notes." />
 <p>Ya está en iPhone y Mac. Tiene carpetas, etiquetas, carpetas inteligentes, tablas, listas, búsqueda en texto escrito a mano y documentos escaneados, y sumas en las notas. Puedes bloquear una nota con contraseña, Face ID o Touch ID. Apple Intelligence transcribe y resume grabaciones en dispositivos compatibles.</p>
 <p>Notas no conserva versiones anteriores. Mantiene las notas borradas durante 30 días. Para compartir, la otra persona necesita una Cuenta de Apple. En Windows puedes abrir iCloud.com, pero Apple no ofrece app de Notas para Android.</p>
 <h2 id="onenote">Lo que hace mejor OneNote</h2>
 <p>OneNote divide los cuadernos en secciones y páginas. Puedes escribir o dibujar en cualquier punto. En Mac tiene bolígrafo, marcador y resaltador, aunque Microsoft dice que allí no convierte la escritura a mano en texto. Puede copiar el texto de una imagen; el procesamiento tarda a veces entre 24 y 48 horas.</p>
 <p>En el Mac sincroniza continuamente con OneDrive y guarda una copia local para trabajar sin conexión. Puedes proteger una sección con contraseña, consultar versiones de una página y restaurar una. Las páginas borradas permanecen 60 días. La protección excluye la sección de la búsqueda. Copilot resume, reescribe y redacta con los planes que lo incluyen.</p>
 <h2 id="mover">Mover notas entre las dos</h2>
 <p>OneNote para Mac guarda una página como PDF con Archivo, Guardar como PDF. Notas no importa blocs de OneNote. Para unas pocas páginas, copia y pega. En sentido contrario, Notas exporta PDF o Markdown, pero OneNote no ofrece un importador directo de Notas en los pasos citados por Microsoft. Revisa el formato después de mover contenido.</p>
 <h2 id="pinto">Si quieres Notas con ChatGPT o Claude</h2>
 <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} alt="Pinto Notes en un Mac, en inglés: una línea añadida por ChatGPT y el botón para deshacer." caption="Pinto Notes marca lo que cambió ChatGPT y permite deshacerlo." />
 <p>Pinto Notes funciona en iPhone y Mac, con carpetas, tablas, listas, Markdown cifrado e historial de versiones. Importa Notas de Apple en un Mac, sin cambiar el original, además de Obsidian, Evernote, Google Keep y Bear. No tiene un importador directo de OneNote, escritura libre ni app para Windows, Android o web.</p>
 <p>También puedes consultar <a href="/es/blog/alternativas-notas-apple">alternativas a Notas de Apple</a>, <a href="/blog/apple-notes-version-history" hrefLang="en">historial de versiones de Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/import-your-notes" hrefLang="en">importar notas de otras apps</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
