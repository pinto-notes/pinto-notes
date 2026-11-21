import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-recetas-notas-iphone");

// Spanish version of /blog/apple-notes-recipe-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "plantilla de receta" gives "plantilla de recetas", "plantilla de recetas de
// cocina", "plantilla de recetario" and "plantilla de recetario de cocina" (the rest is about medical prescriptions);
// "plantilla para recetas" (mx) gives the same; "recetas en notas iphone" and "recetario notas iphone" give nothing.
// "Recetario" is the word for the recipe box. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Formato > Más > Anular
// todo), /es-es/guide/notes/apde615d29c2/mac ("Añadir enlaces": Edición > Añadir enlace, Comando + K, start typing the
// note's title to link to it), /es-es/guide/notes/apda85974595/mac (Resultados matemáticos), the iPhone guide
// /es-es/guide/iphone/iph908d1558b/ios (botón Adelante, Añadir enlace) and /iph1ac0b3a2/ios (botón Lista de
// comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable and Localizable.loctable:
// Edición, Pegar en formato Markdown and Pegar como Markdown in es_419, Añadir enlace and Agregar enlace in es_419,
// Anular todo). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the
// app's own string. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Sopa de lentejas con limón

Para 4, 35 minutos. De: la ficha de la abuela

## Ingredientes
- [ ] 250 g de lentejas rojas
- [ ] 1 cebolla
- [ ] 2 zanahorias
- [ ] 2 dientes de ajo
- [ ] 1 cucharadita de comino molido
- [ ] 2 limones

De la despensa: aceite de oliva, sal.

## Pasos
1. Rehoga la cebolla, las zanahorias y el ajo en aceite de oliva con el comino.
2. Añade las lentejas y un litro de agua. Deja cocer a fuego lento 20 minutos.
3. Tritura la mitad y luego añade el zumo de limón y sal al gusto.

## Notas
- Hecha el 14 nov: le faltaba limón.
`;

const INDEX = `# Recetario

## Entre semana
- Sopa de lentejas con limón

## Fin de semana
- Pollo asado con patatas

## Repostería
- Bizcocho de plátano

