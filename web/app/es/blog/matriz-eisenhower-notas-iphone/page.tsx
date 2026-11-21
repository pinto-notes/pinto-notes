import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "matriz-eisenhower-notas-iphone");
// Spanish version of /blog/apple-notes-eisenhower-matrix-template, 21 Nov 2026. Autocomplete hl=es, gl=es:
// "matriz eisenhower plantilla" suggests plantilla Word, Excel gratis, PDF and Notion.
// "matriz eisenhower plantilla notas" has no suggestions.
// Apple Support read 21 Nov: /es-es/guide/notes/apd93c815aa0/mac (botón Lista de comprobación),
// /es-es/guide/notes/apd1955d3b21/mac (botón Formato, Encabezamiento),
// /es-es/guide/notes/not9474646a9/mac (Archivo > Duplicar nota),
// /es-es/guide/iphone/iph1ac0b3a2/ios and /es-es/102296 (crear nota y lista).
// No unverified menu name. No picture.
const ui = UI.es;
const TEMPLATE = `Lanzamiento de reservas del café, semana del 23 de noviembre

Resultado: publicar la nueva página de reservas el 27 de noviembre.
Revisión: 24 de noviembre, 9:00.

Hacer: urgente e importante
Arreglar el formulario de reservas del móvil antes de las pruebas de hoy. El botón de enviar no funciona.
Enviar el enlace de prueba a la dueña del café antes de las 17:00 del 23 de noviembre. Mañana necesita dar su opinión.

Programar: importante, no urgente
Probar los correos de confirmación el 25 de noviembre a las 10:00, antes del lanzamiento.
Escribir la guía de entrega el 26 de noviembre a las 14:00 para que la dueña pueda cambiar los horarios.

Delegar o reducir: urgente, poco importante para el resultado
Pedir a Javier que ajuste el tamaño de la imagen de portada antes del 24 de noviembre. Confirmar que puede hacerlo.
Responder a la invitación opcional de la llamada de lanzamiento antes de las 16:00 de hoy. Pedir una actualización por escrito.

Descartar: ni urgente ni importante
No buscar más diseños para la web. El actual ya está aprobado.
Dejar como están los iconos de las carpetas internas. No afectan a la página de reservas.
`;
const PROMPT = `Lee mi nota "Lanzamiento de reservas del café, semana del 23 de noviembre". Propón aquí en el chat cambios en sus cuatro listas de la matriz de Eisenhower. Valora la importancia según el resultado indicado y la urgencia según los plazos y consecuencias escritos en la nota. Explica cada cambio. Pregúntame por los datos que falten: no inventes plazos ni supongas que otra persona aceptará una tarea. No edites la nota hasta que apruebe los cambios.`;
const FAQ = [
 {q:"¿Cómo hago una matriz de Eisenhower en Notas?",a:["Crea una nota con cuatro encabezados: Hacer, Programar, Delegar o reducir y Descartar. Pon una lista de comprobación bajo cada uno."]},
 {q:"¿Hace falta una tabla de cuatro casillas?",a:["No para esta plantilla. Cuatro listas dejan espacio para el plazo y el motivo de cada tarea, y permiten marcarla al terminar."]},
 {q:"¿Dónde va una tarea urgente pero poco importante?",a:["Mira qué ocurre si espera y cuánto ayuda al resultado. Puedes pedir ayuda, reducir el trabajo o rechazarlo. Un plazo no convierte la tarea en importante."]},
 {q:"¿Qué va en Programar?",a:["Trabajo que ayuda al resultado pero no pide actuar ya. Escribe cuándo piensas hacerlo y reserva ese tiempo aparte en el calendario."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="matriz-eisenhower-notas-iphone"
 intro={<>Haz una matriz de Eisenhower en Notas de Apple con cuatro listas: Hacer, Programar, Delegar o reducir y Descartar. Copia el ejemplo y ordena tus tareas por urgencia e importancia.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"La plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#ordenar",label:"Ordenar tareas"},{href:"#limites",label:"Sus límites"},{href:"#pinto",label:"Revisar con IA"}]}>
 <p>Una nota con cuatro encabezados y listas de comprobación basta. Escribe el resultado arriba y anota por qué va cada tarea en su lista. El ejemplo prepara la página de reservas de un café.</p>
 <PostCta slug="es/matriz-eisenhower-notas-iphone" path="/es/blog/matriz-eisenhower-notas-iphone" position="answer" ui={ui.cta} title="Comprueba tus prioridades"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Tras conectarlos, ChatGPT o Claude pueden leer la nota y proponer cambios con motivos que tú compruebas.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="plantilla">La plantilla: cuatro listas con motivos</h2>
 <p>Solo hay un resultado: publicar la página el 27 de noviembre. El formulario roto impide probarla hoy. La guía de entrega importa, pero puede esperar al jueves. La llamada opcional pide respuesta hoy, no una hora de trabajo.</p>
 <Keep title="Matriz de Eisenhower para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Copia como texto normal. Convierte los nombres de sección en encabezados y las tareas en listas." />
 <h2 id="preparar">Prepárala en Mac o iPhone</h2>
 <p>Usa una nota de iCloud o guardada en el dispositivo. Apple advierte que algunas funciones de formato no están disponibles con otras cuentas. Las listas separadas dejan espacio para explicar cada tarea.</p>
 <Paths rows={[{on:"Mac",steps:["Botón Formato","Encabezamiento"]},{on:"iPhone",steps:["Botón Formato","Encabezamiento"]}]} />
 <p>En el Mac, crea una nota y pega el ejemplo. Cambia el resultado y las tareas. Selecciona Hacer, usa el botón Formato y elige Encabezamiento. Repite con las otras secciones. Selecciona solo las tareas bajo cada encabezado y pulsa el botón Lista de comprobación.</p>
 <p>En iPhone, crea la nota con título, resultado y revisión. Aplica Encabezamiento a cada sección. Debajo, toca Lista de comprobación y escribe las tareas. Retorno añade otro elemento. Marca el círculo cuando acabes. En Descartar, márcalo cuando hayas decidido dejarlo fuera.</p>
 <p>En el Mac, Archivo, Duplicar nota te da otra matriz para otro proyecto. Consulta las <a href="/blog/apple-notes-templates" hrefLang="en">plantillas de Notas</a> (en inglés).</p>
 <h2 id="ordenar">Decide qué es urgente e importante</h2>
 <p>Empieza por la importancia: ¿ayuda al resultado o evita una consecuencia? Después pregunta qué plazo o dependencia obliga a actuar ahora. Anota el motivo, sobre todo si el plazo es solo una preferencia.</p>
 <ul>
 <li>Hacer contiene trabajo importante que no puede esperar. El botón roto impide las pruebas de hoy.</li>
 <li>Programar contiene trabajo importante con margen. Reserva aparte el tiempo para la guía.</li>
 <li>Delegar o reducir contiene trabajo apremiante que necesita menos atención tuya. Pregunta a Javier antes de contar con él.</li>
 <li>Descartar guarda lo que has decidido omitir. Así no vuelve como tarea inexplicablemente pendiente.</li>
 </ul>
 <p>Si trabajas a solas, la tercera lista puede significar hacer una versión menor, aplazarla de común acuerdo o rechazarla. Mover una línea no transfiere la responsabilidad. En la próxima revisión, comprueba plazos y motivos de nuevo. La <a href="/es/blog/revision-semanal-notas-iphone">revisión semanal</a> puede ayudarte a elegir el resultado de la semana siguiente.</p>
 <h2 id="limites">Hasta dónde llega</h2>
 <p>La nota registra tus decisiones. No mueve tareas por ti. Escribir una fecha no reserva tiempo en el calendario y escribir el nombre de Javier no le manda una petición. Una IA puede revisar tus motivos, pero necesita el resultado y los plazos reales.</p>
 <h2 id="pinto">Revisa la misma nota con ChatGPT o Claude</h2>
 <p>Pinto Notes tiene encabezados y listas de comprobación. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, puede leer y editar tus notas. Pide primero una revisión, antes de cambiar nada.</p>
 <Keep title="Pide una revisión de prioridades" text={PROMPT} copyLabel={ui.copy} note="Cambia el título por el de tu nota y comprueba los cambios propuestos." />
 <p>Si propone programar el arreglo del formulario, recuerda que las pruebas dependen de él hoy. Corrige cualquier plazo inventado para la guía. Tras aprobar los cambios, pídele que actualice la nota. Pinto conserva las versiones anteriores.</p>
 <p>Puedes traer tus notas de Apple con <a href="/blog/move-from-apple-notes" hrefLang="en">una importación en el Mac</a> (en inglés). Notas de Apple no cambia. La app está en inglés.</p>
 </LocalPostPage>;
}

