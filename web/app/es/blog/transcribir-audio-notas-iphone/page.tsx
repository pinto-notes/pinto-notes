import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "transcribir-audio-notas-iphone");
// Versión de /blog/apple-notes-record-and-transcribe. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "transcribir audio notas iphone" ofreció "transcribir audio a texto notas iphone"
// y "transcribir audio notas de voz iphone".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/iphone/iphbe11247b5/ios
// (Grabar audio, Añadir transcripción a la nota, Copiar transcripción);
// /guide/notes/apdb5106e334/mac (grabación en Mac); /guide/iphone/iph57c6590e9/ios
// (Grabación de llamadas, Grabaciones de llamadas); /121115 (Apple Intelligence).
// Los botones que la guía muestra solo como iconos se describen por su acción. La captura está en inglés.
const ui = UI.es;
const FOLLOW_UP = `Usa mi nota "Notas de reuniones" de Pinto Notes. Voy a pegar la transcripción.
Añade el nombre y la fecha de la reunión, un resumen de dos líneas y las decisiones bajo Reuniones, con la más reciente arriba.
Añade cada tarea en Pendientes como "Responsable: tarea (fecha límite)" en una lista de verificación.
Si algo no queda claro, pregúntame antes de escribirlo.`;
const FAQ = [
  {q:"¿Hace falta Apple Intelligence para transcribir audio?",a:["No. La transcripción funciona en iPhone 12 o posterior y Mac con M1 o posterior, con un idioma compatible. Para crear un resumen sí hace falta Apple Intelligence."]},
  {q:"¿Dónde aparecen las llamadas grabadas?",a:["En la carpeta Grabaciones de llamadas de Notas. La grabación se inicia en Teléfono desde Más y Grabación de llamadas. Ambas personas oyen un aviso. La disponibilidad depende de la región y del idioma."]},
  {q:"¿Puedo escribir mientras grabo una reunión?",a:["Sí. En iPhone, desliza hacia abajo desde la parte superior de la pantalla de grabación. En el Mac puedes seguir editando la nota mientras se graba."]},
  {q:"¿Se borra la transcripción al eliminar el audio?",a:["Sí. Apple indica que se eliminan juntos. Usa “Copiar transcripción” o “Añadir transcripción a la nota” antes de borrar una grabación si necesitas conservar el texto."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="transcribir-audio-notas-iphone"
  intro={<>En Notas, abre una nota, toca Archivo adjunto y elige Grabar audio. Para transcribir necesitas un iPhone 12 o posterior, o un Mac con M1 o posterior, y un idioma compatible.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#mac",label:"Mac"},{href:"#requisitos",label:"Requisitos"},{href:"#texto",label:"Texto"},{href:"#llamadas",label:"Llamadas"}]}>
    <p>Graba dentro de una nota y consulta la transcripción. Puedes copiarla o añadirla a la nota. La transcripción no requiere Apple Intelligence; el resumen sí.</p>
    <PostCta slug="es/transcribir-audio-notas-iphone" path="/es/blog/transcribir-audio-notas-iphone" position="answer" template="meeting-notes" ui={ui.cta} title="Convierte la transcripción en tareas"><p>Pinto Notes tiene una plantilla gratuita de reuniones. Al conectar ChatGPT o Claude, pega la transcripción para obtener resumen, decisiones y tareas con responsable y fecha.</p></PostCta>
  </Answer>} hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Nota de una clase en Notas de un Mac, en inglés, con grabación, vista previa de la transcripción y resumen." caption="Grabación y transcripción de una clase en Notas para Mac. Imagen: Apple." />} faq={FAQ}>
  <h2 id="iphone">Grabar y transcribir en el iPhone</h2>
  <MenuPaths rows={[{on:"iPhone",steps:["Notas","Archivo adjunto","Grabar audio"]}]} />
  <Steps><li>Abre una nota, toca Archivo adjunto y elige Grabar audio.</li><li>Inicia la grabación. Toca el botón de transcripción para ver las palabras mientras hablas.</li><li>Si quieres escribir notas a la vez, desliza hacia abajo desde la parte superior.</li><li>Al terminar, pausa y finaliza la grabación con los controles de la pantalla.</li></Steps>
  <p>La <a href="https://support.apple.com/es-es/guide/iphone/iphbe11247b5/ios">guía de Apple para iPhone</a> muestra estos controles. Anota las decisiones durante la reunión y comprueba después las palabras exactas en el audio.</p>
  <h2 id="mac">Grabar en Notas para Mac</h2>
  <Steps><li>En una nota, haz clic en el botón de adjuntos de la barra y elige Grabar audio.</li><li>Inicia la grabación. Puedes seguir editando la nota.</li><li>Abre la transcripción con su botón. Al terminar, pausa y finaliza la grabación.</li></Steps>
  <p>Para volver al texto, haz doble clic en la grabación y abre su transcripción. Apple explica el proceso en la <a href="https://support.apple.com/es-es/guide/notes/apdb5106e334/mac">guía para Mac</a>. Algunas funciones requieren notas de iCloud y pueden faltar en cuentas de otros proveedores.</p>
  <h2 id="requisitos">Dispositivos e idiomas compatibles</h2>
  <p>Las guías de iOS 27 y macOS 27 piden iPhone 12 o posterior, o Mac con M1 o posterior. Admiten la transcripción con el dispositivo en inglés, español, portugués, italiano, francés, alemán, japonés, coreano, chino simplificado o chino tradicional. La guía de Mac enumera varias regiones para el inglés.</p>
  <p>Si no aparece el botón de transcripción, comprueba el dispositivo y el idioma. Las llamadas tienen otra lista de idiomas en la <a href="https://www.apple.com/ios/feature-availability/#phone-call-transcription">página de disponibilidad</a>. Para resumir se necesita un <a href="https://support.apple.com/es-es/121115">dispositivo con Apple Intelligence</a>, como iPhone 15 Pro o posterior compatible, o Mac con M1 o posterior. El idioma del dispositivo y el de Siri deben coincidir. Los idiomas de resumen no son necesariamente los mismos que los de transcripción. Consulta la <a href="https://www.apple.com/ios/feature-availability/#apple-intelligence-notes-transcription">lista actual</a> y la <a href="/es/blog/ia-notas-apple">guía de IA en Notas</a>.</p>
  <h2 id="texto">Usar el texto de la grabación</h2>
  <p>Abre la grabación y su transcripción. En el menú de opciones elige “Añadir transcripción a la nota” o “Copiar transcripción”. También puedes buscar dentro del texto. Al seleccionar un fragmento, se reproduce esa parte del audio. En un dispositivo compatible, abre la grabación y elige Resumen; en Mac, haz doble clic antes.</p>
  <p>Conserva la transcripción completa hasta comprobar nombres y decisiones con el audio.</p>
  <h2 id="llamadas">Grabaciones de llamadas en Notas</h2>
  <p>La llamada se graba desde Teléfono, no desde Notas. Comprueba la disponibilidad y el consentimiento de la otra persona. Apple indica que la <a href="https://support.apple.com/es-es/guide/iphone/iph57c6590e9/ios">grabación de llamadas</a> no está disponible en la Unión Europea ni en varios países más.</p>
  <Steps><li>Durante una llamada con otra persona, toca Más y “Grabación de llamadas”. Ambos oyen un aviso.</li><li>Detén la grabación o cuelga. Aparecerá en la carpeta “Grabaciones de llamadas” de Notas.</li><li>Abre la nota y consulta el audio y su transcripción, si está disponible. Se identifica a cada participante.</li></Steps>
  <p>La transcripción puede tardar en aparecer. Para consultar transcripciones de llamadas de Teléfono o FaceTime, Apple pide iOS 18.1 o posterior, además de un idioma y región compatibles. Comprueba el texto: Apple advierte que puede contener errores. Al borrar el audio también se borra la transcripción.</p>
  <h2 id="pinto">Preparar el seguimiento de una reunión</h2>
  <p>La <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta en Notas</a> sirve para rellenar a mano. La <a href="/templates/meeting-notes">plantilla de Pinto Notes</a> pone las tareas abiertas arriba y las reuniones debajo, con la más reciente primero. Pega el texto revisado de Notas.</p>
  <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, puedes pedir un resumen de dos líneas, decisiones y tareas con nombre y fecha. Si algo no está claro, debe preguntar antes de escribir.</p>
  <Keep title="Petición para tu IA conectada" text={FOLLOW_UP} note="Añade primero la plantilla. Después pega esta petición y la transcripción en ChatGPT o Claude." />
  <p>Más tarde, pregunta “¿Qué tengo pendiente?” o pide “Marca como terminada la revisión de diseño de Lucía”. La IA puede marcar la tarea y Pinto conserva las versiones anteriores. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en un Mac sin cambiarlas.</p>
</LocalPostPage>; }
