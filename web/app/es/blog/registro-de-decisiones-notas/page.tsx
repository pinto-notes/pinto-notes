import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "registro-de-decisiones-notas");

// Spanish version of /blog/apple-notes-decision-log-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "registro de decisiones" gives "registro de decisiones
// arquitectónicas", "registro de decisiones de arquitectura" and "registro de toma de decisiones"; "diario de
// decisiones" gives "como hacer un diario de decisiones"; "plantilla toma de decisiones" gives excel and "arbol de toma
// de decisiones"; "registro de decisiones plantilla" gives nothing. So the slug and title use "registro de decisiones".
// Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apde615d29c2/mac ("Añadir
// enlaces": Edición > Añadir enlace, Comando + K), /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas), /es-es/102462
// ("Si no puedes colaborar en la app Notas": Cuenta de Apple), and the Notes app's own Spanish strings on macOS 27.2
// (MainMenu.loctable and Localizable.loctable: Edición, Pegar en formato Markdown and Pegar como Markdown in es_419,
// Añadir enlace and Agregar enlace in es_419, Fijar nota). Paste as Markdown is new in macOS 27 and no Spanish support
// page covers it yet; its name here is the app's own string. That column widths can't be dragged is from the English
// post's own test on macOS 27. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Registro de decisiones

Cada decisión que merece la pena recordar: qué elegimos, qué no y por qué. La más reciente, arriba.

## Preguntas abiertas
- ¿Permitimos editar sin conexión en la primera versión?
- ¿Quién se encarga del importador después del lanzamiento?

## Seguir con Postgres, 4 de noviembre
- Contexto: las notas llegaron a 2 millones de filas y la búsqueda se volvió lenta.
- Opciones: una base de datos documental, un servicio de búsqueda o mejores índices.
- Elegimos: Postgres con un índice de trigramas.
- Por qué: una sola base de datos que mantener, y el índice hizo la búsqueda 40 veces más rápida.
- Revisar: al llegar a 20 millones de filas.

