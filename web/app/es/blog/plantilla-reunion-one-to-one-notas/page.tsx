import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-reunion-one-to-one-notas");

// Spanish version of /blog/apple-notes-1-on-1-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "reunion one to one" gives "plantilla reunión one to one", "plantilla de reunión
// one to one pdf" and "que significa reunion one to one"; "plantilla one on one" gives only "plantilla one to one";
// "reuniones uno a uno" gives "formato de reuniones uno a uno" and "preguntas para reuniones uno a uno"; "plantilla
// reunion uno a uno" gives nothing. So the slug and title use "reunión one to one", and the text calls it 1:1 too.
// Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas
// en Notas en el Mac": Ordenar automáticamente los ítems marcados, ajustes de Notas), /es-es/guide/notes/apd58edc7964/mac
// ("Utilizar carpetas inteligentes": the Listas filter), /es-es/102462 ("Si no puedes colaborar en la app Notas": Cuenta
// de Apple, a locked note has to be unlocked first), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (crear una
// lista de comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable, Localizable.loctable,
// SmartFolderFilterRow.loctable and SmartFolderChecklistsFilterView.loctable: Edición, Pegar en formato Markdown and
// Pegar como Markdown in es_419, Archivo, Duplicar nota, Nueva carpeta inteligente, the Carpetas and Listas filters,
// No marcadas and No completadas in es_419, Bloquear nota, Fijar nota, Ajustes and Configuración in es_419). Paste as
// Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. Facts
// are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# 1:1 con Emma

Cada dos jueves. Añade temas durante la semana.

## La próxima vez
- Comentarios sobre la revisión de diseño
- El presupuesto para la conferencia
- Los objetivos de Emma para el próximo trimestre

## Seguimiento
- [ ] Yo: buscarle a Emma un mentor del equipo de plataforma
- [ ] Yo: preguntar por una rotación de guardias más tranquila
- [ ] Emma: preparar el plan de lanzamiento para el 20 de nov

