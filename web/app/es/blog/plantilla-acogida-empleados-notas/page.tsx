import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-acogida-empleados-notas");
// Spanish version of /blog/apple-notes-employee-onboarding-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla onboarding empleados", "plantilla acogida empleados"
// and "plan de incorporacion nuevos empleados" returned []. Local term is "acogida"; no volume inferred.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `Primer mes en Herramientas Olivo

Nombre: Marta Chen, atención al cliente
Inicio: 23 de noviembre de 2026. Revisión del primer mes: 18 de diciembre.
Responsable: Amalia Pérez. Compañero de apoyo: Leo Martín.

Qué se espera de mí
Antes de la revisión, responder consultas habituales de entrega con Leo revisando las respuestas.
Explicar cuándo escalar una devolución. Confirmar estas expectativas con Amalia.

Personas
Persona\tQué preguntarle
Amalia Pérez, responsable\tPrioridades y comentarios. Reunión de seguimiento los viernes.
Leo Martín, compañero\tBorradores de respuesta y dudas de entrega. Trabajar juntos el martes.
Nuria Díaz, informática\tSolicitudes de acceso en el portal interno.

Sistemas y páginas de consulta
Manual del equipo: intranet, Atención / Primeros pasos.
Guía de entregas: intranet, Atención / Consultas de entrega.
Sistema de atención: solicitud IT-4821 presentada el 23 de noviembre. Acceso pendiente.
Calendario del equipo: se abre correctamente, comprobado el 23 de noviembre.

Preguntas y respuestas
Abierta, para Amalia: ¿qué devoluciones requieren aprobación? Preguntar el 27 de noviembre.
Respondida el 23 de noviembre por Leo: ¿dónde hay respuestas de ejemplo? Atención / Respuestas de ejemplo.

Semana 1, del 23 al 27 de noviembre
Confirmar con Amalia lo esperado para el primer mes
Probar el acceso al sistema de atención cuando se resuelva la solicitud IT-4821
Leer la guía de entregas y observar a Leo en dos consultas

Semana 2, del 30 de noviembre al 4 de diciembre
Redactar tres respuestas sobre entregas para que Leo las revise
Pedir a Amalia que explique las reglas de escalado de devoluciones

Semana 3, del 7 al 11 de diciembre
Atender cinco consultas habituales con Leo revisando las respuestas
Anotar un paso confuso de la guía de entregas

Semana 4, del 14 al 18 de diciembre
Reunir dos respuestas revisadas para la reunión del primer mes
Revisar el avance con Amalia y acordar el siguiente objetivo

Diario de aprendizaje
23 de noviembre: encontré las respuestas de ejemplo con Leo. El acceso sigue pendiente.

