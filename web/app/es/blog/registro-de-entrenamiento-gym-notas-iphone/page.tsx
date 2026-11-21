import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "registro-de-entrenamiento-gym-notas-iphone");

// Spanish version of /blog/apple-notes-workout-log-template (templates, 21 Nov 2026). Search words, Google
// autocomplete (hl=es, gl=es and gl=mx) on 21 Nov: "registro de entrenamiento" gives "registro de entrenamiento gym"
// first, then excel, app, pdf and "plantilla registro de entrenamiento"; "plantilla rutina gimnasio" (pdf, excel,
// google sheets) is suggested too; "rutina gimnasio notas iphone" and "rutina gym notas" give nothing. Apple's own
// Spanish words, read on 21 Nov 2026: support.apple.com/es-es/guide/notes/apd93c815aa0/mac ("Añadir listas en Notas
// en el Mac": Formato > Más > Anular todo), /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla),
// /es-es/guide/notes/apdb54e469b6/mac ("Ordenar y fijar notas": Archivo > Fijar nota, pinned notes at the top of the
// list), the iPhone guide /es-es/guide/iphone/iph1ac0b3a2/ios (botón Lista de comprobación), and the Notes app's own
// Spanish strings on macOS 27.2 (MainMenu.loctable: Edición, Pegar en formato Markdown and Pegar como Markdown in
// es_419, Archivo, Duplicar nota, Anular todo, Fijar nota and Anclar nota in es_419). Paste as Markdown is new in
// macOS 27 and no Spanish support page covers it yet; its name here is the app's own string. Weights use a decimal
// comma. Facts are the English post's; the screenshot is its English one, described in Spanish.

const ui = UI.es;

const TEMPLATE = `# Registro de entrenamiento, semana del 23 de noviembre

## Programa
- Pierna: sentadilla, zancadas, elevaciones de gemelos
- Empuje: press de banca, press militar, fondos
- Tirón: peso muerto, remo, dominadas

## Lunes: pierna
- [ ] Sentadilla 3 x 5 con 100 kg
- [ ] Zancadas 3 x 10 con 16 kg
- [ ] Elevaciones de gemelos 3 x 15

## Miércoles: empuje
- [ ] Press de banca 3 x 6 con 70 kg
- [ ] Press militar 3 x 8 con 40 kg
- [ ] Fondos 3 x 10

## Viernes: tirón
- [ ] Peso muerto 3 x 3 con 120 kg
- [ ] Remo 3 x 8 con 60 kg
- [ ] Dominadas 3 x 6

## Mejores marcas
- Peso muerto: 120 kg x 3 (6 nov)
- Sentadilla: 100 kg x 5 (2 nov)
- Press de banca: 70 kg x 6 (4 nov)
- Carrera de 5 km: 29 min (5 nov)
`;