## 1:1 anteriores
5 de noviembre
- Las guardias fueron duras: dos avisos de noche. Quiere una rotación más tranquila.
- Quiere liderar el lanzamiento de primavera. Parecía cansada pero animada.
`;

const QUESTIONS = `Preguntas fijas
- ¿Qué te preocupa esta semana?
- ¿Qué te está frenando?
- ¿Necesitas algo de mí?
- Comentarios, en las dos direcciones
- ¿Cómo van tus objetivos?
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de reunión one to one?", a: [
    "No. Notas no tiene plantillas. Una nota por persona que vas ampliando, con encabezados para el próximo orden del día, el seguimiento y los 1:1 anteriores, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Qué debe llevar el orden del día de un one to one?", a: [
    "Primero sus temas, luego los tuyos y después el seguimiento de la vez anterior. Añade una o dos preguntas fijas, como qué le está frenando y si necesita algo de ti. Apunta los temas durante la semana, cuando surgen.",
  ] },
  { q: "¿Una nota por 1:1 o una nota por persona?", a: [
    "Una por persona. El orden del día, los compromisos pendientes y todos los 1:1 anteriores quedan juntos, el más reciente primero, así que lees las notas de la última vez antes de la siguiente sin tener que buscarlas.",
  ] },
  { q: "¿Hay una app que redacte mis notas de los 1:1?", a: [
    "Pinto Notes tiene una plantilla gratuita de notas de 1:1. Cuéntale a ChatGPT o a Claude cómo fue y escribe la sección, añade lo que prometió cada uno como lista de comprobación y quita los temas ya tratados.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-reunion-one-to-one-notas"
      intro={<>
        Un buen one to one se prepara en las dos semanas anteriores, cuando van surgiendo los temas. Aquí tienes una plantilla de
        reunión one to one para pegar en Notas de Apple: una nota por persona que vas ampliando, con el próximo orden del día, el
        seguimiento y todos los 1:1 anteriores. Después, cómo mantenerla y hasta dónde llega Notas.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#orden-del-dia", label: "El orden del día" },
          { href: "#entre-reuniones", label: "Entre 1:1" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "1:1 que se redactan solos" },
        ]}>
          <p>
            Notas no tiene plantilla de 1:1, pero una nota por persona sirve: una lista La próxima vez que vas ampliando durante la
            semana, el seguimiento como lista de comprobación con un nombre en cada línea y los 1:1 anteriores debajo, el más reciente
            primero. Lee la parte de arriba antes de cada reunión y escribe la sección nueva justo después.
          </p>
          <PostCta template="one-on-one-notes" slug="es/plantilla-reunion-one-to-one-notas" path="/es/blog/plantilla-reunion-one-to-one-notas" position="answer"
            ui={ui.cta} title="¿Quieres que tus 1:1 se redacten solos?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de notas de 1:1. Cuéntale a ChatGPT o a Claude cómo fue y lo redacta, añade el seguimiento y quita lo que ya se trató.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="Una nota de 1:1 en Pinto Notes en un Mac, en inglés: 1:1 con Emma un jueves sí y otro no, tres temas en Next time, cuatro tareas de seguimiento con una marcada y el 1:1 del 5 de noviembre en Past 1:1s."
        caption="Una nota de 1:1 en Pinto Notes: qué sacar, qué prometió cada uno y los 1:1 anteriores, el más reciente primero. En Notas de Apple funciona igual." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por persona</h2>
      <p>
        Una nota por reunión desperdiga el seguimiento. Una nota por persona guarda toda la historia en un sitio: lo que quieres sacar,
        lo que cada uno dijo que haría y cómo fueron los últimos 1:1. Pon un nombre en cada tarea de seguimiento, &ldquo;Yo&rdquo;
        incluido, para que quede claro quién debe qué. Deja una palabra en cada línea, porque un ítem vacío de una lista no sobrevive al
        pegado.
      </p>
      <Keep title="Notas de 1:1 para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
      ]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y el seguimiento en una lista de comprobación. Con un Comando + V normal, los símbolos
        se quedan como texto. En el iPhone, escríbela, selecciona las líneas de seguimiento y toca el botón Lista de comprobación. Para
        la siguiente persona, borra las líneas de ejemplo, guarda esa copia en blanco en una carpeta 1:1 y elige Archivo, Duplicar nota.
      </p>

      <h2 id="orden-del-dia">El orden del día: La próxima vez</h2>
      <p>
        La próxima vez es el orden del día, escrito a lo largo de dos semanas y no dos minutos antes de la llamada. Sus temas van
        primero: la reunión es más suya que tuya. Unas cuantas preguntas fijas debajo recogen lo que a ninguno de los dos se le ocurrió
        apuntar.
      </p>
      <Keep title="Preguntas fijas" text={QUESTIONS} copyLabel={ui.copy} />
      <p>
        Si la otra persona también quiere añadir temas, comparte una nota que tenga solo La próxima vez y deja que pueda hacer cambios. Cada uno
        necesita una Cuenta de Apple. El resto, cómo lo viste incluido, guárdalo en tu propia nota.
      </p>

      <h2 id="entre-reuniones">Entre 1:1</h2>
      <ul>
        <li>
          <strong>Fíjala.</strong> Fija la nota arriba de su carpeta, así añadir un tema desde el iPhone lleva unos segundos.
        </li>
        <li>
          <strong>Redáctala justo después.</strong> Añade la fecha como una línea al principio de 1:1 anteriores, dos o tres puntos sobre
          lo que se habló y cómo viste a la otra persona, y pasa los compromisos a Seguimiento. Borra los temas ya tratados.
        </li>
        <li>
          <strong>Deja que lo marcado baje.</strong> Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas
          (Configuración en Latinoamérica), y lo que está hecho baja al final de la lista.
        </li>
        <li>
          <strong>Ve todos los compromisos abiertos.</strong> Crea una carpeta inteligente con dos criterios: Carpetas, con tu carpeta
          1:1, y Listas, con No marcadas (en Latinoamérica, No completadas). Ahí está cada persona a la que todavía le debes algo.
        </li>
        <li>
          <strong>Bloquéala si es privada.</strong> Cómo viste a alguien es cosa tuya. Una nota bloqueada se abre con tu contraseña o con
          Face ID o Touch ID, aunque no se puede compartir para editarla.
        </li>
      </ul>
      <p>
        La búsqueda lee cada palabra de cada nota, así que buscar &ldquo;rotación&rdquo; encuentra cada vez que salió.{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) repasa todos los criterios
        que puede usar una carpeta inteligente. Para las reuniones de equipo, la <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla
        de acta de reunión</a> pone arriba las tareas con su responsable, y <a href="/blog/apple-notes-templates" hrefLang="en">Apple
        Notes templates</a> (en inglés) tiene más notas para pegar.
      </p>

      <h2 id="limites">Hasta dónde llegan las notas de 1:1 en Notas</h2>
      <ul>
        <li><strong>Redactarlas te toca a ti.</strong> Justo después de un 1:1 empieza la siguiente reunión, y las notas esperan hasta que se te ha olvidado la mitad.</li>
        <li><strong>Ordenar es a mano.</strong> Pasar los compromisos a Seguimiento y borrar los temas tratados es fácil de saltarse, y el orden del día se llena de cosas viejas.</li>
        <li><strong>No hay patrones.</strong> Que las guardias salgan en tres 1:1 seguidos está en la nota, pero nada te lo señala.</li>
        <li><strong>La búsqueda encuentra palabras, no respuestas.</strong> &ldquo;¿Qué le prometí a Emma la última vez?&rdquo; significa leerte el seguimiento tú.</li>
      </ul>
      <p>
        Para una o dos personas, la plantilla basta. Con un equipo de seis, redactar las notas es lo que se queda sin hacer.
      </p>

      <h2 id="pinto-notes">Notas de 1:1 que se redactan solas</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/one-on-one-notes">1:1 notes</a> es una nota por persona que vas
        ampliando, con la próxima vez, el seguimiento y los 1:1 anteriores, el más reciente primero.
      </p>
      <p>
        La primera vez, tu IA te pregunta con quién es el 1:1 y escribe su nombre. Durante la semana, menciona algo que quieras sacar y
        lo añade a la próxima vez. Después del 1:1, cuéntale cómo fue, por ejemplo &ldquo;Emma y yo acabamos de tener nuestro 1:1.
        Quiere liderar el próximo lanzamiento y pidió un mentor.&rdquo; Añade una sección al principio de los 1:1 anteriores con su
        nombre y la fecha, de qué se habló y cómo la viste, apunta lo que prometió cada uno como líneas de la lista de seguimiento y
        quita los temas ya tratados. Antes del siguiente, pregúntale &ldquo;¿qué prometí la última vez?&rdquo;. Puedes seguir
        escribiendo y marcando todo tú, y se guardan todas las versiones anteriores de la nota. La parte de la IA funciona cuando ChatGPT
        o Claude está conectado; <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un
        minuto.
      </p>
      <p>
        Las notas de 1:1 que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola
        importación en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
