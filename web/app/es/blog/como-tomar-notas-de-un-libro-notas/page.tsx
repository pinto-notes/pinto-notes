import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "como-tomar-notas-de-un-libro-notas");

// Spanish version of /blog/apple-notes-book-notes-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "como tomar notas de un libro" gives "al leer un libro" and "notas inteligentes";
// "notas de un libro" gives ejemplo, "tomar notas de un libro" and "como hacer notas de un libro"; "notas de libros"
// gives "tomar notas de libros" and "app para notas de libros"; "plantilla resumen de libro" gives "plantilla para resumen
// de libro"; "resumen de libros plantilla" gives "plantillas para resumen de libros". So the slug and title use "tomar
// notas de un libro", and the text says plantilla. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apde615d29c2/mac ("Añadir enlaces": Edición > Añadir enlace, Comando + K),
// /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas), /es-es/guide/notes/apd58edc7964/mac ("Utilizar carpetas
// inteligentes"), the iPhone guide /es-es/guide/iphone/iph908d1558b/ios (Añadir enlace) and /iph1ac0b3a2/ios (crear una
// lista de comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable, Localizable.loctable,
// SmartFolderFilterRow.loctable and SmartFolderChecklistsFilterView.loctable: Edición, Pegar en formato Markdown and
// Pegar como Markdown in es_419, Archivo, Duplicar nota, Añadir enlace and Agregar enlace in es_419, the Etiquetas and
// Listas filters, No marcadas and No completadas in es_419). "Menú de edición" for the iPhone step is the wording the
// recipe translation uses. Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here
// is the app's own string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Cuatro mil semanas, de Oliver Burkeman

## Frases para guardar
- "Nunca llegará el día en que por fin lo tengas todo bajo control." (p. 31)

## Lo que pienso
- La lista de tareas es infinita por definición. Terminarla no es el objetivo.
- Elige tus tres grandes proyectos; todo lo demás espera.
- Lo difícil es decir que no a cosas buenas.

## La idea principal
La vida es corta y la atención, limitada. Querer hacerlo todo asegura que lo importante se quede sin sitio. Elige a propósito qué vas a desatender.

## Qué voy a hacer distinto
- [ ] Tener una lista de tres proyectos activos, no más
- [ ] Hacer lo más importante primero, antes del correo
- [ ] Dejar una tarde a la semana sin nada planeado
`;

const INDEX = `# Libros

