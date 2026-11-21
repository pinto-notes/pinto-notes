import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Paths, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "exportar-notas-iphone-pdf");
// Versión de /blog/apple-notes-export-pdf. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "exportar notas iphone pdf" ofrece esa frase; "como exportar notas de iphone" ofrece "a pdf"
// y "como exportar todas las notas de iphone". Apple, leído el 21 Nov 2026:
// support.apple.com/es-es/guide/notes/not201900c07/mac (Archivo > Exportar como),
// /guide/iphone/iphdf551cfa2/ios (Compartir > Marcación > OK; Ver más),
// /guide/mac-help/mchlp1531/mac (Imprimir > PDF), /es-es/102208 (copia de datos).
// La guía /es-lamr/guide/iphone/iphdf551cfa2/ios dice Marcado y Listo.
// El artículo inglés cubre versiones anteriores de macOS; cuando la guía española actual no da
// ese nombre, se describe el paso sin citar un menú antiguo no verificado. Captura inglesa.
const ui=UI.es;
const FAQ=[
 {q:"¿Por qué solo sale una página del escaneo?",a:["Apple indica que un PDF o escaneo de varias páginas adjunto a la nota aparece solo con su primera página en el PDF exportado desde iPhone. Envía también el archivo original."]},
 {q:"¿Puedo exportar una carpeta entera a PDF?",a:["Las guías de Apple explican cómo exportar una nota abierta, no una carpeta o biblioteca. En un Mac, una herramienta como notes-exporter permite escribir cada nota en PDF."]},
 {q:"¿Puedo pedir a Apple todas mis notas?",a:["Sí. En privacy.apple.com puedes solicitar una copia de tus datos de iCloud, incluidas las notas. Apple da 14 días para descargarla cuando esté lista, sin especificar el formato de las notas."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="exportar-notas-iphone-pdf"
 intro={<>Un PDF permite compartir o imprimir una nota sin que la otra persona use Notas. En el Mac se exporta desde el menú Archivo; en el iPhone, desde Compartir y Marcación. Cada operación trabaja con una nota.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#mac",label:"En un Mac"},{href:"#iphone",label:"En el iPhone"},{href:"#pagina",label:"Escaneos"},{href:"#todas",label:"Todas las notas"}]}>
  <p>En el Mac, abre una nota y elige Archivo, Exportar como, PDF. En el iPhone, toca Compartir, Marcación y después OK para guardar el PDF. Apple no describe una exportación de carpetas completas a PDF.</p>
  <PostCta slug="es/exportar-notas-iphone-pdf" path="/es/blog/exportar-notas-iphone-pdf" position="answer" ui={ui.cta} title="Tus notas como archivos"><p>Pinto Notes guarda cada nota como Markdown. En un Mac también puedes exportar una nota a PDF y descargar una copia de toda tu biblioteca.</p></PostCta>
 </Answer>}
 hero={<Capture priority src="/blog/macos27/notes-export-to" width={770} height={795} maxWidth={385} alt="Menú Archivo de Notas en macOS 27, en inglés, con Export To, PDF y Markdown." caption="La exportación a PDF está en el menú Archivo de Notas. La captura muestra la app en inglés." />} faq={FAQ}>
 <h2 id="mac">Exportar una nota a PDF en un Mac</h2>
 <Paths rows={[{on:"macOS 27",steps:["Archivo","Exportar como","PDF"]}]} />
 <Steps><li>Abre Notas y selecciona la nota.</li><li>Elige Archivo, Exportar como y PDF.</li><li>Escribe otro nombre si quieres, elige la carpeta y guarda. Puedes añadir etiquetas para encontrarlas luego en Finder.</li></Steps>
 <p>En versiones anteriores de macOS, busca la opción de PDF en Archivo; la guía española actual no confirma los nombres de esos menús antiguos. También puedes elegir Archivo, Imprimir, abrir el menú PDF de la ventana de impresión y guardar como PDF. Las opciones de seguridad de esa ventana permiten poner una contraseña al archivo.</p>
 <h2 id="iphone">Exportar una nota a PDF en el iPhone</h2>
 <Paths rows={[{on:"iPhone",steps:["Compartir","Marcación","OK"]}]} />
 <Steps><li>Abre la nota y toca Compartir.</li><li>Elige Marcación. Si no aparece, toca Ver más.</li><li>Haz las marcas que quieras y toca OK para guardar el PDF. En algunas regiones de Latinoamérica, esos botones se llaman Marcado y Listo.</li></Steps>
 <p>Para imprimir, toca Compartir, Imprimir y elige una impresora. También puedes abrir una nota en Pages para seguir editándola; si está bloqueada, desbloquéala antes con contraseña, Face ID o Touch ID. Apple explica ambas rutas en <a href="https://support.apple.com/es-es/guide/iphone/iphdf551cfa2/ios">su guía para iPhone</a>.</p>
 <h2 id="pagina">Por qué un escaneo muestra una sola página</h2>
 <p>El PDF exportado usa la configuración de visualización actual de los adjuntos. Si la nota tiene un PDF o un escaneo de varias páginas, Apple indica que solo aparecerá la primera. Conserva y envía el archivo adjunto original cuando necesites todas.</p>
 <h2 id="todas">Una carpeta o todas las notas</h2>
 <div className="tableWrap"><table><thead><tr><th>Opción</th><th>Resultado</th></tr></thead><tbody><tr><th>Exportar nota por nota</th><td>Un PDF por nota, en iPhone o Mac</td></tr><tr><th>Solicitar datos a Apple</th><td>Copia de iCloud en privacy.apple.com; formato de las notas no especificado</td></tr><tr><th>notes-exporter</th><td>En Mac, exporta PDF, Markdown, HTML, Word o EPUB; omite notas bloqueadas y usa Chrome para los PDF</td></tr></tbody></table></div>
 <p>Apple permite descargar la copia solicitada durante 14 días. Para una copia que puedas volver a importar como notas, Markdown es más útil que PDF: <a href="/blog/export-apple-notes-to-markdown" hrefLang="en">guía de exportación a Markdown</a>. También puedes leer <a href="/blog/back-up-apple-notes" hrefLang="en">cómo hacer una copia de seguridad</a>.</p>
 <h2 id="pinto">Notas que ya son archivos</h2>
 <Figure shot={SHOTS.welcome} caption="Una nota de Pinto Notes en un Mac. Por debajo es un archivo Markdown." />
 <p>Pinto Notes ofrece en Mac exportar la nota abierta a PDF e imprimirla. En sus ajustes de cuenta puedes descargar un ZIP con todas las notas Markdown, carpetas y adjuntos. ChatGPT o Claude pueden leerlas y editarlas tras conectarse, sin exportación previa. La importación de Notas de Apple se hace en un Mac y no cambia los originales.</p>
 <p>También puedes consultar <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
