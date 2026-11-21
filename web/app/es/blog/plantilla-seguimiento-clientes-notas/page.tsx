import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-seguimiento-clientes-notas");

// Spanish version of /blog/apple-notes-client-tracker-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "plantilla seguimiento clientes" returned itself,
// "plantilla seguimiento clientes excel" and "plantilla para seguimiento de clientes gratis".
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla,
// convertir párrafos, Tabulador), /es-es/guide/notes/apd93c815aa0/mac (botón Lista de comprobación),
// /es-es/guide/iphone/iph1ac0b3a2/ios (botones de lista y tabla),
// /es-es/guide/notes/apde615d29c2/mac (Edición > Añadir enlace, Aceptar),
// /es-es/guide/iphone/iph908d1558b/ios (botón Adelante, Añadir enlace, OK). No picture.

const ui = UI.es;
const TEMPLATE = `Cerámica del Puerto

Contacto
Mara Soler, propietaria
mara@ceramicadelpuerto.example
Prefiere el correo. Puede hablar los martes por la tarde.

Trabajo conjunto
Textos de la web para la colección de invierno.
Mara aprueba los textos. León aporta las fotos de los productos.

Situación actual
Primer borrador enviado el 18 de noviembre de 2026.
Esperando los comentarios de Mara para revisar las páginas de producto.
Último contacto: 20 de noviembre de 2026, correo de Mara.
Próximo seguimiento: 24 de noviembre de 2026, pedir comentarios si no han llegado.

Próximas acciones
Pedir comentarios a Mara el 24 de noviembre
Confirmar cuándo enviará León las fotos de los esmaltes

Registro de contactos
20 de noviembre de 2026: Mara espera revisar el borrador el lunes.
18 de noviembre de 2026: Enviado el primer borrador. Faltan dos fotos de esmaltes.

Para la próxima vez
Usar español de España. Mantener los cuidados en cada página de producto.

Notas relacionadas
Cerámica del Puerto, reunión inicial, 12 de noviembre de 2026
`;
const INDEX = `Clientes

Cliente\tÚltimo contacto\tPróximo seguimiento
Cerámica del Puerto\t20 nov 2026\t24 nov, comentarios al borrador
Estudio Abedul\t19 nov 2026\t25 nov, disponibilidad en enero
`;
const FAQ = [
  { q: "¿Puedo seguir a mis clientes en Notas de Apple?", a: ["Sí. Guarda una nota por cliente con sus datos, el trabajo actual, el último contacto y el próximo seguimiento. Usa una tabla índice para ver las fechas juntas."] },
  { q: "¿Qué anoto entre reuniones?", a: ["La situación actual, la última conversación y una próxima acción concreta. Añade una línea fechada después de cada intercambio. Los detalles de cada reunión pueden ir en otra nota."] },
  { q: "¿La fecha de seguimiento envía un aviso?", a: ["No. Es texto. Crea un recordatorio aparte si no puedes perder esa fecha y revisa el índice tú mismo."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-seguimiento-clientes-notas"
    intro={<>Esta plantilla de seguimiento de clientes para Notas de Apple usa una nota por cliente y un índice con las próximas fechas de contacto. Copia los ejemplos y sustituye sus datos.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "La ficha" }, { href: "#indice", label: "El índice" },
      { href: "#uso", label: "Mantenerlo al día" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Úsalo con IA" },
    ]}><p>Da a cada cliente una nota con sus preferencias, un registro fechado y el próximo contacto. En una tabla índice, enlaza esas notas y reúne las fechas. Tú mantienes al día ambos registros.</p>
      <PostCta slug="es/plantilla-seguimiento-clientes-notas" path="/es/blog/plantilla-seguimiento-clientes-notas" position="answer" ui={ui.cta} title="Consulta el historial de un cliente">
        <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Tras conectarlo, ChatGPT o Claude pueden leer tus notas y actualizar la próxima acción con los datos que les des.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">La plantilla: una nota por cliente</h2>
    <p>Una redactora autónoma espera los comentarios de Mara. Sus preferencias de contacto están arriba; la situación actual permite saber qué toca sin releer todos los mensajes.</p>
    <Keep title="Ficha de cliente para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto y convierte las dos próximas acciones en una lista de comprobación." />
    <p>En el Mac, selecciona las dos líneas de acciones y pulsa el botón Lista de comprobación. En el iPhone, inicia una lista bajo ese título e introduce cada acción. Deja el registro de contactos como texto fechado. Apple explica los controles en sus guías de <a href="https://support.apple.com/es-es/guide/notes/apd93c815aa0/mac">Mac</a> y <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">iPhone</a>.</p>
    <p>Para otro cliente, copia el esquema en una nota nueva y cambia todos los datos. Anota lo acordado y lo que falta, sin pegar todo el hilo de correos.</p>
    <h2 id="indice">El índice: fechas y enlaces</h2>
    <p>Guarda otra nota llamada Clientes. Cada fila lleva a la ficha de un cliente. La última columna contiene solo un resumen; la explicación queda en la ficha.</p>
    <Keep title="Índice de clientes para Notas de Apple" text={INDEX} copyLabel={ui.copy} note="Las columnas están separadas por tabulaciones. En el Mac, selecciona las filas y conviértelas en una tabla." />
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"] }, { on: "Mac", steps: ["Edición", "Añadir enlace"] }, { on: "iPhone", steps: ["Adelante", "Añadir enlace"] }]} />
    <p>En el Mac, pega el índice, selecciona desde «Cliente» hasta la última fila y pulsa Tabla. Cada tabulación forma una columna; Tabulador en la última celda añade una fila. En el iPhone, crea la tabla con el botón Añadir tabla y escribe las filas en sus celdas. La <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">guía de Apple para Mac</a> explica la conversión.</p>
    <p>Enlaza cada nombre con su ficha. En el Mac, selecciona el nombre, elige Edición, Añadir enlace, busca la nota y pulsa Aceptar. En el iPhone, selecciona el texto, toca Adelante y Añadir enlace, elige la nota y pulsa OK. Apple da los pasos para <a href="https://support.apple.com/es-es/guide/notes/apde615d29c2/mac">Mac</a> y <a href="https://support.apple.com/es-es/guide/iphone/iph908d1558b/ios">iPhone</a>.</p>
    <h2 id="uso">Mantén las fichas al día</h2>
    <p>Después de una llamada o un correo, añade una línea fechada al registro. Actualiza Situación actual si cambió el acuerdo. Marca la acción terminada, fecha la siguiente y cambia también el índice.</p>
    <p>Antes de llamar, lee Situación actual y Para la próxima vez. Si necesitas un orden del día o decisiones detalladas, utiliza un <a href="/es/blog/plantilla-acta-de-reunion-notas">acta de reunión</a> aparte y enlázala en Notas relacionadas.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>La ficha y el índice son textos distintos. Cambiar una fecha en uno no cambia el otro. Escribir una fecha no programa un aviso. Tampoco registra correos, consulta contactos ni calcula previsiones de ventas. Para un embudo compartido con responsables y seguimientos automáticos, usa un CRM.</p>
    <h2 id="pinto-notes">Usa el esquema con ChatGPT o Claude</h2>
    <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Tiene tablas, listas y enlaces entre notas. Prepara las fichas y <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecta ChatGPT o Claude</a> (en inglés) para que pueda leerlas y editarlas.</p>
    <p>Antes de responder a Mara, pídele que lea su ficha, diga qué falta y redacte un correo usando solo los datos de la nota. Revisa el borrador. Cuando recibas respuesta, dale la información nueva y pide que actualice la ficha y el índice. No son seguimientos automáticos.</p>
    <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
