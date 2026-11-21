import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-inventario-casa-notas");

// Spanish version of /blog/apple-notes-home-inventory-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "plantilla inventario casa" returned itself,
// "plantilla inventario casa alquiler" and "plantilla excel inventario casa";
// "inventario hogar plantilla" returned "plantilla inventario hogar".
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla,
// convertir texto, Tabulador), /es-es/guide/notes/apd93c815aa0/mac (listas),
// /es-es/guide/iphone/iph1ac0b3a2/ios (botones Tabla, Lista de comprobación y Formato),
// /es-es/guide/notes/not95edd2813/mac (fotos y archivos desde Fotos y Finder),
// /es-es/guide/iphone/iph23f4d9aa9/ios (adjuntos y compartir desde Archivos). No picture.

const ui = UI.es;
const TEMPLATE = `Inventario del salón
Habitación: salón
Última revisión: 21 de noviembre de 2026

Objeto\tRegistro
S01: radio DAB\tNúmero de serie anotado; faltan recibo y fotos
S02: mesa de centro de roble\tSin número de serie; falta recibo y foto

S01: radio DAB
Habitación y lugar: salón, balda junto a la ventana
Marca/modelo: Roberts Play 10
Número de serie: DEMO-S01-2047 (solo ejemplo)
Compra: 8 de marzo de 2025
Precio pagado: 59 €, no es una tasación actual
Recibo: S01-recibo.pdf, adjuntar bajo esta ficha
Fotos: S01-frontal.jpg y S01-etiqueta.jpg, adjuntar debajo
Estado: pequeño arañazo junto al mando del volumen

S02: mesa de centro de roble
Habitación y lugar: salón, delante del sofá
Marca/modelo: sin marca, roble macizo, 90 x 50 cm
Número de serie: no figura
Compra: 12 de junio de 2023, de segunda mano
Precio pagado: 75 €, no es una tasación actual
Recibo: falta, pagada en efectivo
Foto: S02-mesa.jpg, adjuntar bajo esta ficha
Estado: marca de agua en la esquina izquierda

Pendiente de registrar
Adjuntar el recibo de la radio
Adjuntar las fotos del frontal y la etiqueta de la radio
Adjuntar la foto de la mesa
Comprobar el número de serie de la radio en su etiqueta
`;
const FAQ = [
  { q: "¿Puedo hacer un inventario de casa en Notas?", a: ["Sí. Usa una nota por habitación y una ficha por objeto con número de serie, recibo y fotos. Copia el ejemplo y sustituye los datos."] },
  { q: "¿Cómo añado fotos de los recibos?", a: ["En el iPhone, usa el botón Archivos adjuntos. Si el PDF está en Archivos, ábrelo, toca Compartir y elige la nota. En el Mac, arrastra el archivo desde Finder."] },
  { q: "¿La nota calcula el valor de reposición?", a: ["No. Registra lo que tienes y lo que pagaste, pero no calcula el valor actual ni el coste de reposición. Tampoco da aprobación de una aseguradora."] },
  { q: "¿Qué pongo si no hay número de serie?", a: ["Escribe «No figura» si ya lo has buscado o «Pendiente de comprobar» si aún no. Conserva la descripción y las fotos."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-inventario-casa-notas"
    intro={<>Copia esta plantilla de inventario de casa en Notas de Apple, con una nota por habitación. Cada objeto tiene un campo para el número de serie, otro para el recibo y espacio para fotos.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "La plantilla" }, { href: "#preparacion", label: "Tabla y lista" },
      { href: "#fotos", label: "Recibos y fotos" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Úsala en Pinto" },
    ]}><p>Una nota por habitación puede reunir una tabla corta de objetos y sus fichas completas. Sustituye los ejemplos y adjunta cada recibo y foto junto a su ficha. La nota no tasa tus bienes ni constituye aprobación de una aseguradora.</p>
      <PostCta slug="es/plantilla-inventario-casa-notas" path="/es/blog/plantilla-inventario-casa-notas" position="answer" ui={ui.cta} title="Actualiza las fichas con ayuda">
        <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Tras conectarlo, ChatGPT o Claude pueden leer y editar tus fichas con los datos que les des.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">Una habitación cada vez</h2>
    <p>El ejemplo contiene una radio y una mesa de segunda mano. El número de serie y los nombres de archivo son ficticios. Copiar el texto no adjunta esos archivos. Sustituye también la marca y el modelo.</p>
    <Keep title="Inventario de casa para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto. Convierte las tres líneas de Objeto y Registro en tabla y las tareas pendientes en lista de comprobación." />
    <p>Repite el código en la ficha y en los archivos. S01 relaciona la radio con su recibo y sus fotos. «Pendiente de comprobar» y «Falta» son situaciones distintas.</p>
    <h2 id="preparacion">Crea la tabla y la lista pendiente</h2>
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"] }, { on: "iPhone", steps: ["Botón Añadir tabla"] }]} />
    <p>En el Mac, pega el esquema, selecciona desde «Objeto» hasta S02 y pulsa Tabla. Las tabulaciones crean las dos columnas. También puedes elegir Formato, Tabla e introducir los datos en la tabla vacía. Tabulador en la última celda añade una fila. Apple explica la conversión en su <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">guía de tablas</a>.</p>
    <p>En el iPhone, crea una tabla con el botón Añadir tabla y escribe las dos filas en las celdas. Borra las líneas de texto que sustituyas. Puedes dar formato a los títulos con el botón Formato; consulta la <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía del iPhone</a>.</p>
    <p>En el Mac, selecciona las cuatro tareas bajo Pendiente de registrar y pulsa Lista de comprobación. En el iPhone, inicia la lista con ese botón. Marca una tarea solo después de adjuntar el archivo o comprobar el dato. Para más opciones, consulta las <a href="/blog/apple-notes-tables" hrefLang="en">tablas</a> y las <a href="/blog/apple-notes-templates" hrefLang="en">plantillas de Notas</a> (en inglés).</p>
    <h2 id="fotos">Adjunta cada recibo y cada foto a su objeto</h2>
    <p>Fotografía el objeto entero y su etiqueta por separado. Pon los archivos debajo de la ficha, fuera de la tabla. Escribe también el número de serie y compáralo con la foto antes de marcar la tarea.</p>
    <p>En el iPhone, toca Archivos adjuntos para añadir una foto. Para un PDF de Archivos, ábrelo, toca Compartir, elige Notas y selecciona la nota existente. Apple explica ambas vías en su <a href="https://support.apple.com/es-es/guide/iphone/iph23f4d9aa9/ios">guía de adjuntos</a>.</p>
    <p>En el Mac, arrastra los PDF desde Finder y las fotos desde Fotos. Usa una nota de iCloud: Apple indica que las notas de Exchange no admiten archivos adjuntos. Consulta la <a href="https://support.apple.com/es-es/guide/notes/not95edd2813/mac">guía de adjuntos del Mac</a>.</p>
    <p>Cuando vendas, dones o tires un objeto, anota cuándo. Añade cada compra mientras conserves el recibo. Para reparaciones y tareas periódicas, usa una <a href="/es/blog/mantenimiento-del-hogar-notas-iphone">lista de mantenimiento del hogar</a> aparte.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>El precio pagado no es una tasación actual ni un coste de reposición. Pregunta a tu aseguradora qué documentos exige. Comprueba cada etiqueta y cada archivo: un nombre escrito no demuestra que el adjunto esté presente. Abre recibos y fotos después de añadirlos y guarda otra copia de los originales.</p>
    <h2 id="pinto-notes">Guarda el inventario en Pinto Notes</h2>
    <p>Pinto Notes permite tablas y adjuntos. Copia el esquema de esta página; no hay una plantilla de inventario preparada para este artículo. Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), puede leer y editar las notas. Una sola autorización con «Allow» concede lectura y edición.</p>
    <p>Pídele que enumere los objetos cuya ficha diga que falta el recibo o que no se ha comprobado el número de serie, sin inventar datos. Contrasta el resultado con las fichas. Pinto puede exportar notas como Markdown en un ZIP con los adjuntos que pueda recuperar. Revisa el resumen: puede omitir notas bloqueadas, protegidas con contraseña, Face ID o Touch ID, e indicar archivos que falten. Abre la copia exportada antes de darla por completa.</p>
    <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin modificarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
