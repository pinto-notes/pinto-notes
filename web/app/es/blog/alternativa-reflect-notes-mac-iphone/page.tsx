import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-reflect-notes-mac-iphone");
// Spanish version of /blog/reflect-notes-alternative-for-mac-and-iphone, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "alternativa a reflect notes" returned []; "alternativa reflect"
// returned Macrium Reflect results, unrelated to this app. No app-specific volume inferred.
// https://reflect.academy/moving-to-reflect-open and https://reflect.academy/import-export-backups read 21 Nov 2026.
// Reflect's export labels remain in English as on its own guide. No Apple menu steps or picture.
const ui = UI.es;
const CHECK = `Prueba de importación desde Reflect
- [ ] Leer una nota larga de principio a fin junto al original
- [ ] Revisar una nota diaria y su fecha
- [ ] Seguir un enlace a otra nota importada
- [ ] Comprobar si los enlaces entrantes siguen sirviendo para encontrar notas
- [ ] Comparar etiquetas y ubicación de las notas
- [ ] Revisar una tabla y una lista de comprobación
- [ ] Abrir cada imagen y adjunto de la muestra
- [ ] Abrir las copias importadas en iPhone
- [ ] Conservar el ZIP original y el acceso a Reflect`;
const FAQ = [
  { q: "¿Hay un plazo para dejar Reflect Classic?", a: ["No. La guía de Reflect consultada el 21 de noviembre de 2026 dice que no hay plazo para pasar a Reflect Open. Puedes comparar las opciones con calma."] },
  { q: "¿Tiene Pinto un importador específico de Reflect?", a: ["No. Prueba la exportación Markdown zip de Reflect Classic con el importador general de Markdown y texto de Pinto en el Mac. Esta vía no se ha probado aquí con una exportación nueva."] },
  { q: "¿Funcionarán igual las notas diarias y los enlaces entrantes?", a: ["No está comprobado. Importa una nota diaria y dos notas enlazadas. Compara fecha, navegación, etiquetas y texto con Reflect antes de trasladar el resto."] },
];
export default function Page() { return <LocalPostPage lang="es" slug="alternativa-reflect-notes-mac-iphone"
  intro={<>Pinto Notes es una alternativa gratuita a Reflect Notes para Mac y iPhone si prefieres editar como en Notas de Apple y conectar ChatGPT o Claude. Reflect Open también es una opción. Según Reflect, no hay plazo para dejar Classic.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#seguir",label:"Cuándo seguir en Reflect"},{href:"#exportar",label:"Exportar desde Classic"},{href:"#importar",label:"Probar Pinto"},{href:"#comprobar",label:"Revisar las notas"},{href:"#ia",label:"Usar tu IA"}]}>
    <p>Pinto permite que ChatGPT o Claude lean y editen tus notas después de conectarlos. Reflect Open mantiene un flujo de trabajo de Reflect con archivos Markdown en una carpeta tuya. Para probar Pinto desde Classic, exporta Markdown y comprueba una muestra antes de mover la biblioteca.</p>
    <PostCta slug="es/alternativa-reflect-notes-mac-iphone" path="/es/blog/alternativa-reflect-notes-mac-iphone" position="answer" ui={ui.cta} title="Prueba tus notas de Reflect en Pinto"><p>Descarga Pinto Notes gratis en el Mac. Importa unas pocas notas Markdown, compáralas y conecta ChatGPT o Claude si quieres acceso con IA.</p></PostCta>
  </Answer>} hero={<></>} faq={FAQ}>
  <h2 id="seguir">Cuándo conviene seguir en Reflect</h2>
  <p>Si las notas diarias y los enlaces entrantes son básicos para ti, pruébalos antes de cambiar. La <a href="https://reflect.academy/moving-to-reflect-open">guía de Reflect Open</a> describe otra app, de código abierto, con archivos Markdown en una carpeta propia. Su importación específica incluye notas diarias, enlaces y etiquetas, pero excluye el historial. Puedes seguir en Classic mientras decides.</p>
  <p>Pinto tiene un editor parecido a Notas de Apple y acceso a ChatGPT o Claude mediante una conexión. Solo funciona en Mac y iPhone. No tiene app para Windows o Android ni versión web.</p>
  <h2 id="exportar">Exporta Markdown desde Reflect Classic</h2>
  <p>La <a href="https://reflect.academy/import-export-backups">guía de Reflect</a> incluye Markdown zip entre los formatos de exportación. La exportación para Reflect Open está destinada a esa app; para esta prueba usa el formato Markdown general.</p>
  <Steps><li>En Reflect Classic, abre las preferencias del Graph con Comando y coma y selecciona el gráfico en la barra lateral.</li><li>Elige Markdown zip y haz clic en Export Reflect.</li><li>Guarda el ZIP original y haz otra copia para la prueba.</li></Steps>
  <p>Extrae la copia y elige una nota diaria, una nota larga, dos notas enlazadas y algún adjunto. Conserva las carpetas relativas y los archivos relacionados. Si ya usas Reflect Open, copia una muestra de su carpeta Markdown sin alterar el gráfico de trabajo.</p>
  <h2 id="importar">Usa la importación general de Pinto en el Mac</h2>
  <p>Abre File en Pinto y elige Import Markdown or Text. Selecciona la carpeta de prueba. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> admite una carpeta o ZIP con Markdown o texto; cada carpeta se convierte en una carpeta. No hay importador específico de Reflect ni garantía de que se reproduzcan su organización y navegación. Esta vía no se ha probado con una exportación nueva.</p>
  <h2 id="comprobar">Revisa lo que usas a diario</h2>
  <p>Lee una nota completa junto al original. Sigue los enlaces, abre adjuntos y comprueba cómo encuentras una nota diaria por su fecha.</p>
  <Keep title="Comprobaciones para la prueba con Reflect" text={CHECK} copyLabel={ui.copy} note="Úsala con la muestra antes de importar el resto de la biblioteca." />
  <p>Comprueba etiquetas y enlaces entrantes aparte de los enlaces normales. Que aparezca una palabra de etiqueta no demuestra que puedas navegar por ella igual. La conservación del historial de Reflect no está verificada: mantén acceso a Reflect y al ZIP. Si la muestra funciona, prueba un lote mayor y repite la revisión.</p>
  <h2 id="ia">Trabaja con ChatGPT o Claude en las copias</h2>
  <p><a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conecta ChatGPT o Claude</a> a Pinto y pulsa Allow. Concede acceso para leer y editar. Pide un resumen en el chat de una nota importada que ya hayas comprobado. Si es correcto, dicta una siguiente acción y revisa la nota editada.</p>
  <p>Pinto conserva las versiones anteriores creadas allí, pero no recrea el historial de Reflect. Guarda la app de origen y la exportación hasta que hayas revisado las notas que necesitas.</p>
</LocalPostPage>; }
