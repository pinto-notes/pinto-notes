import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "metodo-cornell-notas-iphone");

// Spanish version of /blog/apple-notes-cornell-notes-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "metodo cornell" gives plantilla, apuntes, ejemplo, "para tomar
// notas"; "notas cornell" gives plantilla, ejemplos, pdf; "apuntes cornell" gives plantilla and ejemplos; "plantilla
// cornell" gives pdf, word, "samsung notes" and goodnotes; "metodo cornell notas iphone" gives nothing. Students say
// apuntes, so the text uses it. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac": botón Tabla, Formato >
// Tabla, two rows and two columns, Tabulador or Retorno in the last cell adds a row, select paragraphs and click
// Tabla to turn them into a table) and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable: Formato,
// Tabla, Archivo, Duplicar nota). That Notes sets column widths itself is from the English post's own test on macOS
// 27; Apple's page doesn't cover widths. Paste as Markdown is not used here, as in the English post. Facts are the
// English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

// Tabs between the cue and the note: select those lines in Notes and press the Table button.
const TEMPLATE = `Oferta y demanda, 5 de noviembre

Pregunta\tNotas
¿Qué desplaza la curva de demanda?\tLa renta, los gustos, los precios de bienes relacionados
¿Qué te mueve a lo largo de la curva?\tSolo el precio del propio bien
¿Cuál es el precio de equilibrio?\tDonde la demanda iguala a la oferta
¿Qué provoca un precio máximo?\tEscasez, si está por debajo del equilibrio

Resumen: El precio del propio bien te mueve a lo largo de la curva de demanda; la renta, los gustos y los precios relacionados la desplazan. El precio se fija donde la demanda iguala a la oferta.
`;

