import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-presupuesto-mensual-notas-iphone");

// Spanish version of /blog/apple-notes-budget-template (templates, 21 Nov 2026). Search words, Google autocomplete
// (hl=es, gl=es and gl=mx) on 21 Nov: "plantilla de presupuesto" gives mensual, personal, gratis, excel; "presupuesto
// mensual plantilla" and "presupuesto personal plantilla" are suggested; "presupuesto notas iphone" and "plantilla
// presupuesto notas" give nothing, so the slug leads with "plantilla presupuesto mensual" and adds "notas iphone".
// Apple's own Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apda85974595/mac ("Resolver
// problemas matemáticos": Formato > Resultados matemáticos, Sugerir resultados, Retorno, the example Comida=25),
// /es-es/guide/notes/apd0a136b9cc/mac (Añadir una tabla) and the Notes app's own Spanish strings on macOS 27.2
// (MainMenu.loctable and Localizable.loctable: Archivo, Duplicar nota, Formato, Resultados matemáticos, and
// Resultados de los cálculos in es_419). The named amounts have no accents, so the template works as typed. Facts
// are the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const TEMPLATE = `Presupuesto, noviembre

Ingresos = 3200

Alquiler = 1200
Comida = 450
Transporte = 120
Gimnasio = 30
Ocio = 150
Ahorro = 500

