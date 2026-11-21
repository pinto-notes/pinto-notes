import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "lista-de-regalos-notas-iphone");

// Spanish version of /blog/apple-notes-gift-ideas (templates, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es and gl=mx) on 21 Nov: "lista de regalos" gives cumpleaños, navidad, boda and baby shower; "lista de regalos
// plantilla" gives excel, "navidad plantilla" and "plantilla lista de regalos cumpleaños"; "lista de regalos navidad"
// gives plantilla, ideas and online; "lista de ideas de regalos" is a search of its own; "ideas de regalos" gives
// cumpleaños, navidad and "para mujer". So the slug and title use "lista de regalos", and the text says ideas de regalos
// too. Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir
// una tabla en Notas en el Mac": Formato > Tabla, botón Tabla, Tabulador in the last cell adds a row),
// /es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Formato > Más > Anular todo, Ordenar
// automáticamente los ítems marcados), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de
// comprobación), Resultados matemáticos as cited in the budget translation (/es-es/guide/notes, "Resolver problemas
// matemáticos"), locking with a password or Face ID o Touch ID as cited in the olvide-contrasena translation, and the Notes app's
// own Spanish strings on macOS 27.2 (MainMenu.loctable, Localizable.loctable: Edición, Pegar en formato Markdown and
// Pegar como Markdown in es_419, Formato, Tabla, Más, Fijar nota and Anclar nota in es_419, Bloquear nota). Paste as
// Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. The
// example budgets are euros here; the English screenshot shows kronor. Facts are the English post's; the screenshot is
// its English one, described in Spanish.

const ui = UI.es;