## 2026
- Cuatro mil semanas, de Oliver Burkeman
- Deep Work, de Cal Newport
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla para notas de libros?", a: [
    "No. Notas no tiene plantillas. Una nota por libro, con encabezados para las citas, lo que piensas, la idea principal y lo que vas a hacer distinto, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo se toman notas de un libro?", a: [
    "Apunta las frases que te hacen parar, con el número de página, y al lado una idea corta tuya. Al terminar, escribe la idea principal del libro en tres frases y una o dos cosas que vas a cambiar.",
  ] },
  { q: "¿Cómo encuentro una cita otra vez en Notas de Apple?", a: [
    "La búsqueda lee cada palabra de cada nota, así que unas pocas palabras de la cita la encuentran. Si etiquetas cada nota de libro con #libros, una carpeta inteligente también puede reunirlas en un solo sitio.",
  ] },
  { q: "¿Hay una app para notas de libros que funcione como Notas de Apple?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de notas de libros. Mándale a ChatGPT o Claude tus subrayados mientras lees y los guarda bajo el libro; cuando terminas, escribe la idea principal.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="como-tomar-notas-de-un-libro-notas"
      intro={<>
        Un año después de leer un buen libro, casi todo el mundo recuerda la portada y una idea, como mucho. Una página de notas por libro
        lo cambia. Aquí tienes una plantilla para tomar notas de un libro en Notas de Apple, un índice para tenerlas juntas y hasta dónde
        llega Notas.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#mientras-lees", label: "Mientras lees" },
          { href: "#indice", label: "Tenlas juntas" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Notas que escriben la idea principal" },
        ]}>
          <p>
            Notas de Apple no tiene plantilla para notas de libros, pero una nota por libro cumple: las frases que merecen guardarse con su
            número de página, lo que piensas tú, la idea principal en tres frases cuando terminas y una lista de lo que vas a hacer
            distinto. Copia la plantilla de abajo para cada libro nuevo.
          </p>
          <PostCta template="book-notes" slug="es/como-tomar-notas-de-un-libro-notas" path="/es/blog/como-tomar-notas-de-un-libro-notas" position="answer"
            ui={ui.cta} title="¿Quieres que tus subrayados se guarden solos?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de notas de libros. Mándale un subrayado a ChatGPT o Claude mientras lees y lo guarda; cuando terminas, escribe la idea principal.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/book-notes-note" width={1520} height={1255} maxWidth={600}
        alt="Una nota Book notes en Pinto Notes en un Mac, en inglés: Four Thousand Weeks de Oliver Burkeman con una cita de la página 31, cuatro ideas, la idea principal y una lista de tres cosas que hacer distinto, y debajo Deep Work de Cal Newport."
        caption="Notas de libros en Pinto Notes, una sección por libro, tal como las guarda la plantilla. Datos de ejemplo. Los encabezados, las viñetas y la lista funcionan igual en Notas de Apple." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por libro</h2>
      <p>
        Cuatro partes, en el orden en que las rellenas. Las citas y lo que piensas llegan mientras lees. La idea principal y la lista
        llegan al terminar, y son las partes a las que vas a volver. Deja una palabra en cada línea, porque un ítem vacío de una lista no
        sobrevive al pegado.
      </p>
      <Keep title="Notas de un libro para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y la última parte en una lista de comprobación. Con un Comando + V normal, los símbolos
        se quedan como texto. En el iPhone, escríbela, selecciona las últimas líneas y toca el botón Lista de comprobación. Para el
        siguiente libro, elige Archivo, Duplicar nota y cambia las palabras.
      </p>

      <h2 id="mientras-lees">Mientras lees</h2>
      <ul>
        <li>
          <strong>Primero el número de página.</strong> Escribe la página antes de la cita. Lleva un segundo, y es como vuelves a
          encontrar la frase en el libro.
        </li>
        <li>
          <strong>Con tus palabras, no un resumen.</strong> Una idea como &ldquo;lo difícil es decir que no a cosas buenas&rdquo; vale más
          que una paráfrasis limpia del capítulo.
        </li>
        <li>
          <strong>Escribe la idea principal en un día.</strong> Tres frases, de memoria, antes de empezar el siguiente libro. Si no puedes,
          el libro no se te quedó, y eso también conviene saberlo.
        </li>
        <li>
          <strong>Haz una lista pequeña.</strong> De dos a cuatro cosas que de verdad vas a probar. Márcalas cuando se conviertan en
          costumbre.
        </li>
      </ul>

      <h2 id="indice">Tenlas juntas</h2>
      <p>
        Escribe #libros debajo del título de cada nota de libro: así se convierte en una etiqueta. Una carpeta inteligente con el filtro
        Etiquetas en libros reúne todas las notas de libros en un solo sitio, y si añades el filtro Listas en No marcadas (en
        Latinoamérica, No completadas) solo muestra los libros con algo que todavía no has probado.{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) explica cómo crear una.
      </p>
      <Keep title="Índice de libros para Notas de Apple" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
        { on: "iPhone", steps: ["Menú de edición", "Añadir enlace"] },
      ]} />
      <p>
        Para tener un índice por años, guarda una nota más, Libros, y convierte cada título en un enlace: selecciónalo, elige Añadir
        enlace (en Latinoamérica, Agregar enlace) y escoge la nota del libro. La búsqueda lee cada palabra de cada nota, así que unas
        pocas palabras de una cita la encuentran aunque hayas olvidado de qué libro era. Los libros que aún no has leído van en una{" "}
        <a href="/es/blog/lista-de-libros-leidos-notas-iphone">lista de libros por leer</a>, y hay más notas para pegar en{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llegan las notas de libros en Notas</h2>
      <ul>
        <li><strong>Cada cita se escribe a mano.</strong> Copiar una frase de un libro en papel significa dejar el libro, buscar la nota y escribirla.</li>
        <li><strong>La idea principal es lo que casi todos se saltan.</strong> Nada te recuerda escribirla, y una semana después cuesta más.</li>
        <li><strong>El índice es a mano.</strong> Un libro nuevo no está en él hasta que añades su enlace.</li>
        <li><strong>Los libros van cada uno por su lado.</strong> La búsqueda encuentra palabras. No te dice qué tenían en común tres libros sobre la concentración.</li>
      </ul>

      <h2 id="pinto-notes">Notas de libros que escriben la idea principal</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/book-notes">Book notes</a> es una sola nota con una sección por libro,
        del más reciente al más antiguo: las citas, lo que piensas, la idea principal y lo que vas a hacer distinto.
      </p>
      <p>
        Dile a tu IA qué libro estás leyendo y empieza su sección. Mándale un subrayado según avanzas, como &ldquo;página 31: nunca
        llegará el día en que por fin lo tengas todo bajo control&rdquo;, y lo guarda como cita con el número de página. Lo que piensas
        tú entra como viñetas, con tus palabras y sin pulir. Di &ldquo;lo he terminado, ciérralo&rdquo; y escribe la idea principal en
        tres frases y de dos a cuatro cosas que vas a hacer distinto, como lista de comprobación. Puedes seguir escribiendo y editando
        cada línea tú mismo, y se guardan todas las versiones anteriores de la nota.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Las notas de libros que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola
        importación en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
