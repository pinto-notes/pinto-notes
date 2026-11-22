import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "menu-semanal-y-lista-de-la-compra-notas");

// Spanish version of /blog/apple-notes-meal-planner-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es) on 21 Nov: "menu semanal y lista de la compra" is a suggestion of its own, with
// "plantilla menu semanal y lista de la compra" and "app menu semanal y lista de la compra"; "menu semanal plantilla"
// and "planificador de comidas semanal" are suggested too; "menu semanal notas" gives nothing. Apple's own Spanish
// words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el
// Mac": Formato > Más > Anular todo, Ordenar automáticamente los ítems marcados, ajustes de Notas),
// /es-es/guide/notes/apde615d29c2/mac (Añadir enlace, Enlace a la sección), /es-es/guide/notes/apd0a136b9cc/mac
// (Formato > Tabla), /es-es/102462 ("Si no puedes colaborar en la app Notas": Cuenta de Apple, notas bloqueadas),
// /es-es/105086 ("Crear listas de la compra en Recordatorios en el iPhone": Tipo de lista, Compra, iOS 17, items
// grouped by section as you add them), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de
// comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable: Edición, Pegar en formato
// Markdown and Pegar como Markdown in es_419, Archivo, Duplicar nota, Anular todo). Paste as Markdown is new in
// macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. The share permission
// is described, not named: Apple's Spanish wording changed between iOS 26 and iOS 27. Facts are the English post's;
// the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Cenas, semana del 23 de noviembre

## Cenas
- Lunes: pollo al limón con arroz
- Martes: pasta con tomate y albahaca (cocina Óscar)
- Miércoles: tacos de pescado
- Jueves: curry de garbanzos (cocina Óscar)
- Viernes: pizza casera
- Sábado: cena fuera con amigos
- Domingo: pollo asado con patatas

## Fruta y verdura
- [ ] Limones
- [ ] Albahaca
- [ ] Tomates cherry
- [ ] Limas
- [ ] Patatas

## Carne y pescado
- [ ] Contramuslos de pollo
- [ ] Pescado blanco
- [ ] Pollo entero

## Todo lo demás
- [ ] Tortillas de trigo
- [ ] Garbanzos
- [ ] Leche de coco
- [ ] Masa de pizza
- [ ] Mozzarella

