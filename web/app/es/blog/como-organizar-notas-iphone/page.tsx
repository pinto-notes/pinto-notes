import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "como-organizar-notas-iphone");

// Spanish version of /blog/apple-notes-organize (batch 3, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es) on 21 Nov: "como organizar notas iphone" is a suggestion of its own, with "como organizar mis notas en iphone";
// "organizar notas" gives "organizar notas iphone"; "como ordenar notas" gives "como ordenar notas en iphone" and "como
// ordenar alfabeticamente en notas iphone"; "carpetas notas iphone" gives "crear carpetas en notas iphone". "organizar
// notas mac" gives nothing. Apple's own Spanish words, all read on 21 Nov 2026, the same pages the English post cites:
// the Notes guide for Mac (macOS 27) support.apple.com/es-es/guide/notes/apd558a85438/mac ("Añadir y eliminar carpetas":
// Archivo > Nueva carpeta, drag to move, Opción to copy, drag a folder onto another for a subfolder, no subfolders in
// "Todas las de [cuenta]" or Notas, a deleted folder's notes go to "Recién eliminado" for 30 days), /apdb54e469b6/mac
// ("Ordenar y fijar notas": Notas > Ajustes, "Ordenar notas por"; one folder: the folder's button, "Ordenar por"; "Todas
// las de [cuenta]" and "Recién eliminado" always follow the default; Archivo > Fijar nota; two-finger swipe right; drag
// between Fijadas and Notas; a pin shows on every device with the same Apple Account; needs upgraded iCloud notes or
// notes on the Mac), /apd000074a4e/mac ("Personalizar cómo aparecen las notas": "Agrupar notas por fecha", per folder
// "Agrupar por fecha", not available when sorted by title); the iPhone guide (iOS 27)
// /es-es/guide/iphone/ipha61270292/ios ("Organizar las notas en carpetas": Nueva carpeta, touch and hold and drag for a
// subfolder, Renombrar, swipe left to delete, Trasladar, "Ordenar por" by title or date, "Las más antiguas primero",
// "En orden descendente", Ajustes > Apps > Notas > Ordenar notas por, "Agrupar por fecha", "Fijar nota" or swipe right
// and tap the pin). The guide shows the iPhone folder button, the move button and the selection mode as icons without
// names, so the post describes them. The sort choices, Trasladar a, Fijadas, Sin etiquetar, the Smart Folder rules
// (Etiquetas, Fecha de edición en los últimos días, Listas con No marcadas), Edición > Añadir enlace, Formato > Más >
// Anular todo and Edición > Pegar en formato Markdown are the Notes app's own Spanish strings on macOS 27.2
// (Localizable.loctable, MainMenu.loctable, Settings.loctable, SmartFolderDateFilterView.loctable), with the es_419
// names where they differ (Configuración, Anclar nota, Agregar enlace, Pegar como Markdown), as the other Spanish posts
// use them. Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet. Facts are the English
// post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const TIDY = `# Orden semanal