Alquiler + Comida + Transporte + Gimnasio + Ocio + Ahorro =
Ingresos - Alquiler - Comida - Transporte - Gimnasio - Ocio - Ahorro =
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de presupuesto?", a: [
    "No. Notas no tiene ninguna plantilla. Aun así puedes hacer una nota de presupuesto que se suma sola: pon cada cantidad con un nombre en su propia línea, suma los nombres con un signo igual y Resultados matemáticos escribe el total.",
  ] },
  { q: "¿Notas de Apple hace cuentas?", a: [
    "Sí, con Resultados matemáticos. Escribe una suma que acabe en un signo igual y Notas te ofrece el resultado. Las cantidades con nombre, como Alquiler = 1200, se pueden usar en sumas posteriores, y si cambias una se actualizan todos los resultados que hay debajo.",
  ] },
  { q: "¿Por qué no suma mi tabla de presupuesto en Notas?", a: [
    "Resultados matemáticos no funciona dentro de una tabla. Deja la tabla para leer, si quieres, y pon las cantidades con nombre y las sumas como líneas normales debajo.",
  ] },
  { q: "¿Hay una app de presupuesto gratis que funcione como una nota?", a: [
    "Pinto Notes tiene una plantilla gratuita de presupuesto y gastos: una nota que es una pequeña app, con lo que te queda este mes, cada categoría frente a su presupuesto, los recibos mensuales y los últimos seis meses. ChatGPT o Claude pueden apuntar en ella lo que has gastado.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="plantilla-presupuesto-mensual-notas-iphone"
      intro={<>
        Quieres un presupuesto en el sitio donde ya lo apuntas todo, no otra app con su cuenta y su contraseña. Notas de Apple da para
        más de lo que parece. Aquí tienes una plantilla que se suma sola para pegar en una nota, hasta dónde llega y qué usar cuando se
        te quede corta.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#como-suma", label: "Cómo suma" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un presupuesto que se lleva solo" },
        ]}>
          <p>
            Notas no tiene plantillas, pero una nota de presupuesto puede hacer las cuentas. Pon cada cantidad en su propia línea con un
            nombre, como Alquiler = 1200, y luego suma los nombres con un signo igual al final. Resultados matemáticos escribe el total y
            lo que te queda. Copia la plantilla de abajo en una nota nueva.
          </p>
          <PostCta template="budget-log" slug="es/plantilla-presupuesto-mensual-notas-iphone" path="/es/blog/plantilla-presupuesto-mensual-notas-iphone"
            position="answer" ui={ui.cta} title="¿Quieres un presupuesto que se lleve solo?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de presupuesto y gastos: lo que te queda este mes, cada categoría frente a su presupuesto y los recibos que se repiten. Dile a ChatGPT o a Claude lo que has gastado y lo apunta.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="Una nota llamada Sequoia Group Expenses en un iPhone, en inglés: cada gasto con nombre en su propia línea, los nombres sumados hasta 475 $ y 475 $ entre 5, 95 $ por persona."
        caption="El ejemplo de Apple del truco en el que se basa una nota de presupuesto: pon nombre a cada cantidad y suma los nombres. Imagen: Apple." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: un presupuesto mensual que se suma solo</h2>
      <p>
        Crea una nota nueva y pega esto. Cambia las cantidades y los nombres por los tuyos. Vale cualquier nombre, siempre que lo
        escribas igual cada vez.
      </p>
      <Keep title="Presupuesto mensual para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="Notas te ofrece cada resultado después del signo igual. Pulsa Retorno para quedártelo." />
      <p>
        La primera suma es lo que tienes previsto gastar. La segunda es lo que te queda cuando restas de tus ingresos todo, el ahorro
        incluido. Si el segundo resultado es menor que cero, el plan no cuadra.
      </p>
      <p>
        Usa una nota por mes. En un Mac, Archivo, Duplicar nota copia la del mes anterior, así que solo cambias el título y las
        cantidades que se han movido. Si también guardas otras plantillas, <a href="/blog/apple-notes-templates" hrefLang="en">Apple
        Notes templates</a> (en inglés) explica cómo montar una carpeta de plantillas.
      </p>

      <h2 id="como-suma">Cómo suma</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="Una tabla de presupuesto de mudanza en Notas de Apple en macOS 27, en inglés. La celda Total dice 85+240+180= sin resultado. Debajo de la tabla, Boxes = 85, Van = 240 y Cleaning = 180 tienen nombre, y Boxes + Van + Cleaning = muestra 505 como sugerencia de Notas."
        caption="En macOS 27: dentro de una tabla, la suma se queda tal cual. Como líneas con nombre debajo, Notas responde: 505." />
      <Paths rows={[{ on: "Mac", steps: ["Formato", "Resultados matemáticos"] }]} />
      <p>
        Notas lo llama Resultados matemáticos (en Latinoamérica, Resultados de los cálculos). Una línea como Alquiler = 1200 le pone
        nombre a la cifra, y cualquier línea posterior que acabe en un signo igual recibe su resultado. Cambia Comida de 450 a 500 y los
        dos totales se actualizan, que es casi todo lo que hace por ti una hoja de cálculo de presupuesto. Si en un Mac no aparece ningún
        resultado, comprueba que Formato, Resultados matemáticos está activado.
      </p>
      <p>
        Una pega: no funciona dentro de una tabla. Resultados matemáticos se desactiva mientras estás en una, así que una celda Total se
        queda como texto. <a href="/blog/apple-notes-tables" hrefLang="en">Tables in Apple Notes</a> (en inglés) repasa lo que las
        tablas pueden y no pueden hacer.
      </p>

      <h2 id="limites">Hasta dónde llega un presupuesto en Notas</h2>
      <ul>
        <li><strong>Los gastos van a mano.</strong> Para llevar lo que gastas de verdad, añades una línea por cada compra y su nombre a la suma. A las pocas semanas, la línea de la suma es larguísima.</li>
        <li><strong>No hay meses uno al lado del otro.</strong> Cada mes es su propia nota, así que comparar este mes con los seis anteriores es abrir seis notas.</li>
        <li><strong>No hay recibos que se repitan.</strong> El alquiler y las suscripciones hay que escribirlos en la nota de cada mes.</li>
        <li><strong>No hay categorías con límite.</strong> Ves lo que te queda en total, no que te has pasado en comer fuera y vas por debajo en transporte.</li>
      </ul>
      <p>
        Para un plan que haces una vez al mes, la nota basta. Si quieres apuntar los gastos según los haces, ahí es donde la nota se
        queda corta.
      </p>

      <h2 id="pinto-notes">Una nota de presupuesto que se lleva sola</h2>
      <Figure shot={{ ...SHOTS.budgetApp, alt: "La app de presupuesto en una nota de Pinto Notes en un Mac, en inglés: quedan 8.205 kr en octubre, unos 410 kr al día después de los recibos, un gráfico de los últimos seis meses, los recibos del mes y cada categoría frente a su presupuesto con lo que se arrastró del mes anterior." }}
        caption="La plantilla de presupuesto y gastos de Pinto Notes en un Mac, con datos de ejemplo: lo que queda este mes, los últimos seis meses, los recibos y cada categoría frente a su presupuesto." />
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y una nota también puede ser una pequeña app. La
        plantilla gratuita <a href="/templates/budget-log">Budget and expenses</a>, de presupuesto y gastos, es una de ellas: pones una
        vez un presupuesto mensual por categoría, y te enseña lo que te queda este mes con una barra, cada categoría frente a su
        presupuesto con lo que se arrastró del mes anterior, tus recibos mensuales y los últimos seis meses. Añades un gasto con un toque
        y ella hace las cuentas.
      </p>
      <p>
        También puedes decirle a ChatGPT o a Claude lo que has gastado, en el chat que ya usas, y añade el gasto a la nota. Las cuentas
        las hace la app, no la IA. <a href="/blog/budget-tracker-with-chatgpt-or-claude" hrefLang="en">A budget your AI can keep for
        you</a> (en inglés) explica cómo funciona.
      </p>
      <p>
        Tus notas de Apple se pasan con <a href="/blog/import-your-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
