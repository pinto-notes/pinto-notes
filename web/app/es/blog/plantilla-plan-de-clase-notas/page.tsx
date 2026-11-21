import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-plan-de-clase-notas");
// Spanish version of /blog/apple-notes-lesson-plan-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla plan de clase" returned that phrase and
// "plantilla plan de clase word"; "plan de clase plantilla" returned similar. No volume inferred.
// Spain example: one 40-minute maths support lesson for a pupil in 5.º de Primaria.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `Comparar fracciones, 20 de noviembre de 2026
Clase de apoyo de Matemáticas de 40 minutos. Alumna de 5.º de Primaria, 10 años.

Objetivo
Comparar dos fracciones con distintos denominadores y explicar la respuesta usando unidades del mismo tamaño.

Comprobación inicial
Pregunta: ¿qué es mayor, 1/4 o 3/4? Dibuja ambos en rectángulos iguales.
Si los cuartos no están claros, practica primero las partes iguales.

Materiales
Tiras de fracciones cortadas de hojas del mismo tamaño
Lápiz y papel cuadriculado
Cuatro ejercicios de comparación, con respuestas revisadas antes de la clase

Pasos y tiempos
Minutos\tActividad
0 a 5\tComprobar los cuartos y pedir una explicación.
5 a 12\tComparar 1/2 y 2/3 con tiras. Mantener iguales las unidades.
12 a 20\tMostrar la misma comparación con sextos en papel y resolver una juntas.
20 a 30\tLa alumna compara 1/3 con 1/2, 2/5 con 3/5, 3/5 con 2/3 y 3/4 con 5/6. Pedir dibujo o fracciones equivalentes.
30 a 36\tComentar una respuesta. Si cuesta, volver a las tiras y hacer menos ejercicios.
36 a 40\tHacer la pregunta final sin ayuda y anotar la explicación.

Ejemplo resuelto
¿Qué es mayor, 1/2 o 2/3?
1/2 = 3/6 y 2/3 = 4/6, por tanto 2/3 es mayor.
Los sextos deben referirse a unidades del mismo tamaño.
Respuestas de práctica, fracción mayor de cada pareja: 1/2, 3/5, 2/3, 5/6.

Comprobación de aprendizaje
Pregunta final: ¿qué es mayor, 2/3 o 3/4? Explícalo sin las tiras.
Respuesta docente: 2/3 = 8/12 y 3/4 = 9/12, por tanto 3/4 es mayor.
Escuchar si explica el tamaño de las partes, en lugar de elegir el denominador mayor.

Después de la clase
20 de noviembre: comparó medios y tercios con tiras sin ayuda.
En papel eligió 3/4 en la pregunta final, pero no supo explicar por qué.
Próxima sesión: empezar dibujando ambas fracciones como doceavos antes de nuevas comparaciones.
`;
const PROMPT = `Lee mi plan de Pinto Notes "Comparar fracciones, 20 de noviembre de 2026".
Usa las observaciones de Después de la clase para proponer otro plan de 40 minutos para el 27 de noviembre.
No cambies el plan ni las observaciones originales.
Empieza dibujando 2/3 y 3/4 como doceavos en rectángulos iguales.
Incluye objetivo, materiales, pasos con tiempos, ejemplo resuelto y pregunta final con respuesta docente.
El total debe ser 40 minutos. No inventes resultados de la alumna ni digas que el plan se ajusta al currículo.
Enséñame primero el borrador en el chat. Pregunta lo que falte antes de guardar una nota nueva.`;
const FAQ = [
 {q:"¿Qué debe incluir un plan de clase en Notas?",a:["Un objetivo observable, comprobación inicial, materiales, pasos con tiempos, ejemplo resuelto, pregunta final y observaciones posteriores."]},
 {q:"¿La tabla de tiempos hace un seguimiento automático?",a:["No. Los minutos son una guía escrita. Adapta el ritmo según la respuesta de la alumna y anota después lo que ocurrió."]},
 {q:"¿Sirve para entregar el plan al centro?",a:["Es una nota de trabajo para una clase de apoyo. Si el centro exige otro formulario, usa ese formulario para entregarlo."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-plan-de-clase-notas"
 intro={<>Copia este plan de clase en Notas de Apple para una sesión de 40 minutos. Coloca objetivo, materiales, actividades con tiempo, pregunta final y observaciones en una nota.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar el plan"},{href:"#preparar",label:"Prepararlo"},{href:"#clase",label:"Usarlo en clase"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Planear la siguiente"}]}>
 <p>El ejemplo propone una clase de apoyo de fracciones para una alumna de 5.º de Primaria. Sustituye el tema y revisa las respuestas antes de enseñar.</p>
 <div id="plantilla"><Keep title="Plan de clase para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Copia el texto. Convierte los materiales en lista y los tiempos en tabla." /></div>
 <PostCta slug="es/plantilla-plan-de-clase-notas" path="/es/blog/plantilla-plan-de-clase-notas" position="answer" ui={ui.cta} title="Prepara la siguiente clase"><p>Con ChatGPT o Claude conectado a Pinto, puedes usar tus observaciones para redactar un plan nuevo que después revisarás.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara el plan en Notas</h2>
 <p>Usa una nota de iCloud o guardada en el dispositivo. Pega primero el texto. Otras cuentas pueden carecer de estas funciones.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, convierte cada título de sección en Encabezamiento. Selecciona los tres materiales y usa el botón de lista de comprobación. Selecciona las siete líneas de Pasos y tiempos y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. Las tabulaciones separan las dos columnas. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>.</p>
 <p>En iPhone, pega el texto y aplica Encabezamiento. Crea una lista de comprobación para materiales y una tabla de dos columnas para minutos y actividad; después borra las líneas originales. Apple muestra estos iconos en la <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Notas</a>. Hay más diseños en <a href="/blog/apple-notes-templates" hrefLang="en">plantillas de Notas</a>.</p>
 <h2 id="clase">Usa el plan durante la sesión</h2>
 <p>El objetivo pide explicar la comparación, no solo acertarla. Si no reconoce los cuartos como partes iguales, dedica más tiempo al inicio y reduce los ejercicios. Los intervalos orientan, no obligan a seguir el plan al minuto.</p>
 <p>Guarda la respuesta docente fuera de la vista de la alumna. Haz la pregunta final sin ayuda. Después, anota lo que hizo y cuánta ayuda necesitó. Elegir 3/4 sin poder explicar por qué orienta la siguiente sesión. Conserva esa observación en la nota original y copia la plantilla para la próxima clase. Para apuntes del alumnado, consulta el <a href="/es/blog/metodo-cornell-notas-iphone">método Cornell</a>.</p>
 <h2 id="limites">Lo que no hace el plan</h2>
 <p>La tabla no imparte la clase ni mide el aprendizaje. Comprueba tú el contenido, escucha la respuesta y decide los cambios. Si el centro exige un formato de entrega, úsalo.</p>
 <h2 id="ia">Esboza la siguiente clase con ChatGPT o Claude</h2>
 <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> a Pinto y pulsar Allow, puede leer y editar tus notas. Pídele un nuevo plan basado en lo que observaste.</p>
 <Keep title="Pide un borrador de la siguiente clase" text={PROMPT} copyLabel={ui.copy} note="Comprueba las fracciones y los 40 minutos antes de guardar el plan." />
 <p>Resuelve cada ejercicio y suma los tiempos. El plan debe empezar por la explicación que faltó. Quita cualquier observación inventada. Pinto guarda las versiones anteriores si necesitas volver atrás. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus Notas de Apple</a> sin cambiarlas.</p>
 </LocalPostPage>; }
