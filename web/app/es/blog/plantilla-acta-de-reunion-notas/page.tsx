import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-acta-de-reunion-notas");

// Spanish version of /blog/apple-notes-meeting-notes-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "plantilla acta de reunion" gives word, excel, empresa and
// "descargar plantilla acta de reunion"; "acta de reunion" gives plantilla, ejemplo, modelo; "notas de reunion
// plantilla" gives only "plantilla notas de reunion", and "notas de reunion iphone" gives nothing. So the slug and
// title use "acta de reunión", and the text calls it notas de reunión too. Apple's own Spanish words, read on 21 Nov
// 2026: support.apple.com/es-es/guide/notes/apd58edc7964/mac ("Utilizar carpetas inteligentes": Archivo > Nueva
// carpeta inteligente, the Listas filter, alguno o todos los criterios), /es-es/guide/notes/apdc88ed7f1d/mac (Usar
// etiquetas), /es-es/guide/notes/apdb5106e334/mac ("Grabar y transcribir audio": transcripción, resumen, Apple
// Intelligence), /es-es/102462 ("Si no puedes colaborar en la app Notas": Cuenta de Apple), the iPhone guide
// /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de comprobación), and the Notes app's own Spanish strings on
// macOS 27.2 (MainMenu.loctable, SmartFolderFoldersFilterView.loctable and SmartFolderChecklistsFilterView.loctable:
// Edición, Pegar en formato Markdown and Pegar como Markdown in es_419, Archivo, Duplicar nota, Nueva carpeta
// inteligente, the Carpetas filter, Listas with No marcadas, and No completadas in es_419). Paste as Markdown is new
// in macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. Facts are the English
// post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Reunión de producto, 24 de noviembre

Asistentes: Sara, Jonás, Emma

## Orden del día
- Página de precios
- Diseño de la pantalla de pago

## Notas
- Ventas pidió los nuevos precios antes de diciembre
- Dos de cada tres probadores no vieron el total en la pantalla de pago

## Decisiones
- Se mantienen los tres planes, sin pago único de por vida
- El total pasa por encima de los datos de la tarjeta

