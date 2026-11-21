import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "registro-estado-de-animo-notas-iphone");

// Spanish version of /blog/apple-notes-mood-tracker (templates, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es and gl=mx) on 21 Nov: "registro del estado de animo" gives "registro diario del estado de animo", pdf and "app
// registro estado de animo"; "registro de emociones" gives diarias, para adultos, pdf, tcc; "tracker de emociones" gives
// pdf and "mood tracker registro de emociones"; "mood tracker" gives "en español", app, mensual, plantilla; "estado de
// animo iphone" gives "registrar estado de animo iphone". So the slug and title use "registro del estado de ánimo",
// and the text says mood tracker once. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac": botón Tabla, Formato >
// Tabla, two rows and two columns, Tabulador in the last cell adds a row), /es-es/guide/notes/apdb54e469b6/mac
// ("Ordenar y fijar notas": Fijar nota), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable and
// Localizable.loctable: Formato, Tabla, Fijar nota and Anclar nota in es_419, Resultados matemáticos and Resultados de
// los cálculos in es_419). Paste as Markdown is not used here, as in the English post. The template uses a decimal
// comma for hours of sleep. No medical advice, as in the English post. Facts are the English post's; the screenshot is
// its English one, described in Spanish.

const ui = UI.es;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TEMPLATE = `Registro de ánimo y energía

Fecha\tÁnimo (1 a 5)\tEnergía (1 a 5)\tSueño (horas)\tNota
4 nov\t4\t4\t7,5\tGimnasio antes del trabajo
5 nov\t3\t2\t6\tReuniones todo el día
6 nov\t4\t3\t6,5\tComida con Maja
7 nov\t4\t2\t5,5\tMudanza de Maja
8 nov\t4\t4\t8\tMe quedé durmiendo

Patrones
`;

