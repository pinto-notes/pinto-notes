import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "editar-pdf-notas-iphone");
// Versión de /blog/apple-notes-annotate-pdf. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "anotar pdf notas iphone" no dio sugerencias; "editar pdf en notas iphone" ofreció
// "como editar un pdf en notas iphone". El título aclara que se trata de anotaciones.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/iphone/iph8958dd125/ios
// (Ver como, Vista rápida; el botón para dibujar aparece solo como icono),
// /iph893c6f8bf/ios (lápiz, marcador, grosor y opacidad),
// /iphdf551cfa2/ios (Compartir, Marcación y límite de páginas);
// /guide/notes/apdef7f74190/mac (Marcación, Aceptar); /guide/mac-help/mchl1fd88863/mac
// y /guide/preview/prvw11580/mac (herramientas y límites de edición).
const ui = UI.es;
const REVIEW = ["Revisión del PDF", "", "Documento:", "Página:", "Comentario:", "Siguiente paso:", ""].join("\n");
const FAQ = [
  {q:"¿Puedo anotar un PDF en Notas del iPhone?",a:["Sí. Si la vista previa es pequeña, abre el PDF y toca el botón para dibujar. Si es mediana o grande, toca ese botón directamente. Elige un bolígrafo, marcador o lápiz y escribe con el dedo."]},
  {q:"¿Puedo cambiar el texto original del PDF?",a:["Las guías de Apple describen anotaciones y acciones sobre páginas, no la sustitución de las palabras originales. En Mac, la herramienta Texto añade un cuadro sobre la página. Vista Previa tampoco edita el texto existente del PDF."]},
  {q:"¿Dónde está Marcación en Notas para Mac?",a:["Abre la nota, haz clic en el control junto al título del PDF adjunto y elige Marcación. Añade tus anotaciones y haz clic en Aceptar."]},
  {q:"¿Compartir y Marcación cambia el PDF adjunto?",a:["En iPhone, usar Compartir y Marcación en la nota crea otro PDF con el contenido de la nota. Para anotar el adjunto, usa su botón de dibujo. La exportación de la nota solo incluye la primera página de cada PDF o escaneo de varias páginas."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="editar-pdf-notas-iphone"
  intro={<>Puedes anotar un PDF adjunto en Notas del iPhone o del Mac. En iPhone, abre el PDF y usa el botón para dibujar sobre él. En Mac, abre el menú junto al título del archivo y elige Marcación.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#mac",label:"Mac"},{href:"#limites",label:"Límites"},{href:"#exportar",label:"Exportar"}]}>
    <p>En iPhone, si la vista previa es pequeña, abre el PDF y toca el botón de dibujo. Si es mediana o grande, puedes tocarlo directamente. En Mac, abre el menú junto al título del PDF, elige Marcación y termina con Aceptar.</p>
    <PostCta slug="es/editar-pdf-notas-iphone" path="/es/blog/editar-pdf-notas-iphone" position="answer" ui={ui.cta} title="Guarda también los comentarios escritos"><p>Pinto Notes funciona como Notas en iPhone y Mac. Una vez conectados, ChatGPT o Claude pueden leer y editar las observaciones que escribes en una nota. Pinto conserva las versiones anteriores.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Anotar un PDF en el iPhone</h2>
  <p>Si el PDF está en Archivos o Mail, mantenlo pulsado, toca Compartir, elige Notas y guarda el archivo en una nota. Abre esa nota para trabajar sobre el adjunto.</p>
  <Steps><li>Busca el PDF dentro de la nota.</li><li>Con una vista previa pequeña, abre el PDF y toca el botón para dibujar. Con una vista mediana o grande, tócalo directamente.</li><li>Elige bolígrafo, marcador o lápiz y dibuja con el dedo.</li><li>Toca otra vez la herramienta elegida para cambiar grosor u opacidad. Usa el selector de color para otro tono.</li></Steps>
  <p>Para cambiar el tamaño de la vista previa, abre el menú del PDF, toca “Ver como” y elige Pequeño, Mediano o Grande. Si la barra de Marcación se reduce, tócala para desplegarla. Apple explica los controles en <a href="https://support.apple.com/es-es/guide/iphone/iph8958dd125/ios">Trabajar con PDF en Notas</a> y <a href="https://support.apple.com/es-es/guide/iphone/iph893c6f8bf/ios">dibujar con Marcación</a>.</p>
  <h2 id="mac">Usar Marcación en Notas para Mac</h2>
  <Steps><li>Abre la nota que contiene el PDF.</li><li>Haz clic en el control junto al título del archivo y elige Marcación.</li><li>Usa la barra de herramientas para anotar.</li><li>Haz clic en Aceptar al terminar.</li></Steps>
  <p>La herramienta Texto añade un comentario escrito en un cuadro que puedes mover. También puedes resaltar texto, dibujar y añadir una firma. Las herramientas disponibles dependen del archivo. Consulta la <a href="https://support.apple.com/es-es/guide/notes/apdef7f74190/mac">guía de adjuntos de Notas</a> y la <a href="https://support.apple.com/es-es/guide/mac-help/mchl1fd88863/mac">guía de Marcación</a>.</p>
  <h2 id="limites">Qué significa editar un PDF aquí</h2>
  <p>Marcación añade comentarios sobre la página. Un cuadro de texto no sustituye las palabras originales del PDF. Las guías de Notas no documentan esa operación y Apple indica que <a href="https://support.apple.com/es-es/guide/preview/prvw11580/mac">Vista Previa tampoco modifica el texto existente</a>.</p>
  <p>En iPhone, con una vista mediana o grande, muestra las miniaturas y abre el menú de una página para girarla. Las opciones de recortar página y aplicar filtros solo se ofrecen para documentos escaneados.</p>
  <h2 id="exportar">Anotar el adjunto o exportar toda la nota</h2>
  <p>En iPhone, Compartir y Marcación en la nota crea un PDF nuevo de toda la nota. Para anotar el archivo adjunto, usa el control del PDF descrito arriba.</p>
  <p>La exportación de la nota solo incluye la primera página de cada PDF o escaneo adjunto de varias páginas. Si la otra persona necesita el documento completo, comparte el adjunto. Apple explica este límite en la <a href="https://support.apple.com/es-es/guide/iphone/iphdf551cfa2/ios">guía de exportación</a>. Consulta también <a href="/es/blog/exportar-notas-iphone-pdf">cómo exportar Notas a PDF</a>.</p>
  <h2 id="pinto">Guardar también la revisión escrita</h2>
  <p>Un círculo en la página señala dónde cambiar algo. Una nota aparte puede explicar el cambio y quién debe hacerlo. Copia este esquema y repite las líneas de página y comentario.</p>
  <Keep title="Nota para revisar un PDF" text={REVIEW} />
  <p>Para esos comentarios escritos, Pinto Notes se parece a Notas en iPhone y Mac. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leerlos y convertirlos en una lista de tareas sin perder los números de página. Pinto conserva todas las versiones de la nota. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en un Mac sin cambiarlas.</p>
</LocalPostPage>; }
