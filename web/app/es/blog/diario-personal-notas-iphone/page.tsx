import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "diario-personal-notas-iphone");

// Spanish version of /blog/apple-notes-journal-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "plantilla diario personal" gives word, pdf, niños, google docs, notion and "para
// escribir un diario personal"; "diario personal" gives "para escribir", online, app and digital; "diario personal
// iphone" gives only "app diario personal iphone gratis"; "diario iphone" is about Apple's Diario app; "diario en notas
// iphone" and "diario notas iphone" give nothing. So the slug and title use "diario personal" with Notas del iPhone.
// Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apdb54e469b6/mac ("Ordenar y
// fijar notas": Archivo > Fijar nota, pinned notes at the top), /es-es/guide/notes/apd58edc7964/mac ("Utilizar carpetas
// inteligentes": the Etiquetas filter), /es-es/guide/notes/apdc88ed7f1d/mac (Usar etiquetas), /es-es/102537 (locking a
// note with a password or Face ID o Touch ID, as cited in the pilot's olvide-contrasena page), and the Notes app's own Spanish
// strings on macOS 27.2 (MainMenu.loctable and Localizable.loctable: Edición, Pegar en formato Markdown and Pegar como
// Markdown in es_419, Archivo, Duplicar nota, Fijar nota and Anclar nota in es_419, Bloquear nota, Carpeta
// inteligente, Etiquetas). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name
// here is the app's own string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Diario

Unas líneas al día, el día más reciente primero.

## Preguntas
1. ¿Qué ha pasado hoy?
2. ¿Qué me ha quitado energía y qué me la ha devuelto?
3. ¿Qué quiero recordar?
4. ¿Qué es una cosa para mañana?

## Domingo, 8 de noviembre
- Hoy: día tranquilo; terminé la estantería y di un paseo largo.
- Energía: baja después de comer, mejor tras un café con Jonás.
- Recordar: la panadería de la esquina abre a las siete.
- Mañana: llamar a mamá.

