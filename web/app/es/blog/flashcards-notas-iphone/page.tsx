import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "flashcards-notas-iphone");

// Spanish version of /blog/apple-notes-flashcards (templates, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es and gl=mx) on 21 Nov: "flashcards" gives "flashcards para estudiar", online, app, anatomia; "flashcards iphone"
// gives app, free, "flashcards para iphone" and Anki; "tarjetas de estudio" and "fichas de estudio" both give "(flashcards)";
// "como hacer flashcards" gives "para estudiar", digitales, a mano; "flashcards en notas iphone" and "tarjetas de estudio
// iphone" give nothing. Spanish speakers say flashcards, so the slug and title use it and the text says tarjetas too.
// Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una
// tabla en Notas en el Mac": botón Tabla, Formato > Tabla), /es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas
// en el Mac": Formato > Más > Anular todo), /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas), the iPhone guide
// /es-es/guide/iphone/iph1ac0b3a2/ios (crear una lista de comprobación), and the Notes app's own Spanish strings on macOS
// 27.2 (MainMenu.loctable and Localizable.loctable: Formato, Tabla, Más, Archivo, Duplicar nota). Notes has no way to hide
// an answer, so the post says to cover the column, as the English one does. The Pinto study app's buttons (Study now,
// Show answer, Again, Hard, Good, Easy) keep their English names: the app is in English. Facts are the English post's;
// the screenshot is its English one, described in Spanish.

const ui = UI.es;

// Tabs between the question and the answer: select those lines in Notes and press the Table button.
const TEMPLATE = `Flashcards de respiración celular

Pregunta\tRespuesta
¿Para qué descompone la célula la glucosa?\tPara obtener ATP, la energía de la célula
¿Cuáles son las tres etapas?\tGlucólisis, ciclo de Krebs y cadena de transporte de electrones
¿Qué etapa produce más ATP?\tLa cadena de transporte de electrones
¿Dónde ocurre la cadena de transporte de electrones?\tEn las mitocondrias

Falladas esta vez
`;

