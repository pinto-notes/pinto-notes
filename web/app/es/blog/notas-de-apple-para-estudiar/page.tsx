import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-de-apple-para-estudiar");

// Spanish version of /blog/apple-notes-for-school (batch 3, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es) on 21 Nov: "app notas para estudiar" gives "app de notas para estudiar"; "tomar apuntes iphone" gives "tomar
// apuntes en iphone" and "aplicacion para tomar apuntes iphone"; "apuntes iphone" gives "app para apuntes iphone".
// "notas de apple para la universidad", "notas iphone para estudiar", "apple notes para estudiar" and "notas iphone
// universidad" give nothing, and "notas para la universidad" means grades in Spanish, so the post says "estudiar" and
// "apuntes". Apple's own Spanish words, all read on 21 Nov 2026, the same pages the English post cites: the Notes guide
// for Mac (macOS 27) support.apple.com/es-es/guide/notes/apdb5106e334/mac ("Grabar audio y transcribirlo": the toolbar
// button, "Grabar audio", edit the note while recording, the transcription button, "Buscar en la transcripción",
// "Añadir transcripción a la nota", Resumen with Apple Intelligence, deleting the recording deletes the transcript,
// transcription on Macs with M1 or later in the listed languages), /apdd655f4242/mac (the button next to the name,
// "Renombrar archivo adjunto", a scan is named "Documentos escaneados" by default), /apd558a85438/mac (Archivo > Nueva
// carpeta, drag a folder onto another for a subfolder), /apda85974595/mac ("Resolver problemas matemáticos": an
// expression and =, (27/3)^2=, standard order of operations, variables defined above, Retorno inserts the answer,
// Formato > "Resultados matemáticos": Insertar resultados, Sugerir resultados, Desactivado), /apd4e6e2c9a6/mac
// ("Compartir notas y colaborar": menú desplegable, "Compartir un enlace", "Compartir carpeta", "Enviar una copia",
// notes added to a shared folder are shared, @ mentions); the iPhone guide (iOS 27) /es-es/guide/iphone/iphbe11247b5/ios
// (attachments button, "Grabar audio", swipe down to take notes while recording, transcription on iPhone 12 and later,
// summaries on iPhone 15 Pro or later), /iph653f28965/ios ("Escanear documentos", automatic capture at the page's
// edges, saved as a PDF, "Escanear texto"), /iphb8628c6b8/ios (search finds scanned and handwritten text),
// /ipha61270292/ios (Nueva carpeta, "Fijar nota") and /iphe4d04f674/ios (participants signed in with Notas on in
// iCloud, no locked notes). The iPhone guide shows the attachments and transcription buttons as icons without names, so
// the post describes them. Edición > Pegar en formato Markdown, Archivo > Duplicar nota (Comando + D), Formato > Tabla
// (Opción + Comando + T), botón Tabla, Edición > Añadir enlace (Comando + K), the Listas rule with No marcadas and the
// botón Lista de comprobación are as in the other Spanish posts (Notes app strings on macOS 27.2, with es_419 names
// where they differ). The Math Results example uses whole numbers so no decimal separator is in question. Facts are
// the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const CLASS_NOTE = `# Biología

## Esta semana
- [ ] Leer el tema 4
- [ ] Informe de prácticas sobre enzimas
- [ ] Tarjetas de respiración celular

## Clases
- Respiración celular, 3 de noviembre
- Fotosíntesis, 10 de noviembre

## Exámenes
- Parcial, 12 de diciembre
`;

const LECTURE = `# Respiración celular, 3 de noviembre

## Apuntes
- La glucosa se descompone para producir ATP, la energía de la célula.
- Tres etapas: glucólisis, ciclo de Krebs, cadena de transporte de electrones.
- Casi todo el ATP sale de la cadena de transporte de electrones, en las mitocondrias.

## Para preguntar
- [ ] ¿En qué parte de la célula ocurre la glucólisis?

## Resumen
La glucosa se convierte en ATP en tres etapas, y casi todo se produce en las mitocondrias.
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const TIMETABLE = `Día\tAsignatura\tAula
Lunes\tBiología\tLaboratorio 2
Martes\tEconomía\tAula B
Jueves\tBiología\tLaboratorio 2
Viernes\tEconomía\tAula 14
`;

