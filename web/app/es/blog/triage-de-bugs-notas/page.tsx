import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "triage-de-bugs-notas");

// Spanish version of /blog/apple-notes-bug-triage-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "triaje de bugs" turns into "triage de bugs"; "triage de bugs" gives "triage
// bugs meaning" and "triage bugs in jira"; "reporte de bugs" gives qa, ejemplos and "plantilla reporte de bugs";
// "gestion de bugs" gives herramientas; "plantilla bug" and "lista de bugs" give nothing useful. Spanish teams say bug
// and triage, so the slug and title use "triage de bugs". Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac": botón Tabla, Formato >
// Tabla), /es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Ordenar automáticamente los ítems
// marcados en los ajustes de Notas), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable and
// Localizable.loctable: Formato, Tabla, Edición, Pegar en formato Markdown and Pegar como Markdown in es_419). Paste as
// Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. The
// English post's own words: Paste as Markdown is not used for the table, only for headings and lists. Facts are the
// English post's; the screenshot is its English one, described in Spanish. The Pinto template's choices (P0 to P3,
// New, Confirmed, In progress, Fixed, Won't fix) stay in English, as the app does.

const ui = UI.es;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Triage de bugs

Bug\tGravedad\tÁrea\tEstado\tFecha\tEnlace
Las tarjetas guardadas fallan al pagar\tP1\tPago\tEn curso\t2026-11-04\t#412
La búsqueda no encuentra la ñ ni las tildes\tP2\tBúsqueda\tArreglado\t2026-11-02\t#407
El correo del pedido llega dos veces\tP2\tCorreo\tNuevo\t2026-11-06\t#418
El logo del pie se ve borroso en el móvil\tP3\tDiseño\tConfirmado\t2026-11-05\tninguno
`;

const RULES = `## Gravedad
- P0: pérdida de datos, un fallo de seguridad o nadie puede trabajar. Se deja todo.
- P1: un flujo principal no funciona para mucha gente. Esta semana.
- P2: no funciona, pero hay una forma de evitarlo. Se planifica.
- P3: pulido. Cuando haya tiempo.

## Detalles
Las tarjetas guardadas fallan al pagar
1. Inicia sesión en una cuenta con una tarjeta guardada.
2. Añade cualquier cosa a la cesta y ve al pago.
3. Elige la tarjeta guardada y pulsa Pagar.
Esperado: se hace el pedido.
Qué pasó: "Error en el pago", y ningún pedido.
`;

const LIST = `# Bugs por gravedad

