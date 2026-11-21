import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "lista-de-libros-leidos-notas-iphone");

// Spanish version of /blog/apple-notes-reading-list (templates, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es and gl=mx) on 21 Nov: "lista de libros leidos" gives "hacer lista de libros leidos" and "app lista de libros
// leidos"; "libros leidos plantilla" gives pdf, excel, 2026; "lista de libros por leer" gives "como hacer una lista de
// libros por leer"; "lista de lectura" gives iphone, safari and chrome (the browser's Reading List, another thing);
// "plantilla lista de lectura" and "lista de libros notas iphone" give nothing. So the slug and title say "libros
// leídos" and "por leer", not "lista de lectura". Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac": botón Tabla, Formato >
// Tabla, Tabulador in the last cell adds a row), /es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el
// Mac": Ordenar automáticamente los ítems marcados en los ajustes de Notas), the Mac guide's "Ordenar y fijar notas"
// page title, /es-es/102462 ("Si no puedes colaborar en la app Notas": Cuenta de Apple, as cited in the meeting notes
// translation), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (crear una lista de comprobación), and the Notes
// app's own Spanish strings on macOS 27.2 (MainMenu.loctable and Localizable.loctable: Formato, Tabla, Edición, Pegar en
// formato Markdown and Pegar como Markdown in es_419, Fijar nota and Anclar nota in es_419). Paste as Markdown is new in
// macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. It is not used for the
// table, as in the English post. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

// Tabs between the columns: select the six table lines in Notes and press the Table button.
const TEMPLATE = `Lista de lectura

Título\tAutor\tEstado\tPuntuación\tPor qué
Proyecto Hail Mary\tAndy Weir\tLeído\t5\tClub de lectura
Piranesi\tSusanna Clarke\tLeyendo\tAún no\tDe Jonás
Guerra y paz\tLev Tolstói\tAbandonado\t2\tLo dejé en la p. 90
Nunca me abandones\tKazuo Ishiguro\tLeído\t4\tPara las vacaciones
El clamor de los bosques\tRichard Powers\tPor leer\tAún no\tMe lo prestó Sara

Comentarios
Proyecto Hail Mary: La amistad sostiene todo el libro. Se lo dejo a papá.
Nunca me abandones: Tranquilo y extraño. Estuve semanas dándole vueltas.
`;

const SIMPLE = `# Lista de lectura

## Por leer
- [ ] Piranesi, de Susanna Clarke (me lo recomendó Jonás)
- [ ] El clamor de los bosques, de Richard Powers (me lo prestó Sara)

## Leídos
- Proyecto Hail Mary, de Andy Weir: 5 de 5
- Nunca me abandones, de Kazuo Ishiguro: 4 de 5
`;

