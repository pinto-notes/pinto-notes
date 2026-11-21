import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-viaje-notas-iphone");

// Spanish version of /blog/apple-notes-trip-planner-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es) on 21 Nov: "plantilla viaje" gives excel, notion, canva, google sheets; "itinerario de
// viaje plantilla" and "planificador de viajes" (gratis, online, app) are suggested, and so is "lista de equipaje de
// viaje"; "plantilla viaje notas" and "planificador de viajes notas" give nothing. Apple's own Spanish words, read on
// 21 Nov 2026: support.apple.com/es-es/guide/notes/apde615d29c2/mac ("Añadir enlaces": Edición > Añadir enlace,
// Comando + K, Enlace a la sección), /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla), /es-es/guide/notes/
// apd93c815aa0/mac (Formato > Más > Anular todo), the iPhone guide /es-es/guide/iphone/iph908d1558b/ios (botón
// Adelante, Añadir enlace, Enlace a la sección, ">>") and /iph1ac0b3a2/ios (botón Lista de comprobación), and the
// Notes app's own Spanish strings on macOS 27.2 (MainMenu.loctable and Localizable.loctable: Edición, Pegar en
// formato Markdown and Pegar como Markdown in es_419, Archivo, Duplicar nota, Enlazar a, Añadir enlace and Agregar
// enlace in es_419). Paste as Markdown is new in macOS 27 and no Spanish support page covers it yet; its name here is
// the app's own string. Attach File in the iPhone edit menu on iOS 27: no Spanish Apple page or iOS string was at hand,
// so the step is described without a menu name. Facts are the English post's; the screenshots are its English ones,
// described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Lisboa, del 22 al 26 de octubre

## Reservas
- [ ] Vuelo MAD a LIS, jue 22 oct 06:55, ref. TP7XQ2
- [ ] Hotel Príncipe Real, del 22 al 26 oct, ref. 88412093
- [ ] Cena con fado, sáb 24 oct 20:00
- [ ] Vuelo LIS a MAD, lun 26 oct 17:40

## Jueves 22 de octubre
- 06:55 Vuelo a Lisboa
- 13:00 Comida en el Time Out Market
- 15:00 Entrada en el hotel
- 19:30 Atardecer en el Miradouro da Senhora do Monte

## Viernes 23 de octubre
- 09:30 Tranvía 28 a Alfama
- 12:00 Comida cerca del castillo
- Tarde libre

## Sábado 24 de octubre
- 10:00 Excursión a Sintra
- 20:00 Cena con fado

## Equipaje
- [ ] Pasaporte o documento de identidad
- [ ] Datos del seguro de viaje
- [ ] Cargador del teléfono
- [ ] Adaptador de enchufe
- [ ] Zapatos cómodos
- [ ] Impermeable
- [ ] Cepillo de dientes
- [ ] Protector solar

