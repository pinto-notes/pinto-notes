import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "ia-notas-apple");
// Versión de /blog/apple-notes-ai. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "ia notas iphone" ofrece esa frase; "notas iphone con ia" ofrece "notas iphone ia".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/121115 y /127893 (requisitos y Siri AI),
// /guide/iphone/iph6f08da1d2/ios (Herramientas de escritura, Revisar, Reescribir,
// Resumir, Puntos clave, Redactar), /iphbe11247b5/ios (transcripciones),
// /iphb8628c6b8/ios (búsqueda), /guide/notes/apdb5106e334/mac (grabación y resumen),
// /guide/iphone/iphe3f499e0e/ios (privacidad). Captura inglesa.
const ui=UI.es;
const FAQ=[
 {q:"¿Notas de Apple tiene resúmenes con IA?",a:["Sí. Apple Intelligence puede resumir una transcripción de audio y, con Herramientas de escritura, resumir texto seleccionado o extraer sus puntos clave. Necesitas un dispositivo e idioma compatibles."]},
 {q:"¿En qué idiomas transcribe Notas?",a:["En iPhone 12 o posterior, Apple enumera inglés, español, portugués, italiano, francés, alemán, japonés, coreano y chino simplificado y tradicional. Los resúmenes tienen una lista propia de idiomas y regiones."]},
 {q:"¿Por qué no veo la transcripción?",a:["Puede que el dispositivo no cumpla los requisitos o que Notas no reconozca un idioma compatible. Una transcripción de llamada también puede tardar un poco."]},
 {q:"¿Apple recibe mis notas al usar la IA?",a:["Apple indica que muchas peticiones se resuelven en el dispositivo. Otras usan Private Cloud Compute, que no guarda los datos ni los pone a disposición de Apple. Puedes consultar el informe de Apple Intelligence en los ajustes de privacidad."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="ia-notas-apple"
 intro={<>La IA de Notas aparece en las herramientas de escritura, las grabaciones y Siri. Cada función tiene requisitos distintos. Aquí tienes qué hace, dónde funciona y cómo se relaciona con ChatGPT o Claude.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#funciones",label:"Funciones"},{href:"#requisitos",label:"Requisitos"},{href:"#buscar",label:"Búsqueda"},{href:"#otras",label:"ChatGPT y Claude"}]}>
  <p>Apple Intelligence puede revisar, reescribir y resumir texto seleccionado; también resume una grabación transcrita. La transcripción sola funciona en iPhone 12 o posterior, sin Apple Intelligence. Siri AI en iOS y macOS 27 puede buscar notas por contenido en los países donde está disponible.</p>
  <PostCta slug="es/ia-notas-apple" path="/es/blog/ia-notas-apple" position="answer" ui={ui.cta} title="Trabaja con ChatGPT o Claude en tus notas"><p>En Pinto Notes puedes conectar la IA que ya usas para buscar, leer y editar notas. Los cambios se pueden deshacer.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={560} alt="Nota de una clase en un Mac, en inglés, con grabación de audio, transcripción y apuntes." caption="Una grabación y parte de su transcripción en Notas. Imagen: Apple." />} faq={FAQ}>
 <h2 id="funciones">Qué hace Apple Intelligence en Notas</h2>
 <div className="tableWrap"><table><thead><tr><th>Función</th><th>Resultado</th><th>Dispositivo</th></tr></thead><tbody>
 <tr><th>Herramientas de escritura</th><td>Revisar, Reescribir, Resumir, Puntos clave y describir cambios</td><td>iPhone y Mac compatibles</td></tr>
 <tr><th>Transcripción</th><td>Texto de una grabación, buscable y añadible a la nota</td><td>iPhone 12 o posterior; Mac con M1 o posterior</td></tr>
 <tr><th>Resumen de grabación</th><td>Resumen de la transcripción</td><td>Con Apple Intelligence</td></tr>
 <tr><th>Llamadas grabadas</th><td>Grabación, transcripción y resumen en una carpeta de Notas</td><td>iPhone, según el país</td></tr>
 <tr><th>Varita gráfica</th><td>Convierte un boceto o texto cercano en imagen</td><td>iPhone</td></tr>
 <tr><th>Siri AI, beta</th><td>Busca y edita notas por contenido</td><td>iOS 27 y macOS 27, según la región</td></tr>
 </tbody></table></div>
 <p>La transcripción no requiere Apple Intelligence, pero su resumen sí. Con Siri AI, Apple dirige la reescritura a sus funciones de Siri. <a href="/blog/siri-ai-apple-notes" hrefLang="en">Esta guía explica Siri AI en Notas</a>.</p>
 <h3>Revisar o resumir texto</h3>
 <p>Selecciona el texto y abre Herramientas de escritura. Puedes elegir Revisar, Reescribir con tono Informal, Profesional o Conciso, Resumir, Puntos clave o Describe un cambio. Con la extensión de ChatGPT activada, Redactar le envía todo el texto o solo el seleccionado, según elijas.</p>
 <h3>Grabar, transcribir y resumir</h3>
 <Steps><li>En una nota, toca el botón de adjuntos, inicia una grabación y sigue escribiendo si quieres.</li><li>Abre la grabación y muestra la transcripción. Puedes buscar en ella o añadir el texto a la nota.</li><li>En un dispositivo compatible, abre el resumen de esa transcripción para copiarlo o compartirlo.</li></Steps>
 <p>Si borras la grabación, desaparece su transcripción. Las llamadas grabadas llegan a su propia carpeta, con los interlocutores identificados. La grabación de llamadas no está disponible en la Unión Europea ni en otros países citados por Apple, y la otra persona oye un aviso.</p>
 <h2 id="requisitos">Dispositivos, idiomas y espacio</h2>
 <ul><li>iPhone 15 Pro, 15 Pro Max, 16 o posterior, Air o Duo, con iOS 27, para Apple Intelligence.</li><li>Mac con M1 o posterior, o MacBook Neo, con macOS 27.</li><li>El idioma del dispositivo y el de Siri deben coincidir y ser compatibles. Apple enumera español, inglés, francés, alemán, italiano, portugués y otros diez idiomas.</li><li>Puede usar hasta 8 GB de espacio, o hasta 14 GB en algunos modelos nuevos.</li></ul>
 <p>Apple Intelligence llega con la actualización 27.0 a los dispositivos compatibles. No funciona en dispositivos comprados en China continental. Algunas funciones de servidor tienen límites diarios. Los resúmenes de audio admiten menos idiomas: inglés, francés, alemán, italiano, japonés, coreano, portugués de Brasil, español y chino tradicional en las regiones indicadas. Siri AI sigue en beta y, en la Unión Europea, está disponible en Mac pero no en iPhone.</p>
 <h2 id="buscar">Buscar notas con y sin IA</h2>
 <p>La búsqueda normal ya encuentra texto escrito o manuscrito, texto escaneado, objetos de imágenes y etiquetas. Una nota bloqueada solo muestra el título. Dentro de una nota puedes buscar también en los adjuntos. Siri AI añade preguntas por significado, como pedir la nota donde apuntaste una receta sin recordar su título; utiliza información de Notas y otras apps compatibles.</p>
 <h2 id="otras">Qué pueden hacer ChatGPT y Claude</h2>
 <p>La extensión de ChatGPT de Apple recibe el texto que eliges enviar y devuelve una respuesta en Herramientas de escritura o Siri; no abre libremente toda tu biblioteca. Apple no ofrece una extensión equivalente para Claude ni una API de Notas. En Mac, la app de ChatGPT puede leer la nota abierta y Claude para escritorio puede usar una extensión que controla Notas. <a href="/blog/claude-and-apple-notes" hrefLang="en">Consulta los límites de esa conexión</a>.</p>
 <h2 id="pinto">Tu IA habitual con tus notas</h2>
 <Figure shot={SHOTS.aiEdit} caption="ChatGPT añadió cinco líneas a una nota de Pinto Notes, en inglés; aparecen resaltadas y se pueden deshacer." />
 <p>Pinto Notes no incluye una IA propia. ChatGPT, Claude, Claude Code y Codex pueden buscar, leer y editar notas Markdown desde el teléfono, el escritorio o la web una vez conectados. Conserva las versiones y marca los cambios; las notas están cifradas y las bloqueadas permanecen cerradas a la IA. Solo funciona en iPhone y Mac. Importa Notas de Apple con sus carpetas desde un Mac sin cambiar el original.</p>
 <p>También puedes consultar <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
