import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-traspaso-trabajo-notas");
// Spanish version of /blog/apple-notes-work-handover-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla traspaso de tareas" and
// "plantilla entrega de trabajo vacaciones" returned []. Local phrase is "traspaso de trabajo".
// Apple es-es guides read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios and /102296. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `Traspaso del taller Olivo, del 30 de noviembre al 4 de diciembre

Cobertura
Ausente: Sara, del 30 de noviembre al 4 de diciembre de 2026. Regresa el 7 de diciembre.
Responsable durante la ausencia: Jon. Fecha del taller: 10 de diciembre.
Última actualización: 27 de noviembre, 15:00, hora de Madrid.
Sara estará desconectada. Las decisiones urgentes se consultan con Emma.

Trabajo en curso
Tarea\tEstado, responsable y siguiente acción
Página de inscripción\tTexto aprobado; página sin publicar. Jon: pedir la revisión final a Emma el 30 de noviembre antes de las 10:00 y publicar antes de las 12:00.
Reserva de la sala\tHay 18 plazas retenidas; la señal no está aprobada. Jon: pedir la aprobación de Emma antes del 1 de diciembre a las 15:00.
Correo a asistentes\tBorrador listo. Nuria: enviarlo cuando se confirme la sala, antes del 3 de diciembre a las 10:00. Esperar si falta la confirmación.

Documentos clave
Plan: Plan del taller Olivo, actualizado el 27 de noviembre.
Presupuesto de sala: R218, del 26 de noviembre.
Borrador de correo: Correo a asistentes del taller Olivo, versión 2.
Sustituye estos nombres por enlaces que funcionen en tu equipo.

Accesos pendientes
Jon necesita el permiso de edición de inscripciones y acceso a la carpeta del taller.
Sara presentó la solicitud IT-248 el 27 de noviembre; sigue pendiente de aprobación.
Procedimiento de acceso: https://example.com/it/temporary-access
Jon: consultar a informática y probar ambos accesos antes del 27 de noviembre a las 16:00.
Usa tu propia cuenta. No pongas contraseñas, códigos de recuperación ni tokens en esta nota.

Contactos
Emma, presupuesto y urgencias: emma@example.com
Nuria, mensajes a asistentes: nuria@example.com
Luis, reserva de sala R218: luis@example.com
Informática, solicitud IT-248: it@example.com

Riesgos y preguntas abiertas
La reserva de la sala vence el 2 de diciembre a las 12:00. Jon: si no hay aprobación el 1 de diciembre a las 15:00, consultar a Emma ese día. No pagar sin permiso.
¿Podemos admitir a 22 personas? Emma decide antes del 30 de noviembre a las 15:00. Mantener el límite en 18 hasta que apruebe el cambio.
El diseño de las diapositivas puede esperar al regreso de Sara. No requiere cobertura.

Comprobación con quien recibe el trabajo
Jon: abrir cada documento con su propia cuenta
Jon: probar la edición de inscripciones y el acceso a la carpeta
Jon y Nuria: confirmar juntos las próximas acciones y plazos
Jon: anotar aquí las dudas pendientes antes del 27 de noviembre a las 16:30

