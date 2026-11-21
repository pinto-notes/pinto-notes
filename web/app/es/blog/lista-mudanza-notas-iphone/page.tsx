import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "lista-mudanza-notas-iphone");

// Spanish version of /blog/apple-notes-moving-checklist-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "lista de mudanza" returned itself,
// "lista de cosas mudanza" and "como hacer una lista de mudanza"; "checklist mudanza plantilla" returned [].
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/apd93c815aa0/mac (convertir
// párrafos con botón Lista de comprobación), /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla,
// convertir texto, Tabulador), /es-es/guide/iphone/iph1ac0b3a2/ios (Formato, lista y tabla),
// /es-es/102296 (lista de comprobación). No picture.

const ui = UI.es;
const TEMPLATE = `Mudanza, 5 de diciembre de 2026

De: calle del Cedro 18, 2.º A, Madrid
A: calle del Abedul 42, 4.º B, Madrid
Llaves: recoger en la finca nueva a las 08:00

A quién avisar
Mara: cambiar la dirección en el banco antes del 28 de noviembre
Teo: avisar a nóminas de su empresa antes del 30 de noviembre
Mara: comunicar la mudanza al seguro de hogar antes del 28 de noviembre
Teo: solicitar el reenvío postal a Correos antes del 30 de noviembre
Ambos: actualizar las direcciones de entrega antes del próximo pedido

Suministros y conexiones
Teo: confirmar el alta de luz en la calle del Abedul para el 5 de diciembre
Mara: confirmar el último día de luz en la calle del Cedro
Teo: confirmar la instalación de fibra el 7 de diciembre, de 09:00 a 12:00
Mara: preguntar a la compañía del agua cómo cerrar la cuenta anterior
Ambos: anotar las lecturas finales de los contadores antes de devolver las llaves

Antes de que llegue el camión
Mara: confirmar con la empresa de mudanzas dónde puede cargar el 3 de diciembre
Teo: preparar C01 y D01 y actualizar la lista de cajas
Mara: dejar fuera de las cajas la bolsa con la cafetera
Ambos: guardar llaves y cargadores en la bolsa del día

Día de la mudanza
08:00 Mara recoge las llaves nuevas
09:00 Teo recibe el camión en la calle del Cedro
12:30 Ambos revisan el piso anterior y anotan las lecturas
15:00 Mara devuelve las llaves antiguas al administrador

Contactos del día, ejemplo ficticio
Mudanzas: Álex, 600 000 147, reserva M0526
Administradora de la finca nueva: Roberta, 600 000 182, llaves a las 08:00
Administrador de la finca anterior: Samuel, 600 000 114, llaves a las 15:00

Primera noche
Buscar C01 para la cafetera, dos tazas y cucharillas
Buscar D01 para las sábanas y las toallas
Abrir la bolsa del día antes que otras cajas
`;
const BOXES = `Caja\tHabitación\tContenido
C01\tCocina\tCafetera, dos tazas, café, cucharillas
C02\tCocina\tPlatos, cuencos, paños
D01\tDormitorio\tSábanas, dos almohadas, toallas
S01\tSalón\tCables del escritorio, router, regleta`;
const FAQ = [
  { q: "¿Cómo hago una lista de mudanza en Notas?", a: ["Copia este esquema. En el Mac, selecciona las tareas de cada sección y pulsa Lista de comprobación. Deja el horario y los contactos como texto, y usa una tabla para las cajas."] },
  { q: "¿A quién aviso del cambio de domicilio?", a: ["Empieza por el banco, la empresa, el seguro, el correo y las tiendas donde recibes pedidos. Da a cada gestión una persona y una fecha; consulta el trámite de cada entidad."] },
  { q: "¿Cómo identifico las cajas?", a: ["Usa la inicial de la habitación y un número, como C01 para la primera caja de cocina. Escribe el código en la caja y en una fila con su destino y contenido."] },
  { q: "¿Puede Claude actualizar la lista en Pinto Notes?", a: ["Sí. Tras conectarlo, puede leer y editar la nota si se lo pides. Esta página aporta el esquema; Pinto no incluye una plantilla de mudanza preparada."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="lista-mudanza-notas-iphone"
    intro={<>Copia esta lista de mudanza en Notas de Apple. Reúne cambios de dirección, suministros, contactos y cajas para encontrar la cafetera y la ropa de cama al llegar.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "La lista" }, { href: "#preparacion", label: "Prepárala" },
      { href: "#cajas", label: "Las cajas" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Actualízala con IA" },
    ]}><p>Guarda una nota para la mudanza: tareas con responsable, horario y contactos. Identifica las cajas con los mismos códigos en la nota y sobre el cartón. Sustituye los datos de ejemplo.</p>
      <PostCta slug="es/lista-mudanza-notas-iphone" path="/es/blog/lista-mudanza-notas-iphone" position="answer" ui={ui.cta} title="¿Quieres actualizar la nota con IA?">
        <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Después de conectar ChatGPT o Claude, puede leer y editar las tareas o el contenido de las cajas cuando se lo pidas.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">Una nota para toda la mudanza</h2>
    <p>Mara y Teo se mudan el 5 de diciembre en este ejemplo ficticio. Cada gestión indica quién la hace y cuándo. Deja abiertas las tareas de suministros hasta tener confirmación. Cambia direcciones, contactos y horas.</p>
    <Keep title="Lista de mudanza para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto y convierte los grupos de tareas en listas de comprobación." />
    <h2 id="preparacion">Convierte las tareas en listas</h2>
    <p>Usa una nota de iCloud o guardada en el dispositivo. En el Mac, selecciona solo las tareas bajo A quién avisar y pulsa el botón Lista de comprobación. Repite con Suministros, Antes de que llegue el camión y Primera noche. No selecciones los títulos. Marca el círculo cuando termines.</p>
    <p>En el iPhone, pulsa el botón Lista de comprobación e introduce cada tarea; Retorno añade otra. Para dar formato a un título, selecciona el texto y usa el botón Formato. Apple describe las listas en su <a href="https://support.apple.com/es-es/102296">guía de comprobación</a>.</p>
    <p>Deja el horario y los contactos como texto: la hora de recoger las llaves debe quedar visible. Encontrarás más esquemas en <a href="/blog/apple-notes-templates" hrefLang="en">plantillas para Notas</a> (en inglés).</p>
    <h2 id="cajas">Una tabla para saber dónde está cada cosa</h2>
    <p>Escribe C01 en la caja de cocina y en su fila. Anota el destino y el contenido suficiente para encontrar un objeto concreto. Cambia la fila si trasladas algo a otra caja.</p>
    <Keep title="Contenido de las cajas" text={BOXES} copyLabel={ui.copy} note="Hay tabulaciones entre columnas. En el Mac, selecciona las líneas y pulsa Tabla." />
    <Paths rows={[{ on: "Mac", steps: ["Formato", "Tabla"] }]} />
    <p>En el Mac, pega la lista, selecciona desde «Caja» hasta la última fila y pulsa Tabla. Las tabulaciones forman las columnas. Tabulador en la última celda añade una fila. La <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés) explica más controles.</p>
    <p>En el iPhone, crea una tabla con el botón Añadir tabla e introduce los datos en sus celdas. También puedes dejar cada caja en una línea de texto. Junta las cajas de la primera noche en el camión.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>Las fechas son texto. Si cambias el día de mudanza, revisa tú cada cita y cada suministro. Crea avisos aparte. Marcar una tarea no avisa a la empresa ni cambia una cuenta. La lista tampoco genera etiquetas. Coteja las cajas antes de que salga el camión y consulta los trámites de cada proveedor.</p>
    <h2 id="pinto-notes">Pide a tu IA que actualice la nota</h2>
    <p>Pinto Notes es una app gratuita para iPhone y Mac que se parece a Notas de Apple y funciona igual. Puedes escribir esta nota con encabezados, listas y una tabla. No incluye una plantilla de mudanza preparada.</p>
    <p>Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), puede leer y editarla. Pídele que cambie la instalación de fibra al 8 de diciembre, de 10:00 a 13:00, sin mover la fecha de mudanza. O que pase el router de S01 a C02. Comprueba los cambios con la confirmación o con la caja.</p>
    <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin modificarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
