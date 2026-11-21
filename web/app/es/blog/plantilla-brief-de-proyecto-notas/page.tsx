import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-brief-de-proyecto-notas");

// Spanish version of /blog/apple-notes-project-brief-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), read 21 Nov: "plantilla brief de proyecto" returned
// "plantilla de brief de proyecto"; "plantilla resumen de proyecto" returned itself and
// "plantilla de resumen ejecutivo de un proyecto"; "plantilla proyecto notas iphone" returned [].
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/not9474646a9/mac (Nueva nota,
// Archivo > Duplicar nota), /es-es/guide/notes/apd1955d3b21/mac (Formato, Encabezamiento),
// /es-es/guide/notes/apd93c815aa0/mac (botón Lista de comprobación),
// /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla, convertir texto, Tabulador),
// /es-es/guide/iphone/iph1ac0b3a2/ios (Formato, listas y tablas). No picture.

const ui = UI.es;
const TEMPLATE = `Página de pedidos para recoger de Café Olmo, brief de proyecto

Responsable: Sara Martín
Aprueba: Amir López, encargado del café
Fecha objetivo: 4 de diciembre de 2026
Estado: Borrador, pendiente de revisión por Amir

Resultado
Los clientes pueden consultar la carta para recoger y pedir desde la web del café con el móvil.
Durante la primera semana, Amir anota cuántas llamadas preguntan dónde pedir. Revisar la cifra el 11 de diciembre.

Incluye
Una página para recoger con la carta, los precios y el horario actuales.
Un enlace al servicio de pedidos que ya utiliza el café.
Un enlace «Para recoger» en la navegación de la web.

No incluye
Reparto, un sistema de pago nuevo ni cambios en el servicio de pedidos.
Fotografía ni rediseño del resto de la web.

Criterios de aceptación
Amir ha cotejado cada producto y precio con la carta del mostrador.
La página indica el horario y el lugar de recogida.
El enlace «Para recoger» abre la página en el iPhone y el Mac de Sara.
Un pedido de prueba desde el enlace llega a la pantalla del servicio de pedidos actual.

Preguntas pendientes
Pregunta\tResponsable y fecha de respuesta
¿Quién actualiza la carta después del lanzamiento?\tAmir, antes del 25 de noviembre
¿Qué muestra la página cuando no hay recogida?\tSara propone el texto; Amir lo aprueba antes del 26 de noviembre

Aprobación
Amir confirma el alcance y los criterios antes del 27 de noviembre.
Después, anotar aquí cada cambio de alcance, su fecha y su efecto en la fecha objetivo.
`;

const FAQ = [
  { q: "¿Notas incluye una plantilla de brief de proyecto?", a: ["No trae una plantilla. Copia este ejemplo, cambia los datos y da formato a los encabezados, la lista de comprobación y la tabla."] },
  { q: "¿Qué criterios de aceptación conviene escribir?", a: ["Pruebas que la persona que aprueba pueda hacer. Un pedido de prueba que llegue al servicio del café es más claro que pedir una página fácil de usar."] },
  { q: "¿En qué se diferencia del plan de proyecto?", a: ["El brief acuerda el resultado, el alcance, la persona responsable y las condiciones para darlo por terminado. El plan divide ese trabajo en tareas y fechas."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-brief-de-proyecto-notas" hero={<></>}
    intro={<>Copia este brief de proyecto en Notas de Apple para acordar qué se entregará y cómo se comprobará. El ejemplo de una página de pedidos para recoger incluye responsables, alcance, criterios y preguntas pendientes.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "Copia el brief" }, { href: "#preparacion", label: "Prepáralo en Notas" },
      { href: "#acuerdo", label: "Acuerda el alcance" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Revísalo con IA" },
    ]}><p>Usa una nota por proyecto. Pon arriba el resultado y la persona responsable; debajo, el alcance y los criterios de aceptación. Copia el ejemplo y adáptalo a tu trabajo.</p>
      <PostCta slug="es/plantilla-brief-de-proyecto-notas" path="/es/blog/plantilla-brief-de-proyecto-notas" position="answer" ui={ui.cta} title="¿Quieres revisar el brief con ayuda?">
        <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Después de conectarlo, ChatGPT o Claude pueden leer el brief y editarlo cuando se lo pidas.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">La plantilla: acordar qué significa terminado</h2>
    <p>El ejemplo conserva el servicio de pedidos actual. Añadir pagos cambiaría el trabajo. Sustituye nombres y fechas y redacta cada criterio para que se pueda comprobar.</p>
    <Keep title="Brief de proyecto para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Cópialo como texto. Después añade encabezados, una lista de comprobación y una tabla para las preguntas." />
    <h2 id="preparacion">Prepáralo en Notas de Apple</h2>
    <p>En un Mac, pulsa Nueva nota y pega el texto. Selecciona cada título de sección y aplícale un encabezamiento con el botón Formato. Usa una nota de iCloud o guardada en el Mac para disponer de estas opciones.</p>
    <Paths rows={[{ on: "Mac", steps: ["Seleccionar los criterios", "Botón Lista de comprobación"] }, { on: "Mac", steps: ["Seleccionar las preguntas", "Formato", "Tabla"] }, { on: "iPhone", steps: ["Seleccionar un título", "Botón Formato", "Encabezamiento"] }]} />
    <p>Selecciona los cuatro párrafos de Criterios de aceptación y pulsa el botón Lista de comprobación. Cada párrafo será un elemento. No lo marques hasta que la persona que aprueba haya comprobado el resultado. Una tarea terminada no demuestra que se haya superado el criterio.</p>
    <p>Las preguntas tienen una tabulación entre columnas. En el Mac, selecciona desde «Pregunta» hasta la última fila y pulsa Tabla. Cada tabulación crea una columna. También puedes elegir Formato, Tabla y rellenar las celdas. Tabulador en la última celda añade una fila. Hay más ejemplos en la <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés).</p>
    <p>En el iPhone, pega el texto y da formato a los títulos. Para los criterios, crea una lista de comprobación bajo el encabezado e introduce cada uno; Retorno añade el siguiente. Para las preguntas, crea una tabla con el botón Añadir tabla e introduce cada dato en su celda.</p>
    <p>Para el siguiente proyecto, selecciona la nota en el Mac y elige Archivo, Duplicar nota. Sustituye el ejemplo y borra la aprobación anterior. Hay que revisar de nuevo el alcance.</p>
    <h2 id="acuerdo">Revisa el brief antes de empezar</h2>
    <p>El entregable es la página de recogida; el resultado buscado es que los clientes pidan desde el móvil. Las llamadas de la primera semana permiten evaluar el cambio. Son distintas de las pruebas que deciden si la página está lista.</p>
    <p>Pide a Amir que revise también lo excluido. Si hay que añadir reparto, cambia el alcance y reconsidera la fecha antes de crear tareas. Deja el estado en Borrador hasta que confirme el acuerdo.</p>
    <p>Asigna cada pregunta pendiente y una fecha de respuesta. Cuando se resuelva, actualiza el brief. Si necesitas guardar el razonamiento, utiliza un <a href="/es/blog/registro-de-decisiones-notas">registro de decisiones</a> aparte.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>Las fechas y los nombres son texto que mantienes tú. No envían avisos ni recogen aprobaciones. Anota la fecha de confirmación. Una marca tampoco hace el pedido de prueba ni coteja los precios. Si cambia el alcance, revisa los criterios afectados y desmarca los que ya no valgan.</p>
    <h2 id="pinto-notes">Revisa el brief con ChatGPT o Claude</h2>
    <p>Puedes usar este texto en Pinto Notes, que se parece a Notas de Apple y funciona igual en iPhone y Mac. Permite encabezados, listas y tablas. Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), la IA puede leer y editar la nota.</p>
    <p>Pregúntale qué criterios son demasiado vagos para comprobarlos y qué dudas de alcance quedan. Revisa sus propuestas antes de pedirle que aplique las que aceptes. Amir sigue decidiendo el alcance y comprobando el resultado.</p>
    <p>Pinto guarda versiones anteriores de la nota y puede recuperar una. Al hacerlo, conserva también el texto sustituido. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