- [ ] Archiva cada nota de la carpeta Notas, o elimínala
- [ ] Etiqueta las notas de Sin etiquetar que lo necesiten
- [ ] Repasa Esta semana por si algo está en la carpeta equivocada
- [ ] Desfija lo que ya está terminado
- [ ] Vacía o elimina las listas hechas de Tareas abiertas
- [ ] Pasa los proyectos terminados a Archivo
`;

const FAQ = [
  { q: "¿Cuál es la mejor forma de organizar las notas del iPhone?", a: [
    "Unas pocas carpetas amplias para las áreas de tu vida, etiquetas para los temas que las cruzan, una nota índice fijada en cada carpeta y diez minutos a la semana para archivar lo que se ha acumulado. La búsqueda encuentra cualquier palabra, así que el sistema solo tiene que hacer fácil echar un vistazo.",
  ] },
  { q: "¿Cómo ordeno las notas del iPhone alfabéticamente?", a: [
    "Ordénalas por título. En el iPhone, abre la carpeta, toca el botón de opciones de la carpeta, toca Ordenar por y elige Título. En un Mac, haz clic en el botón que aparece junto a la carpeta y elige Ordenar por, o ajusta Ordenar notas por en Notas, Ajustes para todas las carpetas. Una carpeta ordenada por título deja de agruparse por fecha.",
  ] },
  { q: "¿Se pueden crear subcarpetas en Notas de Apple?", a: [
    "Sí. Arrastra una carpeta sobre otra, en un Mac o en el iPhone (en el iPhone, mantenla pulsada primero). Las únicas carpetas que no admiten subcarpetas son la carpeta Todas las de una cuenta y la carpeta Notas.",
  ] },
  { q: "¿Carpetas o etiquetas en Notas de Apple?", a: [
    "Las dos cosas. Una nota vive en una carpeta y puede llevar muchas etiquetas. El consejo de la propia Apple en Notas es usar carpetas para áreas amplias, como el trabajo, y etiquetas para temas concretos, como #impuestos. Una nota con etiqueta no se puede bloquear, así que organiza las notas bloqueadas por carpetas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="como-organizar-notas-iphone"
      intro={<>
        Casi todas las bibliotecas de Notas crecen igual: todo acaba en la carpeta Notas, ordenado por la última edición, hasta que ya no
        sirve de nada desplazarse. Aquí tienes cómo organizar las notas en el iPhone y el Mac con lo que Notas ya trae, una estructura de
        carpetas para copiar y un orden semanal para que siga así.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#carpetas", label: "Carpetas" },
          { href: "#ordenar", label: "Ordenar" },
          { href: "#fijar", label: "Fijar" },
          { href: "#etiquetas", label: "Etiquetas y carpetas inteligentes" },
          { href: "#estructura", label: "Una estructura para copiar" },
          { href: "#enlaces", label: "Enlaces" },
          { href: "#orden-semanal", label: "Orden semanal" },
        ]}>
          <p>
            Crea unas pocas carpetas amplias, con subcarpetas solo donde una carpeta se llene demasiado, y etiqueta las notas por los
            temas que cruzan carpetas. Ordena cada carpeta según cómo buscas las cosas (por fecha de edición, fecha de creación o título) y
            fija las pocas notas que abres a diario. Luego dedica diez minutos a la semana a archivar lo que haya caído en Notas.
          </p>
          <PostCta slug="es/como-organizar-notas-iphone" path="/es/blog/como-organizar-notas-iphone" position="answer" ui={ui.cta}
            title="¿Prefieres no tener que archivar?">
            <p>Pinto Notes se parece a Notas de Apple y funciona igual. Conecta ChatGPT o Claude y moverán tus notas a las carpetas correctas, las etiquetarán y las ordenarán cuando se lo pidas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="La lista de carpetas de Notas en el iPhone con iOS 27, en inglés: Quick Notes y Shared, carpetas de iCloud como Notes, Gift Ideas, Grocery List y Sketches, y una sección de etiquetas debajo."
        caption="Carpetas para las áreas, etiquetas para los temas, todo en una lista. Imagen: Apple." />}
      faq={FAQ}
    >
      <h2 id="carpetas">Carpetas y subcarpetas</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Nueva carpeta"] },
        { on: "iPhone", steps: ["Lista de carpetas", "Nueva carpeta"] },
      ]} />
      <p>
        En un Mac, selecciona una carpeta de la cuenta que quieras, elige Archivo, Nueva carpeta y escribe un nombre. En el iPhone, toca el
        botón de nueva carpeta en la lista de carpetas y luego Nueva carpeta. Para crear una subcarpeta, arrastra una carpeta sobre otra (en
        el iPhone, mantenla pulsada primero). Para deshacerlo, vuelve a sacarla arrastrando. La carpeta Todas las de la cuenta y la carpeta
        Notas no admiten subcarpetas, así que monta tu estructura a su lado.
      </p>
      <p>
        Para mover una nota en un Mac, arrástrala a una carpeta de la barra lateral, o haz clic en ella con la tecla Control pulsada y
        elige Trasladar a. Mantén pulsada la tecla Opción al soltarla para copiarla en vez de moverla. En el iPhone, desliza la nota hacia
        la izquierda y toca el botón de carpeta, o mantenla pulsada y toca Trasladar.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notas en el iPhone con iOS 27 en modo de selección, en inglés: 3 Selected, tres notas marcadas y un botón de carpeta abajo a la izquierda para moverlas."
        caption="Para archivar varias notas a la vez: selecciónalas y toca el botón de carpeta. Imagen: Apple." />
      <p>
        Para un montón de notas en el iPhone, abre la carpeta, toca el botón de opciones, elige seleccionar notas, márcalas y toca el botón
        de carpeta. Eliminar una carpeta manda sus notas a Recién eliminado, donde se quedan 30 días, así que un borrado por error se puede
        deshacer.
      </p>

      <h2 id="ordenar">Ordenar las notas por fecha o por título</h2>
      <Figure shot={{ ...SHOTS.notesDefaultAccount, alt: "Los ajustes generales de Notas de Apple en un Mac con macOS 26, en inglés: Sort notes by en Date Edited, New notes start with en Title y la cuenta por omisión en iCloud, la que usa Siri para crear notas." }}
        ground="sky" caption="Notas, Ajustes en un Mac con macOS 26. Ordenar notas por fija el orden de todas las carpetas." />
      <Paths rows={[
        { on: "Mac", steps: ["Notas", "Ajustes", "Ordenar notas por"] },
        { on: "Mac, una carpeta", steps: ["Botón de la carpeta", "Ordenar por"] },
        { on: "iPhone, una carpeta", steps: ["Botón de opciones de la carpeta", "Ordenar por"] },
        { on: "iPhone, todas las carpetas", steps: ["Ajustes", "Apps", "Notas", "Ordenar notas por"] },
      ]} />
      <p>
        Una carpeta puede ordenarse por fecha de edición, fecha de creación o título. Por título es como se ordenan las notas
        alfabéticamente, y va bien para una carpeta de notas de consulta, como recetas o manuales. Por fecha de edición va bien para una
        carpeta de trabajo, donde lo último que tocaste es lo siguiente que quieres. En el iPhone, Ordenar por también ofrece Las más
        antiguas primero para una fecha y En orden descendente para el título. En Latinoamérica, Ajustes se llama Configuración.
      </p>
      <p>
        El orden de una carpeta solo se aplica a esa carpeta. En un Mac, las carpetas Todas las de cada cuenta y Recién eliminado siguen
        siempre el orden por omisión de Ajustes. Notas también agrupa la lista bajo fechas como Hoy y Ayer; se desactiva con Agrupar por
        fecha en el mismo menú. Una carpeta ordenada por título no se puede agrupar por fecha.
      </p>

      <h2 id="fijar">Fija las notas que abres a diario</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Fijar nota"] },
        { on: "iPhone", steps: ["Mantén pulsada la nota", "Fijar nota"] },
      ]} />
      <p>
        Una nota fijada se queda arriba en su carpeta, sea cual sea el orden (en Latinoamérica, Anclar nota). En un Mac también puedes
        deslizar hacia la derecha con dos dedos y hacer clic en la chincheta, o arrastrar una nota entre las secciones Fijadas y Notas. En
        el iPhone, desliza hacia la derecha y toca la chincheta. Una nota fijada aparece así en todos los dispositivos con la misma Cuenta de
        Apple. Necesita notas de iCloud o notas guardadas en el Mac.
      </p>
      <p>
        Fija pocas. Dos o tres por carpeta bastan: la lista de la compra de ahora, el plan de esta semana y una nota índice de la carpeta
        (más sobre eso abajo).
      </p>

      <h2 id="etiquetas">Etiquetas y carpetas inteligentes</h2>
      <p>
        Una nota está en una sola carpeta, pero puede llevar muchas etiquetas. Escribe # y una palabra, como #impuestos, en cualquier parte
        de la nota. El consejo de la propia Apple en Notas es usar carpetas para las áreas amplias y etiquetas para los temas, y funciona:
        un recibo va en Dinero con #impuestos, y una nota sobre la gestoría va en Trabajo, también con #impuestos.
      </p>
      <p>
        Una carpeta inteligente es un filtro guardado que reúne notas de todas las carpetas según reglas como Etiquetas, Fecha de edición o
        Listas. Para el orden semanal de abajo vale la pena crear tres: Sin etiquetar (una regla Etiquetas que muestre solo las notas sin
        etiquetar), Esta semana (Fecha de edición en los últimos 7 días) y Tareas abiertas (Listas, No marcadas). Las notas se quedan donde
        están. Todas las reglas, y por qué a veces una etiqueta no se forma, están en <a href="/blog/apple-notes-tags-smart-folders"
        hrefLang="en">Apple Notes tags and Smart Folders</a> (en inglés). Un detalle: una nota con etiqueta no se puede bloquear.
      </p>

      <h2 id="estructura">Una estructura de carpetas sencilla para copiar</h2>
      <p>
        Empieza con carpetas para los sitios donde buscarías, y añade una subcarpeta solo cuando una carpeta sea demasiado larga para
        recorrerla de un vistazo. Dos niveles bastan para casi todo el mundo.
      </p>
      <ul>
        <li><strong>Notas.</strong> La carpeta que ya viene, usada como bandeja de entrada. Apunta aquí y archiva después.</li>
        <li><strong>Casa.</strong> La casa, el coche, los manuales y las garantías.</li>
        <li><strong>Dinero.</strong> Presupuestos, recibos, suscripciones. Etiqueta con #impuestos todo lo que sirva para la declaración de la renta.</li>
        <li><strong>Salud.</strong> Citas, medicación, entrenamiento.</li>
        <li><strong>Trabajo.</strong> Con las subcarpetas Proyectos, Reuniones y Consulta si se llena.</li>
        <li><strong>Viajes.</strong> Una nota por viaje.</li>
        <li><strong>Recetas.</strong> Ordenada por título.</li>
        <li><strong>Ideas.</strong> Todo lo que quieras retomar.</li>
        <li><strong>Archivo.</strong> Proyectos terminados y viajes antiguos, fuera de la vista y todavía encontrables con la búsqueda.</li>
      </ul>
      <p>
        Organizar las notas del trabajo sigue el mismo patrón. Dale a cada proyecto una subcarpeta dentro de Trabajo y etiqueta a cada
        cliente en todas las carpetas, como #acme. Las reuniones son más fáciles con una nota por reunión, siempre con la misma forma, que
        es lo que te da la <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta de reunión para Notas</a>. Hay más notas
        para pegar en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="enlaces">Enlaza las notas en un índice</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
        { on: "iPhone", steps: ["Menú de edición", "Añadir enlace"] },
      ]} />
      <p>
        Las carpetas ordenan las notas por fecha o por título. Una nota índice las ordena por su sentido. Crea una nota por cada carpeta con
        mucho movimiento, por ejemplo Índice de trabajo, con un encabezado por proyecto y un enlace a cada nota debajo, y fíjala. Para
        enlazar, selecciona el texto, elige Añadir enlace (en Latinoamérica, Agregar enlace) y escoge la nota, o escribe <code>&gt;&gt;</code> y
        el título de la nota. En iOS 27 y macOS 27 un enlace también puede saltar a un encabezado dentro de una nota, como explica <a
        href="/blog/apple-notes-ios-27" hrefLang="en">what&apos;s new in Apple Notes</a> (en inglés).
      </p>

      <h2 id="orden-semanal">Diez minutos de orden a la semana</h2>
      <p>
        Una vez a la semana (el domingo por la tarde funciona), repasa la bandeja de entrada y las tres carpetas inteligentes. Pega esta
        lista en una nota y fíjala.
      </p>
      <Keep title="Orden semanal para Notas de Apple" text={TIDY} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte las líneas en una lista
        de comprobación. En el iPhone, escribe las líneas, selecciónalas y toca el botón Lista de comprobación. Cuando termines, haz clic en
        la lista y elige Formato, Más, Anular todo, y queda lista para la semana siguiente.
      </p>

      <h2 id="limites">Hasta dónde llega organizar Notas de Apple</h2>
      <ul>
        <li><strong>Archivar es a mano.</strong> Cada nota de la bandeja de entrada espera a que la muevas tú.</li>
        <li><strong>Las etiquetas se ponen a mano</strong>, de nota en nota o de una tanda seleccionada en otra.</li>
        <li><strong>Los índices se quedan viejos.</strong> Una nota nueva no está en el índice hasta que añades su enlace.</li>
        <li><strong>La búsqueda encuentra palabras, no respuestas.</strong> Encuentra todas las notas que dicen &ldquo;cocina&rdquo;. No puede decirte en cuál de ellas se decidió el presupuesto.</li>
      </ul>
      <p>
        Para unos cientos de notas, las carpetas, las notas fijadas y un orden semanal bastan. A partir de ahí, ordenar es el trabajo, y te
        toca a ti.
      </p>

      <h2 id="pinto-notes">Notas que se archivan solas</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, con carpetas, subcarpetas, notas fijadas y una búsqueda
        que lee cada palabra. Cuando conectas ChatGPT o Claude, pueden ordenar por ti. Pide &ldquo;archiva todo lo que hay en Notas en su
        carpeta&rdquo;, &ldquo;etiqueta todas las notas sobre la reforma de la cocina&rdquo; o &ldquo;pasa los viajes terminados a
        Archivo&rdquo;, y las notas se mueven. Puedes seguir archivando y editando todo tú, y se guardan todas las versiones anteriores de
        cada nota. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Para la costumbre semanal, la plantilla gratuita <a href="/templates/weekly-review">Weekly review</a> hace que tu IA te haga cinco
        preguntas el domingo y escriba la semana en una nota, con la semana más reciente arriba y tus tres prioridades de la semana
        siguiente como lista de comprobación. Hay más en <a href="/templates">templates</a>.
      </p>
      <p>
        Las notas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en
        tu Mac</a> (en inglés), con sus carpetas, y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