## P1
- [ ] Las tarjetas guardadas fallan al pagar (Pago, #412)

## P2
- [ ] El correo del pedido llega dos veces (Correo, #418)
- [x] La búsqueda no encuentra la ñ ni las tildes (Búsqueda, #407)

## P3
- [ ] El logo del pie se ve borroso en el móvil (Diseño)
`;

const FAQ = [
  { q: "¿Qué es el triage de bugs?", a: [
    "Decidir, para cada informe de bug nuevo, cómo de grave es y cuándo se arregla. La mayoría de los equipos le dan a cada bug una gravedad de P0 a P3, un área y un estado, y repasan los nuevos un día fijo.",
  ] },
  { q: "¿Qué debe tener una plantilla de triage de bugs?", a: [
    "Un título corto, la gravedad, el área, el estado, la fecha en que se informó y un enlace al informe. Luego, para cada bug que puedas reproducir, los pasos, lo que se esperaba y lo que pasó.",
  ] },
  { q: "¿Puedo llevar los bugs en Notas de Apple?", a: [
    "Para un proyecto pequeño, sí: una tabla con una fila por bug, o una lista de comprobación bajo un encabezado por gravedad. Las tablas de Notas no ordenan ni filtran, así que con más de dos o tres docenas de bugs funciona mejor un gestor de incidencias.",
  ] },
  { q: "¿Hay una plantilla de triage de bugs que registre los informes por mí?", a: [
    "Pinto Notes tiene una plantilla gratuita de triage de bugs. Pega un informe o una issue de GitHub en ChatGPT, Claude o Claude Code y añade una fila según tus reglas de gravedad, con los pasos para reproducirlo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="triage-de-bugs-notas"
      intro={<>
        No todos los equipos necesitan un gestor de incidencias. Una persona que programa sola o un equipo de tres puede tener todos los
        bugs en una nota, si cada uno tiene una gravedad y los peores están arriba. Aquí tienes una plantilla de triage de bugs para Notas
        de Apple, una versión en lista que se ordena mejor y el punto en que una nota deja de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#por-gravedad", label: "Una versión en lista" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Bugs que se registran solos" },
        ]}>
          <p>
            Notas no tiene plantilla de triage de bugs, pero una nota sirve: una tabla con una fila por bug (título, gravedad, área,
            estado, fecha y enlace), las reglas de gravedad debajo y los pasos para reproducir cada bug más abajo. Ponle a cada bug una
            gravedad de P0 a P3 en cuanto llega, y arregla de arriba abajo.
          </p>
          <PostCta template="bug-triage" slug="es/triage-de-bugs-notas" path="/es/blog/triage-de-bugs-notas" position="answer"
            ui={ui.cta} title="¿Quieres que los bugs se registren solos?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de triage de bugs. Pega un informe en ChatGPT o Claude y añade una fila según tus reglas de gravedad, con los pasos para reproducirlo.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="Una nota Bug triage en Pinto Notes en un Mac, en inglés: una tabla de cuatro bugs con gravedad de P1 a P3, área, estado, fecha y número de issue, los pasos para reproducir el fallo del pago con tarjeta guardada y las reglas de gravedad."
        caption="Una nota de triage de bugs en Pinto Notes, con Severity y Status como opciones. En Notas de Apple, la tabla, los detalles y las reglas quedan como texto normal." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una tabla y las reglas</h2>
      <p>
        La tabla es la lista que miras cada mañana. La gravedad dice cuándo se arregla un bug, y las reglas evitan trampas: P1 significa
        que un flujo principal no funciona para mucha gente, y un cliente que se queja más fuerte no cambia eso. Usa títulos cortos,
        porque seis columnas comparten el ancho.
      </p>
      <Keep title="Tabla de triage de bugs para Notas de Apple" text={TABLE} copyLabel={ui.copy}
        note="Cada línea de la tabla lleva un tabulador entre las columnas. Pégala y luego convierte esas líneas en una tabla." />
      <Keep title="Reglas de gravedad y detalles" text={RULES} copyLabel={ui.copy}
        note="Pégalo debajo de la tabla con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Pega y luego crea la tabla.</strong> Pega la plantilla de la tabla en una nota nueva, selecciona las cinco líneas desde
          Bug hasta el último bug y pulsa el botón Tabla. Cada tabulador se convierte en una columna, así que te quedan las seis columnas
          una al lado de otra.
        </li>
        <li>
          <strong>O empieza en blanco.</strong> Elige Formato, Tabla para dos filas y dos columnas, y el tabulador en la última celda
          añade la fila siguiente.
        </li>
        <li>
          <strong>Añade las reglas y los detalles.</strong> Haz clic debajo de la tabla y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown). Las líneas con ## pasan a ser encabezados.
        </li>
        <li>
          <strong>Cambia un estado escribiendo encima.</strong> De En curso a Arreglado es una celda. Deja los bugs arreglados una
          semana, para que se vea qué ha cambiado.
        </li>
      </ul>
      <p>
        Notas decide el ancho de las columnas y no puedes arrastrarlas, así que un título largo aprieta el resto.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa todo lo que una tabla de Notas puede
        y no puede hacer. Si otras personas también informan de bugs, comparte la nota y deja que puedan hacer cambios. Cada una necesita
        una Cuenta de Apple.
      </p>

      <h2 id="por-gravedad">Una versión en lista que se ordena sola</h2>
      <p>
        Las tablas de Notas no se ordenan, así que un P1 nuevo acaba abajo del todo. Si eso te molesta, dale a cada gravedad un
        encabezado y a cada bug una línea de lista de comprobación debajo. Los peores bugs siempre están arriba, y marcar una línea la da
        por arreglada.
      </p>
      <Keep title="Bugs por gravedad para Notas de Apple" text={LIST} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <p>
        Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica), y los bugs arreglados
        bajan al final de su encabezado. La búsqueda lee todas las palabras de todas las notas, así que buscar &ldquo;pago&rdquo;
        encuentra el bug y sus detalles. Hay más notas para pegar en{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega el triage de bugs en Notas</h2>
      <ul>
        <li><strong>No se puede ordenar ni filtrar.</strong> &ldquo;Todos los P1 abiertos&rdquo; significa leerse la tabla entera.</li>
        <li><strong>Cada informe se vuelve a escribir.</strong> Los bugs llegan por correo, por chat y por GitHub, y cada uno es un título, una gravedad y unos pasos que escribes a mano.</li>
        <li><strong>La gravedad se decide cada vez.</strong> Las reglas están en la nota, pero las sigues comparando tú con cada informe.</li>
        <li><strong>No hay enlace al código.</strong> Averiguar en qué archivos está un bug sigue siendo otro trabajo.</li>
      </ul>
      <p>
        Para un proyecto personal o una app pequeña, una nota basta. Con un equipo que registra docenas de bugs a la semana, usa un gestor
        de incidencias.
      </p>

      <h2 id="pinto-notes">Bugs que se registran solos</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/bug-triage">Bug triage</a> es una sola nota con una tabla Bugs, una
        sección Details y las reglas de gravedad. En la tabla, Severity es una opción entre P0 y P3, y Status una opción entre New,
        Confirmed, In progress, Fixed y Won&apos;t fix.
      </p>
      <p>
        Pega un informe de bug en tu IA. Sigue las reglas de Severity y añade una fila con un título corto, la gravedad, el área, el
        estado New, la fecha de hoy y el enlace, y mantiene las filas de la peor a la mejor. Si el informe dice cómo reproducirlo, los
        pasos, lo que se esperaba y lo que pasó van en Details. En Claude Code, la plantilla tiene sus propias instrucciones: pega una
        issue de GitHub y la lee con gh issue view, añade la fila y luego busca en tu código la causa probable y añade a los detalles los
        archivos implicados. <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Notes in Claude Code and Codex</a> (en inglés)
        tiene el único comando que necesitas para añadirlo.
      </p>
      <p>
        Pregúntale &ldquo;¿qué P1 siguen abiertos?&rdquo;, o dile &ldquo;hemos arreglado el pago con tarjeta guardada, márcalo&rdquo; y
        cambia el estado. Puedes seguir editando cada fila tú, y se guardan todas las versiones anteriores de la nota. La parte de IA
        funciona cuando ChatGPT o Claude están conectados, y{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto. Las notas que ya
        tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