const FAQ = [
  { q: "¿Se pueden tomar apuntes Cornell en Notas de Apple?", a: [
    "Sí, con una tabla. Crea una tabla de dos columnas, pon preguntas en la columna izquierda y tus notas en la derecha, y escribe un resumen de dos o tres frases debajo. Para repasar, tapa la columna derecha y responde a las preguntas.",
  ] },
  { q: "¿Cómo hago una tabla de dos columnas en Notas?", a: [
    "En un Mac, elige Formato, Tabla, o pulsa Opción + Comando + T. Te sale una tabla de dos filas y dos columnas, y el tabulador en la última celda añade una fila. También puedes escribir las filas con un tabulador entre las dos partes, seleccionarlas y pulsar el botón Tabla.",
  ] },
  { q: "¿Puedo hacer más estrecha la columna de preguntas?", a: [
    "No. Notas decide el ancho de las columnas y no se pueden arrastrar. Haz las preguntas cortas, de unas pocas palabras, y la columna de notas se queda con el espacio.",
  ] },
  { q: "¿Hay una app de apuntes Cornell que me haga preguntas?", a: [
    "Pinto Notes tiene una plantilla gratuita de apuntes Cornell. Pega tus apuntes de clase en ChatGPT o Claude y escribe las preguntas y el resumen, luego te pregunta y guarda las que fallaste.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="metodo-cornell-notas-iphone"
      intro={<>
        El método Cornell funciona porque convierte tus apuntes en preguntas con las que ponerte a prueba. Notas de Apple no trae ese
        formato, pero una tabla de dos columnas te lleva hasta ahí. Aquí tienes una plantilla Cornell para Notas de Apple, cómo repasar
        con ella y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#repasar", label: "Repasa con ella" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Apuntes que te preguntan" },
        ]}>
          <p>
            Notas no tiene plantilla Cornell, pero una tabla de dos columnas funciona: una pregunta corta a la izquierda, tu nota a la
            derecha, una fila por idea y un resumen de dos o tres frases debajo de la tabla. Usa una nota por clase y tapa la columna
            derecha para repasar.
          </p>
          <PostCta slug="es/metodo-cornell-notas-iphone" path="/es/blog/metodo-cornell-notas-iphone" position="answer" ui={ui.cta}
            title="¿Quieres las preguntas escritas, y un test?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de apuntes Cornell. Pega tus apuntes de clase en ChatGPT o Claude y escribe las preguntas y el resumen, y luego te pregunta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="Una nota Cornell notes en Pinto Notes en un Mac, en inglés: una clase de oferta y demanda con una tabla Cue y Notes de cuatro filas, un resumen y una lista Cues to revisit."
        caption="Apuntes Cornell en Pinto Notes: preguntas a la izquierda, notas a la derecha, un resumen y las preguntas que fallaste. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: preguntas, notas y resumen</h2>
      <p>
        La hoja Cornell original tiene tres partes, y una nota puede tenerlas todas. La columna de notas es lo que escribiste en clase, en
        líneas cortas. La columna de preguntas es una pregunta que responde cada línea, escrita después de clase. El resumen son dos o tres
        frases con tus palabras, y ahí es donde se recuerda casi todo.
      </p>
      <Keep title="Apuntes Cornell para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre la pregunta y la nota. Pégala y luego convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y luego haz la tabla.</strong> Pega la plantilla en una nota nueva, selecciona las cinco líneas que van de Pregunta
          a la última nota y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan Pregunta y Notas una al
          lado de la otra.
        </li>
        <li>
          <strong>O empieza en blanco.</strong> Elige Formato, Tabla para dos filas y dos columnas. Escribe Pregunta y Notas en la primera
          fila, y el tabulador en la última celda añade la fila siguiente.
        </li>
        <li>
          <strong>Haz las preguntas cortas.</strong> Notas decide el ancho de las columnas y no se pueden arrastrar, así que una pregunta
          larga aprieta tus notas. Unas pocas palabras, en forma de pregunta.
        </li>
        <li>
          <strong>Una nota por clase.</strong> Guárdalas en una carpeta por asignatura, y elige Archivo, Duplicar nota para empezar la
          siguiente clase a partir de la anterior.
        </li>
      </ul>
      <p>
        En clase, rellena solo la columna Notas. Escribe las preguntas y el resumen esa misma tarde, mientras aún recuerdas qué quería
        decir la clase. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) cubre todo lo que una
        tabla en Notas puede y no puede hacer.
      </p>

      <h2 id="repasar">Repasa con ella</h2>
      <ul>
        <li><strong>Tapa la columna derecha.</strong> Pon una tarjeta o la mano encima de las notas y responde en voz alta a cada pregunta.</li>
        <li><strong>Apunta lo que fallaste.</strong> Ten una lista corta debajo del resumen con las preguntas que fallaste, y marca cada una cuando la aciertes.</li>
        <li><strong>Lee primero los resúmenes.</strong> Antes de un examen, los resúmenes de todas las clases son la forma más rápida de volver a meterte en una asignatura.</li>
      </ul>
      <p>
        Para otras notas que se pegan igual, mira <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en
        inglés), y para llevar al día una semana de estudio, el <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos en
        Notas</a> también sirve para las sesiones de repaso.
      </p>

      <h2 id="limites">Hasta dónde llegan los apuntes Cornell en Notas</h2>
      <ul>
        <li><strong>Las preguntas te tocan a ti.</strong> Convertir cada línea de tus apuntes en una buena pregunta es la parte lenta, y es la que la gente se salta.</li>
        <li><strong>No hay test.</strong> Tapar una columna con la mano funciona, pero nada te hace las preguntas ni recuerda cuáles fallaste.</li>
        <li><strong>Las clases van por separado.</strong> Repasar un tema que ocupó tres clases es abrir tres notas.</li>
      </ul>

      <h2 id="pinto-notes">Apuntes Cornell que te preguntan</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/cornell-notes">Cornell notes</a> es una nota por asignatura: una
        sección por clase con una tabla de preguntas y notas y un resumen, y una lista de preguntas para repasar.
      </p>
      <p>
        Pega en tu IA tus apuntes de clase o de lectura. Pone tus notas a la derecha en filas cortas, escribe una pregunta para cada una a
        la izquierda y cierra con un resumen en frases sencillas. Di &ldquo;pregúntame sobre oferta y demanda&rdquo; y te hace las
        preguntas de una en una sin enseñarte las respuestas, luego añade las que fallaste a la lista para repasar y las marca cuando las
        aciertas más adelante. Puedes seguir escribiendo y editando cada fila tú, y se guardan todas las versiones anteriores de la nota.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto. La app está en
        inglés.
      </p>
    </LocalPostPage>
  );
}