## Publicar cada martes, 2 de noviembre
- Contexto: las versiones se retrasaban cada vez que un arreglo no estaba listo.
- Elegimos: publicar cada martes lo que esté listo.
- Por qué: las versiones pequeñas son más fáciles de deshacer.
`;

const FAQ = [
  { q: "¿Qué va en un registro de decisiones?", a: [
    "Para cada decisión: la fecha, el contexto, las opciones que barajaste, lo que elegiste, por qué y cuándo volver a mirarla. El porqué y las opciones son lo que la gente se olvida de escribir y lo que más falta hace después.",
  ] },
  { q: "¿Notas de Apple tiene una plantilla de registro de decisiones?", a: [
    "No. Notas no tiene plantillas. Una nota con un encabezado por decisión, la más reciente arriba, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Un registro de decisiones mejor en tabla o en lista?", a: [
    "En una hoja de cálculo, en tabla. En Notas de Apple se lee mejor un encabezado por decisión: el ancho de las columnas no se puede arrastrar, y un porqué largo queda apretado en una celda estrecha.",
  ] },
  { q: "¿Hay un registro de decisiones que responda por qué elegimos algo?", a: [
    "Pinto Notes tiene una plantilla gratuita de registro de decisiones. Cuéntale a ChatGPT o a Claude qué se ha decidido y apunta el contexto, las opciones y el porqué. Más adelante, pregúntale por qué se eligió algo y te cita la entrada.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="registro-de-decisiones-notas"
      intro={<>
        Los equipos vuelven a discutir lo que ya estaba decidido porque nadie apuntó por qué se decidió. Un registro de decisiones lo
        arregla, y no hace falta Confluence ni una hoja de cálculo. Aquí tienes una plantilla de registro de decisiones para Notas de
        Apple, cómo llevarlo y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#al-dia", label: "Llévalo al día" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un registro que recuerda el porqué" },
        ]}>
          <p>
            Notas no tiene plantilla de registro de decisiones, pero una nota sirve: las preguntas abiertas arriba y luego un encabezado
            para cada decisión con su fecha, y debajo el contexto, las opciones, lo que elegiste, por qué y cuándo revisarla. La más
            reciente primero, para que las últimas decisiones sean lo primero que lees.
          </p>
          <PostCta template="decision-log" slug="es/registro-de-decisiones-notas" path="/es/blog/registro-de-decisiones-notas" position="answer"
            ui={ui.cta} title="¿Quieres que las decisiones se apunten solas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un registro de decisiones gratuito. Cuéntale a ChatGPT o a Claude qué se ha decidido y apunta las opciones y el porqué, y lo encuentra cuando se lo pides.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="Una nota Decision log en Pinto Notes en un Mac, en inglés: dos preguntas abiertas, luego la decisión de seguir con Postgres del 4 de noviembre con su contexto, opciones, elección, motivo y cuándo revisarla, y debajo la decisión de publicar cada martes."
        caption="Un registro de decisiones en Pinto Notes, tal como lo escribe la plantilla. En Notas de Apple funciona igual. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: un encabezado por decisión</h2>
      <p>
        Cada entrada son cinco líneas cortas. Contexto dice qué obligó a decidir. Opciones apunta lo que no elegiste, y es la línea que
        evita que la misma idea vuelva el trimestre que viene. Revisar dice cuándo podría cambiar la respuesta, para que nadie la tome
        como definitiva. Las decisiones pequeñas pueden saltarse las opciones, como la de publicar los martes.
      </p>
      <Keep title="Registro de decisiones para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Pégala una vez.</strong> En un Mac con macOS 27, crea una nota y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown). La línea con # pasa a ser el título y cada línea con ## un encabezado. Con un Comando + V
          normal, los símbolos se quedan como texto. En el iPhone, escríbela.
        </li>
        <li>
          <strong>Un registro por proyecto.</strong> Guárdalo en la carpeta del proyecto y fíjalo arriba, para que esté junto a las notas
          que explica.
        </li>
        <li>
          <strong>Compártelo con el equipo.</strong> Si todos usan Notas de Apple, comparte la nota para que cada persona añada sus
          propias decisiones. Todos necesitan una Cuenta de Apple.
        </li>
      </ul>

      <h2 id="al-dia">Llévalo al día</h2>
      <ul>
        <li>
          <strong>Apúntala el mismo día.</strong> El porqué está más claro al acabar la reunión en la que se decidió. Una semana
          después ya es una suposición.
        </li>
        <li>
          <strong>Baja las preguntas cuando se resuelvan.</strong> Cuando una pregunta abierta se decide, bórrala de Preguntas abiertas y
          escribe su entrada encima de las demás decisiones.
        </li>
        <li>
          <strong>Enlázala desde donde surgió.</strong> En la nota de la reunión, selecciona la decisión y elige Edición, Añadir enlace
          (en Latinoamérica, Agregar enlace) para que apunte al registro, y la reunión y los motivos quedan unidos.
        </li>
        <li>
          <strong>Busca antes de volver a discutir.</strong> La búsqueda lee cada palabra de cada nota, así que &ldquo;Postgres&rdquo;
          encuentra la entrada antes de que alguien convoque una reunión para hablarlo. También ayuda una etiqueta #decision en las notas
          de reunión que cambiaron algo.
        </li>
      </ul>
      <p>
        La mayoría de las decisiones nacen en una reunión, y la <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta de
        reunión</a> tiene un encabezado Decisiones justo para eso. Hay más notas para pegar en <a href="/blog/apple-notes-templates"
        hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un registro de decisiones en Notas</h2>
      <ul>
        <li><strong>Alguien tiene que escribirlo.</strong> Después de una reunión larga, el registro es lo primero que se salta.</li>
        <li><strong>El porqué se pierde.</strong> Nada te pide el motivo cuando alguien apunta solo la elección.</li>
        <li><strong>La búsqueda encuentra palabras, no respuestas.</strong> Encuentra todas las notas que dicen Stripe. No puede responder &ldquo;¿por qué elegimos Stripe y no Paddle?&rdquo;</li>
        <li><strong>Compartir exige una Cuenta de Apple.</strong> Cada persona del equipo necesita una para abrir y editar el registro compartido.</li>
      </ul>

      <h2 id="pinto-notes">Un registro de decisiones que recuerda el porqué</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/decision-log">Decision log</a> es una nota con las preguntas abiertas
        y las decisiones, la más reciente primero.
      </p>
      <p>
        Cuéntale a tu IA una decisión con tus propias palabras. Añade una entrada arriba con la decisión en pocas palabras y la fecha, y
        luego el contexto, las opciones que se barajaron, lo que se eligió, por qué y cuándo revisarla, una línea corta cada cosa. Si no
        has dicho por qué, te lo pregunta. Las preguntas sin resolver van a Preguntas abiertas y salen de la lista cuando se deciden.
        Meses después, pregúntale &ldquo;¿por qué elegimos Stripe y no Paddle?&rdquo; y encuentra la entrada y te la cita, o pregúntale
        &ldquo;¿qué sigue sin decidir?&rdquo;. Puedes seguir escribiendo y editando cada entrada tú, y se guardan todas las versiones
        anteriores de la nota. Esta parte funciona cuando ChatGPT o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        En <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Claude Code</a> (en inglés), la plantilla tiene sus propias
        instrucciones para las decisiones técnicas de un proyecto. Cuando eliges una librería, un esquema o una arquitectura, apunta la
        entrada con los archivos a los que afecta, y antes de proponer un cambio lee el registro para comprobar que no deshace una
        decisión.
      </p>
      <p>
        Las notas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