Revisión del primer mes
18 de diciembre: llevar las respuestas revisadas y las preguntas abiertas.
Después: anotar aquí los comentarios y el siguiente objetivo.
`;
const PROMPT = `Lee mi nota de Pinto Notes "Primer mes en Herramientas Olivo".
Añade esta respuesta confirmada en Preguntas y respuestas:
27 de noviembre de 2026, Amalia: todas las devoluciones requieren aprobación de la persona responsable del turno.
Sustituye la pregunta abierta sobre devoluciones por esa respuesta fechada.
Conserva las demás preguntas, el estado del acceso y las listas semanales.
Enumera en el chat las preguntas aún abiertas y a quién iba a preguntarlas.
Usa solo la nota y la respuesta anterior. No inventes normas de la empresa ni marques formación como terminada.
Si no encuentras la nota o la pregunta correcta, consúltame antes de editar.`;
const FAQ = [
 {q:"¿Qué anoto durante mi primer mes de trabajo?",a:["Expectativas del puesto, personas a quienes preguntar, accesos, páginas de consulta y dudas. Añade una lista por semana y fecha las respuestas que recibas."]},
 {q:"¿Cómo sigo un acceso pendiente?",a:["Anota sistema, número y fecha de solicitud y equipo responsable. Mantenlo pendiente hasta probarlo. Guarda las contraseñas en el gestor aprobado por la empresa."]},
 {q:"¿Sustituye esta nota el proceso oficial de incorporación?",a:["No. Es una referencia personal. Usa el sistema de la empresa para documentos, formación obligatoria y solicitudes; marcar una casilla aquí no envía nada."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-acogida-empleados-notas"
 intro={<>Copia esta plantilla de acogida de empleados en Notas de Apple. Guarda personas, accesos y dudas junto a una lista de tareas para las primeras cuatro semanas.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar la plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#primer-mes",label:"Usarla cada semana"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Añadir respuestas"}]}>
 <p>Una nota personal para el primer mes, con expectativas, sistemas y preguntas. El ejemplo sigue a una nueva compañera de atención al cliente.</p>
 <div id="plantilla"><Keep title="Acogida de empleados para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Ejemplo ficticio. Cambia nombres y fechas; convierte Personas en tabla y las tareas semanales en listas." /></div>
 <PostCta slug="es/plantilla-acogida-empleados-notas" path="/es/blog/plantilla-acogida-empleados-notas" position="answer" ui={ui.cta} title="Añade respuestas confirmadas"><p>Con ChatGPT o Claude conectado a Pinto puedes actualizar la nota con una respuesta que ya hayas confirmado.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara la nota en Notas de Apple</h2>
 <p>Usa iCloud o una nota del dispositivo. Pega el texto y cambia las referencias ficticias por enlaces reales del equipo. Algunas funciones no están disponibles con otras cuentas.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, aplica Encabezamiento a cada sección. Selecciona solo las tareas de una semana y usa el botón de lista de comprobación; repite con las otras tres. Selecciona las cuatro líneas de Personas y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>.</p>
 <p>En iPhone, pega el texto y aplica Encabezamiento. Crea una lista por semana e inserta una tabla de dos columnas para personas y responsabilidades. Borra las líneas originales al pasarlas. Apple muestra los controles en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Notas</a>.</p>
 <h2 id="primer-mes">Mantén la nota al día durante el primer mes</h2>
 <p>Confirma las expectativas con Amalia antes de darlas por acordadas. Fecha cada respuesta e indica quién la dio. Deja visibles las preguntas pendientes, con persona y día para volver a preguntar. Aunque una solicitud diga resuelta, prueba el acceso antes de cambiar el estado de tu nota.</p>
 <p>Cada viernes, revisa la lista, mueve tareas pendientes a una fecha realista y escribe algo que ya sabes hacer. Conserva las casillas terminadas. Para conversaciones más largas con tu responsable, usa la <a href="/es/blog/plantilla-reunion-one-to-one-notas">plantilla de reunión individual</a>. En la revisión del mes, lleva dos respuestas revisadas y las dudas abiertas; después anota los comentarios y el siguiente objetivo.</p>
 <h2 id="limites">Lo que no hace esta nota</h2>
 <p>No concede accesos, envía formación ni crea recordatorios. Sigue el proceso oficial de la empresa. Guarda los apuntes de trabajo donde se permita y deja contraseñas y documentos de personal en los sistemas aprobados.</p>
 <h2 id="ia">Añade una respuesta confirmada con ChatGPT o Claude</h2>
 <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> a Pinto y pulsar Allow, obtiene acceso para leer y editar. Dale una respuesta comprobada y pídele que la coloque junto a la pregunta correcta.</p>
 <Keep title="Pide a tu IA que actualice la nota" text={PROMPT} copyLabel={ui.copy} note="Sustituye el ejemplo por información confirmada antes de usarlo." />
 <p>Comprueba fecha, persona y redacción. En el ejemplo, el acceso sigue pendiente y ninguna tarea semanal se marca. Revisa también las preguntas que la IA enumere. Pinto conserva versiones anteriores. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en el Mac sin modificarlas.</p>
 </LocalPostPage>; }