## Para probar
- Fideos con sésamo
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de recetas?", a: [
    "No. Notas no tiene plantillas. Una nota por receta, con los ingredientes como lista de comprobación y los pasos como lista numerada, funciona como una, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Cómo organizo las recetas en Notas?", a: [
    "Pon todas las recetas en una carpeta Recetas, una nota cada una, y ten una nota índice que las enlace bajo encabezados como Entre semana, Fin de semana y Repostería. La búsqueda encuentra una receta por cualquier palabra que tenga, así que también vale un ingrediente.",
  ] },
  { q: "¿Puedo ajustar las cantidades de una receta en Notas?", a: [
    "No por sí sola. Notas hace las cuentas que escribes con Resultados matemáticos, pero no divide por la mitad una lista de ingredientes. Cambias cada cantidad a mano.",
  ] },
  { q: "¿Hay una app de recetas que funcione como Notas de Apple?", a: [
    "Pinto Notes se parece a Notas de Apple y funciona igual, y tiene una plantilla gratuita de recetario. Pega una receta en ChatGPT o Claude y guarda una copia limpia con los ingredientes como lista de comprobación, y luego la archiva en tu recetario.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-recetas-notas-iphone"
      intro={<>
        Las recetas acaban en capturas de pantalla, pestañas abiertas y el reverso de un sobre. Notas de Apple puede tenerlas todas en un
        sitio si todas siguen el mismo formato. Aquí tienes una plantilla de recetas para pegar en Notas, una nota índice para volver a
        encontrarlas y cuándo deja de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#recetario", label: "Un recetario" },
          { href: "#cocina", label: "En la cocina" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un recetario que se ordena solo" },
        ]}>
          <p>
            Notas no tiene plantilla de recetas, pero una nota por receta sirve: las raciones y el tiempo arriba, los ingredientes como
            lista de comprobación y los pasos como lista numerada. Guárdalas en una carpeta Recetas con una nota índice que enlace a cada
            una, y copia la plantilla de abajo para cada receta nueva.
          </p>
          <PostCta template="recipe-box" slug="es/plantilla-recetas-notas-iphone" path="/es/blog/plantilla-recetas-notas-iphone" position="answer" ui={ui.cta}
            title="¿Quieres que alguien te limpie las recetas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene un recetario gratuito. Pega una receta en ChatGPT o Claude y guarda una copia limpia, con los ingredientes como lista de comprobación, y la archiva.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="Una nota Lentil soup with lemon en Pinto Notes en un Mac, en inglés: para 4, 35 minutos, seis ingredientes como lista de comprobación con las lentejas y la cebolla marcadas, una línea From the cupboard y tres pasos numerados."
        caption="Una receta en Pinto Notes, tal como la guarda el recetario. El mismo formato funciona en Notas de Apple." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por receta</h2>
      <p>
        Cada receta tiene las mismas cuatro partes, así que la lees de un vistazo con las manos llenas de harina. La línea de la despensa
        deja el aceite y la sal fuera de la lista de comprobación de la compra. Deja una palabra en cada línea, porque un ítem vacío de una
        lista no sobrevive al pegado.
      </p>
      <Keep title="Receta para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown) convierte la línea con # en el
        título, cada línea con ## en un encabezado y los ingredientes en una lista de comprobación. Con un Comando + V normal, los símbolos
        se quedan como texto. En el iPhone, escríbela, selecciona los ingredientes y toca el botón Lista de comprobación.
      </p>

      <h2 id="recetario">Un recetario: una nota índice</h2>
      <p>
        Una carpeta de recetas se ordena por fecha, y eso no ayuda nada cuando es martes y quieres algo rápido. Ten una nota más,
        Recetario, con un encabezado para cada tipo de comida, y fíjala arriba en la carpeta.
      </p>
      <Keep title="Índice del recetario" text={INDEX} copyLabel={ui.copy} />
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Añadir enlace"], keys: "⌘K" },
        { on: "iPhone", steps: ["Menú de edición", "Añadir enlace"] },
      ]} />
      <p>
        Luego convierte cada nombre en un enlace: selecciónalo, elige Añadir enlace (en Latinoamérica, Agregar enlace) y escoge la nota
        de la receta. Al tocarlo se abre la receta. Las ideas que encuentras pero aún no has cocinado van en Para probar, y así dejan de
        vivir en las pestañas del navegador.
      </p>

      <h2 id="cocina">En la cocina</h2>
      <ul>
        <li>
          <strong>Marca los ingredientes mientras compras o cocinas.</strong> La lista te sirve para la compra, y en la cocina te dice lo
          que ya está en la olla.
        </li>
        <li>
          <strong>Desmárcala para la próxima vez.</strong> Haz clic en los ingredientes y elige Formato, Más, Anular todo.
        </li>
        <li>
          <strong>Apunta lo que cambiaste.</strong> Una línea bajo el encabezado Notas, como &ldquo;le faltaba limón&rdquo;, es como una receta se vuelve
          tuya.
        </li>
        <li>
          <strong>Busca por ingrediente.</strong> La búsqueda de Notas lee cada palabra, así que buscar &ldquo;garbanzos&rdquo; encuentra
          todas las recetas que los llevan.
        </li>
      </ul>
      <p>
        Para planificar la semana a partir de tu recetario, el <a href="/es/blog/menu-semanal-y-lista-de-la-compra-notas">menú semanal
        en Notas</a> pone las cenas y la compra en una nota, y la <a href="/es/blog/lista-de-la-compra-notas-iphone">plantilla de lista
        de la compra</a> ordena la compra por pasillos. Tienes más notas para pegar en{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un recetario en Notas</h2>
      <ul>
        <li><strong>Cada receta se escribe o se limpia a mano.</strong> Una receta copiada de un blog llega con la historia de la autora, los anuncios y los comentarios.</li>
        <li><strong>El índice va a mano.</strong> Una receta nueva no está en el recetario hasta que añades su enlace.</li>
        <li><strong>No ajusta cantidades.</strong> Cocinar para dos con una receta para seis es cambiar tú cada cantidad.</li>
        <li><strong>La búsqueda encuentra palabras, no respuestas.</strong> Encuentra los garbanzos. No te dice qué hacer con garbanzos y las espinacas que hay que gastar.</li>
      </ul>
      <p>
        Para unas cuantas favoritas, una carpeta de notas es todo lo que necesitas. Para una colección de verdad, archivar es el trabajo,
        y te toca a ti.
      </p>

      <h2 id="pinto-notes">Un recetario que se ordena solo</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/recipe-box">Recipe box</a> es una nota con entre semana, fin de semana,
        repostería y para probar, y una nota para cada receta dentro.
      </p>
      <p>
        Pega una receta en tu IA, con la página entera. Guarda una copia limpia como nota propia: las raciones y el tiempo, los
        ingredientes como lista de comprobación, lo que sale de la despensa y pasos cortos numerados, sin la historia. Luego archiva el
        enlace bajo el encabezado que toca. Pregúntale &ldquo;¿qué puedo hacer con garbanzos y espinacas?&rdquo; y busca en el recetario,
        o pídele &ldquo;haz la sopa de lentejas para dos&rdquo; y hace las cuentas. Puedes seguir escribiendo y editando cada receta tú, y
        se guardan todas las versiones anteriores de una nota. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar
        ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Las recetas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
