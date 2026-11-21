import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "mantenimiento-del-hogar-notas-iphone");

// Spanish version of /blog/apple-notes-home-maintenance-checklist (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "mantenimiento del hogar" gives "en general", "e instalaciones" and
// "en la familia"; "tareas de mantenimiento del hogar" is a search of its own; "plan de mantenimiento vivienda" gives
// "plan de mantenimiento de una vivienda"; "mantenimiento preventivo casa" is searched; "checklist mantenimiento casa",
// "lista mantenimiento hogar" and "calendario de mantenimiento de la casa" give nothing. So the slug and title use
// "mantenimiento del hogar". Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd0a136b9cc/mac ("Añadir una tabla en Notas en el Mac": Formato > Tabla, botón
// Tabla), /es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Formato > Más > Anular todo,
// Ordenar automáticamente los ítems marcados in the Notes settings), /es-es/guide/notes/apd58edc7964/mac ("Utilizar
// carpetas inteligentes": the Listas filter), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de
// comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable, Localizable.loctable:
// Edición, Pegar en formato Markdown and Pegar como Markdown in es_419, Formato, Tabla, Más, Fijar nota and Anclar nota
// in es_419, Ordenar automáticamente los elementos seleccionados in es_419, the Listas filter with No marcadas and No
// completadas in es_419). Cuenta de Apple for sharing is cited as in the meeting notes translation (/es-es/102462).
// Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own
// string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const NOTE = `# Mantenimiento de casa

Las tareas que mantienen la casa en marcha, cada cuánto tocan y cuándo se hicieron por última vez.

## Tareas
Pega la tabla de tareas debajo de esta línea.

## Este mes
- [ ] Probar los detectores de humo (toca el 14 nov)
- [ ] Revisión de la caldera (toca el 20 nov)
- [ ] Limpiar los canalones (toca el 24 nov)

## A quién llamar
- Fontanero: Nordin e Hijos, 08-465 004 27
- Electricista: Volt Fix, 08-465 004 63

