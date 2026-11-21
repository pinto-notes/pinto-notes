import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "revision-semanal-notas-iphone");

// Spanish version of /blog/apple-notes-weekly-review-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "revision semanal" gives "revision semanal gtd" and "revision semanal
// en ingles"; "weekly review" gives template, gtd and traduccion; "plantilla revision semanal" and "revision semanal
// plantilla" give nothing. So the slug and title use "revisión semanal" with plantilla. Apple's own Spanish words, read
// on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Ordenar
// automáticamente los ítems marcados, ajustes de Notas), /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas), the iPhone
// guide /es-es/guide/iphone/iph1ac0b3a2/ios (crear una lista de comprobación), and the Notes app's own Spanish strings on
// macOS 27.2 (MainMenu.loctable and Localizable.loctable: Edición, Pegar en formato Markdown and Pegar como Markdown in
// es_419, Fijar nota and Anclar nota in es_419, Ajustes and Configuración in es_419). Paste as Markdown is new in macOS 27
// and no Spanish support page covers it yet; its name here is the app's own string. Facts are the English post's; the
// screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Revisión semanal

Veinte minutos el domingo. La semana más reciente, arriba.

## Preguntas
1. ¿Qué ha ido bien esta semana?
2. ¿Qué no, y por qué?
3. ¿Qué he aprendido?
4. ¿Qué agradezco?
5. ¿Cuáles son mis tres prioridades para la semana que viene?

