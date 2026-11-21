import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Checklist, Keep, Paths, PostFigure } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "lista-tareas-notas-iphone");
// Versión de /blog/apple-notes-to-do-list. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "lista de tareas iphone" ofrece esa frase y "como hacer lista de tareas en iphone";
// "lista de tareas notas iphone" no ofrece sugerencias. Apple, leído el 21 Nov 2026:
// support.apple.com/es-es/102296 (botón Lista de comprobación), /102484 (Recordatorios),
// /guide/notes/apd93c815aa0/mac (Formato > Más > Anular todo, ordenar ítems marcados).
// Pegar en formato Markdown se comprobó en las cadenas españolas de Notas, como en el piloto.
// Capturas inglesas. La plantilla conserva la estructura del original.
const ui=UI.es;
const TEMPLATE=`# Tareas

## Hoy
- [ ] Enviar el presupuesto a Daniel
- [ ] Llamar a mamá
- [ ] Devolver el paquete

## Esta semana
- [ ] Reservar el viaje de diciembre
- [ ] Revisar las diapositivas de Ana
- [ ] Pedir cita para el vehículo

## Recados
- [ ] Recoger la ropa de la tintorería
- [ ] Comprar una luz para la bicicleta

## Pendiente de otros
- [ ] Daniel: aprobar el presupuesto

## Algún día
- [ ] Renovar el pasaporte
- [ ] Ordenar el garaje
`;
const FAQ=[
 {q:"¿Cómo hago una lista de tareas en Notas?",a:["En iPhone, crea una nota, escribe un título y toca el botón Lista de comprobación. Cada retorno añade un elemento. En Mac, usa el mismo botón o Mayúsculas, Comando y L."]},
 {q:"¿Se pueden ordenar las tareas?",a:["Puedes hacer que los elementos marcados bajen al final con el ajuste de ordenación de listas. Para otro orden, arrástralos a mano."]},
 {q:"¿Notas o Recordatorios?",a:["Usa Recordatorios para fechas, avisos o lugares. Una lista de Notas sirve para tareas que consultas juntas, como los recados del día."]},
 {q:"¿Cómo veo todas las tareas pendientes?",a:["Crea una carpeta inteligente con la condición Listas de comprobación y elementos sin marcar. Reúne las notas que aún tienen tareas abiertas."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="lista-tareas-notas-iphone"
 intro={<>Una lista de tareas en Notas se crea con un botón. Puedes marcar lo hecho, reordenar elementos y reunir varias listas pendientes. Aquí tienes los pasos y una plantilla para copiar.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#iphone",label:"En iPhone"},{href:"#mac",label:"En Mac"},{href:"#plantilla",label:"Plantilla"},{href:"#ordenar",label:"Ordenar"}]}>
  <p>En iPhone, crea una nota, escribe el título y toca Lista de comprobación. En Mac, usa el botón Lista de comprobación o Mayúsculas, Comando y L. Activa la opción para ordenar automáticamente los ítems marcados si quieres que lo terminado baje al final.</p>
  <PostCta template="weekly-planner" slug="es/lista-tareas-notas-iphone" path="/es/blog/lista-tareas-notas-iphone" position="answer" ui={ui.cta} title="Deja que tu IA mantenga la lista"><p>En Pinto Notes, ChatGPT o Claude pueden añadir tareas y ordenar lo pendiente. La plantilla gratuita de semana deja cada día en su sitio.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640} alt="Notas en un Mac, en inglés, con una lista de la compra y casillas marcadas." caption="La misma lista de comprobación sirve para tareas. Captura: Pinto Notes." />} faq={FAQ}>
 <h2 id="iphone">Crear una lista en el iPhone</h2>
 <p>Toca el botón para crear una nota, escribe un título, pulsa retorno y toca el botón Lista de comprobación. Escribe una tarea por línea. Toca el círculo para marcarla. Puedes arrastrar elementos para moverlos, deslizar a la derecha para sangrarlos y a la izquierda para quitar la sangría.</p>
 <h2 id="mac">Crear una lista en Mac</h2>
 <p>Haz clic en Lista de comprobación o pulsa Mayúsculas, Comando y L. Si ya escribiste las tareas, selecciona los párrafos y toca el botón; cada uno pasa a ser un elemento. Arrastra para reordenar. En Formato, Más, Anular todo puedes reiniciar una lista que repites.</p>
 <h2 id="plantilla">Plantilla de tareas para Notas</h2>
 <p>Separa lo de hoy, la semana, los recados y lo que esperas de otras personas. Deja texto en cada línea, porque una casilla vacía no sobrevive al pegado.</p>
 <Keep title="Lista de tareas para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="En un Mac con macOS 27, usa Edición, Pegar en formato Markdown." />
 <Paths rows={[{on:"Mac",steps:["Edición","Pegar en formato Markdown"]}]} />
 <p>En Latinoamérica, el menú puede decir Pegar como Markdown. En iPhone, pega el texto y convierte las líneas en lista de comprobación con el botón. Para planificar cada día, tienes la <a href="/blog/apple-notes-planner-template" hrefLang="en">plantilla semanal</a> en inglés.</p>
 <Checklist title="Para hacer hoy" items={["Enviar el presupuesto a Daniel","Llamar a mamá","Devolver el paquete","Recoger la ropa de la tintorería"]} />
 <h2 id="ordenar">Ordenar lo que ya terminaste</h2>
 <p>En iPhone, abre Ajustes (Configuración en Latinoamérica), Apps, Notas y busca la opción de ordenar elementos marcados. En Mac, activa Ordenar automáticamente los ítems marcados en los ajustes de Notas. Es una preferencia de cada dispositivo y afecta a todas sus listas. Notas no ordena por prioridad o por nombre.</p>
 <h2 id="varias">Varias listas pendientes</h2>
 <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700} alt="Carpeta inteligente de Notas en Mac, en inglés, que reúne listas con elementos sin marcar." caption="Una carpeta inteligente muestra las notas con tareas pendientes." />
 <p>Fija la lista principal para tenerla arriba, añade una etiqueta como #tareas a varias notas o comparte una lista para colaborar con personas que tengan Cuenta de Apple. Una carpeta inteligente puede reunir notas con casillas sin marcar de distintas carpetas. Si una tarea necesita fecha, hora o aviso al llegar a un lugar, pásala a Recordatorios.</p>
 <h2 id="limites">Hasta dónde llega una lista en Notas</h2>
 <p>Las casillas no tienen fecha ni aviso. Lo marcado permanece hasta que lo quites; lo pendiente no pasa solo a mañana. Puedes organizarlo a mano si la lista es corta.</p>
 <h2 id="pinto">Una lista que puedes mantener con IA</h2>
 <PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600} alt="Planificador semanal de Pinto Notes, en inglés, con las tareas principales, un día por encabezado y una lista para después." caption="La plantilla semanal de Pinto Notes, con datos de ejemplo." />
 <p>La <a href="/templates/weekly-planner">plantilla semanal</a> de Pinto Notes tiene tres tareas principales, una lista por día y otra para después. Con ChatGPT o Claude conectado, puedes pedir que añada tareas, pase al día de hoy lo que quedó pendiente y reinicie la semana. Puedes seguir escribiendo y marcando a mano. Se conservan versiones anteriores y la importación de Notas en Mac no cambia las originales.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-checklist-sort" hrefLang="en">ordenar listas de comprobación</a>, <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas y carpetas inteligentes</a>, <a href="/blog/apple-notes-templates" hrefLang="en">plantillas para Notas</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
