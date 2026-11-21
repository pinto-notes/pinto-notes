import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "tracker-de-habitos-notas-iphone");

// Spanish version of /blog/apple-notes-habit-tracker (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es) on 21 Nov: "tracker de habitos" gives plantilla, pdf, app, mensual; "habitos iphone" gives "tracker
// de habitos iphone" and "app habitos iphone"; "seguimiento de habitos" and "habit tracker" are used too, and
// "seguimiento de habitos notas" gives nothing. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": botón Lista de
// comprobación, Formato > Más > Marcar todo o Anular todo, Ordenar automáticamente los ítems marcados, ajustes de
// Notas), /es-es/guide/notes/apd58edc7964/mac (carpetas inteligentes: Listas, Marcadas), the iPhone guide
// /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de comprobación), and the Notes app's own Spanish strings on
// macOS 27.2 (MainMenu.loctable, Localizable.loctable, Settings.loctable, SmartFolderChecklistsFilterView.loctable:
// Edición, Pegar en formato Markdown and Pegar como Markdown in es_419, Archivo, Duplicar nota, Anular todo, the
// Listas filter with No marcadas). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its
// name here is the app's own string. Facts are the English post's; the screenshots are its English ones, described
// in Spanish.

const ui = UI.es;

const TEMPLATE = `# Hábitos, semana del 16 de noviembre

## Lunes
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Martes
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Miércoles
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Jueves
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Viernes
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Sábado
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Domingo
- [ ] Caminar 20 minutos
- [ ] Leer 10 páginas
- [ ] A la cama antes de las 23:00

## Cómo fue la semana
- Cumplido:
- Fallado:
`;

