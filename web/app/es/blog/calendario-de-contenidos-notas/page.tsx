import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "calendario-de-contenidos-notas");

// Spanish version of /blog/apple-notes-content-calendar (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "calendario de contenidos" gives "para redes sociales", plantilla, excel, notion
// and "para redes sociales plantilla"; "plantilla calendario de contenidos" gives "para redes sociales", google sheets,
// excel and gratis; "calendario editorial" gives redes sociales, ejemplo and plantilla. So the slug and title use
// "calendario de contenidos", and the text says redes sociales and calendario editorial once. Apple's own Spanish words,
// read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac":
// Formato > Tabla, botón Tabla, Tabulador in the last cell adds a row), /es-es/guide/notes/apde615d29c2/mac ("Añadir
// enlaces": Edición > Añadir enlace, Comando + K), /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas),
// /es-es/guide/notes/apd58edc7964/mac ("Utilizar carpetas inteligentes": the Etiquetas filter), and the Notes app's own
// Spanish strings on macOS 27.2 (MainMenu.loctable, Localizable.loctable: Edición, Pegar en formato Markdown and Pegar
// como Markdown in es_419, Formato, Tabla, Añadir enlace and Agregar enlace in es_419, Archivo, Duplicar nota, Fijar
// nota and Anclar nota in es_419). Cuenta de Apple for sharing is cited as in the meeting notes translation
// (/es-es/102462). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the
// app's own string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const SKELETON = `# Calendario de contenidos

## Calendario
Pega la tabla aquí.

## Ideas
- Tres herramientas que uso cada día
- Un día en atención al cliente, en cifras
- Lo que dejamos de hacer este año

