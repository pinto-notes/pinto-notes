import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-en-windows");
// Versión de /blog/apple-notes-on-windows. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "notas iphone en windows" ofreció "ver notas de iphone en windows", "como usar notas de iphone
// en windows" y "como tener notas de iphone en windows".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/105119; /guide/icloud/mm8685520792/icloud,
// /mmc0cd6edf/icloud, /mmcd9c9e9b71/icloud, /mm198698c442/icloud, /mm000b55f946/icloud,
// /mmc8a8e49dbd/icloud y /mm6be2394337/icloud. Los iconos sin nombre visible se describen.
// La captura de Pinto Notes está en inglés.
const ui = UI.es;
const FAQ = [
  {q:"¿Cómo abro Notas del iPhone en Windows 11?",a:["Abre icloud.com/notes e inicia sesión con la misma Cuenta de Apple. Apple recomienda versiones recientes de Firefox, Chrome, Edge u Opera. Solo aparecen las notas guardadas en iCloud."]},
  {q:"¿Necesito iCloud para Windows?",a:["No. Notas se abre en el navegador. La app iCloud para Windows incluye otras funciones, pero Apple no enumera Notas entre ellas."]},
  {q:"¿Puedo adjuntar archivos desde el PC?",a:["Apple indica que los adjuntos se añaden desde Notas en un iPhone o Mac. En Windows puedes verlos o descargarlos desde iCloud.com."]},
  {q:"¿Por qué no se abre una nota bloqueada?",a:["iCloud.com permite abrir las notas protegidas con una contraseña específica de Notas, pero no las bloqueadas con el código o la contraseña de inicio de sesión del dispositivo. Los adjuntos bloqueados aparecen como marcadores de posición."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="notas-iphone-en-windows"
  intro={<>Para usar Notas de Apple en Windows, abre icloud.com/notes en el navegador e inicia sesión con tu Cuenta de Apple. Las notas deben estar guardadas en iCloud para aparecer allí.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#abrir",label:"Abrir notas"},{href:"#faltan",label:"Si faltan notas"},{href:"#editar",label:"Editar"},{href:"#limites",label:"Límites"}]}>
    <p>En <a href="https://www.icloud.com/notes">Notas de iCloud.com</a> puedes leer y editar las notas de iCloud desde Windows, también en Windows 11. Los cambios aparecen en tus dispositivos Apple si activaste la sincronización. No hace falta descargar una app.</p>
    <PostCta slug="es/notas-iphone-en-windows" path="/es/blog/notas-iphone-en-windows" position="answer" ui={ui.cta} title="¿También tomas notas en Mac o iPhone?"><p>Pinto Notes funciona en esos dispositivos y permite conectar ChatGPT o Claude para editar notas. No funciona en Windows y no tiene versión web.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="abrir">Abrir Notas en un PC con Windows</h2>
  <Steps><li>Abre <a href="https://www.icloud.com/notes">icloud.com/notes</a> en el navegador.</li><li>Inicia sesión con la Cuenta de Apple que usas para las notas de iCloud.</li><li>Selecciona una carpeta y luego la nota que quieres leer o editar.</li></Steps>
  <p>Apple incluye Notas entre las <a href="https://support.apple.com/es-es/105119">funciones de iCloud.com para Windows</a>. Recomienda una versión reciente de Firefox, Chrome, Edge u Opera.</p>
  <h2 id="faltan">Si faltan notas del iPhone</h2>
  <p>iCloud.com muestra las notas de iCloud, no las guardadas en Google, Yahoo u otra cuenta. Busca la nota en una carpeta bajo iCloud en el iPhone o el Mac. La <a href="/es/blog/donde-se-guardan-notas-iphone">guía sobre dónde se guardan</a> explica las distintas cuentas.</p>
  <p>En el iPhone, abre Ajustes (Configuración en algunos países), tu nombre, iCloud, Notas, y activa la sincronización. En el Mac, abre Ajustes del Sistema, tu nombre, iCloud, Notas, y activa “Sincronizar este Mac”. La <a href="https://support.apple.com/es-es/guide/icloud/mm8685520792/icloud">guía de Apple</a> muestra las rutas según la versión del sistema. Usa la misma cuenta en el dispositivo y en el navegador.</p>
  <p>Si iCloud.com no permite acceder a tus datos, revisa el acceso web de iCloud en un dispositivo Apple. Protección de Datos Avanzada lo desactiva al activarla. Puedes volver a permitirlo y aprobar el acceso temporal desde un dispositivo de confianza. Apple explica los pasos en <a href="https://support.apple.com/es-es/guide/icloud/mmc8a8e49dbd/icloud">Gestionar el acceso a iCloud.com</a>.</p>
  <h2 id="editar">Escribir y editar en el navegador</h2>
  <Steps><li>Haz clic en el botón para crear una nota en la barra de herramientas.</li><li>Escribe. iCloud.com guarda los cambios automáticamente.</li><li>Selecciona texto y usa el control de estilos de la barra para darle formato.</li></Steps>
  <p>Para una lista de comprobación, sitúa el cursor en una línea vacía o selecciona varias y usa el botón correspondiente. Marca un elemento con el círculo a su lado. Apple explica cómo <a href="https://support.apple.com/es-es/guide/icloud/mmc0cd6edf/icloud">crear notas</a> y <a href="https://support.apple.com/es-es/guide/icloud/mmcd9c9e9b71/icloud">editar listas</a> en iCloud.com.</p>
  <h2 id="limites">Límites de la versión web</h2>
  <h3>Adjuntos y escaneos</h3>
  <p>Añade adjuntos desde Notas en un iPhone o Mac. En Windows puedes abrirlos o descargarlos con doble clic. Para un documento escaneado, abre su miniatura y usa el botón de descarga. Consulta la <a href="https://support.apple.com/es-es/guide/icloud/mm198698c442/icloud">guía de adjuntos</a>.</p>
  <h3>Notas bloqueadas</h3>
  <p>En un dispositivo Apple puedes desbloquear notas con contraseña, Face ID o Touch ID. En iCloud.com necesitas la contraseña específica de Notas. Si protegiste la nota con el código o la contraseña de inicio de sesión del dispositivo, Apple dice que no se abre en la web. Los adjuntos bloqueados muestran marcadores de posición. Para añadir o quitar bloqueos y cambiar la contraseña, usa Notas en un dispositivo Apple. Consulta la <a href="https://support.apple.com/es-es/guide/icloud/mm000b55f946/icloud">guía de notas bloqueadas</a>.</p>
  <h2 id="descarga">¿Hay una app de Notas para Windows?</h2>
  <p>Apple indica usar el navegador. Su <a href="https://support.apple.com/es-es/guide/icloud/mm6be2394337/icloud">guía de iCloud para Windows</a> enumera fotos, archivos y otras funciones, pero no Notas. Si necesitas una app de escritorio en Windows, consulta las <a href="/es/blog/alternativas-notas-apple">alternativas a Notas</a>.</p>
  <h2 id="pinto">Si también usas Mac o iPhone</h2>
  <p>Pinto Notes funciona en iPhone y Mac, sin app para Windows, Android o web. Guarda las notas en archivos Markdown y conserva versiones anteriores. ChatGPT o Claude pueden leerlas y editarlas al conectarlos.</p>
  <Figure shot={SHOTS.welcome} caption="Nota de bienvenida de Pinto Notes en un Mac. La captura está en inglés." />
  <p>En un Mac puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus Notas de Apple</a> una vez sin modificarlas.</p>
</LocalPostPage>; }
