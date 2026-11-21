import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "registro-de-horas-notas");
// Spanish version of /blog/apple-notes-time-log-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "registro de horas plantilla" returned that phrase,
// "registro de horas de trabajo plantilla" and related spreadsheet queries. No volume inferred.
// Apple es-es guides read 21 Nov 2026: /guide/notes/apd0a136b9cc/mac (Formato > Tabla),
// /guide/notes/apd93c815aa0/mac (lista de comprobación), /guide/iphone/iph1ac0b3a2/ios.
// iPhone icon buttons are described, not named. No picture.
const ui = UI.es;
const TEMPLATE = `Registro de horas, del 16 al 20 de noviembre de 2026

Alcance: sesiones de la web, el boletín y gestiones relacionadas. No es toda la jornada laboral.

Sesiones
Fecha\tInicio\tFin\tProyecto\tTarea\tMinutos
16 nov\t09:00\t10:10\tWeb\tRedactar la portada\t70
16 nov\t10:10\t10:25\tGestión\tLlamada sobre la entrega\t15
16 nov\t10:25\t11:10\tWeb\tRevisar la portada\t45
17 nov\t09:00\t09:40\tWeb\tComprobar la vista móvil\t40
17 nov\t14:00\t14:55\tWeb\tAplicar comentarios del cliente\t55
18 nov\t10:00\t11:00\tWeb\tPreparar la revisión\t60
19 nov\t09:15\t10:00\tBoletín\tEscribir la edición de noviembre\t45
19 nov\t10:10\t10:40\tGestión\tResponder el correo del proyecto\t30
20 nov\t09:00\t10:00\tWeb\tPublicar los cambios aprobados\t60
20 nov\t10:15\t10:45\tBoletín\tEditar los asuntos\t30

Totales diarios, sumados a mano
16 nov: 130 minutos
17 nov: 95 minutos
18 nov: 60 minutos
19 nov: 75 minutos
20 nov: 90 minutos
Total semanal: 450 minutos, 7 horas y 30 minutos

Totales por proyecto, sumados a mano
Web: 330 minutos
Boletín: 75 minutos
Gestión: 45 minutos

Interrupciones y tiempo sin registrar
16 nov: la llamada interrumpió el trabajo de la web. Sus 15 minutos ya están en Gestión.
19 nov, de 10:40 a 11:00: actividad sin registrar. 20 minutos desconocidos, excluidos de los totales.

Comprobación semanal
Comparar la duración de cada sesión con su hora de inicio y fin
Comprobar que los totales diarios y por proyecto coinciden con el semanal
`;
const PROMPT = `Lee mi nota de Pinto Notes "Registro de horas, del 16 al 20 de noviembre de 2026".
Añade una sesión el 20 de noviembre de 14:00 a 14:35, para Web: comprobar los enlaces publicados, 35 minutos.
Conserva las sesiones anteriores y la entrada de tiempo desconocido. No cuentes dos veces la llamada.
Propón en el chat nuevos totales diarios, por proyecto y semanales. No cambies los totales guardados hasta que los revise.
Pregúntame por cualquier solapamiento o tiempo ausente. No inventes sesiones ni rellenes huecos sin explicación.`;
const FAQ = [
 {q:"¿Qué datos lleva un registro de horas en Notas?",a:["Anota fecha, inicio, fin, proyecto, tarea y minutos por sesión. Añade subtotales diarios y un total semanal. Indica el alcance si no registras toda la jornada."]},
 {q:"¿Suma sola la columna de minutos?",a:["No. Tanto en Notas de Apple como en la misma tabla de Pinto, los minutos y totales son texto que escribes y compruebas tú."]},
 {q:"¿Cómo registro una interrupción sin duplicar tiempo?",a:["Cierra la primera sesión cuando empieza la interrupción, anótala en otra fila y abre una nueva sesión al volver. No cuentes todo el tramo como una sola tarea."]},
 {q:"¿Qué hago si no recuerdo una tarea?",a:["Marca el intervalo como desconocido y exclúyelo del total por proyecto. Si luego lo reconstruyes con una fuente fiable, indícalo como estimación."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="registro-de-horas-notas"
 intro={<>Copia este registro de horas en Notas de Apple para anotar el trabajo realizado. Escribe los minutos de cada sesión y suma los subtotales a mano para comprobar la semana.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar la plantilla"},{href:"#preparar",label:"Preparar la tabla"},{href:"#registrar",label:"Registrar el tiempo"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Añadir una sesión con IA"}]}>
 <p>Una fila por sesión terminada. El ejemplo suma 450 minutos en cinco días, cuenta una interrupción una sola vez y deja aparte el tiempo desconocido.</p>
 <div id="plantilla"><Keep title="Registro de horas para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Copia el ejemplo ficticio y cambia sesiones y totales. Las tabulaciones de las filas se convierten en columnas." /></div>
 <PostCta slug="es/registro-de-horas-notas" path="/es/blog/registro-de-horas-notas" position="answer" ui={ui.cta} title="Añade sesiones con tu IA"><p>Pinto funciona como Notas de Apple en iPhone y Mac. Si conectas ChatGPT o Claude, puede leer tu registro y añadir las sesiones que le indiques.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Crea la tabla y la lista de revisión</h2>
 <p>Usa una nota de iCloud o guardada en el dispositivo. Pega primero el texto; los títulos de sección y los totales quedan fuera de la tabla.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Seleccionar las filas","Formato","Tabla"]}]} />
 <p>En el Mac, selecciona las once líneas desde Fecha hasta la última sesión y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. Cada tabulación separa una columna. El tabulador en la última celda añade una fila.</p>
 <p>En iPhone, crea una nota y pega el texto. Inserta una tabla de dos columnas: Sesión y Minutos. En Sesión combina fecha, horas, proyecto y tarea; por ejemplo, «16 nov, 09:00 a 10:10, Web, redactar la portada». Pon 70 en Minutos. Pasa las demás sesiones y borra las líneas originales. Apple muestra el control en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía para iPhone</a>.</p>
 <p>En Mac, selecciona las dos líneas de Comprobación semanal y usa el botón de lista de comprobación. En iPhone, crea la lista bajo el título e introduce cada acción. Marca el círculo solo después de comprobarla.</p>
 <h2 id="registrar">Anota el tiempo real y las interrupciones</h2>
 <p>Explica qué trabajo registras. Este ejemplo reúne sesiones de ciertos proyectos, no todas las horas de oficina. Mantén los planes en otra nota. Añade una fila al terminar o cambiar de tarea y usa siempre el mismo nombre de proyecto.</p>
 <p>La primera sesión dura 70 minutos. La llamada tiene sus propios 15 minutos de Gestión y después empieza otra sesión de Web. Contar también todo el tramo de 09:00 a 11:10 como Web duplicaría la llamada. El hueco del jueves son 20 minutos sin actividad conocida y queda fuera de los totales.</p>
 <p>Suma por día: 130 + 95 + 60 + 75 + 90 = 450 minutos, o 7 horas y 30 minutos. Por proyecto: 330 + 75 + 45 = 450. Vuelve a comprobar ambos cálculos si cambias una sesión. Guarda la semana terminada como registro. Consulta también <a href="/blog/apple-notes-templates" hrefLang="en">otras plantillas de Notas</a>.</p>
 <h2 id="limites">Lo que no hace este registro</h2>
 <p>No tiene temporizador ni captura automática. Ni Notas ni esta tabla en Pinto suman columnas. Para muchos cálculos de duración, puede convenir una hoja de cálculo. El total solo describe las sesiones registradas; no explica el tiempo desconocido ni decide qué horas son facturables.</p>
 <h2 id="ia">Pide a ChatGPT o Claude que añada una sesión</h2>
 <p>Pinto admite tablas y listas. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y pulsar Allow, puede leer y editar tus notas. Dale los datos reales de la sesión.</p>
 <Keep title="Petición para tu IA conectada" text={PROMPT} copyLabel={ui.copy} note="Úsala con el ejemplo o cambia título y sesión por los tuyos." />
 <p>Comprueba que añadió una sola sesión de 35 minutos y conservó las anteriores. El viernes debe quedar en 125 minutos, Web en 365 y la semana en 485 minutos, u 8 horas y 5 minutos. Confírmalo antes de pedir que cambie los totales guardados. El tiempo desconocido sigue excluido. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple</a> en el Mac sin cambiar los originales.</p>
 </LocalPostPage>; }
