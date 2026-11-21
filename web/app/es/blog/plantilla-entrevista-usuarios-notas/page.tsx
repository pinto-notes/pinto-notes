import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-entrevista-usuarios-notas");
// Spanish version of /blog/apple-notes-user-interview-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla entrevista usuarios" and
// "plantilla entrevista de usuario" returned []. Local research phrase used; no volume inferred.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios and /102296. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `Entrevista de usuario, P07, cambio de reserva

Fecha: 21 de noviembre de 2026, 09:00
Entrevista: Marta. Apuntes: Teo.
Participante: P07, cliente habitual del taller. Ejemplo ficticio.

Objetivo
Saber si un cliente habitual puede cambiar la reserva de un taller sin acudir a atención al cliente.

Consentimiento
09:00: P07 aceptó notas escritas y citas anónimas para la revisión interna del producto.
Sin grabación de audio ni vídeo. Confirmar aparte el permiso antes de usar IA.

Preguntas y apuntes de respuesta
P1. Cuéntame la última vez que cambiaste una reserva de taller.
Apuntes: Envió un correo al estudio, esperó dos días y recibió otra entrada.

P2. La clase de cerámica del sábado coincide con el trabajo. Muéstrame cómo la pasarías al domingo.
Apuntes: Abrió Clases y luego Cuenta. Buscó un enlace de reserva y abrió Ayuda. Paró sin cambiar la fecha.

P3. ¿Qué esperabas encontrar al abrir Cuenta?
Apuntes: Una lista de entradas con una opción de cambiar fecha al lado de cada reserva.

Registro de pruebas
ID y hora\tLo observado o dicho
E1, 09:06\tP1, cita: "Escribí porque no encontré cómo cambiarla".
E2, 09:13\tP2, observación: abrió Clases, Cuenta y Ayuda. No cambió la fecha.
E3, 09:15\tP3, cita: "Esperaba verlo al lado de mi entrada".

Interpretación, pendiente de comprobar
P07 quizá espere cambiar la reserva junto a la entrada en Cuenta. Basado en E2 y E3.
Esta sesión no demuestra que otros clientes esperen lo mismo.

Preguntas para seguir
¿Vería P07 un enlace Mis reservas en Cuenta? Probar con otra tarea.
¿Estaba disponible el cambio de fecha para esta reserva? Revisar la configuración de prueba.