## Tono
- Frases cortas. Una idea por publicación.
- Enseña el trabajo: una captura o una cifra vale más que un adjetivo.
- Termina con una pregunta, no con una venta.
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Fecha\tTítulo\tCanal\tEstado
2026-11-03\tCinco preguntas para cada cliente nuevo\tBlog\tPublicado
2026-11-10\tLo que aprendimos en 100 llamadas con clientes\tLinkedIn\tProgramado
2026-11-12\tNewsletter: tres historias de clientes\tNewsletter\tEn borrador
2026-11-17\tNuestro onboarding, antes y después\tLinkedIn\tEn borrador
2026-11-19\tEntre bastidores: el equipo de soporte\tInstagram\tIdea
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de calendario de contenidos?", a: [
    "No. Notas no tiene plantillas. Una nota con una tabla de publicaciones (fecha, título, canal, estado) y una lista de ideas debajo funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Notas puede ordenar una tabla por fecha?", a: [
    "No. Las tablas de Notas no se ordenan. Escribe las fechas como 2026-11-03 para que se lean en orden, y pon cada publicación nueva en su sitio a mano.",
  ] },
  { q: "¿Mi equipo puede editar el mismo calendario de contenidos en Notas?", a: [
    "Sí, si compartes la nota. Cada persona necesita una Cuenta de Apple, y todos editan la misma nota.",
  ] },
  { q: "¿Hay una app de notas que planifique el contenido por mí?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de calendario de contenidos. Cuéntale una idea a ChatGPT o a Claude y la guarda, o pídele que planifique las próximas dos semanas y añade las publicaciones al calendario.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="calendario-de-contenidos-notas"
      intro={<>
        Publicar cada semana es más fácil cuando el plan y las ideas están en un sitio que ya abres. Notas de Apple puede ser ese sitio con
        una nota y una tabla. Aquí tienes una plantilla de calendario de contenidos para redes sociales y tu blog, para pegar en Notas,
        cómo llevarla semana a semana y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#cada-semana", label: "Semana a semana" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un calendario que planifica contigo" },
        ]}>
          <p>
            Notas no tiene calendario de contenidos, pero una nota sirve: una tabla con la fecha de publicación, el título, el canal y el
            estado, y debajo una lista de ideas y unas líneas sobre cómo escribes. Fíjala y apunta cada idea en cuanto la tengas.
          </p>
          <PostCta template="content-calendar" slug="es/calendario-de-contenidos-notas" path="/es/blog/calendario-de-contenidos-notas" position="answer"
            ui={ui.cta} title="¿Quieres las próximas dos semanas planificadas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un calendario de contenidos gratuito. Cuéntale una idea a ChatGPT o a Claude y la guarda, o pídele dos semanas de publicaciones a partir de tus ideas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="Una nota Content calendar en Pinto Notes en un Mac, en inglés: una tabla Calendar con cinco publicaciones del 3 al 19 de noviembre con título, canal y estado, una lista Ideas de tres y tres líneas Voice."
        caption="Un calendario de contenidos en Pinto Notes, donde Channel y Status se eligen de una lista. En Notas de Apple, la misma tabla los guarda como palabras escritas." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: un calendario, ideas y un tono</h2>
      <p>
        El calendario es una tabla, una fila por publicación. Las ideas son una lista sencilla, así que una idea a medias cuesta una
        línea. El tono son tres reglas que lees antes de escribir, para que cada publicación suene como la anterior. La nota va en dos
        partes: primero los encabezados y las listas, luego la tabla.
      </p>
      <Keep title="Calendario de contenidos para Notas de Apple" text={SKELETON} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título y cada línea con ## en un encabezado. Con un Comando + V normal, los símbolos se quedan como texto. En el iPhone,
        escríbela. Luego cambia la línea de debajo de Calendario por la tabla.
      </p>
      <Keep title="Tabla del calendario" text={TABLE} copyLabel={ui.copy}
        note="Cada línea lleva un tabulador entre las columnas. Pégala y convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y crea la tabla.</strong> Pega las líneas de la tabla debajo de Calendario, selecciona las seis líneas, de Fecha
          a la última publicación, y pulsa el botón Tabla. Cada tabulador se convierte en una columna.
        </li>
        <li>
          <strong>O empieza en blanco.</strong> Elige Formato, Tabla para dos filas y dos columnas, y el tabulador en la última celda
          añade la fila siguiente.
        </li>
        <li>
          <strong>Títulos cortos.</strong> Notas decide el ancho de las columnas y no puedes arrastrarlas, así que un título largo aprieta
          las demás columnas. Basta con un título provisional de pocas palabras.
        </li>
        <li>
          <strong>Escribe las fechas siempre igual.</strong> 2026-11-03 se lee en orden de arriba abajo y es fácil de buscar.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa todo lo que una tabla de Notas
        puede y no puede hacer.
      </p>

      <h2 id="cada-semana">Semana a semana</h2>
      <ul>
        <li>
          <strong>Fíjala.</strong> Una nota fijada se queda arriba de su carpeta, así que una idea en el tren va directa a la lista.
        </li>
        <li>
          <strong>Planifica una vez por semana.</strong> Pasa dos o tres ideas a la tabla con una fecha y En borrador, y bórralas de la
          lista.
        </li>
        <li>
          <strong>Escribe los borradores en sus propias notas.</strong> Escribe cada publicación en una nota aparte y enlázala desde el
          calendario con Edición, Añadir enlace (Comando + K; en Latinoamérica, Agregar enlace), para que el calendario siga siendo
          corto.
        </li>
        <li>
          <strong>Etiqueta los borradores.</strong> Escribe #borrador en cada nota de borrador, y una carpeta inteligente con el filtro
          Etiquetas los reúne en un sitio. Lee <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a>{" "}
          (en inglés) si no aparece.
        </li>
        <li>
          <strong>Empieza una nota nueva cada trimestre.</strong> Elige Archivo, Duplicar nota y borra las filas ya publicadas: las
          ideas y el tono se vienen contigo.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
      ]} />
      <p>
        Si las publicaciones se planifican en una reunión de equipo, la{" "}
        <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta de reunión</a> guarda las decisiones y quién escribe qué. Hay
        más notas para pegar en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un calendario de contenidos en Notas</h2>
      <ul>
        <li><strong>No se ordena.</strong> Las tablas de Notas no se ordenan, así que una publicación que pasa a otra semana significa mover su fila a mano.</li>
        <li><strong>El estado es solo una palabra.</strong> Nada evita una errata, y no puedes mostrar solo lo programado.</li>
        <li><strong>Planificar te toca a ti.</strong> Convertir una lista de ideas en dos semanas de publicaciones en varios canales es la parte lenta, cada semana.</li>
        <li><strong>El tono es un recordatorio.</strong> Las tres reglas están en la nota, y que cada borrador las cumpla depende de ti.</li>
      </ul>
      <p>
        Para un canal y una publicación por semana, una nota es todo lo que necesitas. Con varios canales, mantener la tabla al día pasa a
        ser el trabajo.
      </p>

      <h2 id="pinto-notes">Un calendario de contenidos que planifica contigo</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/content-calendar">Content calendar</a> es una nota con una tabla
        Calendar, una lista Ideas y tu Voice, el tono. En la tabla, Channel se elige entre Blog, Newsletter, LinkedIn, Instagram o
        YouTube, y Status entre Idea, Drafting, Scheduled o Published.
      </p>
      <p>
        Cuéntale una idea a tu IA y la añade en Ideas. Pídele &ldquo;planifica las próximas dos semanas: dos publicaciones en LinkedIn y
        una newsletter&rdquo; y elige ideas de la lista y añade una fila por publicación, con fecha, título provisional, canal y Drafting.
        Escribe borradores con el tono de Voice, y cuando le dices que una publicación ya ha salido, la pasa a Published. &ldquo;¿Qué hay
        programado esta semana?&rdquo; tiene una respuesta directa sacada de la tabla. Esto funciona en cuanto conectas ChatGPT o Claude,
        y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto. Puedes seguir
        cambiando cada fila tú, y se guardan todas las versiones anteriores de la nota.
      </p>
      <p>
        Los planes que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