## Semana del 2 de noviembre
- Fue bien: entregué el informe un día antes; entrené cuatro veces.
- No fue bien: el jueves no hubo trabajo profundo, demasiadas reuniones.
- Aprendí: un orden del día de 30 minutos gana a una reunión de 60.
- Agradezco: la cena con mi hermana.
- [ ] Reservar las mañanas del jueves para trabajo profundo
- [ ] Enviar el plan del cuarto trimestre a Jonás
- [ ] Pedir cita con el dentista
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de revisión semanal?", a: [
    "No. Notas no tiene plantillas. Una nota con tus preguntas arriba y un encabezado para cada semana debajo funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Qué preguntas lleva una revisión semanal?", a: [
    "Con cinco basta: qué ha ido bien, qué no y por qué, qué has aprendido, qué agradeces y tus tres prioridades para la semana que viene. La última es la parte que vas a usar el lunes.",
  ] },
  { q: "¿Una nota por semana o una nota para todas las semanas?", a: [
    "Una nota para todas las semanas, con la más reciente arriba. Las tres prioridades de la semana pasada quedan justo debajo de las de esta, y la búsqueda encuentra una palabra en todas ellas.",
  ] },
  { q: "¿Hay una revisión semanal que me haga las preguntas?", a: [
    "Pinto Notes tiene una plantilla gratuita de revisión semanal. Dile a ChatGPT o a Claude que toca la revisión y te hace las cinco preguntas una a una; luego escribe la semana en tu nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="revision-semanal-notas-iphone"
      intro={<>
        Una revisión semanal son veinte minutos el domingo que te ahorran un lunes sin rumbo. Solo funciona si las preguntas son las
        mismas cada semana, así que su sitio es una nota que guardas. Aquí tienes una plantilla de revisión semanal para Notas de Apple,
        cómo convertirla en costumbre y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#domingo", label: "El domingo" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una revisión que te pregunta" },
        ]}>
          <p>
            Notas no tiene plantilla de revisión semanal, pero una nota sirve: cinco preguntas arriba y luego un encabezado para cada
            semana, con tus respuestas en líneas cortas y las tres prioridades de la semana siguiente como lista de comprobación. Añade la
            semana nueva arriba, así el plan de la semana pasada queda justo debajo.
          </p>
          <PostCta template="weekly-review" slug="es/revision-semanal-notas-iphone" path="/es/blog/revision-semanal-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que alguien te haga las preguntas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de revisión semanal. ChatGPT o Claude te hace las cinco preguntas y luego escribe la semana en tu nota.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="Una nota Weekly review en Pinto Notes en un Mac, en inglés: cinco preguntas numeradas y luego la revisión de la semana del 2 de noviembre, con lo que fue bien, lo que no, lo aprendido y un agradecimiento, y una lista con las tres prioridades, con Pedir cita con el dentista marcada."
        caption="Una revisión semanal en Pinto Notes, tal como la escribe la plantilla. En Notas de Apple funciona igual, con un encabezado para cada semana. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: cinco preguntas, una nota</h2>
      <p>
        Las preguntas van arriba para que nunca tengas que recordarlas. Cada semana lleva un encabezado con la fecha del lunes, una línea
        por respuesta y las tres prioridades como lista de comprobación que marcas durante la semana. Deja una palabra en cada línea,
        porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Revisión semanal para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <ul>
        <li>
          <strong>Pégala una vez.</strong> En un Mac con macOS 27, crea una nota y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown). La línea con # pasa a ser el título, cada línea con ## un encabezado y las tres
          prioridades una lista de comprobación. Con un Comando + V normal, los símbolos se quedan como texto. En el iPhone, escríbela,
          selecciona las tres prioridades y toca el botón Lista de comprobación.
        </li>
        <li>
          <strong>Deja la semana de ejemplo como guía.</strong> Mantenla hasta tu primer domingo y luego cámbiala por la tuya.
        </li>
        <li>
          <strong>Fíjala.</strong> Fija la nota arriba de su carpeta, para que esté ahí cuando abras Notas el domingo.
        </li>
      </ul>

      <h2 id="domingo">El domingo</h2>
      <ul>
        <li>
          <strong>Empieza por las tres prioridades de la semana pasada.</strong> Marca lo que hiciste antes de escribir nada nuevo. Lo
          que sigue abierto pasa a las tres de la semana que viene o lo descartas a propósito.
        </li>
        <li>
          <strong>Añade la semana nueva arriba.</strong> Copia el bloque de la semana pasada, pégalo debajo de las preguntas y cambia la
          fecha y las líneas. Unas pocas palabras por respuesta bastan, siempre que dentro de un mes las entiendas.
        </li>
        <li>
          <strong>Elige tres, no diez.</strong> Tres cosas que te alegraría tener hechas el viernes. Con Ordenar automáticamente los
          ítems marcados activado en los ajustes de Notas (Configuración en Latinoamérica), las que marcas bajan al final de la lista.
        </li>
        <li>
          <strong>Mira atrás una vez al mes.</strong> La búsqueda lee cada palabra, así que buscar &ldquo;reuniones&rdquo; te enseña
          cuántas veces fueron el problema. Una etiqueta como #revision en la nota la deja a un toque en la barra lateral.
        </li>
      </ul>
      <p>
        Una revisión semanal más corta, con la misma idea, es una de las notas de <a href="/blog/apple-notes-templates"
        hrefLang="en">Apple Notes templates</a> (en inglés). Para seguir lo que haces cada día entre revisiones, el{" "}
        <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos en Notas</a> encaja al lado, y la{" "}
        <a href="/es/blog/diario-personal-notas-iphone">plantilla de diario personal</a> es para los días en sí.
      </p>

      <h2 id="limites">Hasta dónde llega una revisión semanal en Notas</h2>
      <ul>
        <li><strong>Las preguntas no se hacen solas.</strong> Un domingo cansado, una lista de preguntas es fácil de saltarse.</li>
        <li><strong>Pasar lo pendiente es a mano.</strong> Lo que no marcaste la semana pasada se queda donde está hasta que lo copias arriba.</li>
        <li><strong>Ver patrones significa releer.</strong> La búsqueda encuentra una palabra. No te dice qué se repite en dos meses de revisiones.</li>
      </ul>
      <p>
        Si la costumbre ya te funciona, la nota es todo lo que necesitas. Si se te escapa en las semanas con mucho lío, lo que falta es
        alguien que pregunte.
      </p>

      <h2 id="pinto-notes">Una revisión semanal que te pregunta</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/weekly-review">Weekly review</a> es una nota con las cinco preguntas y
        una sección de revisiones, con la semana más reciente primero.
      </p>
      <p>
        Dile a tu IA que toca la revisión semanal. Te hace las cinco preguntas una a una y luego añade la semana arriba de las revisiones:
        un encabezado con la fecha del lunes, tus respuestas en líneas cortas con tus propias palabras y tus tres prioridades como lista
        de comprobación. Dile que una está hecha y la marca. Pregúntale &ldquo;¿en qué dije que me iba a centrar la semana
        pasada?&rdquo; o &ldquo;¿qué se repite en mis revisiones?&rdquo; y relee la nota para responderte. Puedes seguir escribiendo y
        marcando todo tú, y se guardan todas las versiones anteriores de la nota. Esta parte funciona cuando ChatGPT o Claude está
        conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Las notas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