## Tareas
- [ ] Sara: enviar los nuevos precios a ventas (vie)
- [ ] Jonás: mover el total en la pantalla de pago (mié)
- [ ] Emma: revisar las normas del IVA para Noruega (próxima semana)
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de acta de reunión?", a: [
    "No. Notas no tiene plantillas. Una nota por reunión, con encabezados para el orden del día, las notas, las decisiones y las tareas, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo llevo las tareas de las reuniones en Notas?", a: [
    "Escríbelas como lista de comprobación con el nombre de la persona delante. Luego crea una carpeta inteligente con dos criterios, tu carpeta Reuniones y Listas en No marcadas, y todas las reuniones con algo pendiente aparecen en un solo sitio.",
  ] },
  { q: "¿Notas puede grabar y resumir una reunión?", a: [
    "Con Apple Intelligence, una grabación en Notas se convierte en una transcripción y un resumen. No saca quién hace qué y para cuándo, así que las tareas las sigues escribiendo tú.",
  ] },
  { q: "¿Hay una app de notas de reunión que escriba las tareas por mí?", a: [
    "Pinto Notes tiene una plantilla gratuita de notas de reunión. Pega tus notas sueltas o una transcripción en ChatGPT o Claude, y escribe el resumen, las decisiones y cada tarea con su responsable y su fecha.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-acta-de-reunion-notas"
      intro={<>
        Las notas de una reunión solo sirven por la parte que casi todo el mundo se salta: qué se decidió y quién hace qué después. Aquí
        tienes una plantilla de acta de reunión para pegar en Notas de Apple, una forma de ver todas las tareas pendientes en un solo
        sitio y el punto en que Notas deja de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#tareas", label: "Tareas pendientes" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un acta que se redacta sola" },
        ]}>
          <p>
            Notas no tiene plantilla de acta de reunión, pero una nota por reunión sirve: quién asistió, el orden del día, tus notas, las
            decisiones y las tareas como lista de comprobación, con un nombre en cada una. Guárdalas en una carpeta Reuniones, y una
            carpeta inteligente te enseña todas las tareas que siguen pendientes.
          </p>
          <PostCta template="meeting-notes" slug="es/plantilla-acta-de-reunion-notas" path="/es/blog/plantilla-acta-de-reunion-notas" position="answer"
            ui={ui.cta} title="¿Quieres que las tareas se escriban solas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de notas de reunión. Pega tus notas sueltas en ChatGPT o Claude y escribe el resumen, las decisiones y quién hace qué.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="Una nota Meeting notes en Pinto Notes en un Mac, en inglés: tareas con un responsable y una fecha cada una, una de ellas marcada, y luego una sección Pricing sync con un resumen de dos líneas y las decisiones."
        caption="Notas de reunión en Pinto Notes: las tareas pendientes arriba y cada reunión debajo. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por reunión</h2>
      <p>
        Las decisiones y las tareas son lo que vas a volver a buscar, así que tienen sus propios encabezados. Pon un nombre y un día en
        cada tarea: &ldquo;mirar lo del IVA&rdquo; sin responsable no lo hace nadie. Deja una palabra en cada línea, porque un ítem
        vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Acta de reunión para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
      ]} />
      <ul>
        <li>
          <strong>Pégala una vez.</strong> En un Mac con macOS 27, crea una nota y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown). La línea con # pasa a ser el título, cada línea con ## un encabezado y las tareas una
          lista de comprobación. En el iPhone, escribe los encabezados y toca el botón Lista de comprobación para las tareas.
        </li>
        <li>
          <strong>Guarda una copia en blanco.</strong> Borra las líneas de ejemplo y guarda esa nota en una carpeta Reuniones. Antes de
          cada reunión, elige Archivo, Duplicar nota y cambia el título.
        </li>
        <li>
          <strong>Etiqueta las habituales.</strong> Escribe #semanal en la nota de una reunión y todas las reuniones semanales quedan a
          un toque en la barra lateral.
        </li>
        <li>
          <strong>Grábala si no puedes escribir.</strong> Con Apple Intelligence, una grabación en Notas se convierte en una
          transcripción y un resumen. Copia de ahí las decisiones y las tareas a la plantilla.
        </li>
      </ul>

      <h2 id="tareas">Ver todas las tareas pendientes</h2>
      <Paths rows={[{ on: "Mac", steps: ["Archivo", "Nueva carpeta inteligente"] }]} />
      <p>
        Tareas repartidas en veinte notas de reunión son tareas que no hace nadie. En un Mac, elige Archivo, Nueva carpeta inteligente,
        llámala Tareas pendientes y ponle dos criterios que se tengan que cumplir los dos: Carpetas, con tu carpeta Reuniones, y Listas,
        con No marcadas (en Latinoamérica, No completadas). Todas las reuniones con algo pendiente están en esa carpeta, y una reunión
        sale de ella en cuanto marcas su última tarea.
      </p>
      <p>
        Si quienes asisten a la reunión también usan Notas de Apple, comparte la nota y deja que puedan hacer cambios, para que cada
        persona marque sus tareas. Todos necesitan una Cuenta de Apple. Para el final de la semana, <a href="/blog/apple-notes-templates"
        hrefLang="en">Apple Notes templates</a> (en inglés) tiene una revisión semanal para pegar, y{" "}
        <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Tags and Smart Folders</a> (en inglés) repasa todos los criterios
        que puede usar una carpeta inteligente.
      </p>

      <h2 id="limites">Hasta dónde llegan las actas de reunión en Notas</h2>
      <ul>
        <li><strong>Redactarla te toca a ti.</strong> Unas notas sueltas o una transcripción no se convierten solas en decisiones y responsables.</li>
        <li><strong>No hay lista por persona.</strong> Una carpeta inteligente te enseña las reuniones con tareas pendientes, no &ldquo;todo lo que tiene pendiente Sara&rdquo;.</li>
        <li><strong>No hay respuestas entre reuniones.</strong> &ldquo;¿Qué decidimos sobre los precios el mes pasado?&rdquo; significa abrir notas hasta dar con ello.</li>
      </ul>
      <p>
        Para un par de reuniones a la semana, la plantilla y una carpeta inteligente bastan. Con más, redactar el acta es el trabajo para
        el que nadie tiene tiempo.
      </p>

      <h2 id="pinto-notes">Notas de reunión que se redactan solas</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/meeting-notes">Meeting notes</a> es una sola nota para todas tus
        reuniones: las tareas pendientes arriba y una sección corta por reunión debajo, de la más reciente a la más antigua.
      </p>
      <p>
        Después de una reunión, pega tus notas sueltas o una transcripción en tu IA. Escribe un resumen de dos líneas y las decisiones, y
        añade cada tarea como &ldquo;Sara: enviar los nuevos precios a ventas (vie)&rdquo;. Si algo no está claro, pregunta antes de
        escribirlo. Luego pregúntale &ldquo;¿qué tengo pendiente?&rdquo;, o dile que la revisión de Jonás está hecha y marca la línea.
        Puedes seguir escribiendo y marcando todo tú, y se guardan todas las versiones anteriores de la nota.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto, y tus notas de
        Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en inglés). La app
        está en inglés.
      </p>
    </LocalPostPage>
  );
}
