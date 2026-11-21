import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "biblioteca-prompts-chatgpt-notas");

// Traducción de /blog/chatgpt-prompt-library-in-notes, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "biblioteca de prompts chatgpt" dio esa frase y
// "biblioteca de prompts para chatgpt"; "biblioteca de prompts" también dio
// "biblioteca de prompts en español". Guías de Apple en español leídas el 21 Nov 2026:
// https://support.apple.com/es-es/guide/notes/apd558a85438/mac (Archivo > Nueva carpeta),
// https://support.apple.com/es-es/guide/notes/apdb54e469b6/mac (Archivo > Fijar nota),
// https://support.apple.com/es-es/guide/notes/not9474646a9/mac (Archivo > Duplicar nota),
// https://support.apple.com/es-es/guide/notes/not201900c07/mac (se puede pegar Markdown con formato).
// La guía no nombra el comando para pegar Markdown: se describe la acción sin inventar etiqueta.
// El diseño de ejemplo es editorial, no una plantilla instalada ni una prueba real de IA.

const ui = UI.es;
const TEMPLATE = `# Prompt: resumen semanal del proyecto

Estado: por probar
Última prueba: AAAA-MM-DD
Probado con: app y modelo utilizados

## Cuándo usarlo
Convierte apuntes sueltos del proyecto en una actualización para un compañero.

## Prompt reutilizable
Escribe un resumen semanal del proyecto para [DESTINATARIOS] usando solo [APUNTES].
Usa dos encabezados: Avances y Próximos pasos.
No superes 150 palabras. Escribe frases cortas.
Mantén los nombres y las fechas tal como se proporcionan. No inventes plazos.
Si falta un dato necesario para un resumen útil, pregunta antes de redactar.

## Ejemplo de entrada
Destinatarios: equipo de diseño
Apuntes: borrador de la página de inicio terminado. Revisión prevista para el martes.

## Ejemplo de resultado para comparar
Avances: el borrador de la página de inicio está terminado.
Próximos pasos: revisar el borrador el martes.

## Notas de la prueba
Comprueba que se mantiene el martes y no se añade ningún plazo.
Sustituye este ejemplo por un resultado que hayas comprobado.
`;
const RETRIEVE = `Busca en mis notas de Pinto Notes "Prompt: resumen semanal del proyecto" y lee la nota.
Muéstrame la sección Prompt reutilizable antes de usarla.
Pregúntame quiénes son los destinatarios y qué apuntes tengo esta semana. No cambies el prompt guardado.`;
const FAQ = [
  { q: "¿Cómo creo una biblioteca de prompts en Notas de Apple?", a: ["Crea una carpeta Prompts y guarda un prompt por nota. Incluye para qué sirve, el texto que vas a copiar y un resultado que hayas revisado. Busca el nombre de la tarea cuando lo necesites."] },
  { q: "¿Qué conviene guardar junto al prompt?", a: ["Guarda una entrada de ejemplo, un resultado útil, la fecha y el modelo de la prueba. Anota qué cambiaste si el resultado falló. Mantén separadas las instrucciones reutilizables de los datos de cada uso."] },
  { q: "¿Puede ChatGPT recuperar un prompt de Pinto Notes?", a: ["Sí, después de conectar Pinto Notes y elegir Allow. ChatGPT puede buscar y leer la nota. Pídele que muestre las instrucciones guardadas antes de darle los nuevos datos. Allow también le permite editar."] },
  { q: "¿Esta biblioteca rellena variables automáticamente?", a: ["No. Las palabras entre corchetes son recordatorios. Sustitúyelas al copiar el texto a ChatGPT o pide a ChatGPT conectado que te pregunte por los datos que faltan. Es una nota normal que creas tú."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="biblioteca-prompts-chatgpt-notas"
    intro={<>Guarda cada prompt reutilizable de ChatGPT en su propia nota, con el nombre de la tarea y un resultado de ejemplo. En Notas de Apple puedes copiarlos a mano. Si conectas Pinto Notes, ChatGPT puede buscar y leer el prompt que le pidas.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "Copiar la plantilla" }, { href: "#organizar", label: "Organizar los prompts" },
      { href: "#probar", label: "Probar un cambio" }, { href: "#pinto", label: "Recuperar con ChatGPT" },
    ]}>
      <p>Crea una carpeta Prompts y guarda una tarea por nota. Separa las instrucciones reutilizables de los datos de cada uso y añade un ejemplo comprobado. Cuando lo necesites, copia las instrucciones a ChatGPT y proporciona los datos nuevos.</p>
      <PostCta slug="es/biblioteca-prompts-chatgpt-notas" path="/es/blog/biblioteca-prompts-chatgpt-notas" position="answer" ui={ui.cta} title="Pide a ChatGPT que encuentre tu prompt"><p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Una vez conectado, ChatGPT puede buscar una nota con un prompt y leer sus instrucciones cuando se lo pidas.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="plantilla">Una nota con un prompt para copiar</h2>
    <p>Esta estructura deja las instrucciones por encima del ejemplo para que copies solo lo necesario. Cambia la tarea y conserva las secciones para el siguiente prompt.</p>
    <Keep title="Nota para la biblioteca de prompts" text={TEMPLATE} copyLabel={ui.copy} note="En Notas para Mac puedes pegar Markdown con formato para conservar el título y los encabezados. Si pegas texto sin formato, verás los símbolos Markdown." />
    <p>Sustituye <code>[DESTINATARIOS]</code> y <code>[APUNTES]</code> en el texto que envíes a ChatGPT. Déjalos en la nota original como recordatorio. Copia solo la sección Prompt reutilizable con los datos de esa ocasión.</p>
    <h2 id="organizar">Encuentra los prompts por tarea</h2>
    <p>En Notas para Mac, elige Archivo &gt; Nueva carpeta y llámala Prompts. Pon a cada nota un nombre de tarea, como «Prompt: resumen semanal del proyecto» o «Prompt: explicar un cambio de código». La búsqueda encuentra palabras dentro de la nota. Incluye las que recordarás.</p>
    <p>Para fijar un prompt que usas a menudo, elige Archivo &gt; Fijar nota. Apple permite fijar notas actualizadas de iCloud o guardadas en el Mac. Una nota por tarea mantiene cada prueba con sus instrucciones. La <a href="/blog/apple-notes-templates" hrefLang="en">guía de plantillas para Notas</a> explica cómo reutilizar una nota base.</p>
    <p>En un Mac, elige Archivo &gt; Duplicar nota para crear otro prompt a partir de esa base. Cambia el nombre y quita los ejemplos anteriores. Usa estados sencillos, como «Por probar» y «Probado».</p>
    <h2 id="probar">Guarda una prueba que puedas comparar</h2>
    <p>La <a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt">guía de OpenAI</a> recomienda dar instrucciones concretas y contexto, revisar la respuesta y ajustar el prompt. Tu nota sirve para guardar esas pruebas.</p>
    <ol>
      <li>Ejecuta el prompt reutilizable con una entrada breve.</li>
      <li>Compara el resultado con la entrada. En el resumen semanal, comprueba que el martes sigue siendo martes y no aparece un plazo nuevo.</li>
      <li>Si falla, cambia una instrucción y repite la misma prueba.</li>
      <li>Guarda el resultado útil, el cambio, la fecha y el modelo.</li>
    </ol>
    <p>Prueba otra entrada antes de marcar el prompt como probado. Un resumen sin fecha de revisión sirve para comprobar que no la inventa. Un resultado guardado ayuda a comparar; no garantiza la próxima respuesta.</p>
    <h2 id="limites">Qué hace esta biblioteca</h2>
    <p>En Notas de Apple, buscas la nota y copias las instrucciones tú. Las palabras entre corchetes son texto normal. Complétalas para cada uso y revisa la respuesta. Guardar un prompt no programa su ejecución ni lo inserta en el navegador.</p>
    <h2 id="pinto">Recupera un prompt con ChatGPT</h2>
    <p>Usa la misma estructura en una nota de Pinto Notes para iPhone y Mac. Sigue la <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">guía para conectar ChatGPT</a> y elige Allow. Ese permiso le deja leer y editar tus notas.</p>
    <Keep title="Pide un prompt guardado" text={RETRIEVE} copyLabel={ui.copy} note="Conecta Pinto Notes primero. Esta petición recupera las instrucciones y solicita datos nuevos." />
    <p>Comprueba que ChatGPT encontró la nota correcta antes de darle los detalles de esta semana. Si apruebas un prompt mejorado, pídele que guarde las instrucciones nuevas y el ejemplo revisado en esa nota. Pinto conserva las versiones anteriores.</p>
    <p>Esta biblioteca vive en notas que mantienes tú. Tú decides cuándo recuperar un prompt y qué versión conservar. Si ya está en Notas de Apple, puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importarla desde un Mac</a> sin cambiar los originales.</p>
  </LocalPostPage>;
}