## Ideas
- Traer sardinas en lata
- Pedirle a Marta su lista de pastelerías
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla para planificar viajes?", a: [
    "No. Notas no tiene planificador de viajes ni plantillas. Una nota con un encabezado para las reservas, otro para cada día y una lista de equipaje funciona como uno, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Puedo guardar mis billetes en Notas?", a: [
    "Sí. En un Mac, arrastra el PDF a la nota. En el iPhone con iOS 27, el menú de edición tiene una opción para adjuntar un archivo. Una pega: una nota con un archivo adjunto no se puede bloquear.",
  ] },
  { q: "¿Cómo reutilizo la lista de equipaje en el siguiente viaje?", a: [
    "Duplica la nota con Archivo, Duplicar nota, haz clic en la lista de equipaje y elige Formato, Más, Anular todo. Cambia las fechas y borra los días antiguos.",
  ] },
  { q: "¿Hay un planificador de viajes gratis que funcione como una nota?", a: [
    "Pinto Notes tiene una plantilla gratuita de viaje: una nota que es una pequeña app, con una cuenta atrás, cada día como una línea de tiempo, las reservas con una marca de pagado y una lista de equipaje. ChatGPT o Claude pueden añadir una reserva que les pegues.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-viaje-notas-iphone"
      intro={<>
        El vuelo está en un correo, el hotel en otro, el plan del sábado en un chat y la lista de equipaje en tu cabeza. Notas de Apple
        puede tenerlo todo en una sola nota. Aquí tienes una plantilla de viaje para pegar, tres maneras de sacarle más partido y hasta
        dónde llega.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#mejor", label: "Sácale más partido" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un plan de viaje que lleva la cuenta" },
        ]}>
          <p>
            Notas no tiene planificador de viajes, pero una nota sirve. Ponle una lista de reservas que marcas cuando están pagadas, un
            encabezado para cada día con la hora delante de cada plan y una lista de equipaje. Copia la plantilla de abajo.
          </p>
          <PostCta slug="es/plantilla-viaje-notas-iphone" path="/es/blog/plantilla-viaje-notas-iphone" position="answer" ui={ui.cta}
            title="¿Quieres que la cuenta atrás y las reservas se lleven solas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de viaje: los días que faltan, cada día como una línea de tiempo, lo que queda por pagar y lo que ya está en la maleta. Pega el correo de una reserva en ChatGPT o Claude y acaba en el plan.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="Un sobre dibujado con una flecha hacia una tarjeta con una lista de comprobación, con dos de sus ítems marcados en naranja."
        caption="Cada correo de reserva acaba como una línea del plan." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por viaje</h2>
      <p>
        Cuatro días en Lisboa, como ejemplo. Pon tu propio viaje antes de pegarla: las reservas con sus números de confirmación, un
        encabezado por día y lo que siempre se te olvida meter en la maleta. Deja una palabra en cada línea, porque un ítem vacío de una
        lista no sobrevive al pegado.
      </p>
      <Keep title="Plantilla de viaje para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="El mismo Markdown pegado dos veces en Notas de Apple en macOS 27, en inglés: con Comando + V los símbolos se quedan como texto, y con Edición, Pegar en formato Markdown se convierte en un encabezado, una lista y texto en negrita."
        caption="A la izquierda, pegado normal. A la derecha, Pegar en formato Markdown. Las líneas de lista funcionan igual." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown).
        La línea con # pasa a ser el título, cada línea con ## un encabezado, las reservas y el equipaje se convierten en listas de
        comprobación, y los planes se quedan como lista normal. Con un Comando + V normal, los símbolos se quedan como texto. En el
        iPhone, escribe las líneas, selecciona las reservas y el equipaje y toca el botón Lista de comprobación.
      </p>
      <p>
        Marca una reserva cuando esté pagada, y las que queden sin marcar son lo que aún debes. Si prefieres ver las reservas como una
        tabla con columnas para la fecha y la referencia, Formato, Tabla crea una. <a href="/blog/apple-notes-tables" hrefLang="en">Tables
        in Apple Notes</a> (en inglés) explica cómo, y lo que no pueden hacer.
      </p>

      <h2 id="mejor">Sácale más partido</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Edición", "Añadir enlace", "Enlace a la sección"], keys: "⌘K" },
        { on: "iPhone", steps: ["Menú de edición", "Añadir enlace", "Enlace a la sección"] },
      ]} />
      <ul>
        <li>
          <strong>Un índice arriba.</strong> En macOS 27 y en iOS 27, un enlace puede apuntar a un encabezado, así que la nota puede
          empezar con un enlace a cada día. Escribe el título del viaje en Enlazar a y aparecen sus encabezados. En Latinoamérica, Añadir
          enlace se llama Agregar enlace. <a href="/blog/apple-notes-ios-27" hrefLang="en">What&apos;s new in Apple Notes in iOS 27</a>{" "}
          (en inglés) tiene los detalles.
        </li>
        <li>
          <strong>Los billetes en la nota.</strong> En un Mac, arrastra el PDF de un billete o de la confirmación del hotel a la nota,
          debajo de su reserva. En el iPhone con iOS 27, usa la opción para adjuntar un archivo del menú de edición. Una nota con un
          archivo dentro no se puede bloquear, así que no apuntes en ella números de pasaporte.
        </li>
        <li>
          <strong>La misma lista la próxima vez.</strong> Cuando vuelvas, elige Archivo, Duplicar nota, haz clic en la lista de equipaje
          y elige Formato, Más, Anular todo. La copia es el principio del siguiente viaje.
        </li>
      </ul>
      <p>
        Si planificas así a menudo, <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés) tiene una
        lista de equipaje y una revisión semanal que se pegan igual.
      </p>

      <h2 id="limites">Hasta dónde llega un plan de viaje en Notas</h2>
      <ul>
        <li><strong>No hay cuenta atrás.</strong> Las fechas son palabras. Notas no sabe que el viaje es dentro de nueve días, ni que hoy es el segundo día.</li>
        <li><strong>Las reservas van a mano.</strong> Cada correo de confirmación se copia línea a línea: la hora, la referencia, el día al que pertenece.</li>
        <li><strong>Los días no se ordenan.</strong> Añade una cena al viernes y te toca buscar el encabezado del viernes y el sitio correcto dentro. Pásala al sábado y te toca cortar y pegar.</li>
        <li><strong>No hay recuento.</strong> Saber cuántas reservas quedan por pagar o cuánto falta por meter en la maleta es contar marcas.</li>
      </ul>
      <p>
        Para un fin de semana fuera, la nota sobra. Para una semana con vuelos, trenes y unas cuantas cenas reservadas, acabas
        ordenando el plan a mano.
      </p>

      <h2 id="pinto-notes">Un plan de viaje que lleva la cuenta</h2>
      <Figure shot={{ ...SHOTS.tripApp, alt: "La app de plan de viaje en una nota de Pinto Notes en un Mac, en inglés: Lisboa, faltan 9 días, 3 de 5 reservas pagadas, 5 de 14 cosas en la maleta y el primer día como una línea de tiempo con el vuelo y el hotel." }}
        caption="La plantilla de viaje de Pinto Notes en un Mac, con datos de ejemplo: faltan 9 días, 3 de 5 reservas pagadas, 5 de 14 cosas en la maleta y el primer día como una línea de tiempo." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y una nota también puede ser una pequeña app. La
        plantilla gratuita <a href="/templates/trip-plan">Trip plan</a> es una de ellas. Dices adónde vas y cuándo, y cuenta los días que
        faltan y luego en qué día del viaje estás. Cada día es una línea de tiempo con sus reservas en su sitio. Las reservas tienen un
        tipo, una hora y una referencia, y una marca cuando están pagadas, así que te dice lo que queda por pagar. La lista de equipaje va
        por grupos, con un toque por cosa, y un viaje nuevo la conserva.
      </p>
      <p>
        También puedes pegar la confirmación de una reserva en ChatGPT o Claude, en el chat que ya usas, y la añade al día que toca.
        Pregúntale qué te falta por reservar y lee el plan para responderte.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Tus notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