const FAQ = [
  { q: "¿Notas de Apple tiene un tracker de hábitos?", a: [
    "No. Notas no tiene tracker de hábitos ni plantillas. Una nota con un encabezado para cada día y una lista de tus hábitos debajo funciona como uno: marcas los hábitos según los haces y empiezas una copia nueva cada semana.",
  ] },
  { q: "¿Cómo desmarco una lista entera en Notas?", a: [
    "En un Mac, haz clic en la lista y elige Formato, Más, Anular todo. Al desmarcarla pierdes lo que habías marcado, así que para un tracker de hábitos, duplica antes la nota y desmarca la copia.",
  ] },
  { q: "¿Notas puede contar mi racha?", a: [
    "No. Notas no cuenta las marcas entre notas ni entre días, así que la racha la cuentas tú, repasando las semanas anteriores.",
  ] },
  { q: "¿Hay un tracker de hábitos gratis que funcione como una nota?", a: [
    "Pinto Notes tiene una plantilla gratuita de tracker de hábitos: una nota que es una pequeña app, con el anillo de la semana, una marca por hábito, rachas y una vista del mes. ChatGPT o Claude pueden apuntar en ella lo que has hecho.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="tracker-de-habitos-notas-iphone"
      intro={<>
        Quieres seguir unos pocos hábitos en la app que ya abres cada día, no registrarte en otra. Notas de Apple puede hacer una versión
        sencilla. Aquí tienes una plantilla semanal para pegar, cómo mantenerla semana tras semana y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#cada-semana", label: "Cada semana" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un tracker que cuenta" },
        ]}>
          <p>
            Notas no tiene tracker de hábitos, pero una lista de comprobación cubre la parte diaria. Haz una nota por semana con un
            encabezado para cada día y tus hábitos como lista debajo, márcalos según los haces y duplica la nota el lunes. Copia la
            plantilla de abajo.
          </p>
          <PostCta slug="es/tracker-de-habitos-notas-iphone" path="/es/blog/tracker-de-habitos-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que alguien cuente tus rachas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de tracker de hábitos: marca un hábito con un toque y ve el anillo de la semana, tus rachas y el mes. ChatGPT o Claude pueden apuntarte el día.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Tres tarjetas dibujadas con listas de comprobación, abiertas en abanico, con marcas de recuento al lado."
        caption="Un tracker de hábitos en Notas es una lista que copias cada semana." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una semana de hábitos</h2>
      <p>
        Tres hábitos, siete días y un sitio para apuntar cómo fue la semana. Pon tus propios hábitos antes de pegarla y deja una palabra
        en cada línea, porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Tracker de hábitos semanal para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="El mismo Markdown pegado dos veces en Notas de Apple en macOS 27, en inglés: con Comando + V los símbolos se quedan como texto, y con Edición, Pegar en formato Markdown se convierte en un encabezado, una lista y texto en negrita."
        caption="A la izquierda, pegado normal. A la derecha, Pegar en formato Markdown. Con las líneas de lista pasa lo mismo." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown).
        La línea con # pasa a ser el título, cada día un encabezado y las líneas <code>- [ ]</code> una lista que puedes marcar. Con un
        Comando + V normal, los símbolos se quedan como texto. En el iPhone, escribe los hábitos como líneas, selecciónalos y toca el
        botón Lista de comprobación.
      </p>
      <p>
        Hay dos ajustes que ayudan. Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica), y lo que ya has hecho baja
        al final de cada día. Y una carpeta inteligente con el filtro Listas en No marcadas muestra todas las notas con algo pendiente
        de marcar. <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) explica cómo
        crear una.
      </p>

      <h2 id="cada-semana">Cada semana</h2>
      <p>
        El lunes, selecciona la nota de la semana anterior y elige Archivo, Duplicar nota. Luego cambia la fecha del título y desmárcalo
        todo: haz clic en la lista de cada día y elige Formato, Más, Anular todo. Guarda las notas viejas en una carpeta Hábitos. Esa
        carpeta es tu historial.
      </p>
      <p>
        Si llevas otras rutinas así, <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés) tiene
        una revisión semanal y una lista para hoy que se pegan igual. Si uno de tus hábitos es el gimnasio, un{" "}
        <a href="/es/blog/registro-de-entrenamiento-gym-notas-iphone">registro de entrenamiento en Notas</a> guarda las series y tus
        mejores marcas.
      </p>

      <h2 id="limites">Hasta dónde llega un tracker de hábitos en Notas</h2>
      <ul>
        <li><strong>No hay rachas.</strong> Notas no cuenta las marcas, así que los días seguidos que llevas caminando los cuentas tú, repasando las semanas anteriores.</li>
        <li><strong>No ves la semana de un vistazo.</strong> Cada día es su propia lista. Para saber qué hábito fallas más, tienes que leerte la nota entera.</li>
        <li><strong>Todos los hábitos, todos los días.</strong> Un hábito que quieres tres veces por semana, u ocho vasos de agua, no cabe en una sola marca.</li>
        <li><strong>Una copia cada lunes.</strong> Si se te olvida duplicarla, las marcas de la semana acaban en la nota de la anterior.</li>
      </ul>
      <p>
        Para tres hábitos y un poco de disciplina, la nota funciona. A partir de ahí, estás haciendo a mano el seguimiento que podría
        hacer una app.
      </p>

      <h2 id="pinto-notes">Un tracker de hábitos que cuenta por ti</h2>
      <Figure shot={{ ...SHOTS.habitApp, alt: "La app de tracker de hábitos en una nota de Pinto Notes en un Mac, en inglés: el anillo de esta semana al 62 %, 2 de 6 hábitos hechos hoy, una cuadrícula con la semana de cada hábito y los hábitos con sus marcas y rachas, entre ellos Gym con 1 de 3 esta semana." }}
        caption="La plantilla de tracker de hábitos de Pinto Notes en un Mac, con datos de ejemplo: el anillo de la semana, los hábitos de hoy con sus rachas y Gym con 1 de 3 esta semana." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y una nota también puede ser una pequeña app. La
        plantilla gratuita <a href="/templates/habit-tracker">Habit tracker</a> es una de ellas. Eliges tus hábitos una vez, los marcas
        con un toque, y te enseña el anillo de la semana, la racha y la mejor racha de cada hábito, y un mes que puedes rellenar después.
        Un hábito puede ser diario, de algunos días laborables, de unas cuantas veces por semana o una cuenta, como los vasos de agua.
      </p>
      <p>
        También puedes decirle a ChatGPT o a Claude lo que has hecho, en el chat que ya usas, y marca el día en la nota. Pregúntale qué
        hábito has fallado más este mes y lee el tracker para responderte.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Tus notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