const FAQ = [
  { q: "¿Se pueden hacer flashcards en Notas de Apple?", a: [
    "Sí, con una tabla de dos columnas: la pregunta a la izquierda, la respuesta a la derecha y una fila por tarjeta. Notas no puede esconder una respuesta ni dar la vuelta a una tarjeta, así que tapas la columna derecha para ponerte a prueba.",
  ] },
  { q: "¿Notas de Apple tiene repetición espaciada?", a: [
    "No. Notas no sabe qué tarjetas toca repasar ni cuáles has fallado. Lo más parecido a mano es una lista de las tarjetas falladas debajo de la tabla, que repasas primero la próxima vez.",
  ] },
  { q: "¿Puedo barajar las flashcards en Notas de Apple?", a: [
    "No. Las tablas de Notas no se ordenan ni se barajan, así que las tarjetas salen en el orden en que las escribiste. Empezar de vez en cuando por la última fila es el apaño más sencillo.",
  ] },
  { q: "¿Hay una app de flashcards que funcione como Notas de Apple?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de apuntes y flashcards con su propia app de estudio. Pega tus apuntes en ChatGPT o Claude y hace las tarjetas; la app te enseña las que toca repasar, una a una.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="flashcards-notas-iphone"
      intro={<>
        Las flashcards funcionan porque te obligan a responder antes de ver la respuesta. Notas de Apple no tiene modo de tarjetas, pero
        una tabla de dos columnas se acerca bastante. Aquí tienes una plantilla de flashcards para pegar en Notas, cómo estudiar con ella
        y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#estudiar", label: "Estudia con ella" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Tarjetas que vuelven a su hora" },
        ]}>
          <p>
            Notas de Apple no tiene flashcards, pero una tabla de dos columnas sirve: la pregunta a la izquierda, la respuesta a la
            derecha y una fila por tarjeta. Tapa la columna derecha para ponerte a prueba, y apunta debajo de la tabla una lista corta con
            las tarjetas que fallaste.
          </p>
          <PostCta template="study-flashcards" slug="es/flashcards-notas-iphone" path="/es/blog/flashcards-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que las tarjetas se hagan solas y vuelvan a su hora?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de flashcards con una app de estudio. Pega tus apuntes en ChatGPT o Claude y hace las tarjetas; las que fallas vuelven antes.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="Una nota Study notes and flashcards en Pinto Notes en un Mac, en inglés: una línea sobre cómo funcionan las tarjetas y luego un encabezado Notes con una sección Cell respiration de tres puntos."
        caption="Apuntes en Pinto Notes, la nota de la que salen las flashcards. Datos de ejemplo. Los encabezados y las viñetas funcionan igual en Notas de Apple; la app de estudio no se pasa." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una tabla por tema</h2>
      <p>
        Cada fila es una tarjeta. Haz la pregunta corta y la respuesta más corta todavía: una tarjeta que necesita un párrafo para
        responderse son dos tarjetas. La línea de debajo de la tabla es para las tarjetas falladas, así la siguiente sesión empieza por
        ellas.
      </p>
      <Keep title="Flashcards para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre la pregunta y la respuesta. Pégala y luego convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y luego haz la tabla.</strong> Pega la plantilla en una nota nueva, selecciona las cinco líneas que van de
          Pregunta a la última respuesta y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan Pregunta y
          Respuesta una al lado de la otra.
        </li>
        <li>
          <strong>O empieza en blanco.</strong> Elige Formato, Tabla para dos filas y dos columnas. Escribe Pregunta y Respuesta en la
          primera fila, y el tabulador en la última celda añade la tarjeta siguiente.
        </li>
        <li>
          <strong>Haz las preguntas cortas.</strong> Notas decide el ancho de las columnas y no se pueden arrastrar, así que una pregunta
          larga aprieta la respuesta.
        </li>
        <li>
          <strong>Una nota por tema.</strong> Guárdalas en una carpeta Estudio, añade a cada una una etiqueta como #biología y elige
          Archivo, Duplicar nota para empezar el siguiente tema con la misma estructura.
        </li>
      </ul>
      <p>
        Una lista de líneas &ldquo;pregunta: respuesta&rdquo; también vale, pero la respuesta queda a la vista justo al lado de la
        pregunta. La tabla te deja tapar una columna entera de una vez. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple
        Notes</a> (en inglés) cubre todo lo que una tabla en Notas puede y no puede hacer.
      </p>

      <h2 id="estudiar">Estudia con ella</h2>
      <ul>
        <li><strong>Tapa la columna derecha.</strong> Pon una tarjeta o la mano encima de las respuestas y di cada una en voz alta antes de mirar.</li>
        <li><strong>Apunta lo que fallaste.</strong> Escribe la pregunta debajo de Falladas esta vez y toca el botón Lista de comprobación. Márcala cuando la aciertes en una sesión posterior.</li>
        <li><strong>Empieza por los fallos.</strong> La próxima vez, repasa la lista antes que la tabla. Esas son las tarjetas que necesitan práctica.</li>
        <li><strong>Reinicia para la siguiente ronda.</strong> Cuando todos los fallos estén marcados, elige Formato, Más, Anular todo, o borra las líneas marcadas y empieza de cero.</li>
        <li><strong>Encuentra una tarjeta por cualquier palabra.</strong> La búsqueda lee cada palabra de cada nota, así que &ldquo;mitocondrias&rdquo; encuentra la tarjeta esté donde esté.</li>
      </ul>
      <p>
        Si tomas apuntes en clase, el método Cornell en Notas pone las preguntas justo
        al lado de tus apuntes, que es un mazo de flashcards que se hace mientras escribes. Más notas para pegar en{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llegan las flashcards en Notas</h2>
      <ul>
        <li><strong>Nada toca repasar.</strong> Notas no sabe cuándo viste una tarjeta por última vez, así que o repasas todas cada vez o llevas tú la cuenta.</li>
        <li><strong>No se dan la vuelta.</strong> La respuesta está siempre en la página. Taparla funciona, pero es fácil echar un vistazo.</li>
        <li><strong>No se barajan.</strong> Las tablas no se ordenan, así que aprendes el orden de las tarjetas junto con las respuestas.</li>
        <li><strong>Hacer las tarjetas es lo lento.</strong> Convertir un tema en buenas preguntas lleva más tiempo que estudiarlas.</li>
      </ul>
      <p>
        Para un examen la semana que viene con veinte tarjetas, una tabla en Notas basta. Para una asignatura entera, lo difícil es saber
        qué tarjetas estudiar hoy, y Notas te lo deja a ti.
      </p>

      <h2 id="pinto-notes">Flashcards que vuelven cuando toca</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y una nota también puede ser una pequeña app. La
        plantilla gratuita <a href="/templates/study-flashcards">Study notes and flashcards</a> es una de ellas: tus apuntes bajo un
        encabezado por tema y una app de estudio que te dice cuántas tarjetas toca repasar hoy. Pulsa Study now y te pregunta una tarjeta
        cada vez. Pulsa Show answer y luego di cómo te fue (Again, Hard, Good o Easy); cada botón te dice cuándo vuelve la tarjeta. Las
        que fallas vuelven antes; las que te sabes esperan más.
      </p>
      <p>
        Puedes añadir, editar y borrar cada tarjeta tú mismo en la app, o pegar una lista de líneas de pregunta y respuesta y hace las
        tarjetas. Con ChatGPT o Claude conectado, pega los apuntes de clase o un capítulo y hace de cinco a diez tarjetas junto a las
        tuyas. Di &ldquo;pregúntame diez tarjetas de biología&rdquo; y te las hace en el chat, una a una y sin la respuesta, y actualiza
        cada tarjeta como lo hace la app. Pregúntale &ldquo;¿qué tarjetas fallo siempre?&rdquo; y lee el mazo para responderte.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Los apuntes que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
