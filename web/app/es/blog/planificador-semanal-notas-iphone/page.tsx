import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "planificador-semanal-notas-iphone");

// Spanish version of /blog/apple-notes-planner-template (batch 3, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es) on 21 Nov: "planificador iphone" gives "planificador semanal iphone", "planificador diario iphone" and
// "planificador de tareas iphone"; "plantilla planificador semanal" is a suggestion of its own; "planificador semanal
// app" gives "planificador semanal app ios" and "planificador semanal apple"; "planificador semanal notas" is
// suggested; "notas iphone agenda" gives "agenda notas iphone"; "lista de tareas iphone" gives "como hacer lista de
// tareas en iphone". "planificador semanal notas iphone", "planner notas iphone" and "agenda semanal notas iphone" give
// nothing. Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac
// ("Añadir listas en Notas en el Mac": Formato > Más > "Anular todo", "Ordenar automáticamente los ítems marcados" in
// the Notes settings), /es-es/guide/notes/apdb54e469b6/mac ("Ordenar y fijar notas": Archivo > Fijar nota, pinned notes
// at the top of the list), the iPhone guide /es-es/guide/iphone/ipha61270292/ios ("Fijar nota"), and the Notes app's
// own Spanish strings on macOS 27.2 (MainMenu.loctable and Localizable.loctable: Edición, Pegar en formato Markdown and
// Pegar como Markdown in es_419, Archivo, Duplicar nota, Añadir enlace and Agregar enlace in es_419, Fijar nota and
// Anclar nota in es_419, Anular todo, the Listas filter with No marcadas and No completadas in es_419, Ajustes and
// Configuración in es_419). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name
// here is the app's own string. The botón Lista de comprobación is as in the other Spanish posts. Facts are the English
// post's; the PostCta keeps template="weekly-planner", whose Pinto template is in English ("Top three this week",
// Monday to Sunday, "Later"), so those names stay in English. The picture is the English post's, described in Spanish.

const ui = UI.es;

const WEEKLY = `# Semana del 16 de noviembre

## Las tres de esta semana
- [ ] Enviar a Jonás el presupuesto del cuarto trimestre
- [ ] Reservar los vuelos a casa para Navidad
- [ ] Salir a correr tres veces

## Lunes
- [ ] Reunión de equipo a las 9:00
- [ ] Terminar el borrador del presupuesto

## Martes
- [ ] Dentista a las 8:30
- [ ] Correr 5 km

## Miércoles
- [ ] Llamar a mamá
- [ ] Devolver el paquete

## Jueves
- [ ] Pedir cita para la revisión del coche
- [ ] Cena con Sara a las 19:00

## Viernes
- [ ] Recoger la ropa de la tintorería

## Sábado
- [ ] Mercado de productores

## Domingo
- [ ] Planificar la semana que viene

## Más adelante
- [ ] Renovar el pasaporte
- [ ] Arreglar la luz de la bici
`;

const DAILY = `# Hoy

## Las tres de hoy
- [ ] Terminar el borrador del presupuesto
- [ ] Llamar a mamá
- [ ] Correr 5 km

## Mañana
- [ ] Reunión de equipo a las 9:00
- [ ] Contestar el correo de Jonás

## Tarde
- [ ] Revisar las diapositivas de Lucía
- [ ] Recoger la ropa de la tintorería

## Noche
- [ ] Cena con Sara a las 19:00

## Para mañana
- [ ] Lo que no dé tiempo a hacer hoy
`;

