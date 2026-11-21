import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "ordenar-lista-notas-iphone");

// Spanish version of /blog/apple-notes-checklist-sort (batch 3, 21 Nov 2026). Search words, Google autocomplete (hl=es,
// gl=es) on 21 Nov: "lista notas iphone" gives "ordenar lista notas iphone", "hacer lista en notas iphone", "compartir
// lista notas iphone" and "lista compra notas iphone"; "lista notas iphone ordenar" gives "ordenar lista notas iphone";
// "notas iphone checklist" and "checklist iphone notes" are suggested too. "notas iphone marcados al final", "lista de
// verificacion notas" and "notas iphone tachar" give nothing. Apple's own Spanish words, all read on 21 Nov 2026, the
// same pages the English post cites: support.apple.com/es-es/102296 ("Crea una lista de verificación con Notas",
// published 25 Feb 2025: Ajustes > Apps > Notas, "Ordenar ítems marcados", Manualmente o Automáticamente; drag to
// reorder; swipe right to indent and left to undo; tap the empty circle; it calls the button "Lista de verificación");
// the iPhone guide for iOS 16 /es-es/guide/iphone/iph1ac0b3a2/16.0/ios/16.0 (the older path Ajustes > Notas > "Ordenar
// ítems marcados", Automáticamente "en todas tus notas"; its in-note Lista menu is not in the current guides, so it's
// left out, as in the English post); the Notes guide for Mac (macOS 27) /es-es/guide/notes/apd93c815aa0/mac ("Añadir
// listas en Notas en el Mac": hold an item and drag it, "Ordenar automáticamente los ítems marcados" in the Notes
// settings, Formato > Más > "Marcar todo" o "Anular todo", Comando and click any item, Tabulador and Mayúsculas +
// Tabulador, Mayúsculas + Retorno, Control + Comando + Flecha arriba o abajo), /apd97da26aed/mac ("Cambiar los ajustes":
// Notas > Ajustes; moves ticked items to the bottom and unticked ones back to the top) and /apd46c25187e/mac ("Atajos de
// teclado y gestos": Mayúsculas + Comando + L, Mayúsculas + Comando + U, Control + Comando + Flecha arriba o abajo).
// The button is "botón Lista de comprobación" here, as in the other Spanish posts (the Mac guide's word is "lista de
// comprobación"; article 102296 says "Lista de verificación"). File > Duplicate Note and File > New Smart Folder, the
// Listas rule with No marcadas, are the Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable,
// Localizable.loctable), with es_419 names where they differ, as in the other Spanish posts. Not confirmed on any Apple
// page, so left out: why a ticked item looks grey or struck through, and the iPhone taps for Uncheck All in iOS 27.
// Facts are the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const FAQ = [
  { q: "¿Por qué los ítems marcados bajan al final de la lista en Notas?", a: [
    "Porque Ordenar ítems marcados está en Automáticamente. En el iPhone, ve a Ajustes, Apps, Notas, Ordenar ítems marcados y toca Manualmente para que los ítems marcados se queden donde están. En un Mac, elige Notas, Ajustes y desmarca Ordenar automáticamente los ítems marcados.",
  ] },
  { q: "¿Puedo ordenar los ítems marcados solo en una nota?", a: [
    "El ajuste se aplica a todas las listas de todas las notas de ese dispositivo. Para ordenar una lista y dejar el resto como está, deja el ajuste desactivado y arrastra a mano los ítems marcados hacia abajo.",
  ] },
  { q: "¿Puede Notas de Apple ordenar una lista alfabéticamente?", a: [
    "No. Notas deja los ítems en el orden en que los escribes, y lo único que ordena según Apple es bajar los marcados al final. Arrastra los ítems a mano o, en un Mac, pulsa Control + Comando + Flecha arriba o Flecha abajo para mover una línea cada vez.",
  ] },
  { q: "¿Cuál es el atajo de teclado para una lista en Notas de Apple?", a: [
    "En un Mac, Mayúsculas + Comando + L convierte la línea en una lista de comprobación y Mayúsculas + Comando + U marca o desmarca el ítem en el que estás. Comando y clic en cualquier ítem los marca todos.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="ordenar-lista-notas-iphone"
      intro={<>
        Marcas un ítem de una lista en Notas de Apple y, o baja al final, o se queda donde estaba. Lo decide un solo ajuste, y está en un
        sitio distinto en el iPhone y en el Mac. Aquí tienes dónde encontrarlo, cómo mover los ítems a mano y cómo dejar una lista como
        nueva.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#iphone", label: "En el iPhone" },
          { href: "#mac", label: "En el Mac" },
          { href: "#a-mano", label: "Mover ítems a mano" },
          { href: "#anular-todo", label: "Anular todo" },
          { href: "#atajos", label: "Atajos" },
          { href: "#pinto-notes", label: "Una lista que se ordena sola" },
        ]}>
          <p>
            En el iPhone, ve a Ajustes, Apps, Notas, toca Ordenar ítems marcados y luego Automáticamente para que los ítems marcados bajen
            al final, o Manualmente para que se queden donde están. En un Mac, elige Notas, Ajustes y marca o desmarca Ordenar
            automáticamente los ítems marcados. Es un solo ajuste para todas tus notas, así que basta con configurarlo una vez en cada
            dispositivo.
          </p>
          <PostCta template="grocery-list" slug="es/ordenar-lista-notas-iphone" path="/es/blog/ordenar-lista-notas-iphone" position="answer"
            ui={ui.cta} title="¿Quieres que los ítems marcados se borren solos?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una lista de la compra gratuita. Dile a ChatGPT o a Claude lo que necesitas y coloca cada cosa en su pasillo, y cuando vuelves de la compra borra las líneas marcadas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="Una nota Groceries en Notas de Apple en un Mac, en inglés: ocho ítems sin marcar, de Oat milk a Dark chocolate, y debajo Sourdough, Eggs y Spinach marcados al final."
        caption="Una lista de la compra en Notas de Apple en un Mac, con los ítems marcados al final." />}
      faq={FAQ}
    >
      <h2 id="iphone">Bajar los ítems marcados al final en el iPhone</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Ajustes", "Apps", "Notas", "Ordenar ítems marcados"] },
      ]} />
      <p>
        El ajuste está en la app Ajustes (Configuración en Latinoamérica), no en Notas. Abre Ajustes, toca Apps, luego Notas, luego
        Ordenar ítems marcados, y elige:
      </p>
      <ul>
        <li><strong>Automáticamente.</strong> Cada ítem que marcas baja al final de su lista, así que lo que queda por hacer se queda arriba.</li>
        <li><strong>Manualmente.</strong> Los ítems marcados se quedan donde están. Elígelo si tu lista tiene un orden que quieres mantener, como los pasos de una receta.</li>
      </ul>
      <p>
        En versiones anteriores de iOS, el mismo ajuste está un nivel más arriba, en Ajustes, Notas, Ordenar ítems marcados. En los dos
        casos se aplica a todas las listas de todas las notas de ese iPhone.
      </p>

      <h2 id="mac">Bajar los ítems marcados al final en el Mac</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Notas", "Ajustes", "Ordenar automáticamente los ítems marcados"] },
      ]} />
      <p>
        En Notas, elige Notas, Ajustes y marca Ordenar automáticamente los ítems marcados. Marca un ítem y baja al final de la lista.
        Desmárcalo y vuelve arriba del todo. Si desmarcas el ajuste, los ítems se quedan donde están cuando los marcas.
      </p>
      <p>
        El Mac tiene su propio ajuste, separado del del iPhone, así que configúralo en los dos si quieres que tus listas se comporten igual
        en cada uno.
      </p>

      <h2 id="a-mano">Mover un ítem de la lista a mano</h2>
      <Paths rows={[
        { on: "iPhone", steps: ["Arrastra el ítem"] },
        { on: "Mac", steps: ["Mantén pulsado el ítem", "Arrástralo"] },
        { on: "Mac", steps: ["Subir el ítem"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Bajar el ítem"], keys: "⌃⌘↓" },
      ]} />
      <p>
        Con el orden en Manualmente, el orden lo decides tú. En el iPhone, arrastra un ítem adonde quieras. En un Mac, mantén pulsado un
        ítem y arrástralo, o pon el cursor en una línea y pulsa Control + Comando + Flecha arriba o Flecha abajo para moverlo un puesto cada
        vez. Notas no ordena una lista alfabéticamente, así que arrastrar también es la forma de poner los ítems en orden.
      </p>
      <p>
        Para agrupar ítems, aplícales sangría. En el iPhone, desliza un ítem hacia la derecha para aplicarla y hacia la izquierda para
        quitarla. En un Mac, pulsa Tabulador para aplicarla y Mayúsculas + Tabulador para quitarla. Para la compra, los encabezados
        funcionan mejor que el orden: un encabezado por pasillo, como en la <a href="/es/blog/lista-de-la-compra-notas-iphone">lista de
        la compra en Notas del iPhone</a>.
      </p>

      <h2 id="anular-todo">Anular todo, o marcar todo</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Formato", "Más", "Anular todo"] },
        { on: "Mac", steps: ["Formato", "Más", "Marcar todo"] },
      ]} />
      <p>
        Para volver a usar una lista, haz clic en ella y elige Formato, Más, Anular todo. Marcar todo marca todos los ítems. También hay
        una forma más rápida: pulsa Comando y haz clic en cualquier ítem. Si queda algún ítem sin marcar, Notas los marca todos, y si
        están todos marcados, los desmarca todos.
      </p>
      <p>
        Al desmarcarlo todo pierdes el registro de lo que habías marcado. Para una lista que guardas por su historial, como un <a
        href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos</a>, elige antes Archivo, Duplicar nota y deja como nueva la
        copia.
      </p>

      <h2 id="atajos">Atajos de teclado para listas en el Mac</h2>
      <Paths rows={[
        { on: "Lista", steps: ["Aplicar formato de lista de comprobación"], keys: "⇧⌘L" },
        { on: "Marcar", steps: ["Marcar o anular la marca de un ítem"], keys: "⇧⌘U" },
        { on: "Mover", steps: ["Ítem arriba o abajo"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Mayúsculas + Comando + L aplica el formato de lista de comprobación, igual que el botón Lista de comprobación. Mayúsculas + Comando
        + U marca o desmarca el ítem donde está el cursor, así que no necesitas el ratón. Mayúsculas + Retorno añade una segunda línea
        dentro de un mismo ítem. En el iPhone, toca el botón Lista de comprobación, y cada vez que pulsas Intro empieza un ítem nuevo.
      </p>

      <h2 id="listas-abiertas">Encuentra todas las listas con algo pendiente</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="El cuadro Nueva carpeta inteligente de Notas de Apple en macOS 27, en inglés, con el nombre Open to-dos y una sola regla: Checklists, Unchecked."
        caption="Una carpeta inteligente con todas las notas que tienen algún ítem sin marcar (en español, la regla es Listas, No marcadas). Notas de Apple en macOS 27." />
      <p>
        Ordenar arregla una lista. Para verlas todas, crea una carpeta inteligente con la regla Listas, No marcadas (en Latinoamérica, No
        completadas): reúne todas las notas que aún tienen algún ítem sin marcar, de cualquier carpeta. En un Mac, elige Archivo, Nueva
        carpeta inteligente. Los pasos para el iPhone están en <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">Apple Notes
        tags and Smart Folders</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega ordenar una lista</h2>
      <ul>
        <li><strong>Todas las notas o ninguna.</strong> El ajuste cubre todas las listas del dispositivo, así que una lista de la compra y una receta se ordenan igual.</li>
        <li><strong>Los marcados se acumulan.</strong> Bajan al final y se quedan ahí hasta que los eliminas o los desmarcas.</li>
        <li><strong>El orden es a mano.</strong> Notas no ordena por nombre ni por pasillo, y un ítem nuevo va donde lo escribes.</li>
      </ul>
      <p>
        Para una lista que usas cada semana, no pasa nada. Para una lista que cambia cada día, ordenarla es un trabajo en sí.
      </p>

      <h2 id="pinto-notes">Una lista que se ordena sola</h2>
      <Figure shot={{ ...SHOTS.aiEdit, alt: "Una nota Groceries en Pinto Notes en un Mac, en inglés. Las cinco líneas que acaba de añadir ChatGPT están resaltadas, y una barra abajo dice que ChatGPT ha cambiado 5 líneas, con Undo para deshacer." }}
        caption="Una nota de la compra en Pinto Notes en un Mac. Las cinco líneas que acaba de añadir ChatGPT están resaltadas, con Undo abajo para deshacer." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde el
        chat que ya usas. La plantilla gratuita <a href="/templates/grocery-list">Grocery list</a> es una lista con un encabezado por
        pasillo.
      </p>
      <p>
        Dile a tu IA lo que necesitas, aunque sea en una frase larga, y añade cada cosa bajo su pasillo y se salta lo que ya está en la
        lista. Marca las cosas mientras compras. Di &ldquo;ya he vuelto de la compra&rdquo; y borra las líneas marcadas y te dice qué
        queda. Puedes seguir añadiendo, marcando y arrastrando todo tú, y se guardan todas las versiones anteriores de cada nota. Funciona
        cuando ChatGPT o Claude están conectados, y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT</a> (en
        inglés) lleva un minuto.
      </p>
      <p>
        Las listas que ya tienes en Notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación
        en tu Mac</a> (en inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