## Siempre en la despensa
- Aceite de oliva, sal, pimienta
- Arroz, pasta, copos de avena
- Cebollas, ajos
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de menú semanal?", a: [
    "No. Notas no tiene planificador de comidas ni plantillas. Una nota con las cenas de la semana arriba y la lista de la compra como listas de comprobación debajo funciona como uno, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Puedo compartir el menú en Notas con mi pareja?", a: [
    "Sí. Comparte la nota y elige que los demás puedan hacer cambios. Los dos necesitan una Cuenta de Apple, y una nota bloqueada no se puede compartir para editarla. Las marcas aparecen en los dos teléfonos.",
  ] },
  { q: "¿La lista de la compra va en Notas o en Recordatorios?", a: [
    "Recordatorios tiene, desde iOS 17, un tipo de lista Compra que ordena los artículos por secciones según los añades. Notas deja la lista junto a las cenas de las que sale. Si planificas primero la semana, tenerlo todo en una nota te ahorra copiar.",
  ] },
  { q: "¿Hay un planificador de comidas que escriba la lista de la compra?", a: [
    "Pinto Notes tiene una plantilla gratuita de menú semanal: las cenas de la semana, quién cocina y la compra por pasillos. ChatGPT o Claude pueden planificar la semana en ella y escribir la lista, sin lo que siempre tienes en la despensa.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="menu-semanal-y-lista-de-la-compra-notas"
      intro={<>
        Decidir qué hay de cena a las seis y descubrir entonces que no queda arroz. Un menú semanal arregla las dos cosas, y Notas de
        Apple puede guardarlo junto a la lista de la compra que necesita. Aquí tienes una plantilla para pegar, cómo prepararla para que
        la lista funcione en el súper y hasta dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#mejor", label: "Sácale más partido" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un menú que escribe la lista" },
        ]}>
          <p>
            Notas no tiene planificador de comidas, pero una nota sirve. Pon arriba las cenas de la semana, una línea por día, y debajo la
            compra como listas de comprobación, con un encabezado por pasillo. Copia la plantilla de abajo.
          </p>
          <PostCta template="meal-plan" slug="es/menu-semanal-y-lista-de-la-compra-notas" path="/es/blog/menu-semanal-y-lista-de-la-compra-notas"
            position="answer" ui={ui.cta} title="¿Quieres que la lista de la compra se escriba sola?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de menú semanal. Dile a ChatGPT o a Claude qué te apetece esta semana y planifica las cenas y escribe la lista de la compra por pasillos, sin lo que ya tienes en la despensa.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Una nota Groceries en Notas de Apple en un Mac, en inglés: una lista de ocho cosas que comprar, con Sourdough, Eggs y Spinach marcados y movidos al final."
        caption="Una lista de la compra en Notas de Apple en un Mac. Con Ordenar automáticamente los ítems marcados activado, lo que ya está en la cesta baja al final." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por semana</h2>
      <p>
        Una semana de cenas para dos, como ejemplo. Cambia primero las cenas y luego la compra que necesitan. Deja una palabra en cada
        línea, porque un ítem vacío de una lista no sobrevive al pegado. El último encabezado es una lista normal de lo que siempre
        tienes, para no comprar aceite de oliva cada semana.
      </p>
      <Keep title="Menú semanal para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="El mismo Markdown pegado dos veces en Notas de Apple en macOS 27, en inglés: con Comando + V los símbolos se quedan como texto, y con Edición, Pegar en formato Markdown se convierte en un encabezado, una lista y texto en negrita."
        caption="A la izquierda, pegado normal. A la derecha, Pegar en formato Markdown. Las líneas de lista funcionan igual." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown).
        La línea con # pasa a ser el título, cada línea con ## un encabezado, las cenas se quedan como lista normal y la compra se
        convierte en listas de comprobación. Con un Comando + V normal, los símbolos se quedan como texto. En el iPhone, escribe las
        líneas, selecciona la compra y toca el botón Lista de comprobación.
      </p>
      <p>
        Luego activa Ordenar automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica). En el súper, cada cosa que marcas baja al
        final de su lista, así que lo que falta se queda arriba.
      </p>

      <h2 id="mejor">Sácale más partido</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
        { on: "Mac", steps: ["Formato", "Más", "Anular todo"] },
      ]} />
      <ul>
        <li>
          <strong>La semana que viene, a partir de esta.</strong> El domingo, elige Archivo, Duplicar nota, cambia las cenas, haz clic en
          cada pasillo y elige Formato, Más, Anular todo. La mayoría de las semanas comparten la mitad de la compra.
        </li>
        <li>
          <strong>Las recetas, a un toque.</strong> Guarda cada receta en su propia nota y enlázala desde su cena con Añadir enlace. En
          iOS 27 y macOS 27, un enlace también puede apuntar a un encabezado, así que &ldquo;Ingredientes&rdquo; se abre justo donde lo
          necesitas.
        </li>
        <li>
          <strong>Compartida con quien cocine.</strong> Comparte la nota y deja que los demás puedan hacer cambios. Quien esté en el
          súper va marcando, y el otro teléfono lo ve. Los dos necesitan una Cuenta de Apple, y una nota bloqueada no se puede compartir
          así.
        </li>
      </ul>
      <p>
        Si prefieres ver la semana como una cuadrícula con una columna para quién cocina, Formato, Tabla crea una.{" "}
        <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) explica cómo. Para más notas que se pegan
        igual, mira <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un menú semanal en Notas</h2>
      <ul>
        <li><strong>La lista va a mano.</strong> Notas no sabe que un curry lleva leche de coco. Lees cada receta y escribes lo que necesita, todas las semanas.</li>
        <li><strong>No ordena por pasillos.</strong> Tú decides dónde van los limones. Recordatorios tiene una lista Compra que ordena los artículos por secciones según los añades, pero entonces la lista vive lejos de las cenas. Puedes organizar tu lista de la compra por pasillos.</li>
        <li><strong>No recuerda lo que tienes.</strong> Notas no puede decirte que hay arroz en casa. La lista de la despensa solo ayuda si la lees antes de escribir la compra.</li>
        <li><strong>No da ideas.</strong> Cuando nadie sabe qué cocinar, la nota espera.</li>
      </ul>
      <p>
        Compartir es lo que Notas hace bien. Planificar las cenas y convertirlas en una lista sigue siendo cosa tuya.
      </p>

      <h2 id="pinto-notes">Un menú semanal que escribe la lista de la compra</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Una nota Groceries en Pinto Notes en un Mac, en inglés. Las cinco líneas que acaba de añadir ChatGPT están resaltadas, y una barra abajo dice que ChatGPT ha cambiado 5 líneas, con Undo para deshacer." }}
        caption="Una nota de la compra en Pinto Notes en un Mac. Las cinco líneas que acaba de añadir ChatGPT están resaltadas, con Undo abajo para deshacer." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde
        el chat que ya usas. La plantilla gratuita <a href="/templates/meal-plan">Meal plan</a> es una nota con las cenas de la semana y
        quién cocina, la compra por pasillos y lo que siempre hay en la despensa.
      </p>
      <p>
        El fin de semana, pídele a tu IA que planifique la semana. Te pregunta qué noches cocinas y qué quieres saltarte, propone cenas,
        rellena la semana y luego escribe la lista de la compra por pasillos, sin lo que ya hay en la despensa. Di &ldquo;añade leche de
        avena&rdquo; el miércoles y acaba en el pasillo que toca. Cada línea que añade queda resaltada, con Undo para deshacer, y se
        guardan todas las versiones anteriores de la nota. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar
        ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Tus notas de Apple se pasan con <a href="/blog/import-your-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