const SKELETON = `# Ideas de regalos

## Ideas
Pega la tabla aquí.

## Tallas y gustos
- Maja: cocina mucho, ya tiene batidora amasadora.
- Jonás: talla M, le encanta todo lo verde.
- Mamá: nada de más cosas; prefiere hacer algo juntos.
- Papá: tiene todas las bufandas que vende el club.

## Navidad
- [ ] Mamá
- [ ] Papá
- [ ] Jonás
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Persona\tOcasión\tIdea\tPresupuesto\tEstado
Maja\tCasa nueva\tUn buen cuchillo de cocina\t90\tIdea
Papá\tNavidad\tEntradas para el fútbol\t50\tComprado
Jonás\tCumpleaños\tUn gorro de lana verde\t30\tIdea
Mamá\tNavidad\tUn fin de semana fuera\t250\tIdea
Emma\tAgradecimiento\tUn buen aceite de oliva\t20\tRegalado
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de lista de regalos?", a: [
    "No. Notas no tiene plantillas. Una nota con una tabla de ideas por persona y una lista de tallas y gustos funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo llevo la lista de regalos de Navidad en el iPhone?", a: [
    "Ten una nota con una lista de comprobación de todas las personas a las que regalas y marca cada nombre cuando hayas comprado su regalo. Fija la nota para que esté arriba cuando estés en una tienda.",
  ] },
  { q: "¿Puedo esconder una lista de regalos en Notas?", a: [
    "Sí. Bloquea la nota con una contraseña o con Face ID o Touch ID, y su contenido queda oculto hasta que la desbloqueas.",
  ] },
  { q: "¿Hay una app de ideas de regalos que recuerde lo que le gusta a cada uno?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de ideas de regalos. Cuéntale a ChatGPT o a Claude lo que le gustaría a alguien y lo guarda, y antes de un cumpleaños te sugiere regalos dentro del presupuesto.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="lista-de-regalos-notas-iphone"
      intro={<>
        La idea de regalo perfecta sale en marzo, de pasada, y en diciembre ya no te acuerdas. Una nota a la que la añades en cuanto la
        oyes lo arregla. Aquí tienes una lista de ideas de regalos para Notas de Apple, por persona, con presupuestos y tallas, lista para
        Navidad y para cada cumpleaños que venga después.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#todo-el-ano", label: "Todo el año" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una lista que sugiere regalos" },
        ]}>
          <p>
            Notas no tiene plantilla de lista de regalos, pero una nota sirve: una tabla con la persona, la ocasión, la idea, un
            presupuesto y si ya está comprado, y debajo una lista de tallas y gustos de cada persona. Fíjala y apunta cada idea en cuanto
            la oigas.
          </p>
          <PostCta template="gift-ideas" slug="es/lista-de-regalos-notas-iphone" path="/es/blog/lista-de-regalos-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres guardar las ideas según las oyes?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una lista de ideas de regalos gratuita. Cuéntale a ChatGPT o a Claude lo que le gustaría a alguien y añade la idea, y antes de un cumpleaños te sugiere regalos dentro del presupuesto.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="Una nota Gift ideas en Pinto Notes en un Mac, en inglés: una tabla Ideas con cinco regalos para Maja, papá, Jonas, mamá y Emma con la ocasión, un presupuesto en coronas suecas y un estado, y una lista Sizes and likes de cuatro personas."
        caption="Una lista de ideas de regalos en Pinto Notes, donde Budget es un número y Status se elige de una lista. En Notas de Apple, la misma tabla los guarda como texto escrito." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: ideas por persona, tallas y gustos</h2>
      <p>
        La tabla guarda cada idea, una fila cada una, así que ves de un vistazo quién tiene algo y quién no. La lista de tallas y gustos
        es lo que vas sabiendo de cada persona a lo largo del año: una talla, un color favorito, lo que ya tiene. La lista de Navidad es a
        quién te falta regalarle algo. La nota va en dos partes: primero los encabezados y las listas, luego la tabla.
      </p>
      <Keep title="Ideas de regalos para Notas de Apple" text={SKELETON} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y los nombres de debajo de Navidad en una lista de comprobación. Con un Comando + V
        normal, los símbolos se quedan como texto. En el iPhone, escríbela, selecciona los nombres y toca el botón Lista de comprobación.
        Luego cambia la línea de debajo de Ideas por la tabla.
      </p>
      <Keep title="Tabla de ideas" text={TABLE} copyLabel={ui.copy}
        note="Cada línea lleva un tabulador entre las columnas. Pégala y convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Pega y crea la tabla.</strong> Pega las líneas de la tabla debajo de Ideas, selecciona las seis líneas, de Persona al
          último regalo, y pulsa el botón Tabla. Cada tabulador se convierte en una columna.
        </li>
        <li>
          <strong>O empieza en blanco.</strong> Elige Formato, Tabla para dos filas y dos columnas, y el tabulador en la última celda
          añade la fila siguiente.
        </li>
        <li>
          <strong>Ideas cortas.</strong> Notas decide el ancho de las columnas y no puedes arrastrarlas. &ldquo;Un gorro de lana
          verde&rdquo; basta, y los detalles van en Tallas y gustos.
        </li>
        <li>
          <strong>Bloquéala si compartes el Mac con la familia.</strong> Una nota bloqueada solo se abre con tu contraseña o con Face ID o Touch ID.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa todo lo que una tabla de Notas
        puede y no puede hacer.
      </p>

      <h2 id="todo-el-ano">Todo el año, y en Navidad</h2>
      <ul>
        <li>
          <strong>Fíjala.</strong> Una nota fijada se queda arriba de su carpeta, así que una idea que oyes en una cena entra antes de
          que se te olvide.
        </li>
        <li>
          <strong>Busca por nombre.</strong> La búsqueda de Notas lee cada palabra, así que buscar &ldquo;Jonás&rdquo; encuentra su fila
          y su talla.
        </li>
        <li>
          <strong>Suma los presupuestos tú.</strong> Las tablas no suman, pero Resultados matemáticos hace las cuentas que escribes.
          Debajo de la tabla, escribe 50 + 250 = y Notas te da lo que llevas de Navidad.
        </li>
        <li>
          <strong>Marca los nombres según compras.</strong> Con Ordenar automáticamente los ítems marcados activado, las personas que
          faltan suben arriba de la lista de Navidad.
        </li>
        <li>
          <strong>Empieza de cero el diciembre que viene.</strong> Haz clic en la lista de Navidad y elige Formato, Más, Anular todo.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Más", "Anular todo"] }]} />
      <p>
        Para tener a la vista todo lo que gastas en la temporada, la{" "}
        <a href="/es/blog/plantilla-presupuesto-mensual-notas-iphone">plantilla de presupuesto para Notas</a> se suma sola con Resultados
        matemáticos. Hay más notas para pegar en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en
        inglés).
      </p>

      <h2 id="limites">Hasta dónde llega una lista de regalos en Notas</h2>
      <ul>
        <li><strong>Las ideas llegan por otro lado.</strong> Una amiga menciona un libro en un mensaje, y solo llega a la nota si paras y lo copias.</li>
        <li><strong>No se ordena.</strong> Las tablas de Notas no se ordenan, así que ver todo lo de una persona o una ocasión significa leer la tabla entera.</li>
        <li><strong>El total del presupuesto es a mano.</strong> Vuelves a escribir la suma cada vez que cambia una idea.</li>
        <li><strong>Elegir te toca a ti.</strong> Las tallas, los gustos y los presupuestos están en la nota, y encontrar el regalo que encaja tres semanas antes de un cumpleaños sigue siendo cosa tuya.</li>
      </ul>
      <p>
        Para un puñado de personas, una nota es todo lo que necesitas. Para una Navidad en familia y un año de cumpleaños, mantenerla al
        día es el trabajo.
      </p>

      <h2 id="pinto-notes">Una lista de regalos que sugiere regalos</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/gift-ideas">Gift ideas</a> es una nota con una tabla Ideas y una
        lista Sizes and likes. En la tabla, Budget es un número y Status se elige entre Idea, Bought o Given.
      </p>
      <p>
        Menciona algo que le gustaría a alguien y tu IA añade una fila: la persona, la ocasión si la has dicho, la idea, el presupuesto si
        lo has dado, e Idea como estado. Dile &ldquo;Jonás usa la talla M y le encanta todo lo verde&rdquo; y va a Sizes and likes.
        Pregúntale &ldquo;el cumpleaños de papá es dentro de tres semanas. ¿Ideas por menos de 50 euros?&rdquo; y te sugiere tres regalos
        dentro del presupuesto que encajan con lo que hay en la nota. Cuando compras uno, pone el estado en Bought. Esto funciona en
        cuanto conectas ChatGPT o Claude, y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en
        inglés) lleva un minuto. Puedes seguir cambiando cada fila tú, y se guardan todas las versiones anteriores de la nota.
      </p>
      <p>
        Las listas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
