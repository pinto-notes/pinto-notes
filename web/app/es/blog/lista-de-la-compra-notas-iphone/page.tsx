import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "lista-de-la-compra-notas-iphone");

// Spanish version of /blog/apple-notes-grocery-list-template (templates, 21 Nov 2026). Search words, Google
// autocomplete on 21 Nov: "lista de la compra notas" gives "lista de la compra notas iphone" (hl=es, gl=es), and
// "lista de la compra iphone" gives it too, with "compartida iphone" and "recordatorios iphone"; in Mexico "lista de
// compras iphone" gives "lista de compras notas iphone" and "lista del super" gives "lista del super en iphone".
// "lista de la compra por pasillos" gives nothing. Apple's own Spanish words, read on 21 Nov 2026:
// support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas en el Mac": Formato > Más > Anular
// todo, Ordenar automáticamente los ítems marcados, ajustes de Notas), /es-es/guide/notes/apdb54e469b6/mac ("Ordenar y
// fijar notas": pinned notes at the top of the list), /es-es/102462 ("Si no puedes colaborar en la app Notas": Cuenta
// de Apple, notas bloqueadas), /es-es/105086 ("Crear listas de la compra en Recordatorios en el iPhone": Tipo de
// lista, Compra, iOS 17, items grouped by section as you add them), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios
// (botón Lista de comprobación), and the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable: Edición,
// Pegar en formato Markdown and Pegar como Markdown in es_419, Anular todo, Fijar nota and Anclar nota in es_419).
// Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is the app's own
// string. The share permission is described, not named: Apple's Spanish wording changed between iOS 26 and iOS 27.
// Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Lista de la compra

## Fruta y verdura
- [ ] Manzanas
- [ ] Espinacas
- [ ] Limones

## Pan y lácteos
- [ ] Leche de avena
- [ ] Huevos

## Carne y pescado
- [ ] Filetes de salmón

## Despensa
- [ ] Tomate triturado, 2 latas
- [ ] Arroz

## Congelados
- [ ] Guisantes