const FAQ = [
  { q: "¿Cómo hago una lista de libros en Notas de Apple?", a: [
    "Haz una nota llamada Lista de lectura con una tabla de título, autor, estado, puntuación y por qué. Si quieres algo más sencillo, usa una lista de comprobación con los libros por leer y marca cada uno al terminarlo.",
  ] },
  { q: "¿Puedo ordenar mi lista de libros en Notas de Apple?", a: [
    "No. Las tablas de Notas no se ordenan, así que los libros se quedan en el orden en que los añadiste. Una lista de comprobación sí puede bajar al final los libros marcados si activas Ordenar automáticamente los ítems marcados en los ajustes de Notas.",
  ] },
  { q: "¿Puedo compartir la lista con mi club de lectura?", a: [
    "Sí. Comparte la nota y todos pueden añadir libros, pero cada persona necesita una Cuenta de Apple.",
  ] },
  { q: "¿Hay una app de lista de lectura que funcione como Notas de Apple?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de lista de lectura con estado y una puntuación del 1 al 5. Háblale de un libro a ChatGPT o Claude y lo apunta; pregúntale qué leer después y te sugiere uno de tu lista.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="lista-de-libros-leidos-notas-iphone"
      intro={<>
        Los libros que te recomiendan acaban en capturas de pantalla, mensajes y pestañas del navegador, y cuando buscas algo que leer ya
        no están. Notas de Apple puede guardarlos en una sola nota. Aquí tienes una plantilla de lista de libros leídos y por leer para
        Notas, una versión más sencilla con una lista de comprobación y hasta dónde llega Notas.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#lista", label: "Una lista más sencilla" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una lista que se rellena sola" },
        ]}>
          <p>
            Notas de Apple no tiene plantilla de lista de lectura, pero una nota con una tabla cumple: título, autor, estado, una
            puntuación sobre 5 y por qué lo querías leer. Añade una fila cuando alguien te recomiende un libro y escribe unas líneas en
            Comentarios cuando termines uno.
          </p>
          <PostCta template="reading-list" slug="es/lista-de-libros-leidos-notas-iphone" path="/es/blog/lista-de-libros-leidos-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que tus libros se apunten solos?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de lista de lectura. Háblale de un libro a ChatGPT o Claude y añade la fila; pregúntale qué leer después y elige uno de tu lista.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/reading-list-note" width={1520} height={1153} maxWidth={600}
        alt="Una nota Reading list en Pinto Notes en un Mac, en inglés: una tabla Books de cinco libros con título, autor, estado, puntuación y por qué, desde Project Hail Mary, leído y con un 5, hasta The Overstory, por leer, y debajo comentarios sobre dos libros."
        caption="Una lista de lectura en Pinto Notes, donde el estado se elige de una lista y la puntuación va del 1 al 5. Datos de ejemplo. En Notas de Apple la misma tabla funciona con las palabras escritas a mano." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una tabla de libros</h2>
      <p>
        Con cinco columnas basta. El estado es una de cuatro palabras: Por leer, Leyendo, Leído o Abandonado. Por qué es la columna que
        más vas a agradecer: dentro de un año, &ldquo;De Jonás&rdquo; te dice más que el título. Los libros abandonados se quedan en la
        lista, para que no vuelvas a empezarlos por error.
      </p>
      <Keep title="Lista de libros para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre las columnas. Pégala y luego convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y luego haz la tabla.</strong> Pega la plantilla en una nota nueva, selecciona las seis líneas que van de Título a
          El clamor de los bosques y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan cinco columnas
          una al lado de la otra.
        </li>
        <li>
          <strong>Añade un libro en un segundo.</strong> Haz clic en la última celda y pulsa el tabulador: aparece una fila nueva para el
          siguiente libro.
        </li>
        <li>
          <strong>Que las celdas sean cortas.</strong> Notas decide el ancho de las columnas y no se pueden arrastrar, así que cinco
          columnas se reparten el espacio. Lo que dé para más va en Comentarios, debajo de la tabla.
        </li>
        <li>
          <strong>Fíjala.</strong> Fija la nota en lo alto de su carpeta (en Latinoamérica, Anclar nota), para que sea lo primero que ves
          cuando un amigo te dice &ldquo;tienes que leer esto&rdquo;.
        </li>
      </ul>
      <p>
        La búsqueda lee cada palabra de la nota, así que buscar un autor o el nombre de un amigo encuentra la lista. Para compartirla con
        un club de lectura, comparte la nota; cada persona necesita una Cuenta de Apple.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) cubre todo lo demás que una tabla puede y
        no puede hacer.
      </p>

      <h2 id="lista">Una versión más sencilla, con una lista</h2>
      <p>
        Si una tabla es más de lo que quieres, una lista de comprobación sirve. Los libros por leer van en la lista y marcas uno cuando lo
        terminas. Deja una palabra en cada línea, porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Lista de libros por leer para Notas de Apple" text={SIMPLE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, las líneas con ## en encabezados y los libros en una lista de comprobación. Con un Comando + V normal, los símbolos se
        quedan como texto. En el iPhone, escríbela, selecciona los libros y toca el botón Lista de comprobación. Activa Ordenar
        automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica) y los libros que has terminado bajan
        al final. Cuando quieras recordar uno, pásalo a Leídos con su puntuación.
      </p>
      <p>
        Para guardar algo más que una puntuación, guarda para cada libro sus citas, lo que piensas tú y la idea principal. Más notas para pegar en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en
        inglés).
      </p>

      <h2 id="limites">Hasta dónde llega una lista de libros en Notas</h2>
      <ul>
        <li><strong>No se ordena ni se filtra.</strong> Las tablas no se ordenan, así que encontrar todos los libros Por leer significa leer la columna Estado de arriba abajo.</li>
        <li><strong>El estado es solo texto.</strong> Nada impide que &ldquo;Leído&rdquo; y &ldquo;Terminado&rdquo; acaben en la misma columna.</li>
        <li><strong>Cada libro se escribe a mano.</strong> Una recomendación en un mensaje no está en la lista hasta que la copias.</li>
        <li><strong>La lista no responde.</strong> Guarda lo que puntuaste alto, pero no te dice qué libro por leer se parece más a los que te encantaron.</li>
      </ul>

      <h2 id="pinto-notes">Una lista de lectura que se rellena sola</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/reading-list">Reading list</a> es una nota con una tabla Books y una
        sección Notes. El estado se elige entre To read, Reading, Finished o Dropped, y la puntuación es una escala del 1 al 5, así que
        los eliges en vez de escribirlos.
      </p>
      <p>
        Háblale de un libro a tu IA y añade una fila: el título, el autor, To read, y quién te lo recomendó o por qué lo quieres leer. Di
        &ldquo;he terminado Piranesi, cinco estrellas&rdquo; y cambia el estado y la puntuación. Lo que piensas de un libro va en Notes,
        bajo su título. Pregúntale &ldquo;¿qué leo ahora?&rdquo; y te sugiere uno de tus libros por leer, según los que puntuaste alto.
        Puedes seguir añadiendo y editando cada fila tú mismo, y se guardan todas las versiones anteriores de la nota.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        La lista de libros que ya tienes en Notas de Apple se pasa con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola
        importación en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
