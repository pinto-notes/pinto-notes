import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-estudio-biblico-notas");
// Spanish version of /blog/apple-notes-bible-study-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla estudio biblico" returned ["plantilla estudio biblico"];
// "estudio biblico plantilla" returned ["estudio biblico plantilla"]. No volume inferred.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac (Encabezamiento),
// /guide/notes/apd0a136b9cc/mac (Formato > Tabla), /guide/notes/apd93c815aa0/mac
// (lista de comprobación), /guide/iphone/iph1ac0b3a2/ios and /102296 (iPhone icons).
// iPhone icon buttons are described, not given invented names. Santiago 1:22 quotes the
// public-domain Reina-Valera 1909: https://ebible.org/spaRV1909/JAS01.htm (read 21 Nov 2026);
// license: https://ebible.org/spaRV1909/copyright.htm.
const ui = UI.es;
const TEMPLATE = `Estudio bíblico: Santiago 1:19-25, 21 de noviembre de 2026

Pasaje
Santiago 1:19-25
Traducción: Reina-Valera 1909
Fragmento, Santiago 1:22: "Mas sed hacedores de la palabra, y no tan solamente oidores, engañándoos á vosotros mismos."

Observaciones
El versículo 19 habla de escuchar antes de hablar y advierte sobre la ira.
Los versículos 23-24 comparan a quien escucha y olvida con alguien que se mira en un espejo y olvida lo que vio.

Preguntas
¿Cómo relaciona el ejemplo del espejo la escucha con la acción?
¿A qué se refiere la continuidad del versículo 25?

Referencias cruzadas
Referencia\tRelación que quiero examinar
Lucas 6:46-49\tComparar escuchar y actuar con Santiago 1:22.
Proverbios 15:1\tComparar las palabras y la ira con Santiago 1:19.

Aplicación
Esta noche, dejar que Lucía termine de hablar durante la cena antes de responder.
Mañana, anotar un momento en que escuché o interrumpí.

Oración
Dios, ayúdame a escuchar con paciencia y a poner en práctica lo que aprendo. Amén.
`;
const PROMPT = `Lee mi nota de Pinto Notes "Estudio bíblico: Santiago 1:19-25, 21 de noviembre de 2026".
Busca en mis otros estudios preguntas anteriores sobre escuchar, hablar o actuar conforme a lo oído.
Cita exactamente en el chat las preguntas relacionadas, con el título y la fecha de cada nota.
Si no encuentras ninguna, dilo. No inventes notas ni respuestas. No cambies mis notas mientras reviso los resultados.
Cuando elija una pregunta, añade solo esa pregunta y su fuente bajo Preguntas en la nota de Santiago.
Conserva el pasaje, las observaciones, la aplicación y la oración.
Si sugieres una interpretación, márcala en el chat como "Interpretación sugerida para comprobar" y sepárala del pasaje.`;
const FAQ = [
 {q:"¿Qué debe incluir una plantilla de estudio bíblico?",a:["Anota el pasaje y la traducción. Separa observaciones, preguntas, referencias cruzadas, aplicación y oración. Identifica cualquier fragmento copiado para distinguirlo de tus palabras."]},
 {q:"¿Puedo guardar las referencias cruzadas en una tabla?",a:["Sí. Usa una columna para la referencia y otra para la relación que quieres examinar. Lee cada pasaje en su contexto antes de sacar conclusiones."]},
 {q:"¿Para qué sirve la lista de comprobación?",a:["Para acciones concretas, como volver a leer un pasaje o investigar una pregunta. Una marca indica que hiciste la acción; no mide tu comprensión ni tu fe."]},
 {q:"¿Puedo reutilizar esta nota?",a:["Sí. Duplica la nota en el Mac o copia el diseño en una nota nueva del iPhone. Cambia pasaje, fecha, fragmento y respuestas. Conserva el estudio anterior."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-estudio-biblico-notas"
 intro={<>Copia esta plantilla de estudio bíblico en Notas de Apple, con una nota por pasaje. Incluye observaciones, preguntas, referencias cruzadas, aplicación y oración. El ejemplo trabaja Santiago 1:19-25.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar la plantilla"},{href:"#preparar",label:"Preparar la nota"},{href:"#estudiar",label:"Estudiar el pasaje"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Buscar preguntas anteriores"}]}>
 <p>Escribe la referencia y la traducción encima de tus apuntes. El ejemplo funciona como texto. Puedes convertir las referencias en una tabla y las acciones en una lista de comprobación.</p>
 <div id="plantilla"><Keep title="Plantilla de estudio bíblico para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Cópiala en una nota nueva y sustituye el ejemplo por tu pasaje y tus respuestas. El fragmento procede de la Reina-Valera 1909, de dominio público." /></div>
 <PostCta slug="es/plantilla-estudio-biblico-notas" path="/es/blog/plantilla-estudio-biblico-notas" position="answer" ui={ui.cta} title="Busca preguntas de estudios anteriores"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Al conectar ChatGPT o Claude, puedes pedirle que busque preguntas en tus estudios anteriores.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara la nota en Notas de Apple</h2>
 <p>Usa una nota de iCloud o guardada en el dispositivo. Algunas funciones no están disponibles con otros proveedores de correo. Pega primero el texto.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, pon el cursor en cada nombre de sección, usa el botón de formato y elige Encabezamiento. Selecciona las dos acciones bajo Aplicación y usa el botón de lista de comprobación. Selecciona las tres líneas de Referencias cruzadas y usa el botón de tabla, o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a> para empezar con una tabla vacía. El tabulador de la última celda añade una fila. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a> para más opciones.</p>
 <p>En iPhone, crea una nota, pega el texto y aplica Encabezamiento a cada sección. En el lugar de Aplicación, usa el icono de lista de comprobación y escribe cada acción. En Referencias cruzadas, inserta una tabla de dos columnas y pasa los datos. Borra las líneas originales después. Apple muestra los controles en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Notas para iPhone</a>.</p>
 <h2 id="estudiar">Usa la plantilla con otro pasaje</h2>
 <p>Lee el pasaje completo. Sustituye la referencia y anota tu traducción. Si copias un fragmento, añade versículo y fuente. El ejemplo cita <a href="https://ebible.org/spaRV1909/JAS01.htm">Santiago 1:22 de la Reina-Valera 1909</a>, una edición de <a href="https://ebible.org/spaRV1909/copyright.htm">dominio público</a>.</p>
 <p>Anota observaciones que puedas relacionar con el texto. Deja las dudas bajo Preguntas. Si propones una interpretación, identifícala como tu lectura e indica el versículo. Lee el contexto de cada referencia cruzada y apunta el título y la página de cualquier comentario que consultes.</p>
 <p>Escribe una acción propia, márcala cuando la hagas y añade después una nota fechada. En el Mac, duplica la nota para el siguiente estudio; en iPhone, copia el diseño en una nota nueva. Hay más diseños en <a href="/blog/apple-notes-templates" hrefLang="en">las plantillas de Notas</a>.</p>
 <h2 id="limites">Lo que no hace la plantilla</h2>
 <p>No busca versículos ni verifica citas. Comprueba cada referencia en tu Biblia y deja abiertas las preguntas que requieren más contexto.</p>
 <h2 id="ia">Busca preguntas anteriores con ChatGPT o Claude</h2>
 <p>Pinto admite encabezamientos, listas y tablas. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y pulsar Allow, podrá leer y editar tus notas. Pídele que busque preguntas que ya escribiste.</p>
 <Keep title="Pide a tu IA que busque preguntas" text={PROMPT} copyLabel={ui.copy} note="Sustituye el título y el tema. La petición necesita estudios anteriores para encontrar coincidencias." />
 <p>Comprueba cada resultado en la nota de origen, con su fecha y palabras exactas. Si no hay preguntas anteriores, no añadas ninguna. Revisa que la edición no cambie tus respuestas ni el pasaje. La <a href="/blog/move-from-apple-notes" hrefLang="en">importación desde Notas de Apple</a> se hace en el Mac y deja los originales intactos.</p>
 </LocalPostPage>; }
