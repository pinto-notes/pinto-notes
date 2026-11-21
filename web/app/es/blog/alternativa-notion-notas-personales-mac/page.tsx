import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-notion-notas-personales-mac");

// Traducción de /blog/notion-alternative-for-personal-notes-on-mac, 21 Nov 2026.
// Autocomplete de Google, client=firefox, hl=es, gl=es: "alternativa a notion para notas"
// no dio sugerencias; "alternativas a notion" dio esa frase, "alternativas a notion gratis",
// "alternativas a notion open source" y "alternativas a notion sin ia". Apple: el original
// no indica pasos de sus menús. Datos sobre Notion y Pinto tomados del original inglés.

const ui = UI.es;
const FAQ = [
  { q: "¿Sirve Pinto Notes para mis notas personales de Notion?", a: ["Sí, si escribes notas personales en Mac y iPhone. Pinto tiene carpetas, listas de comprobación y tablas, y permite a ChatGPT o Claude leer y editar las notas al conectarlos. Prueba primero una exportación Markdown pequeña. Conserva en Notion el trabajo que dependa de bases de datos."] },
  { q: "¿Pinto Notes tiene una opción para importar desde Notion?", a: ["No aparece en su lista de orígenes. En un Mac, usa File, Import Markdown or Text con una carpeta o un ZIP de archivos Markdown o de texto. Exporta antes las páginas desde Notion."] },
  { q: "¿Se conservan las vistas de las bases de datos?", a: ["No esperes que Markdown reproduzca el espacio de trabajo. Notion exporta páginas como Markdown y bases de datos de página completa como CSV. Su guía indica que no se pueden exportar todas las vistas a la vez."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="alternativa-notion-notas-personales-mac"
    intro={<>Notas de Apple puede sustituir a Notion para apuntes personales en Mac. Pinto Notes ofrece un editor parecido y permite que ChatGPT o Claude lean y editen tus notas cuando los conectas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#personales", label: "Qué mover" }, { href: "#apple", label: "Notas de Apple" },
      { href: "#pinto", label: "Pinto Notes" }, { href: "#exportar", label: "Exportar desde Notion" },
      { href: "#probar", label: "Probar unas páginas" },
    ]}>
      <p>Para un cuaderno personal en Mac, prueba Notas de Apple: listas de comprobación, tablas y búsqueda. Pinto Notes añade acceso para una IA conectada y guarda las versiones anteriores. Si tu trabajo depende de propiedades y vistas de bases de datos, mantenlo en Notion.</p>
      <PostCta slug="es/alternativa-notion-notas-personales-mac" path="/es/blog/alternativa-notion-notas-personales-mac" position="answer" ui={ui.cta} title="Prueba tus apuntes en Pinto Notes"><p>Trae una pequeña carpeta Markdown a Pinto Notes desde el Mac. Después, conecta ChatGPT o Claude para que puedan leer y editar esas notas.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="personales">Separa las notas personales de las bases de datos</h2>
    <p>Empieza por las páginas que abres para leer o escribir. Un diario, un borrador o una lista para un viaje pueden funcionar como notas en carpetas. Prueba esas páginas sin mover todo el espacio de trabajo.</p>
    <p>Las bases de datos de Notion hacen más que guardar texto. Cada elemento es una página con propiedades, filtros, ordenaciones y distintas vistas. Una lista de lecturas por estado o un calendario puede seguir siendo útil aunque trabajes por tu cuenta. Su <a href="https://www.notion.com/help/intro-to-databases">guía de bases de datos</a> explica esas funciones.</p>
    <h2 id="apple">Prueba Notas de Apple para un cuaderno sencillo</h2>
    <p>Notas de Apple admite listas de comprobación, tablas, notas fijadas y etiquetas. Las carpetas inteligentes agrupan notas por reglas; la búsqueda encuentra palabras dentro de ellas. Escribe primero unas notas nuevas para ver si te gusta.</p>
    <p>Una tabla de Notas de Apple no ordena ni suma sus celdas como una base de datos. Si necesitas eso, comprueba las diferencias en <a href="/es/blog/notas-apple-vs-notion">Notas de Apple frente a Notion</a>.</p>
    <h2 id="pinto">Pinto Notes y el acceso de tu IA</h2>
    <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Tiene carpetas, listas de comprobación y tablas. Sus notas son archivos Markdown que se muestran con formato. Si usas comandos de barra, escribe <code>/</code> al principio de una línea y elige un encabezado, una lista o una tabla.</p>
    <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leer y editar tus notas. Por ejemplo, puedes pedirles que conviertan una lista de equipaje en una lista de comprobación y seguir editándola tú después. Pinto conserva todas las versiones anteriores.</p>
    <p>Notion también permite conexiones con IA. Su <a href="https://www.notion.com/help/notion-mcp">conexión MCP oficial</a> permite a ChatGPT y Claude leer y escribir páginas. Si solo quieres esa función, pruébala antes de cambiar de app.</p>
    <p>Pinto Notes se descarga gratis en Mac y también funciona en iPhone. No hay app para Windows o Android ni versión web.</p>
    <h2 id="exportar">Exporta páginas personales desde Notion</h2>
    <p>En un Mac, abre una página de Notion que quieras probar y sigue su <a href="https://www.notion.com/help/export-your-content">guía de exportación</a>:</p>
    <ol>
      <li>Abre el menú de los tres puntos de la página y elige Export.</li>
      <li>Elige Markdown &amp; CSV.</li>
      <li>Activa Include subpages si quieres incluir las páginas anidadas.</li>
      <li>Exporta y conserva el ZIP descargado.</li>
    </ol>
    <p>Notion exporta las páginas normales como Markdown, las bases de datos de página completa como CSV y los bloques de llamada como HTML. Abre el archivo descargado antes de importarlo.</p>
    <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menú File de Pinto Notes en un Mac, con Import Markdown or Text entre las opciones." caption="Import Markdown or Text sirve para los archivos exportados. Captura: Pinto Notes." />
    <p>En Pinto Notes, elige File, Import Markdown or Text. Acepta una carpeta o un ZIP de archivos Markdown o de texto; cada carpeta se convierte en una carpeta. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> explica esta opción. No aparece Import from Notion entre los orígenes.</p>
    <h2 id="probar">Comprueba unas páginas antes de mover el resto</h2>
    <p>Elige notas representativas, incluida alguna con imagen o adjunto si los usas. Compáralas con los originales y comprueba los bloques de Notion que necesites.</p>
    <ul>
      <li>Revisa si están todas las notas esperadas y en carpetas útiles.</li>
      <li>Abre imágenes y adjuntos, y sigue enlaces entre páginas.</li>
      <li>Lee una lista y una tabla, incluido el texto que viene después.</li>
      <li>Escribe una nota nueva y busca una antigua.</li>
    </ul>
    <p>Usa la nueva app para tus próximos apuntes personales. Conserva las páginas y el ZIP originales mientras decides. Puedes dejar en Notion las bases de datos que aún uses.</p>
    <h2 id="limites">Cuándo conviene seguir en Notion</h2>
    <p>Si tu problema es trabajar sin conexión, prueba primero la opción de Notion. En su app de escritorio o móvil, abre el menú de tres puntos de una página y activa Available offline. Según su <a href="https://www.notion.com/help/guides/working-offline-in-notion-everything-you-need-to-know">guía</a>, se configura por página y por dispositivo.</p>
    <p>Si usas propiedades y vistas todos los días, conserva ese trabajo allí. Prueba a mover solo el cuaderno personal y decide sobre el resto después de usarlo.</p>
  </LocalPostPage>;
}