const FAQ = [
  { q: "¿Notas de Apple tiene un registro del estado de ánimo?", a: [
    "No. Notas no tiene mood tracker ni plantillas. Una tabla con una fila por cada noche, con ánimo, energía, sueño y una nota corta, funciona como uno, y puedes pegar la plantilla de esta página y convertirla en tabla.",
  ] },
  { q: "¿Qué debe tener un registro del estado de ánimo?", a: [
    "Lo justo para rellenarlo cada noche: la fecha, el ánimo y la energía del 1 al 5, las horas de sueño y una línea sobre el día. La línea es lo que más importa, porque es lo que explica una nota baja más adelante.",
  ] },
  { q: "¿Notas puede hacer un gráfico de mi estado de ánimo?", a: [
    "No. Una tabla de Notas no ordena, no suma y no dibuja gráficos. Las columnas las lees tú, o copias las filas a una hoja de cálculo cuando quieras un gráfico.",
  ] },
  { q: "¿Hay un registro del estado de ánimo que encuentre patrones por mí?", a: [
    "Pinto Notes tiene una plantilla gratuita de registro de ánimo y energía. Cuéntale tu día a ChatGPT o Claude y apunta las puntuaciones, y cuando se lo pides, escribe lo que ve y en cuántos días se basa.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="registro-estado-de-animo-notas-iphone"
      intro={<>
        Una mala semana parece salir de la nada hasta que miras las noches de antes. Un registro del estado de ánimo es la forma de
        mirarlo. Aquí tienes un registro de ánimo y energía para pegar en Notas de Apple, una forma de mantenerlo más de una semana y el
        punto en que una nota deja de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#cada-noche", label: "Cada noche" },
          { href: "#mirar-atras", label: "Mirar atrás" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un registro que ve patrones" },
        ]}>
          <p>
            Notas no tiene mood tracker, pero una tabla sirve: una fila por cada noche con la fecha, el ánimo y la energía del 1 al 5,
            las horas de sueño y una línea sobre el día. Después de unas semanas, lee las columnas de arriba abajo para ver qué tienen en
            común tus días buenos.
          </p>
          <PostCta template="mood-energy-log" slug="es/registro-estado-de-animo-notas-iphone" path="/es/blog/registro-estado-de-animo-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que alguien encuentre los patrones?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un registro gratuito de ánimo y energía. Cuéntale tu día a ChatGPT o Claude y apunta la fila, y cuando se lo pides te dice lo que ve.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="Una nota Mood and energy log en Pinto Notes en un Mac, en inglés: una tabla Check-ins con cinco noches del 4 al 8 de noviembre, cada una con ánimo, energía, horas de sueño y una nota corta, y tres patrones debajo."
        caption="Un registro de ánimo y energía en Pinto Notes, donde ánimo y energía son escalas del 1 al 5. En Notas de Apple, las mismas columnas funcionan como una tabla normal. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una fila cada noche</h2>
      <p>
        Cinco columnas, y todas se ganan su sitio. El ánimo es cómo te ha sentado el día. La energía es cuánta has tenido, que no es lo
        mismo: un buen día puede dejarte sin fuerzas. El sueño es el número que más probablemente explica los dos. La nota es una línea
        sobre el día, para que un 3 siga significando algo dentro de dos semanas. Hay cinco noches de ejemplo rellenas; cámbialas por las
        tuyas.
      </p>
      <Keep title="Registro de ánimo y energía para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre las columnas. Pégala y luego convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y luego crea la tabla.</strong> Pega la plantilla en una nota nueva, selecciona las seis líneas desde Fecha hasta
          la última noche y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan Fecha, Ánimo, Energía,
          Sueño y Nota una al lado de otra.
        </li>
        <li>
          <strong>Borra los ejemplos y añade tus filas.</strong> Borra las noches de ejemplo o escribe encima. El tabulador en la última
          celda añade la fila siguiente.
        </li>
        <li>
          <strong>Que la nota sea corta.</strong> Notas decide el ancho de las columnas y no puedes arrastrarlas, así que una nota larga
          aprieta los números. Con unas pocas palabras basta.
        </li>
        <li>
          <strong>Fíjala.</strong> Fija la nota arriba de su carpeta, para tener el registro de cada noche a un toque.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa todo lo que una tabla de Notas puede
        y no puede hacer.
      </p>

      <h2 id="cada-noche">Cada noche</h2>
      <ul>
        <li><strong>A la misma hora, todos los días.</strong> Rellénalo cuando te lavas los dientes o pones el móvil a cargar, para que vaya pegado a algo que ya haces.</li>
        <li><strong>Puntúa el día entero.</strong> El ánimo a las 22:00 después de una buena cena dice poco de una tarde difícil. Repasa el día antes de elegir un número.</li>
        <li><strong>Usa toda la escala.</strong> Si todos los días son un 3, el registro no puede enseñarte nada. Un 1 o un 5 de vez en cuando es lo honesto.</li>
        <li><strong>Escribe qué fue distinto.</strong> &ldquo;Reuniones todo el día&rdquo; o &ldquo;me quedé durmiendo&rdquo; es lo que buscarás más adelante.</li>
        <li><strong>Si te saltas un día, déjalo vacío.</strong> Un hueco es mejor que una puntuación inventada tres días después.</li>
      </ul>
      <p>
        Si quieres palabras además de números, el <a href="/es/blog/diario-personal-notas-iphone">diario personal en Notas</a> hace
        cuatro preguntas cortas al día, y el <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos</a> encaja junto a esta
        nota para cosas como un paseo o nada de pantallas después de las diez.
      </p>

      <h2 id="mirar-atras">Mirar atrás</h2>
      <p>
        Una vez a la semana, lee la tabla de arriba abajo y apunta lo que veas debajo de Patrones. La búsqueda lee todas las palabras de
        todas las notas, así que buscar &ldquo;reuniones&rdquo; encuentra todos los días en que lo escribiste. Para un total rápido,
        Resultados matemáticos hace las sumas que escribes, así que 4+3+4+4+4= debajo de la tabla suma el ánimo de la semana.
      </p>
      <p>
        Dale unas semanas antes de sacar conclusiones; cinco días son un comienzo. Esto es un diario de cómo te has sentido, no una
        herramienta de salud. Si los días bajos se siguen acumulando, habla con un médico.
      </p>

      <h2 id="limites">Hasta dónde llega un registro del estado de ánimo en Notas</h2>
      <ul>
        <li><strong>Las tablas no cuentan.</strong> Una tabla de Notas no puede poner arriba tus mejores días, sacar la media de una columna ni dibujar un gráfico.</li>
        <li><strong>Los patrones van a ojo.</strong> Ver que la energía baja después de una noche corta significa leer cada fila y acordarte de todo.</li>
        <li><strong>La fila se escribe a mano.</strong> En una noche de cansancio, cinco celdas bastan para que te la saltes.</li>
      </ul>
      <p>
        Para un mes, una tabla en una nota es todo lo que necesitas. Con los meses, la parte útil, ver qué te anima y qué te agota, te
        queda a ti.
      </p>

      <h2 id="pinto-notes">Un registro de ánimo que encuentra patrones</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/mood-energy-log">Mood and energy log</a> es una sola nota con una tabla
        Check-ins: la fecha, el ánimo y la energía como escalas del 1 al 5, el sueño en horas y una nota, con Patterns debajo.
      </p>
      <p>
        Cada noche, cuéntale tu día a tu IA con tus palabras. Añade la fila, con el ánimo y la energía del 1 (bajo) al 5 (genial), tu
        sueño y una línea corta. Cuando no está segura de una puntuación, te pregunta en vez de adivinar. Después de unas semanas,
        pregúntale &ldquo;¿qué tienen en común mis mejores días?&rdquo; o &ldquo;¿una noche corta cambia mi energía al día
        siguiente?&rdquo; y escribe lo que ve debajo de Patterns, con en cuántos días se basa. No da consejos médicos. Puedes seguir
        añadiendo y editando cada fila tú, y se guardan todas las versiones anteriores de la nota. Esto funciona cuando ChatGPT o Claude
        están conectados, y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Un registro que ya llevas en Notas de Apple se pasa con{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en inglés), y Notas de Apple no cambia.
        La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