## Sábado, 7 de noviembre
- Hoy: ayudé a Maja con la mudanza; fue más rápido de lo que temíamos.
- Energía: las escaleras me la quitaron, la pizza de después me la devolvió.
- Recordar: Maja dice que el piso nuevo tiene sol por la tarde.
- Mañana: contestar al casero antes de las doce.
`;

const PROMPTS = `¿Con quién he hablado hoy?
¿Qué me ha sorprendido?
¿Qué haría de otra forma?
¿Qué me hace ilusión?
¿Qué he dejado para luego, y por qué?
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de diario?", a: [
    "No. Notas no tiene plantillas. Una nota con unas pocas preguntas arriba y un encabezado para cada día funciona como diario, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Una nota por día o una nota para todo el diario?", a: [
    "Una sola nota es más fácil de mantener: siempre está en el mismo sitio, y los últimos días están justo debajo de las preguntas. Cuando se haga larga, empieza una nota nueva para el mes siguiente.",
  ] },
  { q: "¿Puedo bloquear mi diario en Notas de Apple?", a: [
    "Sí. Notas puede bloquear una nota, y una nota bloqueada se abre con una contraseña o con Face ID o Touch ID. Bloquea la nota del diario y todos los días que tiene quedan bloqueados con ella.",
  ] },
  { q: "¿Cómo encuentro un día antiguo del diario?", a: [
    "La búsqueda lee todas las palabras de todas las notas, así que busca un nombre, un lugar o una palabra que recuerdes haber escrito. Una etiqueta como #viaje en los días importantes deja que una carpeta inteligente reúna esas notas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="diario-personal-notas-iphone"
      intro={<>
        Casi todos los diarios se quedan en la página en blanco. Unas pocas preguntas fijas te ayudan a pasar de ahí, y Notas de Apple ya
        está en tu móvil al final del día. Aquí tienes una plantilla de diario para pegar en Notas, cómo mantenerlo, cómo encontrar días
        antiguos y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#cada-dia", label: "Cada día" },
          { href: "#preguntas", label: "Cuando te atascas" },
          { href: "#dias-antiguos", label: "Encontrar días antiguos" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un diario que pregunta" },
        ]}>
          <p>
            Notas no tiene plantilla de diario, pero una nota sirve: cuatro preguntas cortas arriba y luego un encabezado para cada día,
            con el más reciente primero. Contesta cada pregunta en una línea, y al abrir la nota siempre tienes ahí los últimos días.
          </p>
          <PostCta template="daily-journal" slug="es/diario-personal-notas-iphone" path="/es/blog/diario-personal-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que el día se escriba solo?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un diario gratuito. Cuéntale tu día a ChatGPT o Claude y escribe la entrada con tus palabras, con el día más reciente primero.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="Una nota Daily journal en Pinto Notes en un Mac, en inglés: cuatro preguntas numeradas y luego las entradas del domingo 8 y el sábado 7 de noviembre, la más reciente primero, cada una con las líneas Today, Energy, Remember y Tomorrow."
        caption="Un diario en Pinto Notes, con el día más reciente primero. La misma estructura funciona en Notas de Apple." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota, el día más reciente primero</h2>
      <p>
        Las preguntas van arriba para que nunca te encuentres con una página en blanco. Cada día tiene un encabezado con el día de la
        semana y la fecha, y las respuestas van debajo, una línea corta cada una. El día más reciente va justo debajo de las preguntas,
        así que lees hoy y ayer sin desplazarte. Hay dos días de ejemplo rellenos; cámbialos por los tuyos.
      </p>
      <Keep title="Diario para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título y cada línea con ## en un encabezado. Con un Comando + V normal, los símbolos se quedan como texto. En el iPhone, escribe
        las preguntas una vez y luego añade cada día a mano.
      </p>
      <p>
        Si también planificas el día por la mañana, el Daily plan de{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés) es la otra mitad: tres cosas para hoy y
        qué hacer si sobra tiempo. Tenlo en su propia nota, para que el diario siga siendo un registro de lo que pasó.
      </p>

      <h2 id="cada-dia">Cada día</h2>
      <ul>
        <li>
          <strong>Fija la nota.</strong> Fijada arriba de su carpeta, es lo primero que ves al abrir Notas en la cama.
        </li>
        <li>
          <strong>Añade el día arriba.</strong> Haz clic al final de la última pregunta, pulsa Retorno y escribe el encabezado nuevo. El
          día anterior baja debajo de él.
        </li>
        <li>
          <strong>Con una línea basta.</strong> Sáltate una pregunta cuando no haya nada que decir. Un diario que llevas un año con dos
          líneas al día vale más que uno que llevas una semana con dos páginas.
        </li>
        <li>
          <strong>Escríbelo con tus palabras.</strong> &ldquo;Las escaleras me la quitaron, la pizza de después me la devolvió&rdquo;
          significará más dentro de un año que &ldquo;cansado&rdquo;.
        </li>
        <li>
          <strong>Empieza una nota nueva cada mes.</strong> Cuando la nota se haga larga, elige Archivo, Duplicar nota, ponle a la copia el
          nombre del mes nuevo y borra de ella los días antiguos. Las preguntas se quedan.
        </li>
      </ul>
      <Paths rows={[{ on: "Mac", steps: ["Archivo", "Duplicar nota"] }]} />

      <h2 id="preguntas">Cuando las cuatro preguntas no encajan</h2>
      <p>
        Las cuatro preguntas sirven para casi todos los días. Los días que no, cambia una por otra de esta lista, o guarda la lista al
        final de la nota para elegir de ahí.
      </p>
      <Keep title="Preguntas de repuesto para el diario" text={PROMPTS} copyLabel={ui.copy} />
      <p>
        Si quieres seguir cómo te sientes con números además de con palabras, el{" "}
        <a href="/es/blog/registro-estado-de-animo-notas-iphone">registro del estado de ánimo en Notas</a> es una tabla con una fila por
        cada noche. Para los hábitos que vas marcando, está el{" "}
        <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos en Notas</a>.
      </p>

      <h2 id="dias-antiguos">Encontrar días antiguos</h2>
      <ul>
        <li>
          <strong>Busca una palabra.</strong> La búsqueda de Notas lee todas las palabras de todas las notas, así que
          &ldquo;panadería&rdquo; o el nombre de una amiga encuentra el día en que lo escribiste.
        </li>
        <li>
          <strong>Etiqueta los días importantes.</strong> Escribe #viaje o #familia en la línea y se convierte en una etiqueta. Una
          carpeta inteligente con un criterio de Etiquetas reúne luego todas las notas que la tienen.{" "}
          <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) explica cómo funcionan y qué
          revisar cuando no funcionan.
        </li>
      </ul>
      <p>
        Un diario es privado. Puedes bloquear la nota con una contraseña o con Face ID o Touch ID, para que no se abra si tu móvil acaba en otras manos.
      </p>

      <h2 id="limites">Hasta dónde llega un diario en Notas</h2>
      <ul>
        <li><strong>La línea en blanco la sigues rellenando tú.</strong> Las preguntas ayudan, pero en una noche de cansancio nadie te las hace.</li>
        <li><strong>Cada día se escribe a mano.</strong> Si prefieres contar tu día hablando, luego hay que pasarlo a texto.</li>
        <li><strong>La búsqueda encuentra palabras, no temas.</strong> Encuentra &ldquo;casero&rdquo;. No puede decirte qué te ha rondado la cabeza estas tres semanas.</li>
      </ul>
      <p>
        Para mucha gente, una nota y cuatro preguntas son todo el diario, y basta. Lo que no puede hacer es mirar atrás por ti.
      </p>

      <h2 id="pinto-notes">Un diario que te hace las preguntas</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/daily-journal">Daily journal</a> es una sola nota con las mismas cuatro
        preguntas y tus entradas debajo, con el día más reciente primero.
      </p>
      <p>
        Dile que quieres escribir el diario y tu IA te hace las preguntas de una en una, y se salta las que no quieras contestar. O
        cuéntale tu día de una vez, por ejemplo &ldquo;hoy ha sido largo: la mudanza de Maja está hecha, sus cajas no, y yo estoy en el
        sofá&rdquo;, y escribe la entrada sin preguntar. Cada día tiene un encabezado con el día de la semana y la fecha, y líneas cortas
        con tus palabras para Today, Energy, Remember y Tomorrow. No añade consejos salvo que se los pidas. Más adelante, pregúntale
        &ldquo;¿qué me ha rondado la cabeza esta semana?&rdquo; y responde a partir de tus entradas. Puedes seguir escribiendo y editando
        cada día tú, y se guardan todas las versiones anteriores de la nota. Esto funciona cuando ChatGPT o Claude están conectados, y{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Un diario que ya llevas en Notas de Apple se pasa con{" "}
        <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en inglés), y Notas de Apple no cambia.
        La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
