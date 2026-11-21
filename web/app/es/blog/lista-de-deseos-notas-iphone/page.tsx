import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "lista-de-deseos-notas-iphone");
// Spanish version of /blog/apple-notes-wishlist-template, 21 Nov 2026. Autocomplete hl=es, gl=es:
// "lista de deseos plantilla" suggests "lista de deseos navidad plantilla" and "plantilla excel lista de deseos".
// "plantilla lista de deseos notas iphone" returns no suggestions.
// Apple Support read 21 Nov: /es-es/guide/notes/not9474646a9/mac (Edición > Pegar),
// /es-es/guide/notes/apd93c815aa0/mac (botón Lista de comprobación),
// /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla, Tabulador),
// /es-es/guide/iphone/iph1ac0b3a2/ios (encabezado, lista y tabla). No unverified menu name. No picture.
const ui = UI.es;
const TEMPLATE = `Mi lista de deseos

Próxima revisión: 28 de noviembre de 2026
Regla: esperar al menos siete días antes de decidir. Comprobar el precio de nuevo antes de comprar.

Lámpara de escritorio con brazo ajustable
Enlace: https://example.com/lampara-escritorio
Precio visto: 65 €, envío incluido
Visto el: 21 de noviembre de 2026
Motivo: la luz del techo deja la mesa a oscuras al atardecer.
Esperar hasta: 28 de noviembre de 2026
Decisión: esperar. Medir antes el hueco junto al monitor.

Molinillo manual de café
Enlace: https://example.com/molinillo-cafe
Precio visto: 95 €, envío incluido
Visto el: 20 de noviembre de 2026
Motivo: probar café recién molido los fines de semana.
Esperar hasta: 27 de noviembre de 2026
Decisión: esperar. Pedir prestado uno durante un fin de semana.

Soporte para portátil
Enlace: https://example.com/soporte-portatil
Precio visto: 39 €, envío incluido
Visto el: 12 de noviembre de 2026
Motivo: subir la pantalla para las videollamadas.
Esperar hasta: 19 de noviembre de 2026
Decisión: descartar, 21 de noviembre. Los libros bajo el portátil ya cumplen esa función.

Antes de decidir
Medir el hueco de la mesa para la lámpara.
Pedir prestado un molinillo durante el fin de semana.
`;
const TABLE = `Artículo\tEsperar hasta / decisión
Lámpara de escritorio\t28 nov 2026 / Esperar, medir la mesa
Molinillo de café\t27 nov 2026 / Esperar, probar uno prestado
Soporte para portátil\t19 nov 2026 / Descartar, los libros sirven
`;
const FAQ = [
 { q: "¿Cómo hago una lista de deseos en Notas?", a: ["Pega la plantilla en una nota nueva. Anota el enlace, precio y fecha, motivo, día para reconsiderarlo y decisión. Debajo, crea una lista de comprobación con lo que debes verificar."] },
 { q: "¿Uso tabla o lista de comprobación?", a: ["La tabla resume artículos y decisiones. Deja los motivos y enlaces en cada entrada. La lista sirve para acciones como medir la mesa o probar algo prestado."] },
 { q: "¿Qué anoto antes de comprar?", a: ["Para qué quieres el artículo, qué usas ahora, precio con envío y cuándo volverás a decidir. Escribe comprar, esperar o descartar con el motivo. La fecha no te obliga a gastar."] },
];
export default function Page() {
 return <LocalPostPage lang="es" slug="lista-de-deseos-notas-iphone"
 intro={<>Esta lista de deseos para Notas guarda posibles compras con sus enlaces, precios fechados y motivos. Una fecha de espera te da tiempo para reconsiderar cada compra.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"La plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#revisar",label:"Revisar la lista"},{href:"#limites",label:"Sus límites"},{href:"#pinto",label:"Revisar con IA"}]}>
 <p>Guarda en una nota cada posible compra personal. Anota el enlace, el precio, cuándo lo viste, el motivo, cuándo decidirás y qué has decidido. Usa una lista de comprobación para los pasos previos.</p>
 <PostCta slug="es/lista-de-deseos-notas-iphone" path="/es/blog/lista-de-deseos-notas-iphone" position="answer" ui={ui.cta} title="Revisa tu lista con ayuda"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Si conectas ChatGPT o Claude y permites el acceso, pueden leer la lista y editar las notas de revisión que les pidas.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="plantilla">La plantilla: compras que merecen otra pensada</h2>
 <p>Hay dos artículos en espera y uno descartado. Los precios en euros son ficticios y los enlaces de example.com son marcadores. Sustitúyelos por las páginas y los precios reales, con envío incluido.</p>
 <Keep title="Lista de deseos para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pégala como texto normal. Después convierte las dos últimas líneas en lista de comprobación." />
 <p>Escribe primero el motivo. "La mesa queda a oscuras" se puede comprobar; "me gusta" también puede valer, si sabes que ese es el motivo. Para compras destinadas a otras personas, usa la <a href="/es/blog/lista-de-regalos-notas-iphone">lista de regalos</a>.</p>
 <h2 id="preparar">Prepárala en Mac o iPhone</h2>
 <Paths rows={[{on:"Mac",steps:["Edición","Pegar"]},{on:"Mac",steps:["Selecciona las dos últimas líneas","Botón Lista de comprobación"]}]} />
 <p>En el Mac, crea una nota, elige Edición, Pegar, selecciona las dos acciones de Antes de decidir y pulsa el botón Lista de comprobación. Marca el círculo cuando completes la acción. Los artículos siguen como texto: marcar una acción no significa que hayas comprado nada.</p>
 <p>En iPhone, crea la nota y escribe el contenido. Selecciona cada nombre de artículo y aplícale Encabezamiento desde el botón Formato. Bajo Antes de decidir, toca el botón Lista de comprobación y pulsa Retorno para añadir otro elemento. Apple explica los controles en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">manual del iPhone</a>.</p>
 <h3>Una tabla opcional para la revisión</h3>
 <p>Conserva las entradas completas. Si la lista crece, esta tabla resume fechas y decisiones.</p>
 <Keep title="Tabla de revisión" text={TABLE} copyLabel={ui.copy} note="Hay un tabulador entre el artículo y su revisión. Pega este bloque aparte bajo las entradas." />
 <p>En el Mac, pega las cuatro líneas, selecciónalas y pulsa el botón Tabla. Cada tabulador separa dos columnas. También puedes usar Formato, Tabla y rellenarla a mano. Tabulador en la última celda añade una fila. En iPhone, añade una tabla y escribe las mismas columnas. La <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés) ofrece más ejemplos.</p>
 <p>Actualiza el resumen cada vez que cambies una decisión, o prescinde de él si mantener dos copias da demasiado trabajo.</p>
 <h2 id="revisar">Decide al terminar la espera</h2>
 <p>Siete días son solo un ejemplo. Un artículo esencial que se ha roto puede pedir una decisión antes; una compra cara para una afición puede esperar más. En la fecha de revisión, vuelve a leer el motivo y consulta el precio actual. Mide la mesa o prueba el molinillo prestado.</p>
 <p>Escribe comprar, esperar o descartar con fecha y motivo. Si esperas, fija otra fecha. Conserva lo descartado para no repetir la misma decisión. Si compras, apunta la fecha y el importe pagado.</p>
 <h2 id="limites">Hasta dónde llega</h2>
 <p>El precio y la fecha solo registran lo que viste. La nota no vigila precios ni existencias, y escribir una fecha no crea un aviso. Pon un recordatorio aparte si lo necesitas. Las decisiones siguen siendo tuyas.</p>
 <h2 id="pinto">Revisa la lista con ChatGPT o Claude</h2>
 <p>Puedes guardar este contenido en Pinto Notes con encabezados, enlaces y lista de comprobación. <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">Conecta ChatGPT o Claude</a> y permite el acceso. Un solo Allow autoriza leer y editar tus notas.</p>
 <p>Prueba con esta petición: "Lee Mi lista de deseos. Añade una sección Para revisar hoy con los artículos cuya espera terminó. Usa solo los precios y motivos anotados. No cambies mis decisiones y enumera lo que queda por comprobar". Revisa las fechas y consulta tú los precios actuales antes de decidir.</p>
 <p>Puedes traer tus notas de Apple con <a href="/blog/move-from-apple-notes" hrefLang="en">una importación en el Mac</a> (en inglés). Notas de Apple no cambia. La app está en inglés.</p>
 </LocalPostPage>;
}

