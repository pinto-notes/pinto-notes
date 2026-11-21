import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Checklist, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "google-keep-a-notas-iphone");
// Versión de /blog/google-keep-to-apple-notes. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "pasar notas de google keep a iphone" ofrece esa frase; "google keep a notas" no la ofrece.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/102223 y
// /guide/notes/not201900c07/mac (Archivo > Importar a Notas, HTML, Notas importadas),
// /guide/iphone/iph7262fd4fe/ios (Ajustes > Apps > Notas > Cuentas de Notas).
// Los datos de Google Takeout son los del artículo inglés. La captura está en inglés.
const ui=UI.es;
const FAQ=[
 {q:"¿Notas puede importar Google Keep?",a:["No directamente. Descarga Keep con Google Takeout y, en un Mac, importa los archivos HTML desde Archivo, Importar a Notas. Para unas pocas notas, copia y pega en el iPhone."]},
 {q:"¿Se sincronizan Keep y Notas?",a:["No. Añadir una cuenta Google a Notas crea notas de esa cuenta, pero Keep no las muestra ni pasa sus notas a la app de Apple."]},
 {q:"¿Llegan las etiquetas de Keep?",a:["No como etiquetas de Notas. Puedes organizar después con carpetas o escribir etiquetas con #palabra en las notas importantes."]},
 {q:"¿Takeout borra algo en Keep?",a:["No. Crea una copia para descargar y deja Keep como estaba. No incluye notas que ya se borraron."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="google-keep-a-notas-iphone"
 intro={<>Google Keep y Notas de Apple no se sincronizan. Si quieres cambiar, puedes copiar unas cuantas notas en el iPhone o descargar toda tu biblioteca y usar un Mac.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#pocas",label:"Unas pocas"},{href:"#todas",label:"Todas"},{href:"#llega",label:"Qué llega"},{href:"#pinto",label:"Otra opción"}]}>
  <p>Para pocas notas, copia el texto en Keep y pégalo en Notas. Para todas, pide una descarga en Google Takeout, abre el ZIP en un Mac e importa los archivos HTML de la carpeta Keep desde Archivo, Importar a Notas. Revisa listas e imágenes antes de borrar nada.</p>
  <PostCta slug="es/google-keep-a-notas-iphone" path="/es/blog/google-keep-a-notas-iphone" position="answer" ui={ui.cta} title="Importa Keep sin ordenar archivos uno a uno"><p>Pinto Notes lee la descarga de Google Keep en un Mac y convierte etiquetas en carpetas o etiquetas, conservando listas, imágenes y notas fijadas.</p></PostCta>
 </Answer>} faq={FAQ}>
 <h2 id="antes">Antes de empezar</h2>
 <p>Keep usa etiquetas y colores. Notas usa carpetas y etiquetas con #. Haz primero una prueba con una nota que tenga lista, imagen y etiqueta; revisa también las notas archivadas.</p>
 <Checklist title="Comprueba antes de cambiar" items={["Anota las etiquetas que quieras conservar","Prueba una lista y una nota con imagen","Revisa el archivo de Keep","Deja Keep intacto hasta contar las notas importadas"]} />
 <h2 id="pocas">Unas pocas notas: copiar y pegar</h2>
 <Steps><li>Abre una nota en Keep y copia el texto.</li><li>Crea una nota en Notas y pega el contenido. Escribe el título en la primera línea.</li><li>Si la lista llega como texto, selecciona sus líneas y toca el botón Lista de comprobación. Añade por separado las imágenes que falten.</li></Steps>
 <h2 id="todas">Todas las notas: Takeout y un Mac</h2>
 <Steps><li>En takeout.google.com, desmarca los demás servicios y deja solo Google Keep.</li><li>Elige un enlace por correo y un archivo ZIP. Google puede tardar de minutos a días; el enlace vence aproximadamente a los siete días y cada archivo puede descargarse cinco veces.</li><li>Abre el ZIP en un Mac. En la carpeta Takeout, busca Keep. La importación de Pinto Notes ha encontrado archivos HTML y JSON por nota; comprueba el contenido de tu descarga.</li><li>En Notas, selecciona una carpeta de iCloud y usa Archivo, Importar a Notas. Elige los archivos HTML y confirma. Aparecerán en Notas importadas.</li></Steps>
 <Paths rows={[{on:"Mac",steps:["Archivo","Importar a Notas"]}]} />
 <p>Apple enumera HTML entre los formatos que admite, pero no JSON. Tampoco explica cómo quedarán las listas y las imágenes de Keep tras importar HTML, así que la nota de prueba es necesaria. En el iPhone puedes compartir un archivo desde Archivos a Notas, uno por uno; para muchos, usa un Mac.</p>
 <h2 id="llega">Qué llega a Notas</h2>
 <div className="tableWrap"><table><thead><tr><th>En Keep</th><th>Copiar y pegar</th><th>Takeout e importación</th></tr></thead><tbody>
 <tr><th>Texto</th><td>Sí</td><td>Sí</td></tr><tr><th>Listas</th><td>Pueden quedar como texto</td><td>Comprueba la prueba</td></tr><tr><th>Imágenes</th><td>Añádelas aparte</td><td>Comprueba la prueba</td></tr><tr><th>Etiquetas</th><td>No</td><td>No</td></tr><tr><th>Colores y recordatorios</th><td>No</td><td>No</td></tr>
 </tbody></table></div>
 <p>Google dice que Takeout incluye texto, elementos de listas, archivos adjuntos, colores, estado de fijación y archivo, colaboradores y etiquetas. No significa que todo eso llegue a Notas. Reordena después con carpetas y etiquetas. <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Esta guía explica las etiquetas</a>.</p>
 <h2 id="gmail">Una cuenta de Google no conecta las dos apps</h2>
 <p>En el iPhone, Ajustes (Configuración en Latinoamérica), Apps, Notas, Cuentas de Notas permite activar una cuenta Google. Esas notas se sincronizan como correo IMAP; Google Keep no las muestra. Algunas funciones de Notas faltan en cuentas de terceros. Para consultar diferencias, lee <a href="/es/blog/notas-apple-vs-google-keep">Notas frente a Keep</a>.</p>
 <h2 id="pinto">Importar Keep a Pinto Notes</h2>
 <PostFigure src="/blog/launch/import-google-keep-guide" width={1600} height={1000} maxWidth={640} kind="plain" alt="Guía de importación de Google Keep en Pinto Notes para Mac, en inglés." caption="Pinto Notes abre la descarga de Keep con ese servicio seleccionado." />
 <p>En un Mac, elige Archivo e importar desde Google Keep. Descarga los datos y entrégalos a Pinto Notes. Puedes convertir las etiquetas en carpetas o etiquetas; llegan las listas con sus marcas, las notas fijadas y las imágenes. Las archivadas requieren marcar su opción. No llegan colores, dibujos ni recordatorios, y el resumen indica cuántas notas los tenían. Pinto Notes solo funciona en iPhone y Mac, y conserva versiones anteriores de las notas que edites con ChatGPT o Claude.</p>
 <p>También puedes consultar <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/import-your-notes" hrefLang="en">importar notas de otras apps</a>, <a href="/blog/move-apple-notes-to-obsidian-notion-keep" hrefLang="en">mover Notas a Obsidian, Notion o Keep</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
