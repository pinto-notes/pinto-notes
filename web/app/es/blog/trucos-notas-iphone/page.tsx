import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "trucos-notas-iphone");
// Versión de /blog/apple-notes-tips. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "trucos notas iphone" ofrece esa frase; "funciones notas iphone" también aparece.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apdf028f7034/mac
// (nota rápida), /apd93c815aa0/mac (listas), /apd1955d3b21/mac (formato), /apd58edc7964/mac
// (carpetas inteligentes), /not28c5f5468/mac (bloqueo), /apdb54e469b6/mac (fijar),
// /apdb5106e334/mac (audio); /guide/iphone/iph653f28965/ios (escaneo),
// /iphb8628c6b8/ios (búsqueda). Menús nuevos del Mac comprobados en el piloto español.
// Capturas inglesas, descritas en español.
const ui=UI.es;
const FAQ=[
 {q:"¿Qué se puede hacer con Notas?",a:["Listas, tablas, etiquetas, carpetas inteligentes, enlaces, cálculos, escaneos, grabaciones transcritas y notas bloqueadas, además de texto. iCloud las sincroniza entre iPhone y Mac."]},
 {q:"¿Cómo abro una nota rápida en Mac?",a:["Mantén Fn o la tecla del globo y pulsa Q. También puedes usar la esquina inferior derecha. Se guarda en la carpeta Notas rápidas."]},
 {q:"¿Busca dentro de un escaneo?",a:["Sí. Encuentra texto de documentos escaneados, escritura a mano en idiomas compatibles y objetos de fotos. Para un PDF adjunto, busca dentro de la nota e incluye adjuntos."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="trucos-notas-iphone"
 intro={<>Notas parece una app para escribir texto, pero también guarda escaneos, grabaciones, listas, tablas y enlaces. Estos quince usos te ayudan a aprovecharla sin montar un sistema nuevo.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#capturar",label:"Capturar"},{href:"#ordenar",label:"Dar forma"},{href:"#encontrar",label:"Encontrar"},{href:"#ideas",label:"Ideas"}]}>
  <p>Los cambios más útiles: abre una nota rápida con Fn y Q en Mac, fija lo que consultas a diario, deja que lo marcado baje al final, duplica una nota como plantilla y reúne las listas pendientes en una carpeta inteligente.</p>
  <PostCta slug="es/trucos-notas-iphone" path="/es/blog/trucos-notas-iphone" position="answer" ui={ui.cta} title="¿Quieres usar ChatGPT o Claude con tus notas?"><p>Pinto Notes mantiene carpetas, listas y tablas; tu IA puede leer y editar notas tras conectarse, y las versiones anteriores quedan guardadas.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/macos27/notes27-smart-folder-open-todos" width={2000} height={900} maxWidth={700} alt="Nota en un Mac, en inglés, con encabezado, lista, etiqueta, tabla, enlace e imagen." caption="Una nota combina varios de estos recursos. La captura está en inglés." />} faq={FAQ}>
 <p>Las listas, los encabezados plegables y las notas fijadas funcionan con iCloud o notas locales. Algunas funciones faltan en Gmail y otras cuentas de correo.</p>
 <h2 id="capturar">Guarda ideas al momento</h2>
 <h3>1. Abre una nota rápida</h3><p>En Mac, mantén Fn o la tecla del globo y pulsa Q. También sirve la esquina inferior derecha. Desde Safari puedes compartir una página a una nota rápida. Se guardan en Notas rápidas. En los ajustes de Notas puedes elegir si se retoma la última.</p>
 <h3>2. Escanea papel</h3><p>En iPhone, abre una nota, toca el botón Adjuntos y escanea un documento. Se guarda como PDF. Si solo necesitas unas líneas, escanea texto e insértalo como texto editable.</p>
 <h3>3. Graba y transcribe</h3><p>En Mac, desde el botón de archivos adjuntos inicia una grabación en la nota. Puedes ver la transcripción y añadirla a la nota. En un Mac con M1 o posterior y un idioma compatible, Apple Intelligence también puede resumirla; la disponibilidad depende del idioma y la región.</p>
 <h3>4. Pega Markdown con formato</h3><p>En macOS 27, Edición, Pegar en formato Markdown convierte # en encabezados y las casillas de texto en una lista real. Un pegado normal deja los símbolos visibles. En Latinoamérica, el nombre puede ser Pegar como Markdown.</p>
 <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640} alt="El mismo texto Markdown pegado de dos maneras en Notas para Mac, en inglés." caption="Pegar como texto deja los símbolos; pegar como Markdown aplica el formato." />
 <h3>5. Duplica notas como plantillas</h3><p>Guarda una nota modelo para reuniones o viajes y usa Archivo, Duplicar nota para crear una copia. <a href="/blog/apple-notes-templates" hrefLang="en">Hay más plantillas aquí</a>.</p>
 <Capture src="/blog/macos27/notes-file-duplicate-note" width={554} height={296} maxWidth={277} alt="Menú Archivo de Notas en Mac, en inglés, con la opción Duplicate Note." caption="Duplicar nota crea una copia de tu modelo." />
 <h2 id="ordenar">Da forma a las notas</h2>
 <h3>6. Ordena las listas</h3><p>Selecciona líneas y toca Lista de comprobación. Activa Ordenar automáticamente los ítems marcados en los ajustes de Notas para que lo hecho baje. En iPhone, busca la misma preferencia bajo Ajustes (Configuración en Latinoamérica), Apps, Notas. Para empezar de nuevo en Mac, Formato, Más, Anular todo.</p>
 <h3>7. Pliega encabezados</h3><p>Selecciona una línea y usa Formato para convertirla en encabezado o subencabezado. El botón junto al encabezado oculta o muestra lo que hay debajo.</p>
 <h3>8. Resalta texto</h3><p>Selecciona el texto, abre Formato y toca Resaltar. El círculo de color junto al botón permite elegir otro tono.</p>
 <h3>9. Usa tablas</h3><p>Formato, Tabla crea una tabla. La tecla tabulador en la última celda añade una fila. También puedes seleccionar líneas separadas por tabulaciones y convertirlas. Las tablas no ordenan ni suman. <a href="/blog/apple-notes-tables" hrefLang="en">Consulta la guía de tablas</a>.</p>
 <h3>10. Calcula en una nota</h3><p>Escribe una operación con = para obtener el resultado. También puedes dar nombre a una cifra y usar ese nombre después. En Mac, Formato, Resultados matemáticos controla si las respuestas se insertan, se sugieren o se desactivan.</p>
 <PostFigure src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={320} alt="Ejemplo de Apple, en inglés, con gastos nombrados y una suma final en Notas del iPhone." caption="Puedes sumar cantidades que ya nombraste. Imagen: Apple." />
 <h2 id="encontrar">Vuelve a encontrar lo que guardaste</h2>
 <h3>11. Fija las notas habituales</h3><p>En Mac, usa Archivo, Fijar nota. En iPhone, mantén pulsada la nota y fíjala desde el menú. La nota queda arriba de su carpeta.</p>
 <h3>12. Enlaza notas</h3><p>Selecciona texto y usa Edición, Añadir enlace. En macOS 27 puedes enlazar un encabezado concreto de otra nota. Un índice enlazado facilita recorrer recetas o proyectos.</p>
 <PostFigure src="/blog/macos27/notes27-link-to-section" width={980} height={710} maxWidth={490} alt="Ventana para añadir un enlace en Notas para Mac, en inglés, con secciones de otra nota." caption="El enlace puede llevar a un encabezado de otra nota." />
 <h3>13. Reúne pendientes con etiquetas</h3><p>Escribe #trabajo o #recetas en las notas. Desde Archivo puedes crear una carpeta inteligente que reúna las listas de comprobación con elementos sin marcar. Borrar esa carpeta no borra las notas.</p>
 <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={640} alt="Ajustes de una carpeta inteligente en Mac, en inglés, con una condición de listas pendientes." caption="Una carpeta inteligente reúne notas de varias carpetas." />
 <h3>14. Busca dentro de escaneos y PDF</h3><p>La búsqueda encuentra texto escrito o a mano, texto escaneado y objetos de fotos. Dentro de una nota, abre la búsqueda de la nota e incluye los adjuntos para buscar en PDF. De una nota bloqueada solo muestra el título. Algunas notas con etiquetas, audio o PDF no se pueden bloquear: <a href="/es/blog/bloquear-carpeta-notas-iphone">consulta las reglas</a>.</p>
 <h2 id="ideas">Ideas para usar Notas</h2>
 <p>Una receta por nota con ingredientes marcables y un índice de enlaces; <a href="/es/blog/plantilla-recetas-notas-iphone">plantilla de recetas</a>. Una lista de equipaje que reinicias antes de viajar. Una <a href="/es/blog/lista-de-la-compra-notas-iphone">lista de la compra</a> que baja lo marcado. Un <a href="/es/blog/plantilla-presupuesto-mensual-notas-iphone">presupuesto mensual</a> con sumas. Apuntes de clase o reunión con transcripción y escaneos. Una <a href="/es/blog/lista-de-libros-leidos-notas-iphone">lista de lectura</a> en tabla. Recibos y garantías escaneados que encuentras con la búsqueda.</p>
 <h2 id="pinto">15. Trabaja con tu IA en las notas</h2>
 <Figure shot={SHOTS.aiEdit} caption="ChatGPT añadió elementos a una lista en Pinto Notes para Mac; se pueden deshacer." />
 <p>Notas de Apple no permite que ChatGPT o Claude lean y editen toda tu biblioteca desde el teléfono o la web, ni guarda historial de versiones. Pinto Notes funciona en iPhone y Mac con carpetas, listas, tablas, Markdown cifrado y plantillas. Al conectar ChatGPT o Claude, pueden leer y editar notas; los cambios se marcan y se pueden deshacer. Importa Notas de Apple, Obsidian, Evernote, Keep, Bear o archivos Markdown en un Mac. No funciona en Windows ni Android.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas y carpetas inteligentes</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