const FAQ = [
  { q: "¿Notas de Apple tiene una plantilla de entrenamiento?", a: [
    "No. Notas no tiene plantillas ni registro de entrenamiento. Una nota por semana, con un encabezado para cada día de entrenamiento y las series como lista de comprobación, funciona como uno, y puedes pegar directamente la plantilla de esta página.",
  ] },
  { q: "¿Apunto los entrenamientos en una lista o en una tabla?", a: [
    "Una lista es más rápida en el gimnasio: marcas cada serie y cambias el peso si fue distinto. Una tabla, con Formato, Tabla, alinea fechas y pesos, pero Notas no puede ordenarla ni sumarla, así que ayuda menos de lo que parece.",
  ] },
  { q: "¿Cómo llevo mis mejores marcas en Notas?", a: [
    "Ten una lista de mejores marcas al final de la nota y cambia la línea cuando la superes, con la fecha. Notas no detecta una marca nueva por ti, así que revisa la lista después de cada sesión.",
  ] },
  { q: "¿Hay un registro de entrenamiento que lleve mis mejores marcas?", a: [
    "Pinto Notes tiene una plantilla gratuita de registro de entrenamiento: una fila por sesión y una lista de mejores marcas. Cuéntale a ChatGPT o a Claude lo que has hecho después de entrenar y apunta la sesión y actualiza tus marcas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="registro-de-entrenamiento-gym-notas-iphone"
      intro={<>
        Una app de gimnasio te pide una cuenta, un plan y una suscripción antes de tu primera sentadilla. Una nota solo te pide las
        series. Aquí tienes una plantilla de registro de entrenamiento para pegar en Notas de Apple, cómo usarla en el gimnasio y cuándo
        deja de bastar.
      </>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#plantilla", label: "La plantilla" },
          { href: "#preparala", label: "Prepárala" },
          { href: "#gimnasio", label: "En el gimnasio" },
          { href: "#limites", label: "Hasta dónde llega" },
          { href: "#pinto-notes", label: "Un registro que guarda tus marcas" },
        ]}>
          <p>
            Notas no tiene registro de entrenamiento, pero una nota por semana sirve. Pon tu programa arriba, un encabezado para cada día
            de entrenamiento con las series como lista de comprobación y tus mejores marcas al final. Copia la plantilla de abajo y
            duplícala cada semana.
          </p>
          <PostCta slug="es/registro-de-entrenamiento-gym-notas-iphone" path="/es/blog/registro-de-entrenamiento-gym-notas-iphone"
            position="answer" ui={ui.cta} title="¿Quieres que alguien lleve tus mejores marcas?">
            <p>Pinto Notes funciona como Notas de Apple y tiene una plantilla gratuita de registro de entrenamiento. Cuéntale a ChatGPT o a Claude lo que has hecho después de entrenar y apunta la sesión y actualiza tus mejores marcas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="Una nota Workout log en Pinto Notes en un Mac, en inglés: una tabla Sessions con una fila por sesión, desde un día de tirón con peso muerto de 115 kg x 3 hasta peso muerto de 120 kg x 3, y una lista Personal bests debajo."
        caption="El mismo registro en Pinto Notes: una fila por sesión y tus mejores marcas al día. Datos de ejemplo." />}
      faq={FAQ}
    >
      <h2 id="plantilla">La plantilla: una nota por semana</h2>
      <p>
        Una semana de empuje, tirón y pierna como ejemplo. Cambia el programa y los ejercicios por los tuyos, y luego los pesos. Deja una
        palabra en cada línea, porque un ítem vacío de una lista no sobrevive al pegado.
      </p>
      <Keep title="Registro de entrenamiento para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy}
        note="En un Mac, pégala en una nota nueva con Edición, Pegar en formato Markdown." />

      <h2 id="preparala">Prepárala</h2>
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Pegar en formato Markdown"] }]} />
      <p>
        En un Mac con macOS 27, crea una nota nueva y elige Edición, Pegar en formato Markdown (en Latinoamérica, Pegar como Markdown).
        La línea con # pasa a ser el título, cada línea con ## un encabezado y las series se convierten en listas de comprobación. Con un
        Comando + V normal, los símbolos se quedan como texto. En el iPhone, escribe las líneas, selecciona las series y toca el botón
        Lista de comprobación. Pon la nota en una carpeta Salud y fíjala (en Latinoamérica, anclarla), para que sea lo primero que ves
        al abrir Notas en el gimnasio.
      </p>

      <h2 id="gimnasio">En el gimnasio</h2>
      <Paths rows={[
        { on: "Mac", steps: ["Archivo", "Duplicar nota"] },
        { on: "Mac", steps: ["Formato", "Más", "Anular todo"] },
      ]} />
      <ul>
        <li>
          <strong>Marca cada serie al terminarla.</strong> Si el peso o las repeticiones fueron otros, cambia la línea en ese momento:
          &ldquo;Sentadilla 3 x 5 con 102,5 kg&rdquo;. Esa línea editada es tu registro.
        </li>
        <li>
          <strong>Apunta cómo te sentiste.</strong> Una palabra después de la línea, como &ldquo;fácil&rdquo; o &ldquo;última repe
          lenta&rdquo;, le dice a tu yo de la semana que viene si debe subir el peso.
        </li>
        <li>
          <strong>La semana que viene, a partir de esta.</strong> El domingo, elige Archivo, Duplicar nota, cambia la fecha y los pesos,
          haz clic en cada día y elige Formato, Más, Anular todo.
        </li>
        <li>
          <strong>Una marca nueva va al final.</strong> Cuando una serie supera una línea de Mejores marcas, cambia esa línea y su fecha.
        </li>
      </ul>
      <p>
        Si prefieres ver las semanas en una cuadrícula, Formato, Tabla crea una. <a href="/blog/apple-notes-tables" hrefLang="en">Tables
        in Apple Notes</a> (en inglés) explica cómo, y lo que no pueden hacer. Para llevar hábitos en vez de series, tienes un{" "}
        <a href="/es/blog/tracker-de-habitos-notas-iphone">tracker de hábitos en Notas</a>, y más notas para pegar como esta en{" "}
        <a href="/blog/apple-notes-templates" hrefLang="en">Apple Notes templates</a> (en inglés).
      </p>

      <h2 id="limites">Hasta dónde llega un registro de entrenamiento en Notas</h2>
      <ul>
        <li><strong>Cada semana es su propia nota.</strong> Para ver cómo te ha ido el press de banca este mes, abres cuatro notas y las lees una al lado de otra.</li>
        <li><strong>Las marcas van a mano.</strong> Notas no se da cuenta de que 120 kg superan a 115 kg. Revisas la lista y la cambias tú, o no la cambia nadie.</li>
        <li><strong>Las tablas no cuentan.</strong> Una tabla en Notas no puede ordenar por ejercicio ni sumar el volumen de una semana.</li>
        <li><strong>No hay respuestas.</strong> &ldquo;¿Qué hice el miércoles pasado?&rdquo; significa hacer scroll.</li>
      </ul>
      <p>
        Para una semana, una nota es el registro más rápido que hay. A lo largo de meses, la parte útil, ver que te estás haciendo más
        fuerte, queda en tus manos.
      </p>

      <h2 id="pinto-notes">Un registro de entrenamiento que guarda tus mejores marcas</h2>
      <p>
        Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, y ChatGPT o Claude pueden trabajar en tus notas desde
        el chat que ya usas. La plantilla gratuita <a href="/templates/workout-log">Workout log</a> es una sola nota para todo tu
        entrenamiento: una tabla con una fila por sesión, con la fecha, el entrenamiento, el ejercicio, el resultado y lo duro que fue
        del 1 al 10, y tus mejores marcas debajo.
      </p>
      <p>
        Después de entrenar, cuéntale a tu IA lo que has hecho: &ldquo;peso muerto, 120 a tres repeticiones, me costó como un
        nueve&rdquo;. Añade la fila y, si es una marca nueva, cambia también esa línea. Luego pregunta &ldquo;¿estoy ganando fuerza en
        press de banca?&rdquo; o &ldquo;¿qué hice el miércoles pasado?&rdquo; y responde con todo el registro. Puedes seguir añadiendo y
        editando cada fila tú, y se guardan todas las versiones anteriores de la nota.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conectar ChatGPT</a> (en inglés) lleva un minuto.
      </p>
      <p>
        Tus notas de Apple se pasan con <a href="/blog/move-from-apple-notes" hrefLang="en">una sola importación en tu Mac</a> (en
        inglés), y Notas de Apple no cambia. La app está en inglés.
      </p>
    </LocalPostPage>
  );
}
