import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "widget-notas-iphone");
// Versión de /blog/apple-notes-widget. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "widget notas iphone" ofreció "widget notas rapidas iphone" y "widget notas de voz iphone".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/118610;
// /guide/iphone/iphb8f1bf206/ios (Editar, Añadir widget, Editar widget, OK);
// /guide/iphone/iph92579feda/ios (acceso desde pantalla de bloqueo, Cuenta por omisión);
// /guide/notes/apdc28344070/mac y /guide/mac-help/mchl52be5da5/mac (widgets de Mac).
// Las páginas no confirman un widget de Notas bajo el reloj de la pantalla de bloqueo.
const ui = UI.es;
const FAQ = [
  {q:"¿Cómo añado el widget de Notas al iPhone?",a:["Mantén pulsado un espacio vacío de la pantalla de inicio, toca Editar y Añadir widget. Busca Notas, elige un tamaño, toca Añadir widget y luego OK. Para cambiar sus opciones, mantenlo pulsado y toca Editar widget."]},
  {q:"¿Hay un widget de Notas en la pantalla de bloqueo?",a:["Comprueba la galería de la pantalla de bloqueo: mantén pulsada la pantalla, toca Personalizar y Añadir widgets. Las guías de Apple citadas no confirman que Notas esté disponible allí. El ajuste para acceder a Notas desde la pantalla de bloqueo es otra función."]},
  {q:"¿En qué cuenta crea notas el widget?",a:["En la cuenta elegida en Ajustes, Apps, Notas, Cuenta por omisión. Apple dice que controla las notas creadas con Siri y el widget de Notas."]},
  {q:"¿Puedo añadir varios widgets de Notas en el Mac?",a:["Sí. Apple permite añadir varios para abrir distintas notas y carpetas, en el escritorio o en el centro de notificaciones."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="widget-notas-iphone"
  intro={<>En iPhone, mantén pulsada la pantalla de inicio, toca Editar y Añadir widget, y busca Notas. En Mac, haz clic con Control en el escritorio y abre la galería de widgets. La pantalla de bloqueo tiene otra galería.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"iPhone"},{href:"#bloqueo",label:"Bloqueo"},{href:"#mac",label:"Mac"},{href:"#problemas",label:"Problemas"}]}>
    <p>Añade Notas desde la galería de la pantalla de inicio del iPhone. En Mac hay widgets de nota y carpeta. Para la pantalla de bloqueo, revisa los widgets disponibles allí: las guías citadas no confirman que Notas aparezca bajo el reloj.</p>
    <PostCta slug="es/widget-notas-iphone" path="/es/blog/widget-notas-iphone" position="answer" ui={ui.cta} title="¿Quieres trabajar con IA dentro de la nota?"><p>Pinto Notes se parece a Notas en iPhone y Mac. Al conectar ChatGPT o Claude, pueden leer y editar tus apuntes. Pinto guarda versiones anteriores.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="iphone">Añadir el widget de Notas al iPhone</h2>
  <MenuPaths rows={[{on:"Pantalla de inicio",steps:["Mantener pulsado","Editar","Añadir widget","Notas"]}]} />
  <Steps><li>Ve a la página de la pantalla de inicio donde lo quieres.</li><li>Mantén pulsado el fondo hasta que las apps se muevan. Toca Editar y “Añadir widget”.</li><li>Busca Notas y recorre los tamaños y estilos disponibles.</li><li>Toca “Añadir widget”, colócalo y toca OK.</li></Steps>
  <p>Para cambiar su contenido, mantenlo pulsado y toca “Editar widget”. La <a href="https://support.apple.com/es-es/guide/iphone/iphb8f1bf206/ios">guía de widgets para iPhone</a> muestra las opciones, que pueden variar según el tamaño.</p>
  <h2 id="bloqueo">Notas y la pantalla de bloqueo</h2>
  <p>La pantalla de inicio y la de bloqueo muestran galerías distintas. Apple explica la <a href="https://support.apple.com/es-es/118610">ruta de la pantalla de bloqueo</a>:</p>
  <Steps><li>Mantén pulsada la pantalla de bloqueo y toca Personalizar.</li><li>Toca “Añadir widgets” y revisa los que aparecen.</li><li>Toca o arrastra uno para colocarlo. Si no cabe, quita otro primero.</li><li>Cierra la lista y toca OK.</li></Steps>
  <p>Estas instrucciones no confirman un widget de Notas en ese espacio. Si Notas no figura en la galería, añadirlo a la pantalla de inicio no lo pondrá bajo el reloj.</p>
  <p>Apple documenta aparte la opción para acceder a Notas desde la pantalla de bloqueo en Ajustes (Configuración en algunos países), Apps, Notas. Puedes crear siempre una nota nueva, reanudar la última o desactivar el acceso. Este ajuste no añade un widget. Consulta la <a href="https://support.apple.com/es-es/guide/iphone/iph92579feda/ios">guía de ajustes de Notas</a>.</p>
  <p>La visualización Hoy se abre al deslizar hacia la derecha desde la pantalla de bloqueo. Si no aparece con el iPhone bloqueado, revisa Ajustes, Face ID y código o Touch ID y código, y activa “Visualización Hoy y búsqueda” bajo las opciones de acceso bloqueado. La <a href="https://support.apple.com/es-es/guide/iphone/iphb8f1bf206/ios">guía de Apple</a> explica esta ruta.</p>
  <h2 id="mac">Añadir un widget de Notas al Mac</h2>
  <p>Apple ofrece widgets de <a href="https://support.apple.com/es-es/guide/notes/apdc28344070/mac">nota y carpeta</a> para el escritorio o el centro de notificaciones. Puedes añadir varios.</p>
  <Steps><li>Haz clic con Control en el fondo de escritorio y elige “Editar widgets”.</li><li>Busca Notas y elige un widget.</li><li>Haz clic para colocarlo automáticamente o arrástralo al sitio deseado.</li><li>Haz clic en Aceptar.</li></Steps>
  <p>En el centro de notificaciones, haz clic en la fecha y hora de la barra de menús y luego en “Editar widgets”. Haz clic con Control en un widget para cambiar el tamaño o editarlo, si se ofrece la opción. Apple describe los <a href="https://support.apple.com/es-es/guide/mac-help/mchl52be5da5/mac">controles de widgets del Mac</a>.</p>
  <h2 id="problemas">Si el widget no muestra lo esperado</h2>
  <p>Comprueba el ajuste relacionado con el problema. Apple no promete que uno de ellos repare todos los widgets vacíos o desactualizados.</p>
  <ul><li>Contenido equivocado: mantén pulsado el widget en iPhone y revisa “Editar widget”. En Mac, usa su opción de edición si aparece.</li><li>No aparecen sugerencias de Notas: revisa Ajustes, Apps, Notas y las opciones de búsqueda.</li><li>Las notas nuevas van a otra cuenta: revisa “Cuenta por omisión” en los ajustes de Notas. Afecta a Siri y al widget.</li><li>Los widgets del Mac están ocultos: en Ajustes del Sistema, Escritorio y Dock, Widgets, comprueba “Mostrar widgets” y “En el escritorio”.</li></ul>
  <p>Si la nota tampoco sale en la búsqueda de Notas, consulta <a href="/es/blog/buscar-en-notas-iphone-no-funciona">estas comprobaciones</a>. Para llegar a una nota más deprisa también puedes usar las <a href="/es/blog/trucos-notas-iphone">notas rápidas y las notas fijadas</a>.</p>
  <h2 id="pinto">Editar la nota con ChatGPT o Claude</h2>
  <p>Un widget permite abrir una nota. Con Pinto Notes, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">ChatGPT o Claude pueden leerla y editarla</a> después de conectarlos. Pinto conserva versiones anteriores. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus Notas de Apple</a> en el Mac sin alterarlas.</p>
</LocalPostPage>; }