const MATH = `distancia = 120
tiempo = 3
distancia / tiempo =
`;

const FAQ = [
  { q: "¿Sirve Notas de Apple para estudiar?", a: [
    "Para tomar y guardar apuntes, sí. Es gratis en el iPhone y el Mac, escanea fotocopias, graba clases con transcripción y hace cuentas. Para repasar se queda más corta: no tiene plantillas, tarjetas ni tests, y una nota compartida necesita que todo el grupo tenga una Cuenta de Apple.",
  ] },
  { q: "¿Puede Notas de Apple grabar una clase y transcribirla?", a: [
    "Sí. En una nota, abre el menú de archivos adjuntos y elige Grabar audio. Notas escribe una transcripción en directo en los idiomas compatibles, en un iPhone 12 o posterior o en un Mac con M1 o posterior, y Apple Intelligence puede resumirla donde esté disponible.",
  ] },
  { q: "¿Puedo repasar para los exámenes en Notas de Apple?", a: [
    "En parte. Una tabla de dos columnas sirve como tarjetas: una pregunta a la izquierda, la respuesta a la derecha, y tapas la columna derecha para ponerte a prueba. Nada programa tus repasos ni recuerda qué tarjetas fallaste.",
  ] },
  { q: "¿Puedo compartir notas de Apple con mis compañeros de clase?", a: [
    "Sí, una nota o una carpeta entera, con Compartir un enlace. Todos necesitan una Cuenta de Apple con Notas activado en iCloud, y una nota bloqueada no se puede compartir. Para cualquier otra persona, Enviar una copia manda una copia que puede leer pero no editar.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="notas-de-apple-para-estudiar"
      intro={<>
        Notas de Apple ya está en tu iPhone y tu Mac, así que es donde acaban muchos apuntes de todas formas. Aquí tienes una respuesta
        sincera a si basta para el instituto o la universidad, y luego una organización que dura todo el cuatrimestre, desde una carpeta
        por asignatura hasta notas que compartes con tu grupo de estudio.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#sirve", label: "¿Sirve para estudiar?" },
          { href: "#carpetas", label: "Una carpeta por asignatura" },
          { href: "#clases", label: "Una nota por clase" },
          { href: "#grabar", label: "Grabar una clase" },
          { href: "#estudiar", label: "Método Cornell y tarjetas" },
          { href: "#grupo", label: "Grupos de estudio" },
          { href: "#pinto-notes", label: "Notas que te preguntan" },
        ]}>
          <p>
            Sí, para tomar y guardar apuntes, sobre todo si tu grupo de estudio también usa iPhone y Mac. Es gratis, escanea fotocopias,
            graba clases con transcripción y hace cuentas. Donde se queda corta es en el repaso: no tiene plantillas, tarjetas ni tests, así
            que eso lo montas tú.
          </p>
          <PostCta template="study-flashcards" slug="es/notas-de-apple-para-estudiar" path="/es/blog/notas-de-apple-para-estudiar"
            position="answer" ui={ui.cta} title="¿Quieres apuntes que te pregunten?">
            <p>Pinto Notes funciona como Notas de Apple y tiene plantillas gratuitas de método Cornell y de tarjetas. Pega tus apuntes de clase en ChatGPT o Claude y escribe las preguntas, y luego te pregunta.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="sirve">¿Sirve Notas de Apple para estudiar?</h2>
      <p>
        Para apuntar, es muy buena. Es gratis, una nota que escribes en el Mac está en tu iPhone gracias a iCloud, y la búsqueda encuentra
        palabras en las notas escritas con el teclado, en la letra a mano y en las páginas escaneadas. Escanea una fotocopia en un PDF,
        graba una clase y escribe lo que se dijo, y te da el resultado de una cuenta cuando escribes un signo igual.
      </p>
      <p>
        Para repasar, te da menos. No hay plantillas, ni tarjetas, ni nada que te haga preguntas o recuerde lo que fallaste. Las tablas no
        ordenan ni suman. Un grupo de estudio solo puede trabajar en una misma nota si todos tienen una Cuenta de Apple. Si tu carrera es
        sobre todo memorizar, como Medicina, toma los apuntes en Notas y planifica el repaso en algo que lo programe.
      </p>

      <h2 id="carpetas">Una carpeta por asignatura</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La lista de carpetas de Notas en el iPhone con iOS 27, en inglés: Quick Notes y Shared, carpetas de iCloud como Notes, Gift Ideas y Grocery List, y una sección de etiquetas debajo."
        caption="La lista de carpetas en el iPhone. Cada asignatura tiene aquí su carpeta. Imagen: Apple." />
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Nueva carpeta"] },
        { on: "iPhone", steps: ["Lista de carpetas", "Nueva carpeta"] },
      ]} />
      <p>
        Crea una carpeta para cada asignatura. Para tener junto un cuatrimestre, crea una carpeta para el cuatrimestre y arrastra encima
        cada carpeta de asignatura, que pasan a ser subcarpetas. El cuatrimestre siguiente, empiezas otra y las asignaturas antiguas se
        quedan apartadas.
      </p>
      <p>
        En cada carpeta, ten una nota de la asignatura con lo que hay que entregar y la lista de clases, y fíjala para que se quede arriba
        (en el iPhone, mantén pulsada la nota y toca Fijar nota; en Latinoamérica, Anclar nota). Selecciona el nombre de una clase y elige
        Edición, Añadir enlace (Comando + K; en Latinoamérica, Agregar enlace) para enlazarla con la nota de esa clase.
      </p>
      <Keep title="Nota de asignatura para Notas de Apple" text={CLASS_NOTE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y los deberes en una lista de comprobación. Deja una palabra en cada línea de la lista,
        porque un ítem vacío no sobrevive al pegado. Después, una carpeta inteligente con la regla Listas, No marcadas reúne todas las notas
        con algo por marcar, deberes incluidos; <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Apple Notes tags and Smart
        Folders</a> (en inglés) explica cómo crearla.
      </p>

      <h2 id="clases">Una nota por clase</h2>
      <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277}
        alt="La parte de abajo del menú Archivo de Notas en macOS 27, en inglés: Export To, Pin Note, Lock Note, Duplicate Note con Comando + D, resaltado, y Print."
        caption="Archivo, Duplicar nota empieza la clase siguiente a partir de la anterior." />
      <p>
        Dale a cada clase su propia nota, con el tema y la fecha como título. Las notas cortas son más fáciles de encontrar y de repasar
        que una nota larga por asignatura. En un Mac, Archivo, Duplicar nota (Comando + D) copia la nota de la semana pasada con sus
        encabezados, lista para vaciar y rellenar.
      </p>
      <Keep title="Nota de clase para Notas de Apple" text={LECTURE} copyLabel={ui.copy} />
      <p>
        En clase, escribe solo bajo Apuntes. Las dudas van bajo Para preguntar como lista de comprobación, para marcarlas cuando tengas la
        respuesta. Escribe el resumen esa misma tarde, en dos o tres frases tuyas.
      </p>

      <h2 id="escanear">Escanea las fotocopias en la nota de la clase</h2>
      <Paths rows={[{ on: "iPhone", steps: ["Botón de archivos adjuntos", "Escanear documentos"] }]} />
      <p>
        Abre la nota de la clase en tu iPhone, toca el botón de archivos adjuntos, luego Escanear documentos, y encuadra la página. El
        iPhone hace la foto cuando detecta los bordes de la página. Escanea las demás páginas, toca el botón para terminar, y la fotocopia
        se guarda en la nota como PDF. Más tarde, la búsqueda encuentra las palabras que contiene. Para una sola cita de un libro, Escanear
        texto, en el mismo menú, escribe el texto en la nota.
      </p>
      <p>
        Un escaneo se llama Documentos escaneados. En un Mac, haz clic en el botón junto a su nombre y elige Renombrar archivo adjunto para
        llamarlo &ldquo;Fotocopia semana 3&rdquo;.
      </p>

      <h2 id="grabar">Graba una clase, con transcripción y resumen</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Botón de archivos adjuntos", "Grabar audio"] },
        { on: "iPhone", steps: ["Botón de archivos adjuntos", "Grabar audio"] },
      ]} />
      <p>
        Pregunta antes al profesor: muchos centros tienen normas sobre grabar. Luego abre la nota de la clase, elige Grabar audio en el menú
        de archivos adjuntos y pulsa el botón de grabar. Puedes seguir escribiendo mientras graba (en el iPhone, desliza hacia abajo desde
        arriba de la pantalla para volver a la nota).
      </p>
      <p>
        Después, abre la grabación y haz clic en el botón de transcripción para leer lo que se dijo. Haz clic en una frase para oír ese
        momento. El menú de la grabación tiene Buscar en la transcripción, para la parte en la que salió el examen, y Añadir transcripción
        a la nota. Luego haz clic en Resumen y Apple Intelligence escribe un resumen breve de la transcripción.
      </p>
      <p>
        La transcripción necesita un iPhone 12 o posterior o un Mac con M1 o posterior, con un idioma compatible. Los resúmenes necesitan
        Apple Intelligence, que en el iPhone quiere decir un iPhone 15 Pro o posterior, y no está disponible en todos los idiomas ni
        regiones. Al eliminar una grabación también se elimina su transcripción.
      </p>

      <h2 id="tablas">Tablas para el horario o la lista de lecturas</h2>
      <PostFigure src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="Una nota llamada Reading list en Notas de Apple en macOS 27, en inglés, con una tabla de tres columnas, Book, Author y Started, y cuatro libros. Los títulos largos ocupan varias líneas dentro de su celda."
        caption="Una tabla en Notas de Apple en macOS 27. Notas decide el ancho de las columnas." />
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Tabla"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Botón Tabla"] },
      ]} />
      <Keep title="Horario para Notas de Apple" text={TIMETABLE} copyLabel={ui.copy}
        note="Cada línea tiene un tabulador entre columnas. Pégalo y luego convierte esas líneas en una tabla." />
      <p>
        Pega el horario en una nota nueva, selecciona las cinco líneas y pulsa el botón Tabla. Cada tabulador se convierte en una columna.
        Tabulador en la última celda añade una fila. Las tablas de Notas no ordenan, no suman y no te dejan cambiar el ancho de una
        columna, así que escribe las entregas ya en orden de fecha. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple
        Notes</a> (en inglés) explica el resto.
      </p>

      <h2 id="estudiar">Método Cornell y tarjetas</h2>
      <p>
        Una tabla de dos columnas es también la forma más sencilla de repasar en Notas. Para el método Cornell, pon una pregunta corta a la
        izquierda, tu apunte a la derecha y un resumen debajo de la tabla; tapa la columna derecha y responde en voz alta. <a
        href="/es/blog/metodo-cornell-notas-iphone">Método Cornell en Notas de Apple</a> tiene una plantilla para pegar.
      </p>
      <p>
        Las tarjetas funcionan igual: una fila por tarjeta, pregunta y respuesta. Lo que Notas no puede hacer es decidir qué tarjetas ves hoy
        ni volver a traerte las que fallaste. <a href="/es/blog/flashcards-notas-iphone">Flashcards en Notas del iPhone</a> muestra cómo
        montarlas y cómo apañarse.
      </p>

      <h2 id="matematicas">Resultados matemáticos para las cuentas de los deberes</h2>
      <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Una nota llamada Sequoia Group Expenses en el iPhone, en inglés: cada gasto con su nombre en una línea, los nombres sumados en 475 $ y 475 $ entre 5, 95 $ por persona."
        caption="El ejemplo de la propia Apple de Resultados matemáticos en el iPhone: pon nombre a los números y luego usa los nombres. Imagen: Apple." />
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Resultados matemáticos"] }]} />
      <p>
        Escribe una cuenta y un signo igual, como (27/3)^2=, y Notas sugiere el resultado; pulsa Retorno para quedártelo. Notas sigue el
        orden habitual de las operaciones, así que añade paréntesis donde los necesites. También puedes poner nombre a un número en una
        línea de arriba y usar ese nombre:
      </p>
      <Keep title="Números con nombre para Resultados matemáticos" text={MATH} copyLabel={ui.copy}
        note="Notas propone el resultado después del último signo igual. Cambia un número de arriba y el resultado cambia con él." />
      <p>
        Formato, Resultados matemáticos (en Latinoamérica, Resultados de los cálculos) decide si los resultados se insertan, se sugieren o
        se desactivan. Te da el resultado, no el desarrollo, así que sirve sobre todo para comprobar una solución.
      </p>

      <h2 id="grupo">Comparte apuntes con tu grupo de estudio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Botón Compartir", "Menú desplegable", "Compartir un enlace"] },
        { on: "iPhone", steps: ["Botón Compartir", "Menú bajo el título", "Compartir un enlace"] },
      ]} />
      <p>
        Compartir un enlace invita a otras personas a trabajar en la misma nota, y todos ven los cambios al momento. Elige si pueden editar
        o solo ver. Para compartir una asignatura entera, en un Mac haz clic en su carpeta con la tecla Control pulsada y elige Compartir
        carpeta, o en el iPhone ábrela y toca el botón Compartir. Cualquier nota que añadas a una carpeta compartida se comparte con todos
        los que están en ella, así que guarda tus notas privadas en otro sitio. Escribe @ y un nombre para avisar a alguien de que lo
        necesitas.
      </p>
      <p>
        Todos necesitan una Cuenta de Apple con Notas activado en iCloud, y las notas bloqueadas no se pueden compartir. Para un compañero
        sin cuenta, Enviar una copia, en el mismo menú, le manda una copia que puede leer pero no editar.
      </p>

      <h2 id="limites">Hasta dónde llega Notas de Apple para estudiar</h2>
      <ul>
        <li><strong>Cada nota se prepara a mano.</strong> No hay plantillas, así que cada nota de asignatura y de clase se pega o se duplica.</li>
        <li><strong>Nada te pregunta.</strong> Tapar una columna funciona, pero Notas no hace las preguntas, no lleva la puntuación ni te vuelve a traer lo que fallaste.</li>
        <li><strong>Las tablas solo guardan texto.</strong> No puedes ordenar una lista de entregas ni sumar notas en una tabla.</li>
        <li><strong>Los grupos necesitan Cuentas de Apple.</strong> Un compañero con otro tipo de teléfono recibe una copia, no la nota compartida.</li>
      </ul>

      <h2 id="pinto-notes">Apuntes que te preguntan</h2>
      <Figure shot={{ ...SHOTS.flashcardsApp, alt: "La app de tarjetas dentro de una nota de Pinto Notes en un Mac, en inglés: 8 tarjetas para hoy, etiquetas de temas, un botón Study now, una racha de 11 días con un calendario, lo que toca esta semana y cuántas tarjetas hay en cada caja." }}
        caption="La plantilla Study notes and flashcards en Pinto Notes en un Mac, con datos de ejemplo." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. Dos de sus plantillas gratuitas están pensadas para repasar, y un toque añade cualquiera de ellas a tus notas.
      </p>
      <p>
        <a href="/templates/cornell-notes">Cornell notes</a> guarda una sección por clase con una tabla de dos columnas, Cue (la pista) y Notes (los apuntes), y un resumen.
        Pega tus apuntes de clase en tu IA y escribe una pregunta para cada fila y el resumen. Di &ldquo;pregúntame sobre oferta y
        demanda&rdquo; y te hace las preguntas una a una sin enseñarte los apuntes, y luego guarda las que fallaste bajo Cues to revisit.
      </p>
      <p>
        <a href="/templates/study-flashcards">Study notes and flashcards</a> es una pequeña app dentro de una nota. Pega un tema y tu IA
        hace de cinco a diez tarjetas con él. Di &ldquo;pregúntame biología, diez tarjetas&rdquo; y te pregunta una tarjeta cada vez,
        primero las que menos dominas, y te dice si acertaste. Las tarjetas que fallas vuelven antes, y las que sabes esperan más. Puedes
        añadir, editar y eliminar tarjetas tú mismo en la app, y se guardan todas las versiones anteriores de cada nota. La parte de IA
        funciona cuando <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT</a> (en inglés) o Claude, algo que
        lleva un minuto.
      </p>
      <p>
        Los apuntes que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