Tareas de seguimiento
Teo: comprobar las reglas de cambio de la reserva de prueba antes del 23 de noviembre
Marta: añadir una tarea sobre Mis reservas a la guía de la siguiente sesión antes del 24 de noviembre
`;
const PROMPT = `Lee mi nota de Pinto Notes "Entrevista de usuario, P07, cambio de reserva".
Crea otra nota llamada "Borrador de hallazgos, P07, cambio de reserva". No cambies la nota original.
Usa solo esa entrevista. Separa experiencia contada, acciones observadas, citas exactas e interpretaciones posibles.
En cada hallazgo cita P07, el ID de prueba y los números de línea devueltos al leer la nota.
Respeta las citas literalmente. No conviertas los apuntes en citas.
Separa preguntas sin respuesta y próximos pasos. No inventes respuestas ni generalices a otros participantes.
Omite cualquier hallazgo sin prueba en la nota. Marca la nota nueva como borrador para revisar.`;
const FAQ = [
 {q:"¿Qué debe incluir la ficha de entrevista?",a:["Objetivo, ID del participante, consentimiento, preguntas y respuestas, registro de pruebas y tareas posteriores. Separa citas y acciones observadas de tus interpretaciones."]},
 {q:"¿Cómo marco una cita?",a:["Ponle ID y hora y copia las palabras exactas. Deja las paráfrasis en los apuntes de respuesta, sin comillas."]},
 {q:"¿Necesito grabar audio?",a:["No. El ejemplo usa notas escritas. Anota el consentimiento real antes de empezar; copiar el ejemplo no autoriza la sesión ni compartirla con una IA."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-entrevista-usuarios-notas"
 intro={<>Copia esta plantilla de entrevista de usuarios en Notas de Apple, una nota por sesión. Mantiene separados los apuntes, las citas exactas, lo observado y las preguntas pendientes.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar la ficha"},{href:"#preparar",label:"Prepararla"},{href:"#entrevista",label:"Tomar apuntes"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Redactar hallazgos"}]}>
 <p>El ejemplo sigue a una persona que intenta cambiar una reserva de cerámica. Sustituye los datos antes de tu propia sesión y registra el consentimiento que obtengas.</p>
 <div id="plantilla"><Keep title="Ficha de entrevista para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto en una nota nueva. Convierte el registro de pruebas en tabla y las tareas en lista de comprobación." /></div>
 <PostCta slug="es/plantilla-entrevista-usuarios-notas" path="/es/blog/plantilla-entrevista-usuarios-notas" position="answer" ui={ui.cta} title="Redacta hallazgos desde tus apuntes"><p>En Pinto, ChatGPT o Claude puede leer una entrevista y preparar un borrador aparte para que lo revises.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara la ficha en Mac o iPhone</h2>
 <p>Usa iCloud o una nota guardada en el dispositivo. Algunas funciones no están disponibles con otros proveedores. Deja las respuestas como texto corriente para escribir durante la conversación.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, aplica Encabezamiento a las secciones. Selecciona las dos tareas finales y usa el botón de lista de comprobación. Selecciona las cuatro líneas del registro de pruebas y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. La tabulación separa las columnas. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>.</p>
 <p>En iPhone, pega el texto, aplica Encabezamiento a las secciones e inserta una tabla de dos columnas para las pruebas. Reemplaza las dos tareas por una lista de comprobación. Borra las líneas de texto después de pasarlas. Apple muestra los iconos en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Notas</a>.</p>
 <h2 id="entrevista">Toma apuntes junto a cada pregunta</h2>
 <p>Antes de empezar, cambia objetivo, preguntas y datos ficticios. Da un ID al participante y anota exactamente qué uso de apuntes y citas acepta. Durante la sesión, escribe respuestas breves. Reserva las comillas para palabras captadas con exactitud y añade tú mismo las horas.</p>
 <p>En E2, P07 abrió Clases, Cuenta y Ayuda y se detuvo. «P07 estaba confundido» sería una interpretación, no una observación. Ponla en su sección con las pruebas que la sustentan. Pregunta qué esperaba después de la tarea, sin sugerirle dónde pulsar.</p>
 <h2>Revisa la sesión antes de sacar conclusiones</h2>
 <p>Lee las respuestas y las pruebas mientras recuerdas la conversación. Deja como desconocidos los detalles que faltan. E2 y E3 sugieren algo que probar, pero no demuestran que un enlace Mis reservas resuelva el problema. Comprueba también las reglas de cambio de fecha. Da responsable y fecha a cada seguimiento y márcalo solo al terminar. Conserva la ficha completa como fuente.</p>
 <h2 id="limites">Lo que no hace la ficha</h2>
 <p>No capta citas perdidas, no comprueba el consentimiento ni valida tus interpretaciones. Una entrevista aporta datos sobre esa sesión. Compara otras antes de hablar de un patrón.</p>
 <h2 id="ia">Prepara hallazgos en otra nota de Pinto</h2>
 <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y pulsar Allow, puede leer y editar tus notas. Antes de usar una entrevista real, comprueba que el acuerdo del participante y las normas de tu organización permiten compartirla con esa IA.</p>
 <Keep title="Pide un borrador de hallazgos" text={PROMPT} copyLabel={ui.copy} note="Empieza con el ejemplo ficticio. Revisa siempre cada cita y su línea de origen." />
 <p>El correo anterior de P07 es experiencia contada; E2 es observación y E3, una expectativa citada. Corrige cualquier mezcla o generalización del borrador. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> en el Mac sin cambiar los originales.</p>
 </LocalPostPage>; }