## Hogar
- [ ] Detergente para platos
`;

const FAQ = [
  { q: "¿Notas de Apple puede ordenar una lista de la compra?", a: [
    "Por pasillos, no. Notas deja los artículos en el orden en que los escribes. Pon un encabezado para cada pasillo y añade cada cosa debajo del suyo, y activa Ordenar automáticamente los ítems marcados para que lo que ya está en la cesta baje al final.",
  ] },
  { q: "¿Notas o Recordatorios para la compra?", a: [
    "Recordatorios tiene, desde iOS 17, un tipo de lista Compra que ordena los artículos por secciones según los añades. Notas es mejor cuando la lista va junto a un menú semanal o unas recetas, o cuando quieres tus propios pasillos en el orden de tu súper.",
  ] },
  { q: "¿Puede mi familia añadir cosas a la misma lista de la compra?", a: [
    "Sí. Comparte la nota y deja que los demás puedan hacer cambios. Todos necesitan una Cuenta de Apple, y una nota bloqueada no se puede compartir para editarla. Las marcas y las cosas nuevas aparecen en todos los teléfonos.",
  ] },
  { q: "¿Hay una lista de la compra que se ordene sola?", a: [
    "Pinto Notes tiene una plantilla gratuita de lista de la compra por pasillos. Dile a ChatGPT o a Claude lo que necesitas, aunque sea en una frase larga, y pone cada cosa en su pasillo.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="lista-de-la-compra-notas-iphone"
      intro={<>
        Una lista de la compra en Notas de Apple crece en el orden en que se acaban las cosas, y acabas recorriendo el súper dos veces.
        Un encabezado por pasillo lo arregla casi todo. Aquí tienes una plantilla de lista de la compra para pegar en Notas, cómo
        compartirla y cuándo es mejor usar Recordatorios.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#compartir", label: "Compártela" },
          { href: "#recordatorios", label: "Notas o Recordatorios" },
          { href: "#pinto-notes", label: "Una lista que se ordena sola" },
        ]}>
          <p>
            Notas no puede ordenar una lista de la compra por pasillos, pero los encabezados sí. Haz una nota con un encabezado para cada
            pasillo y las cosas como lista de comprobación debajo, activa Ordenar automáticamente los ítems marcados y compártela con
            quien más haga la compra. Copia la plantilla de abajo para empezar.
          </p>
          <PostCta template="grocery-list" slug="es/lista-de-la-compra-notas-iphone" path="/es/blog/lista-de-la-compra-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que cada cosa vaya sola a su pasillo?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una lista de la compra por pasillos gratuita. Dile a ChatGPT o a Claude lo que necesitas y pone cada cosa en el pasillo que toca.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="Una nota Grocery list en Pinto Notes en un Mac, en inglés: los encabezados Fruit and veg, Bread and dairy, Meat and fish y Cupboard, cada uno con una lista de comprobación, con Bananas y Butter marcados."
        caption="Una lista de la compra por pasillos en Pinto Notes. El mismo formato funciona en Notas de Apple. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una lista, un encabezado por pasillo</h2>
      <p>
        Pon los pasillos en el orden en que recorres tu súper y lo cruzas una sola vez. Cámbiales el nombre para que encajen: charcutería,
        bebé, mascotas. Deja una palabra en cada línea, porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Lista de la compra para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] },
        { on: "Mac", steps: ["Formato", "Más", "Anular todo"] },
      ]} />
      <ul>
        <li>
          <strong>Pégala.</strong> En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en
          Latinoamérica, Pegar como Markdown): cada línea con ## pasa a ser un encabezado y las cosas una lista de comprobación. En el
          iPhone, escribe los pasillos y luego las cosas, selecciónalas y toca el botón Lista de comprobación.
        </li>
        <li>
          <strong>Deja que lo marcado baje.</strong> Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas (Configuración en Latinoamérica). En el
          súper, cada cosa que marcas baja al final de su pasillo, así que lo que falta siempre está arriba.
        </li>
        <li>
          <strong>Una sola lista, no una por semana.</strong> Borra las líneas marcadas al llegar a casa, o elige Formato, Más, Anular
          todo para lo que compras cada semana.
        </li>
        <li>
          <strong>Fíjala.</strong> Una nota fijada (en Latinoamérica, anclada) se queda arriba del todo en tus notas, así que es lo primero
          que ves en el súper.
        </li>
      </ul>

      <h2 id="compartir">Compártela con las personas para las que compras</h2>
      <p>
        Comparte la nota y elige que los demás puedan hacer cambios. Cualquiera en casa apunta lo que se ha acabado, y quien esté en el
        súper lo va marcando. Los cambios aparecen en todos los teléfonos. Todos necesitan una Cuenta de Apple, y una nota bloqueada no se
        puede compartir para editarla.
      </p>
      <p>
        Si planificas primero las cenas, el <a href="/es/blog/menu-semanal-y-lista-de-la-compra-notas">menú semanal en Notas</a> guarda
        las comidas de la semana y esta lista en una sola nota, y la <a href="/es/blog/plantilla-recetas-notas-iphone">plantilla de
        recetas</a> tiene los ingredientes de cada receta como una lista con la que puedes hacer la compra. Tienes más notas para pegar
        en <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="recordatorios">¿Notas o Recordatorios?</h2>
      <p>
        Hay que ser justos con Recordatorios: desde iOS 17 tiene un tipo de lista Compra que ordena por secciones, él solo, lo que vas
        añadiendo. Es lo único que Notas no puede hacer. Si lo único que quieres es una lista que se ordene, úsalo.
      </p>
      <p>
        Notas gana cuando la lista va junto a otras cosas: un menú semanal, una receta, una nota sobre quién viene a cenar. Además te deja
        elegir los pasillos y su orden, mientras que Recordatorios elige sus propias secciones.
      </p>

      <h2 id="limites">Hasta dónde llega una lista de la compra en Notas</h2>
      <ul>
        <li><strong>El orden lo pones tú.</strong> Cada cosa va a su pasillo a mano, así que lo que apuntas deprisa al salir acaba al final.</li>
        <li><strong>No detecta duplicados.</strong> Dos personas apuntan leche y llegan dos a casa.</li>
        <li><strong>Limpiarla va a mano.</strong> Después de la compra, las líneas marcadas se quedan hasta que las borras.</li>
      </ul>

      <h2 id="pinto-notes">Una lista de la compra que se ordena sola</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/grocery-list">Grocery list</a> es una lista por pasillos: fruta y
        verdura, pan y lácteos, carne y pescado, despensa, congelados y hogar.
      </p>
      <p>
        Dile a tu IA lo que necesitas, aunque sea en una frase larga: &ldquo;nos hacen falta huevos, dos latas de tomate, espinacas y
        detergente para platos&rdquo;. Pone cada cosa en su pasillo y se salta lo que ya está en la lista. Cuando le dices que has vuelto
        de la compra, borra las líneas marcadas y te dice lo que queda. Puedes seguir escribiendo y marcando cada cosa tú, y puedes{" "}
        <a href="/blog/share-a-note-and-edit-it-together" hrefLang="en">compartir la nota y editarla en común</a> (en inglés), viendo los
        cambios de cada uno mientras escribe. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en
        inglés) lleva un minuto. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
