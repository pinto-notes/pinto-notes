import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-daily-scrum-notas");

// Spanish version of /blog/apple-notes-daily-standup-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "plantilla daily" gives "plantilla daily scrum"; "daily scrum" gives
// ejemplo, "para que sirve" and español; "daily standup" gives "daily standup en español", "agenda daily standup" and
// "daily standup meeting template"; "plantilla daily standup" and "reunion diaria plantilla" give nothing. Spanish
// teams say "la daily", so the slug and title use "daily scrum" and the text says daily and standup. Apple's own
// Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en
// el Mac": Ordenar automáticamente los ítems marcados, ajustes de Notas), /es-es/guide/notes/apdb5106e334/mac ("Grabar
// y transcribir audio": transcripción, resumen, Apple Intelligence), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios
// (crear una lista de comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable and
// Localizable.loctable: Edición, Pegar en formato Markdown and Pegar como Markdown in es_419, Fijar nota, Ajustes and
// Configuración in es_419). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name
// here is the app's own string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Notas de la daily

## Bloqueos
- Esperando las claves de API del proveedor de pagos de staging

## Viernes 6 de noviembre
Ayer
- Arreglé el conflicto de sincronización cuando dos dispositivos editan la misma nota
- Añadí tests para cómo el importador trata las tablas

Hoy
- [ ] Revisar la pull request del onboarding
- [ ] Empezar con la exportación a PDF

## Jueves 5 de noviembre
Ayer
- Programé en pareja con Emma en el importador

Hoy
- [x] Arreglar el conflicto de sincronización
- [x] Escribir los tests de tablas del importador
`;

const TEAM = `# Daily del equipo, semana del 2 de noviembre

## Bloqueos
- [ ] Sara: esperando las claves de API del proveedor de pagos de staging

