import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-podcast-notas");
// Spanish version of /blog/apple-notes-podcast-planner-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla podcast" returned that phrase and
// "plantilla guion podcast", "plantilla escaleta podcast" plus app queries. No volume inferred.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `El banco de reparaciones 12: Primera visita a un café de reparación

Fase: Preparación
Siguiente acción: Bea enviará las preguntas a Mina y confirmará el permiso para grabar y publicar.
Grabación: 24 de noviembre de 2026, 10:00, hora de Madrid
Duración prevista: 18 minutos

Promesa a quien escucha
Ayudar a quien va por primera vez a decidir qué llevar y qué esperar en un café de reparación.

Invitada y contexto
Mina Pérez, coordinadora voluntaria del café de reparación ficticio de la calle Olmo, Madrid.
Pronunciación del nombre: confirmar antes de grabar.
Permiso para grabar y publicar: pendiente de confirmación.
Información de Mina, 20 de noviembre: se reserva una cita y se lleva un objeto.
Enlace público de reservas: pedirlo a Mina y comprobarlo antes de publicar.

Frase de entrada
Tienes una chaqueta rota y una cita en el café de reparación. ¿Qué pasa al entrar?

Escaleta, minutos aproximados
1 minuto: apertura y presentación de la invitada.
4 minutos: reservar cita y elegir qué llevar.
6 minutos: seguir una chaqueta rota durante la visita, con una historia de Mina.
5 minutos: qué pasa si el voluntariado no puede terminar la reparación.
2 minutos: resumen y una cosa que hacer antes de la primera visita.

Preguntas a la invitada
¿Qué debe indicar una persona al reservar?
¿Qué pasa entre llegar con una chaqueta rota y sentarse con alguien del equipo?
¿Puedes contar una visita en la que no se terminó la reparación ese día?
¿Qué debería consultar alguien con su café local antes de ir?

Antes de grabar
Confirmar nombre, cargo y permiso de Mina para grabar y publicar.
Enviar la escaleta y preguntar si hay temas que prefiera evitar.
Grabar una prueba breve en la app de audio y escucharla.

Borrador de notas del episodio, revisar tras la edición
Título provisional: Primera visita a un café de reparación, con Mina Pérez.
Descripción: Conversación sobre cómo reservar una visita y llevar un objeto para reparar.
Crédito: Mina Pérez, coordinadora voluntaria, café de reparación de la calle Olmo.
Enlaces pendientes: página de reservas y guía de visitantes, ya comprobadas.
Marcas de capítulos: añadir desde el audio final editado, si se usan.

Lista de publicación
Escuchar entero el audio editado en la app de audio.
Comprobar crédito, permisos y palabras citadas.
Revisar la descripción y todos los enlaces públicos.
Subir audio y notas finales al servicio donde se aloja el pódcast.
Comprobar el episodio publicado y anotar aquí su enlace.
`;
const PIPELINE = `El banco de reparaciones, episodios en curso

