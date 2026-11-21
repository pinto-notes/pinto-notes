import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-simplenote-iphone-mac");

// Traducción de /blog/simplenote-alternative-for-iphone-and-mac, 21 Nov 2026.
// Autocomplete de Google, client=firefox, hl=es, gl=es: "alternativa a simplenote" y
// "alternativas a simplenote" no devolvieron sugerencias. Título descriptivo, sin inferir demanda.
// El original no da pasos de Notas de Apple. Los menús de Simplenote y Pinto son los del original;
// los hechos proceden de sus fuentes allí citadas. No se probó una migración nueva.

const ui = UI.es;
const CHECK = `Comprobación del traslado desde Simplenote

- Conserva el ZIP original como copia de seguridad.
- Abre los archivos de texto exportados y revisa una nota larga.
- Importa primero una carpeta pequeña en Pinto Notes desde un Mac.
- Compara todo el texto y el formato Markdown.
- Mira si necesitas reorganizar las antiguas etiquetas.
- Abre las notas importadas en el iPhone.
- Conserva Simplenote hasta terminar las comprobaciones.
`;
const FAQ = [
  { q: "¿Hay una alternativa gratuita a Simplenote para iPhone y Mac?", a: ["Pinto Notes es gratuita para iPhone y Mac. Se parece a Notas de Apple, importa carpetas de archivos de texto o Markdown desde un Mac y permite que ChatGPT o Claude lean y editen notas una vez conectados."] },
  { q: "¿Por qué no puedo exportar desde Simplenote de la Mac App Store?", a: ["Según la ayuda de Simplenote, esa versión no admite exportación. Usa Settings, Tools, Export Notes en la app web, o File, Export Notes en la app de escritorio Electron."] },
  { q: "¿Se trasladan las etiquetas y versiones anteriores?", a: ["Esta guía importa archivos de texto. No promete reconstruir la organización por etiquetas ni el historial de Simplenote. Guarda la copia original y revisa las notas importadas. Pinto conserva las versiones que crees allí."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="alternativa-simplenote-iphone-mac"
    intro={<>Pinto Notes es una alternativa a Simplenote para iPhone y Mac si quieres una app parecida a Notas de Apple con acceso para tu IA. Exporta desde Simplenote e importa los archivos de texto en Pinto desde el Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#elegir", label: "Decidir si cambiar" }, { href: "#exportar", label: "Exportar" },
      { href: "#importar", label: "Importar en Pinto" }, { href: "#comprobar", label: "Comprobar el traslado" },
    ]}>
      <p>Elige Pinto Notes si usas iPhone y Mac y quieres conectar ChatGPT o Claude para que lean y editen tus notas. Simplenote también funciona en Windows, Linux, Android y la web. Este traslado utiliza archivos de texto y no recupera el historial de versiones anterior.</p>
      <PostCta slug="es/alternativa-simplenote-iphone-mac" path="/es/blog/alternativa-simplenote-iphone-mac" position="answer" ui={ui.cta} title="Trae tus notas de texto a Pinto Notes"><p>Importa tus archivos de texto en un Mac. Después, conecta ChatGPT o Claude si quieres trabajar con esas notas.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menú File de Pinto Notes en un Mac, con Import Markdown or Text entre las opciones." caption="Elige Import Markdown or Text para los archivos de texto exportados. Captura: Pinto Notes." />}
    faq={FAQ}>
    <h2 id="elegir">Qué quieres cambiar de Simplenote</h2>
    <p>Simplenote tiene etiquetas, búsqueda, Markdown, notas compartidas, publicación web y versiones anteriores. Si ya te sirve para escribir, no hace falta cambiar. Consulta su <a href="https://simplenote.com/">descripción oficial</a>.</p>
    <p>Pinto Notes puede servirte si quieres una app parecida a Notas de Apple y acceso de una IA a tus notas. Puedes seguir escribiendo tú y conectarla solo cuando tengas una tarea, como leer la nota de un proyecto y añadir una decisión.</p>
    <p>Pinto Notes solo funciona en iPhone y Mac; no tiene app para Windows o Android ni versión web. Simplenote permite editar sin conexión después de iniciar sesión y descargar las notas.</p>
    <h2 id="exportar">Exporta desde Simplenote en el navegador</h2>
    <ol>
      <li>Inicia sesión en la <a href="https://app.simplenote.com/">app web de Simplenote</a>.</li>
      <li>Abre el menú superior izquierdo y entra en Settings.</li>
      <li>Elige Tools y después Export Notes. Guarda el ZIP.</li>
    </ol>
    <p>También puedes usar File, Export Notes en la app de escritorio Electron. La versión de la Mac App Store no admite exportación, según la <a href="https://simplenote.com/help/#export">ayuda oficial</a>. Si no ves el comando en tu Mac, usa el navegador.</p>
    <p>La <a href="https://github.com/Automattic/simplenote-electron/blob/trunk/lib/utils/export/README.md">documentación de la exportación</a> describe un ZIP con un archivo por nota. El código crea archivos de texto y una copia JSON. Conserva el ZIP intacto y descomprime una copia para revisar los textos.</p>
    <h2 id="importar">Importa los archivos de texto en un Mac</h2>
    <p>En Pinto Notes, abre File y elige Import Markdown or Text. Puedes importar una carpeta o un ZIP de archivos Markdown o de texto; cada carpeta se convierte en una carpeta. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> explica esta vía. Simplenote no cambia.</p>
    <p>Empieza copiando unos pocos archivos a una carpeta aparte. Incluye una nota larga y otra con Markdown si lo usas. Compara las copias importadas con las originales antes de traer el resto. Usa los archivos de texto individuales; el importador de Pinto no trata el JSON como notas.</p>
    <p>Es una importación de archivos, sin conectar la cuenta de Simplenote. Su exportación añade los nombres de las etiquetas al texto, pero no se promete que se conviertan en etiquetas de Pinto ni que se trasladen las versiones anteriores.</p>
    <h2 id="comprobar">Comprueba el resultado antes de dejar Simplenote</h2>
    <Keep title="Lista para revisar el traslado" text={CHECK} copyLabel={ui.copy} note="Guárdala junto a la exportación para anotar lo que hayas comprobado." />
    <p>Abre una nota importada en el Mac y el iPhone. Comprueba todo el texto, sobre todo después de una lista larga o un bloque de código. Revisa los enlaces que utilices. Que el título se lea bien no basta para dar por buena la nota.</p>
    <h2 id="pinto">Trabaja con las notas importadas usando tu IA</h2>
    <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leer y editar tus notas en Pinto. Pídeles que lean una nota de proyecto importada, enumeren las preguntas pendientes y añadan una decisión. Comprueba el cambio con la nota original.</p>
    <p>Pinto conserva las versiones anteriores de los cambios que hagas allí. No importa el historial de Simplenote con los archivos de texto. La <a href="/blog/apple-notes-version-history" hrefLang="en">guía del historial de versiones</a> explica cómo recuperar texto anterior.</p>
  </LocalPostPage>;
}
