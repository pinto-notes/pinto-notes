import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "escanear-documentos-notas-iphone");
// Versión de /blog/apple-notes-scan-document. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "escanear documentos notas iphone" ofreció "escanear documentos desde notas iphone" y
// "no puedo escanear documentos en notas iphone".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/108963 (Archivo adjunto, Escanear Documentos,
// Conservar archivo escaneado, OK); /guide/iphone/iph653f28965/ios (Escanear texto, Insertar);
// /guide/iphone/iph8958dd125/ios (PDF); /102332 (Cámara de Continuidad);
// /guide/iphone/iphdf551cfa2/ios (exportación); /guide/preview/prvw1509/mac (compresión).
// Las capturas no se usan en este artículo.
const ui = UI.es;
const FAQ = [
  {q:"¿Cómo escaneo varias páginas en un solo PDF?",a:["En una nota del iPhone, toca Archivo adjunto y Escanear Documentos. Captura todas las páginas antes de tocar OK. Se guardan juntas en el PDF de la nota."]},
  {q:"¿Escanear texto crea palabras editables?",a:["Sí. Toca Archivo adjunto, Escanear texto, selecciona las palabras con la cámara y toca Insertar. Escanear Documentos guarda un PDF. Apple limita el reconocimiento de texto a los idiomas compatibles."]},
  {q:"¿Cómo reduzco el tamaño de un escaneo?",a:["En el Mac, abre el PDF en Vista Previa. Usa Archivo > Exportar y el filtro Quartz “Reducción del tamaño de archivo”. Guarda una copia y revisa que se lea bien; la compresión puede reducir la calidad."]},
  {q:"¿Puedo escanear para una nota del Mac con el iPhone?",a:["Sí, con Cámara de Continuidad. Haz clic con Control en la nota, elige la opción de escanear y usa el iPhone. Ambos dispositivos necesitan Wi-Fi, Bluetooth y la misma Cuenta de Apple con autenticación de doble factor."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="escanear-documentos-notas-iphone"
  intro={<>Para escanear un documento en Notas del iPhone, abre una nota, toca Archivo adjunto y elige Escanear Documentos. Captura las páginas y toca OK. Notas las guarda en un PDF.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#pdf",label:"PDF"},{href:"#texto",label:"Texto"},{href:"#mac",label:"Mac"},{href:"#tamano",label:"Tamaño"}]}>
    <p>Notas ya tiene escáner de documentos. Escanear Documentos guarda una o varias páginas en PDF. Si necesitas palabras editables, usa Escanear texto. Con Cámara de Continuidad puedes escanear desde el iPhone directamente a una nota del Mac.</p>
    <PostCta slug="es/escanear-documentos-notas-iphone" path="/es/blog/escanear-documentos-notas-iphone" position="answer" ui={ui.cta} title="Guarda el PDF junto a tus apuntes"><p>Pinto Notes admite PDF y archivos en notas y carpetas del iPhone. Al conectar ChatGPT o Claude, pueden leer y editar el texto de tus notas.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Escanear un documento en el iPhone</h2>
  <MenuPaths rows={[{on:"iPhone",steps:["Archivo adjunto","Escanear Documentos"]}]} />
  <Steps><li>Abre una nota o crea una.</li><li>Toca Archivo adjunto y después Escanear Documentos.</li><li>En modo Automático, apunta la cámara y mantén el teléfono quieto.</li><li>Para capturar la página a mano, toca el obturador o un botón de volumen. Ajusta las esquinas y toca “Conservar archivo escaneado”.</li><li>Añade las demás páginas y toca OK.</li></Steps>
  <p>También puedes usar Más y Escanear dentro de la nota. Apple describe ambas rutas y las opciones de flash y filtros de iOS 26 en su <a href="https://support.apple.com/es-es/108963">guía para escanear documentos</a>.</p>
  <h2 id="pdf">El escaneo ya es un PDF</h2>
  <p>Para reunir varias páginas, escanéalas en la misma sesión. Para enviarlas, abre el menú del PDF adjunto y elige compartir. “Vista rápida” lo abre a pantalla completa. Apple enumera estos controles en <a href="https://support.apple.com/es-es/guide/iphone/iph8958dd125/ios">Trabajar con PDF en Notas</a>.</p>
  <p>Comparte el escaneo adjunto si el destinatario necesita todas las páginas. Apple indica que al exportar la nota entera como PDF solo se incluye la primera página de cada escaneo de varias páginas. La <a href="/es/blog/exportar-notas-iphone-pdf">guía de exportación</a> explica la diferencia.</p>
  <h2 id="texto">Escanear palabras en vez de crear un PDF</h2>
  <MenuPaths rows={[{on:"iPhone",steps:["Archivo adjunto","Escanear texto","Insertar"]}]} />
  <p>En una nota, elige Escanear texto. Apunta a la página, selecciona las palabras y toca Insertar. Quedan como texto de la nota. Apple documenta la función en <a href="https://support.apple.com/es-es/guide/iphone/iph653f28965/ios">Escanear texto y documentos</a>. Funciona en idiomas compatibles. No convierte un PDF ya escaneado en un documento editable. Revisa las palabras contra el original.</p>
  <h2 id="mac">Escanear para una nota del Mac</h2>
  <p>Cámara de Continuidad usa el iPhone para poner el PDF en la nota del Mac. Activa Wi-Fi y Bluetooth en ambos dispositivos e inicia sesión con la misma Cuenta de Apple y autenticación de doble factor.</p>
  <Steps><li>Abre la nota en el Mac y haz clic con Control donde irá el escaneo.</li><li>Elige la opción de escanear documentos; si aparece un submenú, selecciona el iPhone.</li><li>Captura las páginas con el iPhone y ajusta las esquinas si hace falta.</li><li>Guarda el escaneo en el iPhone. El PDF aparece en la nota del Mac.</li></Steps>
  <p>La <a href="https://support.apple.com/es-es/102332">guía de Cámara de Continuidad</a> pide macOS Mojave 10.14 e iOS 12 o posteriores, además de hardware compatible. Consulta sus requisitos si la opción no aparece. Apple recomienda usar macOS actualizado.</p>
  <h2 id="tamano">Reducir el tamaño del archivo</h2>
  <p>Abre el PDF en Vista Previa en un Mac. Elige Archivo &gt; Exportar y, en “Filtro Quartz”, selecciona “Reducción del tamaño de archivo”. Guarda una copia con otro nombre. La <a href="https://support.apple.com/es-es/guide/preview/prvw1509/mac">guía de Vista Previa</a> advierte que pueden variar tanto el tamaño final como la calidad. Comprueba la letra pequeña antes de enviarlo.</p>
  <p>La opción “Ver como” de Notas solo cambia el tamaño de la vista previa. No comprime el archivo. Usa Escanear Documentos para un PDF y Escanear texto para añadir palabras a la nota.</p>
  <h2 id="pinto">Conservar el PDF con los apuntes</h2>
  <p>Pinto Notes guarda fotos, PDF y otros archivos en notas y carpetas del iPhone. Usa el escáner de Apple para obtener el PDF y guárdalo junto a tus apuntes. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leer y editar las notas, con versiones anteriores. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en un Mac sin cambiarlas.</p>
</LocalPostPage>; }
