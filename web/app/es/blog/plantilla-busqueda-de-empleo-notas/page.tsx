import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-busqueda-de-empleo-notas");

// Spanish version of /blog/apple-notes-job-search-tracker (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "busqueda de empleo plantilla" gives "plantilla busqueda de empleo", "plantilla excel
// busqueda de empleo" and "plantilla agenda busqueda de empleo"; "plantilla busqueda de trabajo" gives excel; "seguimiento
// de postulaciones" gives "seguimiento de postulaciones laborales", "plantilla seguimiento de postulaciones laborales" and
// "excel de seguimiento de postulaciones" (the Latin American word); "seguimiento de candidaturas", "seguimiento busqueda
// de empleo" and "tracker busqueda de empleo" give nothing, and "candidaturas" alone is about elections. So the slug and
// title use "plantilla de búsqueda de empleo", and the text says candidaturas (postulaciones once). Apple's own Spanish
// words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el
// Mac": botón Tabla, Formato > Tabla, Tabulador in the last cell adds a row), /es-es/guide/notes/apde615d29c2/mac
// ("Añadir enlaces": Edición > Añadir enlace, Comando + K), /es-es/guide/notes/apd93c815aa0/mac (Ordenar automáticamente
// los ítems marcados), the Mac guide's "Ordenar y fijar notas" page title, the iPhone guide
// /es-es/guide/iphone/iph1ac0b3a2/ios (crear una lista de comprobación), and the Notes app's own Spanish strings on macOS
// 27.2 (MainMenu.loctable and Localizable.loctable: Formato, Tabla, Edición, Pegar en formato Markdown and Pegar como
// Markdown in es_419, Añadir enlace and Agregar enlace in es_419, Fijar nota and Anclar nota in es_419). Paste as
// Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. It is not
// used for the table, as in the English post. Facts are the English post's; the screenshot is its English one, described
// in Spanish.

const ui = UI.es;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Búsqueda de empleo

Empresa\tPuesto\tFase\tSiguiente paso
Tideway\tDiseñadora sénior\tEntrevista\tPrimera entrevista, 12 nov
Marlow Studio\tJefa de diseño\tEnviada\tHacer seguimiento, 16 nov
Finch Bikes\tDiseñadora de producto\tGuardada\tEnviar antes del 18 nov
Northlight\tDiseñadora UX\tRechazada\tPedí que me dieran feedback
`;

const REST = `## Preparar entrevistas
Tideway, primera entrevista el 12 nov
1. ¿Un proyecto del que estés orgullosa? El rediseño del onboarding.
2. ¿Cómo trabajas con ingeniería? Revisiones semanales, entregas pequeñas.
3. ¿Por qué Tideway? Me gusta desenredar la logística.

Para preguntarles: ¿cómo comparten diseño y soporte lo que oyen?

## Esta semana
- [ ] Mandar el enlace del portfolio a Tideway
- [ ] Añadir el proyecto del onboarding al CV