const FAQ = [
  { q: "¿Tiene Notas de Apple una plantilla de planificador?", a: [
    "No. Notas de Apple no tiene plantillas. Una nota por semana con un encabezado para cada día y las tareas de ese día como lista de comprobación funciona como planificador, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo uso Notas de Apple como planificador?", a: [
    "Guarda una nota por semana en una carpeta Planificador y fija arriba la nota de esta semana. Pon primero tus tres prioridades, cada tarea bajo su día y lo que no tiene día bajo Más adelante. El domingo, duplica la nota para la semana siguiente y mueve lo que haya quedado.",
  ] },
  { q: "¿Puedo hacer un planificador diario en Notas del iPhone?", a: [
    "Sí. Escribe los encabezados y las tareas, selecciona las tareas y toca el botón Lista de comprobación. Pegar en formato Markdown está en el Mac, así que lo más rápido es pegar la plantilla en un Mac y dejar que la nota se sincronice con tu iPhone.",
  ] },
  { q: "¿Hay un planificador que funcione como Notas de Apple?", a: [
    "Pinto Notes se parece a Notas de Apple, funciona igual y tiene una plantilla gratuita de planificador semanal. Dile a ChatGPT o a Claude qué tienes esta semana y pone cada tarea bajo su día y mantiene tus tres prioridades.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="planificador-semanal-notas-iphone"
      intro={<>
        Mucha gente planifica su semana en Notas de Apple: una lista por día, unas pocas cosas que importan más y un montón de cosas para
        otro momento. Funciona bien cuando todas las semanas tienen la misma forma. Aquí tienes una plantilla de planificador semanal para
        pegar en Notas, una versión diaria, cómo llevar una semana con ella y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#semanal", label: "El planificador semanal" },
          { href: "#diario", label: "Un planificador diario" },
          { href: "#como-usarlo", label: "Notas como planificador" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una semana planificada por ti" },
        ]}>
          <p>
            Notas de Apple no tiene plantilla de planificador, pero una nota por semana sirve: tus tres prioridades arriba, un encabezado
            para cada día con sus tareas como lista de comprobación, y una lista Más adelante para el resto. Pega la plantilla semanal de
            abajo en una nota nueva, o la diaria si planificas día a día.
          </p>
          <PostCta template="weekly-planner" slug="es/planificador-semanal-notas-iphone" path="/es/blog/planificador-semanal-notas-iphone"
            position="answer" ui={ui.cta} title="¿Quieres que te planifiquen la semana?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un planificador semanal gratuito. Dile a ChatGPT o a Claude qué tienes esta semana y pone cada tarea bajo su día y mantiene tus tres prioridades.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="Una nota Weekly planner en Pinto Notes en un Mac, en inglés: una lista Top three this week con una tarea marcada, un encabezado para cada día de lunes a domingo con sus tareas como lista de comprobación, los días hasta el viernes ya marcados, y una lista Later."
        caption="Una semana en Pinto Notes, planificada con la plantilla de planificador semanal. La misma forma funciona en Notas de Apple. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="semanal">La plantilla de planificador semanal</h2>
      <p>
        Una nota guarda la semana entera. Las tres prioridades van primero, para que sean lo primero que ves al abrirla. Cada día tiene un
        encabezado y su propia lista de comprobación, y Más adelante guarda lo que aún no tiene día, para que no se amontone en el lunes.
        Cambia las tareas por las tuyas antes de pegarla, y deja una palabra en cada línea, porque un ítem vacío de una lista no sobrevive
        al pegado.
      </p>
      <Keep title="Planificador semanal para Notas de Apple" text={WEEKLY} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y las tareas en una lista de comprobación. Con un Comando + V normal, los símbolos se
        quedan como texto. En el iPhone, escríbela, selecciona las tareas y toca el botón Lista de comprobación.
      </p>

      <h2 id="diario">Una versión de planificador diario</h2>
      <p>
        Si planificas un día cada vez, ten una sola nota llamada Hoy y fíjala arriba en su carpeta (en Latinoamérica, Anclar nota). Primero
        van otra vez las tres prioridades, luego el día en tres partes y una lista Para mañana con lo que no dio tiempo a hacer.
      </p>
      <Keep title="Planificador diario para Notas de Apple" text={DAILY} copyLabel={ui.copy} />
      <p>
        Cada mañana, borra lo que marcaste ayer, sube las líneas de Para mañana al día y elige tres prioridades nuevas. Si hay líneas que
        se repiten cada día, como salir a correr o el correo, haz clic en la lista y elige Formato, Más, Anular todo en vez de volver a
        escribirlas.
      </p>

      <h2 id="como-usarlo">Cómo usar Notas de Apple como planificador</h2>
      <ul>
        <li>
          <strong>Una nota por semana.</strong> Guárdalas en una carpeta Planificador y fija arriba la nota de esta semana, para tenerla a
          un toque en tu iPhone.
        </li>
        <li>
          <strong>Empieza la semana siguiente a partir de esta.</strong> El domingo, elige Archivo, Duplicar nota, cambia la fecha del
          título, borra lo marcado y pasa lo que quede al lunes.
        </li>
        <li>
          <strong>Deja que lo hecho baje.</strong> Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas
          (Configuración en Latinoamérica), y las tareas marcadas bajan al final de cada día.
        </li>
        <li>
          <strong>Encuentra lo que sigue abierto.</strong> Una carpeta inteligente con la regla Listas, No marcadas (en Latinoamérica, No
          completadas) muestra todas las notas que aún tienen una tarea pendiente, en todas tus carpetas (más en <a
          href="/blog/apple-notes-tags-smart-folders" hrefLang="en">tags and Smart Folders</a>, en inglés).
        </li>
        <li>
          <strong>Enlaza lo más grande.</strong> Selecciona una tarea, elige Edición, Añadir enlace (Comando + K; en Latinoamérica, Agregar
          enlace) y escoge la nota a la que pertenece, como el acta de la reunión del lunes.
        </li>
      </ul>
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
      ]} />
      <p>
        La misma forma de una nota por semana sirve para otras rutinas. El <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de
        hábitos en Notas del iPhone</a> marca los hábitos día a día, el <a href="/es/blog/menu-semanal-y-lista-de-la-compra-notas">menú
        semanal</a> planifica las cenas de la semana, y <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en
        inglés) tiene más notas para pegar.
      </p>

      <h2 id="limites">Hasta dónde llega un planificador en Notas</h2>
      <ul>
        <li><strong>Nada se mueve solo.</strong> Una tarea que no hiciste el miércoles se queda en el miércoles hasta que la cortas y la pegas bajo hoy.</li>
        <li><strong>Cada semana nueva es a mano.</strong> Duplicas la nota, cambias la fecha, borras lo hecho y mueves el resto. Si te lo saltas una vez, la semana sigue en la nota de la anterior.</li>
        <li><strong>Planificar es cosa tuya.</strong> Una lista de veinte cosas no se reparte sola en días, y las tres prioridades no se eligen solas.</li>
        <li><strong>La búsqueda encuentra palabras, no respuestas.</strong> Encuentra el dentista. No puede decirte qué queda esta semana ni qué tarea va pasando de un día a otro.</li>
      </ul>
      <p>
        Para una semana tranquila, basta con una nota y unos minutos el domingo. Para una semana llena, mover y ordenar es el trabajo, y te
        toca a ti.
      </p>

      <h2 id="pinto-notes">Una semana planificada por ti</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/weekly-planner">Weekly planner</a> es una nota con Top three this week,
        un encabezado para cada día de lunes a domingo y Later.
      </p>
      <p>
        Cuéntale a tu IA qué tienes esta semana, todo en un mensaje. Pone cada tarea bajo su día como lista de comprobación, deja bajo Later
        lo que no tiene día y limita las tres prioridades a las tres cosas que tú dices que importan más. Pídele &ldquo;pasa a hoy lo que
        no terminé&rdquo; y se traen las tareas sin marcar de los días anteriores. El domingo, dile que empieza una semana nueva: borra lo
        marcado, pasa lo que queda al lunes y te pregunta tus tres prioridades de la semana siguiente. Puedes seguir escribiendo y marcando
        todo tú, y se guardan todas las versiones anteriores de cada nota. La parte de IA funciona cuando ChatGPT o Claude están
        conectados, y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Los planes que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en
        tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
