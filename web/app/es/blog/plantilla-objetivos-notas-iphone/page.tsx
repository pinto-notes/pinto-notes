import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-objetivos-notas-iphone");

// Spanish version of /blog/apple-notes-goal-template, 21 Nov 2026. Google autocomplete (hl=es, gl=es):
// "plantilla de objetivos" suggests "plantilla de objetivos y metas personales", "plantilla de objetivos smart"
// and "plantilla de objetivos mensuales". "plantilla objetivos notas iphone" has no suggestions.
// Apple Support read 21 Nov 2026: /es-es/guide/notes/apd93c815aa0/mac (botón Lista de comprobación),
// /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla, tabulador), /es-es/guide/notes/apd1955d3b21/mac
// (botón Formato, Encabezamiento), /es-es/guide/iphone/iph1ac0b3a2/ios (nota, encabezado, tabla y lista).
// No menu name had to be inferred. No picture in the English post.

const ui = UI.es;
const TEMPLATE = `Terminar El último tren

Resultado
Terminar un cuento con final antes del 18 de diciembre de 2026.

Punto de partida
14 de noviembre: 1800 palabras. Tengo la primera escena; falta decidir el final.

Meta
Unas 6000 palabras, con todas las escenas escritas y sin huecos.
El borrador estará completo cuando tenga todas las escenas y un final.

Pruebas del avance
Fecha\tQué cambió y dónde comprobarlo
14 de noviembre\t1800 palabras. Archivo: El último tren, 14 nov.
21 de noviembre\t2700 palabras. Escena de la estación añadida y final esbozado. Archivo: El último tren, 21 nov.

Hitos
29 de noviembre: llegar a 3000 palabras y terminar la escena central
13 de diciembre: llegar a unas 6000 palabras y escribir el final
18 de diciembre: leer el borrador entero y completar lo que falte

Siguiente paso
Escribir la conversación en la estación antes de que salga el tren.

Próxima revisión
29 de noviembre de 2026. Comparar el último borrador con el punto de partida.
Comprobar si la escena central está terminada y elegir el siguiente paso.
`;
const PROMPT = `Lee mi nota de objetivos "Terminar El último tren" en Pinto Notes.
Añade esta prueba con fecha 28 de noviembre de 2026: el borrador tiene 3200 palabras y la escena central está terminada. La fuente es mi archivo "El último tren, 28 nov".
Marca el hito del 29 de noviembre como terminado según esa prueba.
Conserva el punto de partida, el resultado, la meta y las pruebas anteriores.
Pon la próxima revisión el 6 de diciembre de 2026.
Propón aquí en el chat un siguiente paso. Pregúntame si falta algo; no inventes avances ni enlaces a fuentes.`;
const FAQ = [
  { q: "¿Qué debe llevar una plantilla de objetivos para Notas?", a: ["Un resultado, un punto de partida con fecha, una meta, pruebas de avance, hitos y una próxima revisión. Añade también el siguiente paso."] },
  { q: "¿Pongo todos mis objetivos en una sola nota?", a: ["Si un objetivo dura semanas y necesita varios hitos o pruebas, dale su propia nota. Así conservas también la meta inicial si cambia."] },
  { q: "¿La fecha de revisión crea un aviso?", a: ["No. Aquí es solo texto. Si necesitas una notificación, crea un recordatorio aparte."] },
  { q: "¿En qué se diferencia de un registro de hábitos?", a: ["Un objetivo tiene un resultado y pruebas de avance. Un hábito registra acciones repetidas. Escribir cada mañana es un hábito; acabar un cuento para el 18 de diciembre es un objetivo."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-objetivos-notas-iphone"
    intro={<>Copia esta plantilla de objetivos en una nota por resultado. Guarda el punto de partida, la meta y las pruebas fechadas junto a los hitos y la próxima revisión.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "La plantilla" }, { href: "#preparar", label: "Prepararla" },
      { href: "#revisar", label: "Revisar el avance" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto", label: "Actualizarla con IA" },
    ]}><p>Usa una nota por objetivo de varias semanas. El ejemplo sigue un cuento hasta tener un borrador completo. Los hitos se convierten en una lista de comprobación y las pruebas en una tabla.</p>
      <div id="plantilla"><Keep title="Plantilla de objetivos para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Cópiala en una nota nueva. Después convierte los hitos en lista y las pruebas en tabla." /></div>
      <PostCta slug="es/plantilla-objetivos-notas-iphone" path="/es/blog/plantilla-objetivos-notas-iphone" position="answer" ui={ui.cta} title="Actualiza tu objetivo con ayuda"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Tras conectarlos, ChatGPT o Claude pueden leer la nota y añadir las pruebas que les des.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
    <h2 id="preparar">Prepara la nota en Notas de Apple</h2>
    <p>Usa una nota de iCloud o guardada en el dispositivo. Apple avisa de que algunas funciones no están disponibles con cuentas de otros proveedores. La plantilla se puede leer sin aplicar formato.</p>
    <Paths rows={[{ on: "Mac", steps: ["Botón Formato", "Encabezamiento"] }, { on: "Mac", steps: ["Formato", "Tabla"] }, { on: "iPhone", steps: ["Botón Formato", "Encabezamiento"] }]} />
    <p>En el Mac, pega el texto en una nota nueva. Pon el cursor en cada nombre de sección, pulsa el botón Formato y elige Encabezamiento. Selecciona las tres líneas de Hitos y pulsa el botón Lista de comprobación.</p>
    <p>Para la tabla, selecciona las tres líneas desde Fecha hasta el 21 de noviembre y pulsa el botón Tabla. Los tabuladores separan las columnas. También puedes usar Formato, Tabla y escribir las celdas a mano. Tabulador en la última celda añade una fila. Consulta la <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés).</p>
    <p>En iPhone, crea una nota y pega el texto. Aplica Encabezamiento a cada sección desde el botón Formato. Vuelve a escribir los hitos con el botón Lista de comprobación y pulsa Retorno para añadir cada uno. Añade una tabla para las pruebas y borra las líneas originales cuando hayas pasado los datos.</p>
    <h2>Sustituye el ejemplo por un resultado</h2>
    <p>"Escribir más" no dice cuándo has acabado. "Terminar un cuento antes del 18 de diciembre" sí. El número de palabras ayuda a medir el avance, pero el cuento aún necesita un final. Anota el punto de partida y el archivo que lo demuestra antes de cambiar nada.</p>
    <p>Elige hitos que puedas comprobar, como terminar una escena. Si cambias el plazo o la meta, añade una frase con la fecha y el motivo. Conserva la meta inicial.</p>
    <h2 id="revisar">Revisa las pruebas y elige un paso</h2>
    <p>El 29 de noviembre, abre el borrador y comprueba las palabras y la escena central. Añade una fila con la fecha y el archivo. Marca el hito solo si se cumplen las dos cosas. Si hay 3200 palabras pero la escena sigue a medias, déjalo pendiente y anótalo.</p>
    <p>Actualiza Siguiente paso y Próxima revisión. Conserva las pruebas anteriores. Al llegar la fecha límite, comprueba también el final y las partes que falten. La <a href="/es/blog/revision-semanal-notas-iphone">revisión semanal</a> te ayuda a decidir qué objetivo atender, mientras esta nota conserva sus pruebas.</p>
    <h2 id="limites">Hasta dónde llega la plantilla</h2>
    <p>La nota guarda lo que escribes. No inspecciona el borrador, mide el avance ni avisa el día de la revisión. Comprueba cada hito con su fuente antes de marcarlo. Un resultado fechado y su archivo suelen servir más que un relato largo de la semana.</p>
    <h2 id="pinto">Actualiza la misma nota con ChatGPT o Claude</h2>
    <p>Pinto Notes admite encabezados, listas y tablas. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y permitir el acceso, la IA puede leer y editar la nota. Dale un resultado que hayas comprobado.</p>
    <Keep title="Pide a tu IA que actualice el objetivo" text={PROMPT} copyLabel={ui.copy} note="Comprueba antes el borrador. Cambia el resultado, el archivo y las fechas por los tuyos." />
    <p>Revisa la edición. Debe aparecer la nueva prueba de 3200 palabras, quedar marcado solo el hito del 29 de noviembre y mantenerse el punto de partida. Comprueba la próxima revisión. Pinto conserva las versiones anteriores.</p>
    <p>Puedes traer tus notas de Apple con <a href="/blog/move-from-apple-notes" hrefLang="en">una importación en el Mac</a> (en inglés). Notas de Apple no cambia. La app está en inglés.</p>
  </LocalPostPage>;
}