## Gente con la que he hablado
- Karin, jefa de diseño en Tideway: le importan más los prototipos sencillos que el acabado.
`;

const FAQ = [
  { q: "¿Puedo llevar mis candidaturas en Notas de Apple?", a: [
    "Sí, con una tabla. Haz una fila por oferta con la empresa, el puesto, la fase y el siguiente paso, y lleva los seguimientos como lista de comprobación debajo. Notas no tiene plantillas, así que pega la de esta página en una nota nueva.",
  ] },
  { q: "¿Notas de Apple puede ordenar mis candidaturas por fase?", a: [
    "No. Las tablas de Notas no se ordenan ni suman. Usa siempre las mismas palabras para la fase (Guardada, Enviada, Entrevista, Oferta, Rechazada) para que la columna se lea rápido.",
  ] },
  { q: "¿Es mejor una hoja de cálculo para buscar trabajo?", a: [
    "Una hoja de cálculo ordena y filtra, y eso ayuda a partir de unas cuantas docenas de candidaturas. Una nota tiene la tabla junto a la preparación de las entrevistas y la gente con la que has hablado, en el móvil entre una entrevista y otra.",
  ] },
  { q: "¿Hay un tracker de búsqueda de empleo que se rellene solo?", a: [
    "Pinto Notes tiene una plantilla gratuita de búsqueda de empleo. Pega una oferta en ChatGPT o Claude y añade la fila, y luego mantiene al día la fase y el siguiente paso a medida que le cuentas qué ha pasado.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-busqueda-de-empleo-notas"
      intro={<>
        Casi todas las plantillas para la búsqueda de empleo son hojas de cálculo, y una hoja de cálculo es una cosa más que abrir. Si ya
        vives en Notas de Apple, una nota puede guardar cada candidatura (o postulación) y lo que toca después. Aquí tienes una plantilla
        de búsqueda de empleo para Notas, cómo tenerla al día y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#semana", label: "Semana a semana" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un tracker que se actualiza solo" },
        ]}>
          <p>
            Notas de Apple no tiene plantilla para seguir tus candidaturas, pero una nota con una tabla cumple: una fila por oferta con la
            empresa, el puesto, la fase y el siguiente paso. Debajo de la tabla, la preparación de las entrevistas, una lista con los
            seguimientos de esta semana y la gente con la que has hablado.
          </p>
          <PostCta template="job-hunt" slug="es/plantilla-busqueda-de-empleo-notas" path="/es/blog/plantilla-busqueda-de-empleo-notas" position="answer"
            ui={ui.cta} title="¿Quieres que alguien te lleve el tracker al día?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de búsqueda de empleo. Pega una oferta en ChatGPT o Claude y añade la fila, y luego te ayuda a preparar la entrevista.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="Una nota Job hunt en Pinto Notes en un Mac, en inglés: una tabla Applications de cuatro ofertas con Tideway en Interview, la preparación de una entrevista con tres preguntas y lo que contestar, una lista This week con un ítem marcado y una nota sobre Karin, de Tideway."
        caption="Una plantilla de búsqueda de empleo en Pinto Notes, donde la fase se elige de una lista. En Notas de Apple la misma tabla funciona escribiendo la fase como una palabra. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota, una fila por oferta</h2>
      <p>
        La tabla responde a la pregunta que más te haces: en qué punto está cada candidatura y qué hago ahora. Pon una fecha en cada
        siguiente paso, porque &ldquo;hacer seguimiento&rdquo; sin día suele quedarse sin hacer. Todo lo que no cabe en una fila va
        debajo de la tabla.
      </p>
      <Keep title="Tabla de candidaturas para Notas de Apple" text={TABLE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre las columnas. Pégala y luego convierte esas líneas en una tabla." />
      <Keep title="Entrevistas y seguimientos para Notas de Apple" text={REST} copyLabel={ui.copy}
        note="En un Mac, pégala debajo de la tabla con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Pega y luego haz la tabla.</strong> Pega la plantilla de la tabla en una nota nueva, selecciona las cinco líneas que van
          de Empresa a Northlight y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan Empresa, Puesto,
          Fase y Siguiente paso una al lado de la otra.
        </li>
        <li>
          <strong>Añade el resto.</strong> Haz clic debajo de la tabla y elige Edición, Pegar en formato Markdown (en Latinoamérica, Pegar
          como Markdown) con la segunda plantilla. En macOS 27, cada línea con ## pasa a ser un encabezado y los seguimientos una lista de
          comprobación. Con un Comando + V normal, los símbolos se quedan como texto. En el iPhone, escribe los encabezados, selecciona los
          seguimientos y toca el botón Lista de comprobación.
        </li>
        <li>
          <strong>Añade una oferta.</strong> Haz clic en la última celda y pulsa el tabulador para tener una fila nueva. Notas decide el
          ancho de las columnas y no se pueden arrastrar, así que deja cada celda en pocas palabras.
        </li>
        <li>
          <strong>Fíjala.</strong> Fija la nota en lo alto de su carpeta (en Latinoamérica, Anclar nota), para que sea lo primero que ves
          cuando te llama alguien de selección.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) cubre todo lo que una tabla en Notas puede
        y no puede hacer.
      </p>

      <h2 id="semana">Semana a semana</h2>
      <ul>
        <li>
          <strong>Usa siempre las mismas palabras.</strong> Guardada, Enviada, Entrevista, Oferta, Rechazada, Retirada. La tabla no se
          ordena, así que esas pocas palabras de siempre son lo que hace que la columna se lea de un vistazo.
        </li>
        <li>
          <strong>Cambia la fila el día que pasa algo.</strong> Una respuesta, un rechazo, una fecha de entrevista: actualiza Fase y
          Siguiente paso antes de cerrar el correo.
        </li>
        <li>
          <strong>Planifica los seguimientos el domingo.</strong> Repasa la columna Siguiente paso y copia lo que toca en Esta semana. Con
          Ordenar automáticamente los ítems marcados activado en los ajustes de Notas (Configuración en Latinoamérica), los marcados bajan
          al final.
        </li>
        <li>
          <strong>Dale a la preparación larga su propia nota.</strong> Cuando la preparación de una empresa pase de unas pocas preguntas,
          muévela a su propia nota y enlázala desde Preparar entrevistas con Edición, Añadir enlace (Comando + K; en Latinoamérica, Agregar
          enlace).
        </li>
        <li>
          <strong>Apunta con quién hablaste.</strong> Una línea sobre cada persona, y lo que le importaba, es lo que vas a querer antes de
          la segunda entrevista. La búsqueda lee cada palabra, así que un nombre la encuentra.
        </li>
      </ul>
      <p>
        Para las notas de las propias entrevistas, puedes usar una nota de reunión. Más notas para pegar en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes
        templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un tracker de empleo en Notas</h2>
      <ul>
        <li><strong>Cada oferta se escribe a mano.</strong> La empresa, el puesto y el enlace a la oferta salen del anuncio celda a celda.</li>
        <li><strong>No se ordena ni se filtra.</strong> Con treinta filas, encontrar las que están en Entrevista significa leer la columna entera.</li>
        <li><strong>Las fechas son solo texto.</strong> &ldquo;Hacer seguimiento, 16 nov&rdquo; está en una celda. Darte cuenta de que hoy es 16 te toca a ti.</li>
        <li><strong>La preparación empieza en blanco.</strong> Las preguntas probables para cada puesto, y tus respuestas, las escribes tú.</li>
      </ul>
      <p>
        Para unas pocas candidaturas, la nota es todo lo que necesitas. Cuando son veinte a la vez, tener la tabla al día es un trabajo en
        sí mismo.
      </p>

      <h2 id="pinto-notes">Un tracker de empleo que se actualiza solo</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/job-hunt">Job hunt</a> es una nota con una tabla Applications, donde
        la fase se elige entre Saved, Applied, Interview, Offer, Rejected o Withdrawn, y secciones para preparar entrevistas, los
        seguimientos de esta semana y la gente con la que has hablado.
      </p>
      <p>
        Pega una oferta o un enlace en tu IA y añade una fila: la empresa, el puesto enlazado a la oferta, la fase en Saved y el siguiente
        paso. Dile que te has inscrito o que te han contestado y cambia esa fila. Di &ldquo;el jueves tengo la primera entrevista con
        Tideway, ayúdame a prepararla&rdquo; y escribe cinco preguntas probables con lo que puedes contestar, bajo el nombre de la empresa.
        Pregúntale &ldquo;¿a qué tengo que hacer seguimiento esta semana?&rdquo; y te lo pone como lista de comprobación. Puedes seguir
        editando cada fila tú mismo, y se guardan todas las versiones anteriores de la nota. Esta parte funciona cuando ChatGPT o Claude
        están conectados; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Las notas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