Episodio\tFase y siguiente acción
11: Arreglar una mochila\tEdición. Álex quitará la introducción repetida.
12: Primera visita a un café de reparación\tPreparación. Bea enviará preguntas a Mina y confirmará el permiso.
13: Cuidar herramientas prestadas\tIdea. Rocío buscará a alguien de una biblioteca de herramientas.
`;
const PROMPT = `Lee mi nota de Pinto Notes "El banco de reparaciones 12: Primera visita a un café de reparación".
Usa solo Invitada y contexto para proponer dos preguntas de seguimiento útiles para quien va por primera vez.
Muéstralas antes en el chat. Pregúntame lo que falte; no inventes historias de la invitada ni normas de reserva.
Cuando apruebe la redacción, añádelas bajo Preguntas a la invitada.
No cambies los tiempos ni el estado del permiso. Deja sin marcar la lista de publicación.`;
const FAQ = [
 {q:"¿Qué debe incluir un plan de pódcast en Notas?",a:["Fase y siguiente acción, promesa para oyentes, datos de la persona invitada, escaleta con tiempos, preguntas, preparativos, borrador de notas y lista de publicación. Usa otra tabla breve para los demás episodios."]},
 {q:"¿Necesito escribir cada palabra?",a:["Para esta entrevista, bastan la entrada, preguntas y tiempo por bloque. Deja margen para repreguntar. Un episodio guionizado puede necesitar un texto completo aparte."]},
 {q:"¿Valen los tiempos previstos como marcas de capítulos?",a:["No. Fija los capítulos a partir del audio editado. Respuestas, pausas y cortes cambian el inicio de cada tema."]},
 {q:"¿Marcar la lista publica el episodio?",a:["No. Sube audio y notas desde tu servicio de alojamiento y comprueba el episodio público antes de marcar la última tarea."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-podcast-notas"
 intro={<>Copia esta plantilla para planear un pódcast en Notas de Apple. Usa una nota por episodio con escaleta, preguntas, borrador de descripción y lista de publicación.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar el plan"},{href:"#preparar",label:"Preparar la nota"},{href:"#episodios",label:"Seguir los episodios"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Preparar preguntas"}]}>
 <p>Una nota por episodio, con fase y próxima acción al principio. El ejemplo ficticio prepara una entrevista de 18 minutos.</p>
 <div id="plantilla"><Keep title="Plan de episodio para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Pega el texto. Convierte las secciones en encabezamientos y las comprobaciones en listas." /></div>
 <PostCta slug="es/plantilla-podcast-notas" path="/es/blog/plantilla-podcast-notas" position="answer" ui={ui.cta} title="Prepara preguntas para la invitada"><p>En Pinto, ChatGPT o Claude puede leer el plan y proponer preguntas a partir del contexto que tú aportes.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara la nota en Mac o iPhone</h2>
 <p>Usa iCloud o una nota del dispositivo. Algunas funciones no están disponibles con otras cuentas. Pega el texto antes de darle formato.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, aplica Encabezamiento a las secciones. Convierte las tres líneas de Antes de grabar y las cinco de Lista de publicación en listas de comprobación. En iPhone, crea las listas con el icono correspondiente, introduce una tarea por línea y borra después el texto original. Apple enseña estos controles en su <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Notas</a>.</p>
 <h2 id="episodios">Mantén una tabla pequeña de episodios</h2>
 <p>Guarda otra nota para los episodios en marcha. Da a cada uno una fase, una próxima acción y una persona responsable. Cambia el texto al pasar de Idea a Preparación, Grabado, Edición o Publicado.</p>
 <Keep title="Episodios en curso" text={PIPELINE} copyLabel={ui.copy} note="Cada fila tiene una tabulación entre episodio y estado. Guarda la escaleta detallada en la nota de cada episodio." />
 <p>En Mac, selecciona las cuatro líneas de la tabla y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. En iPhone, inserta una tabla de dos columnas y pasa las filas. Consulta <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>. Borra las líneas originales. Conserva una copia limpia del plan; consulta <a href="/blog/apple-notes-templates" hrefLang="en">cómo reutilizar plantillas</a>.</p>
 <h2>Graba con la escaleta y revisa las notas</h2>
 <p>Confirma nombre y permiso antes de grabar. Comprueba que las preguntas ayudan a quien escucha. Los bloques suman 18 minutos, pero dejan margen para repreguntar. Después, anota los cortes para la edición. Revisa la descripción según el audio final, elimina temas que no salgan y añade los enlaces comprobados. Calcula los capítulos con el audio editado.</p>
 <h2 id="limites">Lo que no hace este plan</h2>
 <p>Tú actualizas la fase. La lista no comprueba el audio ni conecta la app de grabación con el alojamiento del pódcast. Guarda audio y montaje en tu proceso habitual; anota su ubicación y el enlace público final en la nota.</p>
 <h2 id="ia">Prepara preguntas con ChatGPT o Claude</h2>
 <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> a Pinto y pulsar Allow, puede leer y editar. Pide primero sugerencias en el chat.</p>
 <Keep title="Pide dos preguntas de seguimiento" text={PROMPT} copyLabel={ui.copy} note="Guarda primero el plan y sustituye el contexto por datos que hayas comprobado." />
 <p>Comprueba cada sugerencia con la información de Mina. La reserva de cita y el límite de un objeto constan en el ejemplo; un precio o una reparación garantizada serían inventados. Revisa que el permiso siga pendiente y la lista de publicación sin marcar. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> sin modificarlas.</p>
 </LocalPostPage>; }