Al regresar
Jon: añadir un resumen fechado de lo terminado y lo pendiente antes del 7 de diciembre a las 09:00.
Sara: revisarlo con Jon antes de retomar el trabajo.
`;
const PROMPT = `Lee mis notas de Pinto Notes "Plan del taller Olivo", "Reserva de sala R218" y "Correo a asistentes del taller Olivo".
Crea una nota aparte llamada "Traspaso del taller Olivo, del 30 de noviembre al 4 de diciembre" con el diseño que pego debajo.
Sara estará ausente del 30 de noviembre al 4 de diciembre de 2026 y regresa el 7. Jon la sustituye.
Para cada asunto abierto, incluye estado, responsable, siguiente acción, plazo y título de la nota de origen.
Separa hechos confirmados y preguntas. Si falta responsable, plazo o aprobación, escribe "Pendiente de confirmar" y pregúntame.
Incluye solicitudes de acceso y quién debe aprobarlas. No incluyas contraseñas, códigos ni tokens.
No supongas que un acceso funciona ni que alguien ha aceptado una tarea. Deja sin marcar la lista de comprobación.
No cambies las notas originales. Revisaré el borrador y confirmaré las responsabilidades con el equipo.`;
const FAQ = [
 {q:"¿Qué debe incluir un traspaso de trabajo?",a:["Fechas de ausencia, trabajo actual, responsable y siguiente acción de cada asunto, enlaces a documentos, accesos, contactos y riesgos. Termina con una lista para revisarlo con quien te sustituye."]},
 {q:"¿Debo poner contraseñas en la nota?",a:["No. Anota qué permiso se necesita, quién lo aprueba y dónde se solicita. Quien te sustituya debe usar su propia cuenta. Deja fuera contraseñas, códigos y tokens."]},
 {q:"¿Cómo compruebo que está listo?",a:["Pide a la persona que te sustituye que abra los enlaces, pruebe sus accesos y confirme acciones y fechas. Un nombre en la nota no demuestra que haya aceptado el trabajo."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-traspaso-trabajo-notas"
 intro={<>Copia esta plantilla de traspaso de trabajo en Notas de Apple para preparar una ausencia. Reúne tareas, responsables, accesos, contactos y riesgos.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar el traspaso"},{href:"#preparar",label:"Preparar la nota"},{href:"#revisar",label:"Revisar con el equipo"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Redactar con IA"}]}>
 <p>Usa una nota por periodo de cobertura. Cada asunto pendiente necesita un responsable, una acción y un plazo. Cambia los datos ficticios y nunca guardes contraseñas en la nota.</p>
 <div id="plantilla"><Keep title="Traspaso de trabajo para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cópialo en una nota nueva. Convierte Trabajo en curso en tabla y la revisión con quien te sustituye en lista de comprobación." /></div>
 <PostCta slug="es/plantilla-traspaso-trabajo-notas" path="/es/blog/plantilla-traspaso-trabajo-notas" position="answer" ui={ui.cta} title="Redacta el traspaso desde tus notas"><p>En Pinto, ChatGPT o Claude puede leer tus notas de proyecto y preparar un borrador para que lo compruebes.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara el traspaso en Notas</h2>
 <p>Usa una nota de iCloud o del dispositivo. Pega el texto y aplica los formatos después. Algunas funciones no están disponibles con otros proveedores.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, aplica Encabezamiento a los nombres de sección. Selecciona las cuatro líneas desde Tarea hasta Correo a asistentes y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. Cada tabulación separa columnas. El tabulador en la última celda crea otra fila. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>. Convierte las cuatro líneas de Comprobación en una lista de comprobación.</p>
 <p>En iPhone, crea una nota y pega el texto. Aplica Encabezamiento a las secciones, inserta una tabla de dos columnas y pasa el trabajo. Usa el icono de lista de comprobación para las cuatro tareas de revisión. Borra las líneas originales tras pasarlas. Consulta la <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Apple</a>.</p>
 <h2>Da un siguiente paso a cada asunto</h2>
 <p>Jon necesita la aprobación de la señal antes de que venza la reserva. Escribe ambos plazos. El diseño de Sara puede esperar. Sustituye los nombres de documentos y el enlace de ejemplo por enlaces reales. Las decisiones de una <a href="/es/blog/plantilla-acta-de-reunion-notas">acta de reunión</a> pueden servir de fuente.</p>
 <h2 id="revisar">Compruébalo con quien te sustituye</h2>
 <p>Revisad juntos cada tarea antes de la ausencia. Jon debe probar su propio acceso; la solicitud sigue pendiente hasta que se apruebe y se pruebe. Nuria debe confirmar el plazo del correo. El límite sigue en 18 asistentes hasta que Emma decida. Al final, anotad lo terminado y lo pendiente antes del regreso.</p>
 <h2 id="limites">Lo que no hace la nota</h2>
 <p>La nota no concede accesos, confirma aceptación ni avisa del vencimiento de la reserva. Usa los procesos del equipo para eso y actualiza el texto. Si tu empresa exige un traspaso formal, síguelo.</p>
 <h2 id="ia">Redacta un borrador con ChatGPT o Claude</h2>
 <p>En Pinto puedes usar encabezamientos, tablas y listas. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y pulsar Allow, puede leer y editar. Usa solo información laboral que tu organización permita compartir.</p>
 <Keep title="Pide un borrador de traspaso" text={PROMPT} copyLabel={ui.copy} note="Sustituye notas, nombres y fechas, y pega después el diseño del traspaso." />
 <p>Contrasta responsables, fechas y permisos con las notas originales y con las personas. La señal y el acceso siguen pendientes y el límite es 18. Marca la lista solo después de hacer cada comprobación. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en el Mac sin modificar los originales.</p>
 </LocalPostPage>; }
