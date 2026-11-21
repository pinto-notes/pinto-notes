import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "segundo-cerebro-notas-iphone");

// Versión de /blog/apple-notes-second-brain. Autocomplete, hl=es, gl=es, 21 Nov 2026:
// "segundo cerebro notas iphone" y "segundo cerebro notas de apple" no devolvieron sugerencias;
// se usa la expresión habitual "segundo cerebro" con Notas del iPhone.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apd558a85438/mac
// (Archivo > Nueva carpeta, arrastrar notas), /not9474646a9/mac (nota nueva, primera línea,
// Archivo > Duplicar nota), /apdc88ed7f1d/mac (etiquetas), /apd58edc7964/mac
// (Archivo > Nueva carpeta inteligente, Etiquetas, las notas permanecen en su carpeta),
// /apdb54e469b6/mac (Archivo > Fijar nota), /apde615d29c2/mac (Edición > Añadir enlace,
// Usar el título de la nota, >>), /es-es/guide/iphone/iph908d1558b/ios (>>),
// /es-es/102288 (etiquetas y carpetas inteligentes en iPhone). Sin capturas.
const ui = UI.es;
const HOME = `Inicio

Esta semana
Elegir plantas para el balcón

Proyectos en curso
Jardín del balcón

Para consultar
Plantas de sombra
Notas de riego

Revisión semanal
Leer las notas de Entrada
Archivar lo que merezca la pena conservar
Escribir el siguiente paso de cada proyecto activo
Mover los proyectos terminados a Archivo
`;
const FAQ = [
  { q: "¿Puedo usar Notas de Apple como segundo cerebro?", a: ["Sí. Crea Entrada para notas nuevas, Proyectos para el trabajo activo, Consulta para lo que reutilizarás y Archivo para lo terminado. Fija una nota Inicio con enlaces a lo importante de esta semana y revisa Entrada con regularidad."] },
  { q: "¿Hay una plantilla de segundo cerebro para Notas?", a: ["Copia la nota Inicio de esta página. Cambia los ejemplos por tus proyectos y añade enlaces reales con Edición, Añadir enlace en el Mac, o escribiendo >> y el título de la nota en iPhone o Mac. Los títulos pegados son solo texto."] },
  { q: "¿Cómo reúno las notas de un proyecto que están en distintas carpetas?", a: ["Ponles una etiqueta común, como #jardin. En el Mac, elige Archivo, Nueva carpeta inteligente y usa Etiquetas como criterio. Las notas aparecerán juntas sin salir de sus carpetas originales."] },
  { q: "¿Cada cuánto conviene revisar este sistema?", a: ["Prueba una vez por semana. Archiva las notas útiles de Entrada, apunta el siguiente paso de cada proyecto y pasa lo terminado a Archivo. Hazlo antes si guardas muchas cosas que necesitas hoy."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="segundo-cerebro-notas-iphone"
    intro={<>Notas de Apple puede servirte como segundo cerebro: un lugar donde guardar cosas y encontrarlas cuando hagan falta. Empieza con una carpeta Entrada y una nota Inicio fijada. Después, ordena lo que guardes una vez a la semana.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#carpetas", label: "Las carpetas" }, { href: "#inicio", label: "Nota Inicio" },
      { href: "#etiquetas", label: "Etiquetas" }, { href: "#rutina", label: "Rutina semanal" },
      { href: "#pinto", label: "Enlaces e IA" },
    ]}>
      <p>Crea cuatro carpetas: Entrada, Proyectos, Consulta y Archivo. Fija una nota Inicio con enlaces a tus proyectos. Usa etiquetas y carpetas inteligentes para reunir notas de distintas carpetas. Captura en Entrada y revísala cada semana.</p>
      <PostCta slug="es/segundo-cerebro-notas-iphone" path="/es/blog/segundo-cerebro-notas-iphone" position="answer" ui={ui.cta} title="Deja que tu IA trabaje con tus notas"><p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Su menú Linked From muestra las notas que enlazan con la que tienes abierta. ChatGPT o Claude pueden leer y editar tus notas una vez conectados.</p></PostCta>
    </Answer>} faq={FAQ}>
      <h2 id="carpetas">Empieza con cuatro carpetas</h2>
      <Paths rows={[{ on: "Mac", steps: ["Archivo", "Nueva carpeta"] }]} />
      <p>En el Mac, selecciona una carpeta de iCloud en la barra lateral y elige Archivo, Nueva carpeta. Repite el proceso para las cuatro. Apple advierte que algunas funciones de Notas no están disponibles con cuentas de otros proveedores.</p>
      <ul>
        <li><strong>Entrada</strong> guarda lo nuevo hasta que decidas dónde va.</li>
        <li><strong>Proyectos</strong> guarda tareas con un final, como el jardín del balcón. Pon el plan y el siguiente paso en una nota con ese nombre.</li>
        <li><strong>Consulta</strong> guarda información que volverás a usar, como consejos sobre plantas.</li>
        <li><strong>Archivo</strong> guarda proyectos terminados que quizá necesites consultar.</li>
      </ul>
      <p>Empieza con la próxima nota. No hace falta ordenar toda la biblioteca ahora. En el Mac, arrastra una nota a su carpeta. Añade subcarpetas solo cuando cueste recorrer una carpeta.</p>
      <h2 id="inicio">Copia una nota Inicio y fíjala</h2>
      <p>Guarda Inicio en Proyectos y úsala como punto de partida. Pega este texto y sustituye los ejemplos. Los nombres de proyectos y de consulta son marcadores; después crearás los enlaces.</p>
      <Keep title="Nota Inicio para tu segundo cerebro" text={HOME} copyLabel={ui.copy} note="Pégala como texto normal. Crea las otras notas y sustituye los nombres por enlaces reales." />
      <Paths rows={[{ on: "Mac", steps: ["Edición", "Añadir enlace"] }, { on: "Mac", steps: ["Archivo", "Fijar nota"] }]} />
      <p>Crea otra nota llamada Jardín del balcón. Vuelve a Inicio, selecciona ese nombre, elige Edición, Añadir enlace, escribe el título y selecciona la nota. Deja activado Usar el título de la nota para que el enlace cambie si la renombras. Hazlo también con las notas de consulta que quieras abrir desde Inicio.</p>
      <p>En iPhone o Mac también puedes escribir <code>&gt;&gt;</code> y elegir la nota por su título. Apple explica los pasos en su <a href="https://support.apple.com/es-es/guide/notes/apde615d29c2/mac">guía de enlaces</a>. Después selecciona Inicio y elige Archivo, Fijar nota para dejarla arriba.</p>
      <h2 id="etiquetas">Etiquetas para temas que cruzan carpetas</h2>
      <p>Una carpeta indica dónde guardaste una nota. Una etiqueta reúne notas que viven en sitios distintos. Añade <code>#jardin</code> al proyecto Jardín del balcón y a Plantas de sombra, en Consulta. En el iPhone, escribe un espacio después de la etiqueta para activarla. Usa etiquetas que vayas a repetir.</p>
      <Paths rows={[{ on: "Mac", steps: ["Archivo", "Nueva carpeta inteligente"] }, { on: "iPhone", steps: ["Nueva Carpeta", "Convertir en Carpeta Inteligente"] }]} />
      <p>En el Mac, crea una carpeta inteligente llamada Jardín y elige Etiquetas como criterio. Selecciona #jardin y pulsa Aceptar. En el iPhone, crea una carpeta, ponle nombre, conviértela en inteligente y elige el filtro de etiquetas. Verás el proyecto y sus referencias juntos, aunque cada nota siga en su carpeta.</p>
      <p>Es un filtro guardado. Todavía tienes que poner las etiquetas. Si falta una nota, comprueba que tenga la etiqueta y cumpla las reglas de la carpeta.</p>
      <h2 id="rutina">Apunta primero, revisa después</h2>
      <p>En el Mac, selecciona Entrada y pulsa el botón de nota nueva. Usa un título que reconozcas el mes que viene, como Plantas para un balcón orientado al norte. Añade el dato útil y el enlace a la fuente, si lo hay. Déjala ahí hasta la revisión salvo que ya sepas dónde guardarla.</p>
      <p>Una vez por semana, abre Entrada. Mueve a Consulta lo que quieras conservar y a Proyectos lo que requiera trabajo. Escribe el siguiente paso de cada proyecto. Enlaza desde Inicio los que necesites esta semana. Archiva los terminados y quita sus enlaces de Inicio.</p>
      <p>Si repites siempre los mismos encabezados, guarda una nota de ejemplo. Archivo, Duplicar nota crea otra para rellenar. Guarda decisiones y pasos útiles, no solo enlaces que nunca leíste.</p>
      <h2 id="limites">Lo que tendrás que mantener a mano</h2>
      <p>Un proyecto nuevo no aparece solo en Inicio. Una carpeta inteligente solo muestra notas que cumplen sus reglas. Tú decides qué conservar y cómo cambia tu plan. Notas de Apple tampoco muestra los enlaces entrantes: si un proyecto enlaza Plantas de sombra, la nota de referencia no mostrará el proyecto.</p>
      <h2 id="pinto">Enlaces entrantes e IA en Pinto Notes</h2>
      <p>En Pinto Notes, Linked From, en el menú More de una nota, enumera las notas que enlazan con ella. Puedes abrir una referencia y ver qué proyectos la usan. Solo cuentan los enlaces reales. La <a href="/blog/apple-notes-backlinks" hrefLang="en">guía de enlaces entrantes</a> (en inglés) lo explica.</p>
      <p>Cuando <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectas ChatGPT o Claude</a>, pueden leer y editar tus notas. En la revisión semanal, puedes pedir un borrador de los siguientes pasos de un proyecto. Contrástalo con las notas y corrígelo tú. También puedes leer y editar las notas que mantenga la IA.</p>
      <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus Notas de Apple</a> de una vez en el Mac. Las originales no cambian.</p>
    </LocalPostPage>;
}
