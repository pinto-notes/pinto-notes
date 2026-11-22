import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "control-gastos-notas-iphone");
// Versión de /blog/apple-notes-expense-tracker. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "control gastos iphone" ofrece esa frase y "app control de gastos iphone";
// "control de gastos notas iphone" no ofrece sugerencias.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apda85974595/mac
// (Formato > Resultados matemáticos; Insertar resultados, Sugerir resultados, Desactivado),
// /guide/iphone/iph46efa613a/ios (variables), /guide/notes/apd1955d3b21/mac (tablas).
// Archivo > Duplicar nota y la conversión de tablas se verificaron en el piloto español.
// Capturas inglesas. La plantilla conserva las líneas y tabulaciones del original.
const ui=UI.es;
const TEMPLATE=`Gastos de noviembre

Fecha\tQué\tCategoría\tImporte
1 nov\tCompra semanal\tComida\t412
2 nov\tTarjeta de transporte\tTransporte\t85
3 nov\tCena con amistades\tRestaurante\t230
5 nov\tBombillas\tHogar\t64
6 nov\tCompra semanal\tComida\t238
8 nov\tCine\tOcio\t150

Comida = 412 + 238
Transporte = 85
Restaurante = 230
Hogar = 64
Ocio = 150

Comida + Transporte + Restaurante + Hogar + Ocio =
`;
const FAQ=[
 {q:"¿Puedo llevar mis gastos en Notas?",a:["Sí. Crea una tabla con fecha, compra, categoría e importe. Debajo escribe una suma por categoría y una última línea con todas las categorías. Resultados matemáticos calcula el total."]},
 {q:"¿Notas tiene una plantilla de gastos?",a:["No trae una propia. Copia la plantilla de esta página, convierte las líneas con tabulaciones en una tabla y duplica la nota cada mes."]},
 {q:"¿Por qué no se calcula dentro de la tabla?",a:["Resultados matemáticos no funciona dentro de las celdas. Coloca las sumas bajo la tabla."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="control-gastos-notas-iphone"
 intro={<>Una tabla de Notas basta para apuntar cada compra. Las sumas van debajo, porque Notas no calcula dentro de sus tablas. Esta plantilla muestra cómo llevar un mes y ver el total.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#uso",label:"Cada día"},{href:"#limites",label:"Límites"}]}>
  <p>Registra cada gasto en una fila con fecha, descripción, categoría e importe. Debajo de la tabla, escribe una línea por categoría, como Comida = 412 + 238. Suma al final los nombres de las categorías y añade = para que Notas calcule el total.</p>
  <PostCta template="budget-log" slug="es/control-gastos-notas-iphone" path="/es/blog/control-gastos-notas-iphone" position="answer" ui={ui.cta} title="Registra un gasto una sola vez"><p>La plantilla gratuita de presupuesto de Pinto Notes calcula los totales. ChatGPT o Claude pueden añadir compras cuando se lo pidas.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360} alt="Ejemplo de gastos de grupo en Notas del iPhone, en inglés, con importes nombrados y un total." caption="Apple muestra cómo nombrar importes y sumarlos. La plantilla usa el mismo método. Imagen: Apple." />} faq={FAQ}>
 <h2 id="plantilla">Plantilla de gastos con totales</h2>
 <p>La primera parte es un registro con una fila por compra. Las líneas bajo la tabla hacen las cuentas. Los nombres de categoría van antes de la suma final porque Notas debe conocer cada variable.</p>
 <Keep title="Control de gastos para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Hay una tabulación entre columnas. Pega las líneas y conviértelas en una tabla; pulsa retorno para conservar el total sugerido." />
 <p>Puedes cambiar las categorías. Usa un nombre de una sola palabra con letras latinas para cada variable; los espacios complican la expresión.</p>
 <h2 id="preparar">Preparar la nota</h2>
 <Paths rows={[{on:"Mac",steps:["Formato","Tabla"]},{on:"Mac",steps:["Formato","Resultados matemáticos"]}]} />
 <p>Pega la plantilla en una nota nueva. Selecciona las líneas que van de Fecha al último gasto y pulsa el botón Tabla. Las tabulaciones se convierten en columnas. En Mac, Formato, Resultados matemáticos permite Insertar resultados automáticamente, Sugerir resultados para aceptarlos con Retorno o desactivar la función. Funciona en notas de iCloud actualizadas o guardadas en el Mac.</p>
 <p>Para empezar otro mes, usa Archivo, Duplicar nota, cambia el título y borra las compras anteriores. <a href="/blog/apple-notes-tables" hrefLang="en">La guía de tablas</a> explica sus límites.</p>
 <h2 id="uso">Apuntar gastos cada día</h2>
 <ul><li>En la última celda, pulsa tabulador para añadir una fila.</li><li>Escribe el importe en la tabla y añádelo también a la suma de su categoría.</li><li>Fija la nota para tenerla arriba y usa la búsqueda para encontrar una compra antigua.</li></ul>
 <p>Este registro dice cuánto gastaste. Si quieres planificar límites por categoría, combina la nota con la <a href="/es/blog/plantilla-presupuesto-mensual-notas-iphone">plantilla de presupuesto mensual</a>.</p>
 <h2 id="limites">Hasta dónde llega</h2>
 <p>Cada cantidad se escribe dos veces, una en la tabla y otra en la suma. Si olvidas la segunda, el total será erróneo. La tabla no ordena ni suma, los meses quedan en notas separadas y debes copiar las facturas recurrentes cada mes. Notas no se conecta a un banco.</p>
 <h2 id="pinto">Un registro que se suma solo</h2>
 <Figure shot={SHOTS.budgetApp} caption="Plantilla de presupuesto y gastos de Pinto Notes para Mac, en inglés, con datos de ejemplo." />
 <p>La <a href="/templates/budget-log">plantilla de presupuesto y gastos</a> de Pinto Notes muestra lo que queda por categoría, facturas mensuales y los últimos seis meses. Puedes añadir, editar o borrar un gasto con opción para deshacer. Cada importe se anota una vez y la app hace las cuentas. Con ChatGPT o Claude conectado, puedes dictarle varios gastos y pedir un resumen mensual. No se conecta al banco. La importación de tus Notas de Apple en Mac no cambia el original.</p>
 <p>También puedes consultar <a href="/blog/budget-tracker-with-chatgpt-or-claude" hrefLang="en">presupuesto con ChatGPT o Claude</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/import-your-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
