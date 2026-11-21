import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-retrospectiva-notas");
// Spanish version of /blog/apple-notes-retrospective-template, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "plantilla retrospectiva" returned "plantilla retrospectiva scrum",
// "plantilla retrospectiva" and "plantilla retrospectiva miro". No volume inferred.
// Apple es-es read 21 Nov 2026: /guide/notes/apd1955d3b21/mac,
// /guide/notes/apd0a136b9cc/mac, /guide/notes/apd93c815aa0/mac,
// /guide/iphone/iph1ac0b3a2/ios. iPhone icon controls described.
const ui = UI.es;
const TEMPLATE = `Retrospectiva de la actualización de ayuda de noviembre

Fechas del proyecto: del 9 al 20 de noviembre de 2026
Fecha de revisión: 23 de noviembre de 2026
Participantes: Sara, redactora; Jon, diseñador

Resultados previstos y observados
Plan\tResultado y fuente
Publicar 8 páginas de ayuda revisadas antes del 20 de noviembre\t8 páginas publicadas el 20 de noviembre. Fuente: lista de publicación.
Una revisión por página\t3 de 8 páginas necesitaron una segunda revisión. Fuente: registro de revisiones.

Qué salió bien
Sara probó cada instrucción antes de enviar el borrador a Jon.
La lista de publicación asignaba una persona a cada página.

Qué no salió bien
Dos capturas mostraban la navegación antigua en la primera revisión.
La página de ajustes de cuenta cambió de alcance después de que Sara la redactara.

Causas aún inciertas
Pensamos que acordar el esquema antes podría reducir las segundas revisiones.
El registro no explica por qué cada página necesitó otra revisión.

Qué repetiremos
Probar las instrucciones antes de revisarlas y asignar la comprobación de cada publicación.

Próximo experimento
Acordar los esquemas antes de redactar la actualización de diciembre.
Responsable: Jon
Referencia: 3 de 8 páginas necesitaron otra revisión en noviembre.
Comprobación: no más de 1 de 6 páginas de diciembre necesita otra revisión.
Fecha de revisión: 7 de diciembre de 2026

Acciones
Jon: acordar los seis esquemas con Sara antes del 25 de noviembre de 2026.
Sara: anotar cantidades y motivos de segundas revisiones antes del 4 de diciembre de 2026.

Resultado de la revisión
Pendiente. El 7 de diciembre, comparar el registro con la comprobación anterior.
`;
const PROMPT = `Lee mi nota de Pinto Notes "Retrospectiva de la actualización de ayuda de noviembre".
Sugiere un experimento alternativo a partir de Qué no salió bien.
Separa observaciones y causas posibles. No afirmes que la nota demuestra una causa.
Muestra en el chat el cambio propuesto y cómo medirlo.
Si lo elijo, pregúntame por responsable y fecha de revisión. No los inventes.
Cuando te dé esos datos, sustituye Próximo experimento y Acciones en la nota.
Conserva resultados, observaciones y referencia originales.`;
const FAQ = [
 {q:"¿Qué lleva una retrospectiva en Notas?",a:["Resultados previstos y reales, hechos que salieron bien o mal, causas inciertas y una acción comprobable con responsable y fecha."]},
 {q:"¿Cómo evito confundir una causa posible con un hecho?",a:["Separa observaciones y causas. Anota la fuente de cada resultado y deja las explicaciones no comprobadas bajo su propio título."]},
 {q:"¿La lista asigna tareas y envía avisos?",a:["No. Los nombres y plazos son texto. Confirma cada acción con su responsable y añade el recordatorio a tu calendario si lo necesitas."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="plantilla-retrospectiva-notas"
 intro={<>Copia esta plantilla de retrospectiva en Notas de Apple para un proyecto o sprint terminado. Compara lo previsto con lo ocurrido y acuerda una acción que revisarás después.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"Copiar la plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#revisar",label:"Hacer la revisión"},{href:"#limites",label:"Sus límites"},{href:"#ia",label:"Probar otro cambio"}]}>
 <p>Usa una tabla para resultados, secciones para observaciones y una lista para acciones. El ejemplo propone un cambio medible con responsable y fecha.</p>
 <div id="plantilla"><Keep title="Retrospectiva para Notas" text={TEMPLATE} copyLabel={ui.copy} note="Ejemplo ficticio. Cambia fuentes y resultados por los de tu proyecto." /></div>
 <PostCta slug="es/plantilla-retrospectiva-notas" path="/es/blog/plantilla-retrospectiva-notas" position="answer" ui={ui.cta} title="Prepara otro experimento"><p>En Pinto, ChatGPT o Claude puede leer la retrospectiva y guardar el cambio que elijas después de revisarlo.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="preparar">Prepara la nota en Notas de Apple</h2>
 <p>Usa iCloud o una nota del dispositivo. Algunas funciones pueden faltar en otras cuentas. Pega el texto y dale formato después.</p>
 <MenuPaths rows={[{on:"Mac",steps:["Botón de formato","Encabezamiento"]},{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En Mac, aplica Encabezamiento a las secciones. Selecciona las tres líneas de resultados y usa el botón de tabla o <a href="https://support.apple.com/es-es/guide/notes/apd0a136b9cc/mac">Formato &gt; Tabla</a>. Selecciona las dos acciones y conviértelas en lista de comprobación. Hay más detalles en <a href="/blog/apple-notes-tables" hrefLang="en">las tablas en Notas</a>. En iPhone, inserta una tabla de dos columnas y crea la lista con sus iconos. Borra las líneas originales tras pasarlas. La <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">guía de Apple</a> muestra esos controles.</p>
 <h2 id="revisar">Revisa un proyecto terminado</h2>
 <p>Compara primero resultado y plan. Las ocho páginas salieron a tiempo, pero tres necesitaron otra revisión. Indica de dónde sale cada dato. Deja que cada persona anote hechos concretos antes de discutirlos. Si trabajaste a solas, usa las mismas secciones con tu nombre.</p>
 <p>El cambio de alcance podría explicar trabajo extra, pero este registro no lo demuestra. Por eso Sara anotará los motivos de futuras revisiones. Para reuniones habituales, usa una <a href="/es/blog/plantilla-acta-de-reunion-notas">plantilla de acta</a>.</p>
 <h2>Elige un cambio y comprueba el resultado</h2>
 <p>Jon propone acordar esquemas antes de redactar. Sara registra segundas revisiones. Confirma con ambos su responsabilidad. El 7 de diciembre, anota la cifra real aunque el cambio no ayude. Una mejora en otro grupo de páginas tampoco prueba por sí sola la causa. Decide después si repetir el cambio o probar otro.</p>
 <h2 id="limites">Lo que no hace la retrospectiva</h2>
 <p>No asigna tareas ni manda avisos. Tampoco ofrece votación anónima ni demuestra por qué hubo retrasos. Conserva las explicaciones inciertas y pon la fecha en el calendario si necesitas un aviso.</p>
 <h2 id="ia">Propón un experimento con ChatGPT o Claude</h2>
 <p>Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> a Pinto y pulsar Allow, puede leer y editar tus notas. Pídele un cambio basado en lo que quedó registrado.</p>
 <Keep title="Pide un experimento alternativo" text={PROMPT} copyLabel={ui.copy} note="Comprueba las fuentes, decide tú el responsable y la fecha y revisa la nota editada." />
 <p>Conserva el resultado original y la cifra de referencia. La IA ayuda a redactar; el equipo tiene que hacer la prueba y comprobar el resultado. Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> sin alterarlas.</p>
 </LocalPostPage>; }