## Electrodomésticos
- Lavavajillas: Bosch Serie 4, garantía hasta 2028
- Caldera: Vaillant ecoTEC, instalada en 2021
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const JOBS = `Tarea\tCada\tÚltima vez\tPróxima
Descalcificar el hervidor\tMes\t1 nov 2026\t1 dic 2026
Limpiar el filtro del lavavajillas\tMes\t5 nov 2026\t5 dic 2026
Probar los detectores de humo\t3 meses\t14 ago 2026\t14 nov 2026
Revisión de la caldera\tAño\t20 nov 2025\t20 nov 2026
Limpiar los canalones\t6 meses\t24 may 2026\t24 nov 2026
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de mantenimiento del hogar?", a: [
    "No. Notas no tiene plantillas. Una nota con una tabla de tareas, una lista de comprobación para este mes y los teléfonos a los que llamas funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Qué debe incluir una lista de mantenimiento del hogar?", a: [
    "Cada tarea que se repite, cada cuánto toca y cuándo la hiciste por última vez. Empieza por las que salen caras si se olvidan: los detectores de humo, la revisión de la caldera o la calefacción, los canalones y los filtros.",
  ] },
  { q: "¿Notas puede avisarme cuando toca una tarea?", a: [
    "La nota no te avisa sola. La abres y lees la columna Próxima. Una lista de comprobación para este mes, hecha a principios de cada mes, deja las tareas que tocan en una lista corta.",
  ] },
  { q: "¿Hay una app de mantenimiento del hogar que lleve lo que toca?", a: [
    "Pinto Notes tiene una plantilla gratuita de mantenimiento del hogar. Dile a ChatGPT o a Claude cuándo has hecho una tarea y actualiza las fechas, y pregúntale qué toca este mes y te escribe la lista.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="mantenimiento-del-hogar-notas-iphone"
      intro={<>
        Nadie se olvida del detector de humo a propósito. Se pasa porque la última prueba fue hace tanto que nadie se acuerda. Aquí tienes
        una lista de mantenimiento del hogar para pegar en Notas de Apple, una forma de llevarla cada mes y el punto en que se queda corta.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#cada-mes", label: "Cada mes" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una lista que sabe qué toca" },
        ]}>
          <p>
            Notas no tiene plantilla de mantenimiento del hogar, pero una nota sirve: una tabla con cada tarea que se repite, cada cuánto
            toca y cuándo la hiciste por última vez, y debajo una lista de lo que toca este mes, las personas a las que llamas y los
            modelos de tus electrodomésticos.
          </p>
          <PostCta template="home-maintenance" slug="es/mantenimiento-del-hogar-notas-iphone" path="/es/blog/mantenimiento-del-hogar-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que alguien lleve las fechas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de mantenimiento del hogar. Dile a ChatGPT o a Claude que has hecho una tarea y actualiza las fechas, o pregúntale qué toca este mes.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="Una nota Home maintenance en Pinto Notes en un Mac, en inglés: una tabla Jobs con cinco tareas, de descalcificar el hervidor a limpiar los canalones, con cada cuánto tocan y la última y la próxima fecha, una lista This month con dos de cinco marcadas, Who to call y Appliances."
        caption="Una nota de mantenimiento del hogar en Pinto Notes, donde Every es una lista de opciones. En Notas de Apple las mismas columnas funcionan como una tabla normal, con la lista de comprobación y las listas debajo. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: tareas, este mes, a quién llamar</h2>
      <p>
        La tabla es el registro: cada tarea que se repite, cada cuánto, cuándo se hizo por última vez y cuándo toca la próxima. La lista
        de comprobación es con lo que trabajas este mes. A quién llamar y Electrodomésticos es lo que buscas cuando algo se rompe. Las
        tareas de ejemplo son un punto de partida: añade las tuyas y borra las que no te sirvan.
      </p>
      <Keep title="Nota de mantenimiento del hogar para Notas de Apple" text={NOTE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Keep title="Tabla de tareas para Notas de Apple" text={JOBS} copyLabel={ui.copy}
        note="Cada línea lleva un tabulador entre las columnas. Pégala debajo de Tareas y convierte esas líneas en una tabla." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
        { on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Pega la nota.</strong> En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown). La línea con # pasa a ser el título, las líneas con ## encabezados y las tareas de este mes
          una lista de comprobación. Con un Comando + V normal, los símbolos se quedan como texto.
        </li>
        <li>
          <strong>Luego la tabla.</strong> Cambia la línea de debajo de Tareas por la tabla de tareas, selecciona sus seis líneas, de
          Tarea a la última tarea, y pulsa el botón Tabla. Cada tabulador se convierte en una columna.
        </li>
        <li>
          <strong>Añade una tarea.</strong> El tabulador en la última celda añade una fila. Escribe las fechas con el año, para que una
          tarea que se hace una vez al año siga teniendo sentido el noviembre que viene.
        </li>
        <li>
          <strong>Nombres de tarea cortos.</strong> Notas decide el ancho de las columnas y no puedes arrastrarlas, así que una tarea
          larga aprieta las fechas.
        </li>
      </ul>
      <p>
        Fija la nota arriba de su carpeta. En el iPhone, escribe los encabezados una vez, selecciona las tareas de este mes y toca el
        botón Lista de comprobación. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa todo
        lo que una tabla de Notas puede y no puede hacer.
      </p>

      <h2 id="cada-mes">Cada mes</h2>
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Más", "Anular todo"] }]} />
      <ul>
        <li>
          <strong>Haz la lista del mes.</strong> El día 1, repasa la columna Próxima y escribe una línea de lista por cada tarea que cae
          este mes, con su fecha.
        </li>
        <li>
          <strong>Márcala y actualiza la fila.</strong> Cuando hagas una tarea, márcala y cambia Última vez y Próxima en la tabla. La
          marca es para este mes. La fila es lo que leerás el año que viene.
        </li>
        <li>
          <strong>Que lo hecho baje.</strong> Con Ordenar automáticamente los ítems marcados activado en los ajustes de Notas
          (Configuración en Latinoamérica), las tareas hechas bajan al final y lo pendiente se queda arriba.
        </li>
        <li>
          <strong>Reutiliza la lista.</strong> Si cada mes tocan las mismas tareas, déjalas y elige Formato, Más, Anular todo para
          empezar de nuevo.
        </li>
      </ul>
      <p>
        Una carpeta inteligente con el filtro Listas en No marcadas (en Latinoamérica, No completadas) muestra todas las notas que aún
        tienen algo pendiente, así que una tarea que quedó del mes pasado sigue a la vista.{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) explica cómo crear una.
        Cuando gotea una tubería, la búsqueda lee cada palabra de cada nota, así que &ldquo;fontanero&rdquo; o &ldquo;Bosch&rdquo; te
        da el teléfono o el modelo al momento. Para llevar la casa con otra persona, compartir la nota requiere una Cuenta de Apple para
        cada una. Hay más notas para pegar como esta en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a>{" "}
        (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega una lista de mantenimiento en Notas</h2>
      <ul>
        <li><strong>La próxima fecha la calculas tú.</strong> Notas no sabe que una tarea de cada 3 meses hecha el 14 de agosto toca el 14 de noviembre. La fecha la escribes tú.</li>
        <li><strong>La tabla no se ordena.</strong> No puede poner la próxima tarea arriba, así que lees todas las filas para ver qué toca.</li>
        <li><strong>La lista del mes se copia a mano.</strong> Si se te pasa el día 1, nadie te hace la lista.</li>
        <li><strong>Las fechas se desajustan.</strong> Una tarea que marcaste pero no actualizaste en la tabla parecerá atrasada el año que viene.</li>
      </ul>
      <p>
        Para un piso con cinco tareas, una nota sobra. Para una casa con treinta, mantener las fechas al día es el trabajo, y te toca a ti.
      </p>

      <h2 id="pinto-notes">Una lista que sabe qué toca</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/home-maintenance">Home maintenance</a> es la misma nota: una tabla
        Jobs donde Every se elige entre Month, 3 months, 6 months o Year, una lista This month, Who to call y Appliances.
      </p>
      <p>
        Cuéntale a tu IA una tarea que quieres llevar y cuándo la hiciste por última vez, y añade la fila con las dos fechas, año
        incluido. Pregúntale &ldquo;¿qué toca este mes?&rdquo; y escribe la lista debajo de This month. Dile &ldquo;hoy han revisado
        la caldera&rdquo; y cambia Last done y Next due y marca la tarea. Menciona un modelo o una fecha de garantía y va a Appliances.
        Puedes seguir añadiendo y cambiando cada fila tú, y se guardan todas las versiones anteriores de la nota. Funciona en cuanto
        conectas ChatGPT o Claude: <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva
        un minuto.
      </p>
      <p>
        Las listas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