## Viernes 6 de noviembre
- Sara: arreglado el conflicto de sincronización. Hoy, la revisión del onboarding.
- Jonás: movido el total de la pantalla de pago. Hoy, la comprobación del IVA.
- Emma: tests del importador hechos. Hoy, la exportación a PDF.
`;

const FAQ = [
  { q: "¿Qué debe llevar una nota de la daily?", a: [
    "Tres cosas: qué hiciste ayer, qué vas a hacer hoy y qué te está bloqueando. Unos pocos puntos cortos para cada una. Pon los bloqueos arriba de la nota, porque son la parte en la que otra persona puede hacer algo.",
  ] },
  { q: "¿Notas de Apple tiene una plantilla de daily?", a: [
    "No. Notas no tiene plantillas. Una nota que vas ampliando, con un encabezado por día y el más reciente arriba, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo tomo el acta de la daily scrum?", a: [
    "Una nota por sprint o por semana, un encabezado por día y una línea por persona con lo que hizo y lo que viene. Escribe los bloqueos como lista de comprobación con el nombre de la persona delante, y marca cada uno cuando se resuelva.",
  ] },
  { q: "¿Puede Claude Code escribir mi daily a partir de mis commits?", a: [
    "Con Pinto Notes conectado, sí. La plantilla de daily standup tiene sus propias instrucciones para Claude Code: lee tus commits desde ayer, los convierte en unos pocos puntos sencillos, te pregunta qué viene después y escribe el día en tu nota.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-daily-scrum-notas"
      intro={<>
        Casi todas las dailies empiezan con alguien intentando acordarse de ayer. Una nota que escribes sobre la marcha lo arregla. Aquí
        tienes una plantilla de daily scrum para pegar en Notas de Apple, una versión para todo el equipo y el punto en que Notas deja
        de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#cada-dia", label: "Cada día" },
          { href: "#equipo", label: "Para un equipo" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Una daily a partir de tus commits" },
        ]}>
          <p>
            Notas no tiene plantilla de daily, pero una nota que vas ampliando sirve: los bloqueos arriba y luego un encabezado por día
            laborable, el más reciente primero, con Ayer y Hoy debajo de cada uno. Escribe Hoy como lista de comprobación, y las líneas
            marcadas son el Ayer de mañana.
          </p>
          <PostCta template="daily-standup" slug="es/plantilla-daily-scrum-notas" path="/es/blog/plantilla-daily-scrum-notas" position="answer"
            ui={ui.cta} title="¿Quieres que el ayer se escriba solo?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de daily. Cuéntale a ChatGPT o a Claude lo que hiciste, o deja que Claude Code escriba tu ayer a partir de tus commits.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Una nota Standup notes en Pinto Notes en un Mac, en inglés: un bloqueo a la espera de las claves de API de staging y luego el viernes 6 de noviembre y el jueves 5 de noviembre, cada uno con sus puntos de Ayer y Hoy."
        caption="Notas de la daily en Pinto Notes: los bloqueos arriba, una sección por día, la más reciente primero. En Notas de Apple funciona igual." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota, un encabezado por día</h2>
      <p>
        Una sola nota para todas las dailies guarda el rastro: lo que dijiste el martes que ibas a hacer queda justo debajo de lo que
        hiciste el miércoles. Los bloqueos van encima de los días para que sean lo primero que ves. Deja una palabra en cada línea,
        porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Notas de la daily para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y las líneas de Hoy en una lista de comprobación. Con un Comando + V normal, los
        símbolos se quedan como texto. En el iPhone, escríbela, selecciona las líneas de Hoy y toca el botón Lista de comprobación.
      </p>

      <h2 id="cada-dia">Cada día</h2>
      <ul>
        <li>
          <strong>Fíjala.</strong> Fija la nota arriba de su carpeta, para que sea lo primero que abres por la mañana.
        </li>
        <li>
          <strong>Empieza por lo que marcaste ayer.</strong> Añade el encabezado de hoy debajo de Bloqueos. Lo que marcaste en el Hoy de
          ayer pasa a ser tu Ayer, y lo que quedó sin marcar se arrastra.
        </li>
        <li>
          <strong>Escribe el Hoy la tarde anterior.</strong> Dos o tres líneas mientras todavía sabes dónde lo dejaste te ahorran la
          mañana.
        </li>
        <li>
          <strong>Quita los bloqueos.</strong> Cuando algo se desbloquea, borra su línea. Una lista de bloqueos viejos deja de leerse.
        </li>
        <li>
          <strong>Busca en el pasado.</strong> La búsqueda lee cada palabra de cada nota, así que buscar &ldquo;importador&rdquo;
          encuentra cada día que trabajaste en él.
        </li>
      </ul>
      <p>
        Escribe los puntos cortos y con palabras sencillas. La daily es para gente que no conoce el código por el nombre de sus ramas.
      </p>

      <h2 id="equipo">Para un equipo: una línea por persona</h2>
      <p>
        Si eres quien toma el acta de la daily scrum, basta una línea por persona: lo que hizo y lo que viene. Los bloqueos llevan un
        nombre delante, para que todo el mundo vea quién está atascado y con qué.
      </p>
      <Keep title="Daily del equipo para Notas de Apple" text={TEAM} copyLabel={ui.copy}
        note="Empieza una nota nueva cada semana o cada sprint, para que no crezca demasiado." />
      <p>
        Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica), y los bloqueos
        resueltos bajan al final. Con Apple Intelligence, una grabación en Notas se convierte en una transcripción y un resumen, algo que
        ayuda si no puedes escribir mientras llevas la reunión. Para reuniones más largas, la{" "}
        <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta de reunión</a> tiene decisiones y tareas con su
        responsable, y <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés) tiene una revisión
        semanal para pegar.
      </p>

      <h2 id="limites">Hasta dónde llegan las notas de la daily en Notas</h2>
      <ul>
        <li><strong>El ayer sale de memoria.</strong> Lo que hiciste está en tus commits y pull requests, y Notas no los ve.</li>
        <li><strong>La sprint review es a mano.</strong> Resumir dos semanas significa leer diez días de puntos y volver a escribirlo.</li>
        <li><strong>Los bloqueos viejos son difíciles de encontrar.</strong> Cuando borras un bloqueo, nada recuerda cuánto tiempo esperaste.</li>
        <li><strong>La nota crece.</strong> Una nota que vas ampliando se hace larga, y recortarla es un trabajo más.</li>
      </ul>

      <h2 id="pinto-notes">Una daily a partir de tus commits</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/daily-standup">Daily standup</a> es una nota con los bloqueos arriba
        y los días debajo, una sección por día laborable, la más reciente primero.
      </p>
      <p>
        Cada mañana, cuéntale a tu IA lo que hiciste y lo que viene. Añade una sección con el día de la semana y la fecha, y Ayer y Hoy en
        puntos cortos. Lo que esté bloqueado va a Bloqueos, y cuando dices que se ha desbloqueado, sale. En Claude Code, la plantilla
        tiene sus propias instrucciones: ejecuta git log en el repositorio para ver tus commits desde ayer, los convierte en dos a cinco
        puntos sencillos sin los hashes, te pregunta qué viene ahora y qué te está bloqueando, y luego escribe el día.{" "}
        <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">Notes in Claude Code and Codex</a> (en inglés) tiene el comando
        para añadirlo.
      </p>
      <p>
        Más adelante, pregúntale &ldquo;¿qué me bloqueaba la semana pasada?&rdquo; o &ldquo;resume mis dailies desde el lunes para la
        sprint review&rdquo;. Se guardan todas las versiones anteriores de la nota, así que un bloqueo borrado sigue ahí para encontrarlo.
        La parte de la IA funciona cuando ChatGPT o Claude está conectado;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto. Las notas que ya
        tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
