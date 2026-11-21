import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-organizar-boda-notas");

// Spanish version of /blog/apple-notes-wedding-planner-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "lista de invitados boda plantilla" returned itself,
// "plantilla lista de invitados boda excel" and a PDF variant; "plantilla planificador de boda"
// returned itself and an Excel variant; "organizar boda checklist" returned "checklist organizar boda".
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla,
// convertir párrafos, Tabulador), /es-es/guide/notes/apd93c815aa0/mac (lista de comprobación),
// /es-es/guide/iphone/iph1ac0b3a2/ios (tabla y lista),
// /es-es/guide/iphone/iphe4d04f674/27/ios/27 (Compartir un enlace, permisos). No picture.

const ui = UI.es;
const TEMPLATE = `Boda de Maya y Samuel, 19 de junio de 2027

Lugar: Finca Los Olivos
Límite de invitados: 48
Fecha límite de respuesta: 31 de mayo de 2027
Fecha límite para dar el número final a la finca: 5 de junio de 2027
Última revisión: 21 de noviembre de 2026

Invitados, filas de ejemplo
Invitado\tRespuesta y menú
Elena Ortiz\tSí; vegetariano
Álex Chen\tSí; pollo
Nora Patel\tPendiente; menú por confirmar
Benito Castro\tNo; rechazó el 20 de noviembre

Proveedores
Proveedor\tDecisión y próxima fecha
Lugar, Finca Los Olivos\tReservado; enviar número final antes del 5 de junio
Catering, Cocina Oliva\tPresupuesto recibido; prueba de menú el 28 de noviembre
Fotografía, Estudio Junio\tPreseleccionado; preguntar por las fotos de la ceremonia

Próximas acciones
Maya: confirmar la hora de la prueba con Cocina Oliva antes del 24 de noviembre
Samuel: preguntar a Estudio Junio por la ceremonia antes del 25 de noviembre
Maya: añadir el resto de invitados a la lista antes del 29 de noviembre
Samuel: anotar el pago pendiente a la finca y su fecha en el presupuesto antes del 30 de noviembre

Preguntas pendientes
¿Puede el catering ofrecer un plato principal vegano además del vegetariano?
¿Quién se lleva las flores después del convite?
`;
const FAQ = [
  { q: "¿Cómo organizo una boda en Notas de Apple?", a: ["Pega este esquema. En el Mac, convierte los bloques de invitados y proveedores en tablas y las próximas acciones en lista de comprobación. Cambia los datos de ejemplo."] },
  { q: "¿Puede mi pareja editar la misma nota?", a: ["Sí, si está en iCloud y ambos tenéis una Cuenta de Apple con Notas activado. En iOS 27, toca Compartir, abre el menú bajo el título y elige Compartir un enlace. Da permiso para editar."] },
  { q: "¿Esta lista recoge las respuestas por sí sola?", a: ["No. Introduce cada respuesta y distingue Pendiente de No. La nota no envía invitaciones, recibe respuestas ni calcula un recuento en directo."] },
  { q: "¿Puede ChatGPT actualizar el plan en Pinto Notes?", a: ["Tras conectarlo, puede leer y editar la nota con los datos que le des. No recibe las respuestas de los invitados a través de este esquema."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-organizar-boda-notas"
    intro={<>Copia esta plantilla para organizar una boda en Notas de Apple. Reúne invitados y respuestas, decisiones sobre proveedores y una lista de próximas acciones, con pasos para iPhone y Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "La plantilla" }, { href: "#preparacion", label: "Prepárala" },
      { href: "#actualizar", label: "Mantenerla al día" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Actualízala con IA" },
    ]}><p>Usa una nota con una tabla de invitados, otra de proveedores y una lista de tareas con responsable y fecha. Copia el ejemplo y convierte los bloques en tablas y lista de comprobación.</p>
      <PostCta slug="es/plantilla-organizar-boda-notas" path="/es/blog/plantilla-organizar-boda-notas" position="answer" ui={ui.cta} title="Actualiza el plan con ayuda">
        <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Tras conectarlo, ChatGPT o Claude pueden leer la nota y editarla con las respuestas o novedades que les des.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">Invitados y próximas decisiones</h2>
    <p>Las filas muestran solo una parte de los invitados. Sustitúyelas y añade a todos. Una fila por persona, también en las parejas, permite asociar cada respuesta y cada menú con un nombre.</p>
    <Keep title="Plan de boda para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto. Las dos columnas de cada tabla están separadas por tabulaciones. Da formato a tablas y lista por separado." />
    <h2 id="preparacion">Prepara la nota</h2>
    <Paths rows={[{ on: "Mac, tablas", steps: ["Formato", "Tabla"] }, { on: "Mac, tareas", steps: ["Seleccionar tareas", "Botón Lista de comprobación"] }, { on: "iPhone, tablas", steps: ["Botón Añadir tabla"] }, { on: "iPhone, tareas", steps: ["Botón Lista de comprobación"] }]} />
    <p>En el Mac, selecciona desde «Invitado» hasta la fila de Benito y pulsa Tabla. Repite desde «Proveedor» hasta la fila de fotografía. Las tabulaciones forman columnas. También puedes elegir Formato, Tabla. Tabulador en la última celda añade una fila. Apple lo explica en su <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">guía de tablas</a>.</p>
    <p>Selecciona solo las cuatro próximas acciones y pulsa Lista de comprobación. No conviertas las respuestas de los invitados en casillas: una respuesta pendiente es distinta de una negativa.</p>
    <p>En el iPhone, crea una nota y usa el botón Añadir tabla para introducir las dos columnas de cada bloque. Para las acciones, inicia una lista de comprobación. Da formato a los títulos con el botón Formato. La <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía del iPhone</a> muestra los controles. También puedes dejar las filas como texto.</p>
    <h2 id="actualizar">Mantén el plan al día</h2>
    <p>Cambia la fila en cuanto llegue una respuesta. Usa Sí, No o Pendiente y añade el menú. Apunta las necesidades alimentarias con las palabras del invitado y aclara las dudas antes de enviar la lista al catering. Vuelve a contar los confirmados antes del plazo de la finca: el límite de 48 no es el número actual.</p>
    <p>Guarda el estado junto a cada proveedor. Recibir un presupuesto no equivale a aceptarlo. Cuando decidas, cambia el estado y crea la siguiente tarea. Lleva importes y pagos en una nota de <a href="/es/blog/plantilla-presupuesto-mensual-notas-iphone">presupuesto</a> aparte.</p>
    <p>Revisad las tareas pendientes una vez por semana y actualizad la fecha de última revisión. Para editar juntos una nota de iCloud en iOS 27, toca Compartir, abre el menú bajo el título y elige Compartir un enlace. Ambos necesitáis una Cuenta de Apple con Notas en iCloud. Apple explica los <a href="https://support.apple.com/es-es/guide/iphone/iphe4d04f674/27/ios/27">permisos para compartir</a>.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>La nota no tiene formulario de respuestas, recuento automático ni plano de mesas. Una fecha escrita no programa un aviso. Crea recordatorios aparte. Si necesitas filtrar una lista larga por menú o comparar totales, usa una hoja de cálculo para esa parte. La <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés) explica sus límites.</p>
    <h2 id="pinto-notes">Actualiza la boda con ChatGPT o Claude</h2>
    <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac, con tablas y listas. Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), puede leer y editar la nota. Una sola pulsación en «Allow» concede ambos permisos.</p>
    <p>Pídele que cambie la respuesta de Nora a Sí y su menú a vegano, y que añada una tarea para confirmar esa opción con Cocina Oliva. Comprueba la fila y la tarea con el mensaje recibido. La información la aportas tú.</p>
    <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
