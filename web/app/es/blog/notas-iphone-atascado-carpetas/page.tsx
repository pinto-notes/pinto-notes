import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-iphone-atascado-carpetas");

// Versión de /blog/apple-notes-stuck-on-folders. Búsqueda local, 21 Nov 2026:
// "notas iphone se queda en carpetas", "notas iphone atascado en carpetas" y
// "notas iphone se queda cargando" se buscaron en español. Autocomplete hl=es,
// gl=es no devolvió sugerencias; "atascado en Carpetas" describe la pantalla.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/121669 (Sincronizar este
// iPhone y reiniciar), /es-es/118446 (estado del servicio, cuenta, conexión, datos),
// apple.com/es/support/systemstatus/ (Estado del sistema), /es-es/guide/icloud/
// -mm8685520792/icloud (Todas las de iCloud, Ver todo/Mostrar todo, Sincronizar
// este iPhone/Mac y acceso web), /es-es/118575 y /108382 (actualizaciones),
// /es-es/121115 (preparación de Apple Intelligence e idioma de Siri).
// Ninguna página da un diagnóstico específico de la pantalla Carpetas o un plazo
// de sincronización. Captura inglesa de un aviso de iCloud, no del bloqueo.
const ui = UI.es;
const FAQ = [
  { q: "¿Qué compruebo si Notas no sale de la pantalla Carpetas?", a: ["Si faltan notas de iCloud, mira Estado del sistema de Apple, la Cuenta de Apple y el ajuste de Notas en iCloud. Apple aconseja reiniciar el iPhone y volver a comprobar el ajuste si las notas siguen sin aparecer. Si la pantalla no responde, sigue los pasos generales para apps bloqueadas."] },
  { q: "¿Preparando en Apple Intelligence significa que Notas se sincroniza?", a: ["Ese mensaje se refiere a la configuración de Apple Intelligence. Apple explica que un cambio de idioma de Siri puede dejarla inactiva hasta que se descargue el idioma y coincida con el del dispositivo. No confirma que una nota haya llegado a iCloud."] },
  { q: "¿Cuánto puede tardar Notas en sincronizarse?", a: ["Las páginas de Apple enlazadas aquí no dan un plazo. Una subida lenta, por sí sola, no identifica la causa. Comprueba el estado de iCloud, la conexión, la Cuenta de Apple y que Notas esté activado en cada dispositivo."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="notas-iphone-atascado-carpetas"
    intro={<>Si Notas se queda en Carpetas y no carga las notas, comprueba iCloud y el ajuste de sincronización. Si la pantalla no responde a los toques, sigue los pasos para una app bloqueada.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#carpetas", label: "Carpetas no abre" }, { href: "#icloud", label: "Comprobaciones de iCloud" },
      { href: "#guardando", label: "Guardando" }, { href: "#preparando", label: "Preparando" },
    ]}>
      <p>Consulta Estado del sistema de Apple. Comprueba que cada dispositivo use la misma Cuenta de Apple y que Notas esté activado en iCloud. Revisa la conexión y las actualizaciones. Apple recomienda estas comprobaciones generales, pero no documenta una solución específica para Notas atascado en Carpetas.</p>
      <PostCta slug="es/notas-iphone-atascado-carpetas" path="/es/blog/notas-iphone-atascado-carpetas" position="answer" ui={ui.cta} title="Prueba tus notas en Pinto Notes"><p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas desde tu Mac</a> (guía en inglés) sin cambiar las originales. Esto no arregla Notas de Apple.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560} alt="Notas en macOS 27 muestra en inglés un aviso para activar iCloud, con botones de ajustes y cancelación." caption="Este aviso aparece cuando iCloud está desactivado para Notas. Es distinto de una pantalla Carpetas que no responde." />}
    faq={FAQ}>
      <h2 id="carpetas">Si no puedes abrir una carpeta</h2>
      <p>Prueba Todas las de iCloud o una carpeta bajo iCloud. Según la <a href="https://support.apple.com/es-es/guide/icloud/-mm8685520792/icloud">guía de configuración de Apple</a>, ahí aparecen las notas de iCloud. Si las carpetas se abren pero no muestran notas, sigue con las comprobaciones de abajo.</p>
      <p>Si Notas no responde, consulta <a href="/es/blog/notas-iphone-no-funciona">qué hacer cuando Notas no funciona</a>: cierra y abre la app, reinicia y actualiza. Una pantalla bloqueada no dice si los últimos cambios se han subido.</p>
      <h2 id="icloud">Comprueba iCloud antes de cambiar otros ajustes</h2>
      <Steps>
        <li id="estado"><strong>Consulta el estado del servicio.</strong> Abre <a href="https://www.apple.com/es/support/systemstatus/">Estado del sistema de Apple</a> y busca Notas de iCloud. Si Apple indica una incidencia, sigue su estado antes de cambiar ajustes.</li>
        <li id="cuenta"><strong>Comprueba la Cuenta de Apple.</strong> Los dispositivos deben tener iniciada la misma cuenta. Puedes verla arriba en Ajustes del iPhone o Ajustes del Sistema del Mac.</li>
        <li id="activar"><strong>Comprueba que Notas esté activado en iCloud.</strong> Activa Sincronizar este iPhone o Sincronizar este Mac si estaba desactivado. Si las notas aún no aparecen en el iPhone, Apple pide reiniciarlo y revisar el ajuste otra vez.
          <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "Tu nombre", "iCloud", "Ver todo o Mostrar todo", "Notas", "Sincronizar este iPhone"] }, { on: "Mac, macOS 15 o posterior", steps: ["Ajustes del Sistema", "Tu nombre", "iCloud", "Notas", "Sincronizar este Mac"] }]} />
        </li>
        <li id="conexion"><strong>Comprueba la conexión.</strong> Apple pide una conexión estable. Si el iPhone no usa Wi-Fi, comprueba que los datos móviles estén activados en Ajustes. Si están desactivados, iCloud puede no estar disponible por esa vía.</li>
        <li id="actualizaciones"><strong>Busca actualizaciones.</strong> Apple incluye iOS y macOS en sus comprobaciones de iCloud. Haz una copia de seguridad antes de actualizar.
          <Paths rows={[{ on: "iPhone", steps: ["Ajustes", "General", "Actualización de software"] }, { on: "Mac", steps: ["Menú Apple", "Ajustes del Sistema", "General", "Actualización de software"] }]} />
        </li>
      </Steps>
      <p>Estas comprobaciones vienen de las guías de Apple sobre <a href="https://support.apple.com/es-es/118446">conexión a iCloud</a>, <a href="https://support.apple.com/es-es/121669">notas que faltan</a> y <a href="https://support.apple.com/es-es/guide/icloud/-mm8685520792/icloud">configuración de Notas</a>. Las rutas para actualizar figuran en sus guías de <a href="https://support.apple.com/es-es/118575">iPhone</a> y <a href="https://support.apple.com/es-es/108382">Mac</a>.</p>
      <h2 id="guardando">Si aparece Guardando o tarda en sincronizar</h2>
      <p>Abre <a href="https://www.icloud.com/notes">Notas en iCloud.com</a> con la misma Cuenta de Apple. Busca la nota y el último cambio. Si solo ves una versión anterior, sabes que llegó ese contenido antiguo, no el nuevo. Conserva una copia aparte del texto reciente que aún puedas leer.</p>
      <p>Las páginas de Apple enlazadas aquí no dan un plazo de sincronización ni una solución específica para el mensaje Guardando. Para revisar almacenamiento y notas presentes en un solo dispositivo, consulta <a href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza entre iPhone y Mac</a>.</p>
      <h2 id="preparando">Mira dónde aparece Preparando</h2>
      <p>Si el mensaje está en los ajustes de Apple Intelligence, consulta la <a href="https://support.apple.com/es-es/121115">guía de configuración de Apple</a>. Después de cambiar el idioma de Siri, Apple Intelligence puede no estar disponible hasta que termine de descargarse el idioma y coincida con el del dispositivo. Eso no indica si una nota se subió.</p>
      <p>Si Preparando aparece dentro de Notas al trabajar con un escaneo o un PDF, esa guía no explica la causa. Anota el mensaje exacto y lo que estabas haciendo. Si las comprobaciones no ayudan, comparte esos datos con el <a href="https://getsupport.apple.com/">Soporte de Apple</a>.</p>
    </LocalPostPage>;
}
