import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Checklist, Paths, PostFigure, Steps } from "@/lib/PostParts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "evernote-a-notas-apple");
// Versión de /blog/evernote-to-apple-notes. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "evernote a apple notes" ofrece "evernote import apple notes" y "evernote to apple notes migration";
// "pasar notas de evernote a notas de apple" no ofrece sugerencias. Apple, leído el 21 Nov 2026: support.apple.com/es-es/102223 y
// /guide/notes/not201900c07/mac (Archivo > Importar a Notas, Notas importadas, etiquetas ENEX).
// Los pasos de exportación de Evernote son los del artículo inglés. La captura está en inglés.
const ui=UI.es;
const FAQ=[
 {q:"¿Notas puede importar archivos de Evernote?",a:["Sí, en un Mac. Importa archivos ENEX con Archivo, Importar a Notas. Cada apunte pasa a ser una nota y, desde macOS 13, las etiquetas también se pueden importar."]},
 {q:"¿Cómo llegan al iPhone?",a:["Importa en una carpeta de iCloud desde el Mac. Las notas de esa cuenta se sincronizan con el iPhone que usa la misma Cuenta de Apple. Apple no describe una importación ENEX directa en el iPhone."]},
 {q:"¿Puedo exportar desde la web o el teléfono?",a:["Evernote indica que la exportación se hace en su app de escritorio para Mac o Windows. Puedes exportar un cuaderno entero o hasta 100 notas seleccionadas cada vez."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="evernote-a-notas-apple"
 intro={<>Notas de Apple puede leer las exportaciones ENEX de Evernote en un Mac. Necesitas exportar cada cuaderno, importar los archivos y revisar el resultado antes de cerrar Evernote.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#exportar",label:"Exportar"},{href:"#importar",label:"Importar"},{href:"#revisar",label:"Qué se conserva"},{href:"#elegir",label:"Qué app elegir"}]}>
  <p>En Evernote para Mac o Windows, haz clic con el botón derecho en un cuaderno y expórtalo como ENEX. En Notas para Mac, selecciona una carpeta de iCloud y usa Archivo, Importar a Notas. Las notas aparecen en Notas importadas y llegan al iPhone cuando iCloud sincroniza.</p>
  <PostCta slug="es/evernote-a-notas-apple" path="/es/blog/evernote-a-notas-apple" position="answer" ui={ui.cta} title="Importa Evernote con sus cuadernos"><p>Pinto Notes lee los mismos archivos ENEX en un Mac, convierte cada cuaderno en una carpeta y permite conectar ChatGPT o Claude.</p></PostCta>
 </Answer>} faq={FAQ}>
 <h2 id="antes">Antes de empezar</h2><p>Necesitas un Mac con Notas y la app de Evernote para Mac o Windows. Una cuenta gratuita de Evernote puede exportar. Apple admite la importación en una cuenta iCloud actualizada o en la cuenta local del Mac. Escoge iCloud si quieres ver las notas en el iPhone.</p>
 <h2 id="exportar">1. Exporta cada cuaderno de Evernote</h2>
 <Steps><li>Abre Evernote en tu Mac o PC y selecciona un cuaderno. También puedes seleccionar hasta 100 notas.</li><li>Haz clic con el botón derecho, elige la opción de exportar y selecciona ENEX.</li><li>Conserva atributos como etiquetas y fecha de creación. Exporta el archivo y repite con los otros cuadernos.</li></Steps>
 <p>Evernote guarda el ENEX en el escritorio y permite dividir archivos grandes, con un tamaño máximo entre 300 MB y 2 GB. Si exportaste en Windows, copia los ENEX al Mac.</p>
 <h2 id="importar">2. Impórtalos en Notas en un Mac</h2>
 <Paths rows={[{on:"Mac",steps:["Archivo","Importar a Notas"]}]} />
 <Steps><li>Abre Notas y selecciona una carpeta bajo iCloud o En mi Mac.</li><li>Elige Archivo, Importar a Notas. Selecciona un ENEX y confirma la importación.</li><li>Las notas llegan a Notas importadas. Renombra esa carpeta con el nombre del cuaderno y continúa con el siguiente.</li></Steps>
 <p>Apple no indica si varios ENEX seleccionados juntos conservan cada cuaderno por separado. Por eso conviene importarlos de uno en uno. La opción de conservar la estructura de carpetas se refiere a carpetas de archivos, no a varios ENEX.</p>
 <h2 id="revisar">Qué se conserva y qué debes comprobar</h2>
 <p>Cada nota del ENEX se convierte en una nota de Apple. Desde macOS 13, Notas también puede importar sus etiquetas. Apple advierte que los adjuntos o funciones que no admita pueden quedar fuera, sin enumerarlos.</p>
 <Checklist title="Antes de dejar Evernote" items={["Importa primero un cuaderno pequeño","Comprueba listas, tablas y archivos adjuntos","Revisa las etiquetas y cuenta las notas","Conserva Evernote hasta terminar la comprobación"]} />
 <p>En Notas, puedes escribir #palabra para crear una etiqueta y reunirla con una carpeta inteligente.</p>
 <h2 id="elegir">¿Conviene cambiar?</h2>
 <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785} alt="Evernote en un Mac, en inglés, con su asistente de IA moviendo una nota de cuaderno." caption="El asistente de Evernote puede mover notas. Imagen: Evernote." />
 <p>Evernote funciona también en Windows, Android y web, tiene recortador, escaneo, búsqueda avanzada, tareas y funciones propias de IA, incluida una conexión MCP. Su plan Gratis se limita a 50 notas, un cuaderno y un dispositivo. Notas ya viene en iPhone y Mac, sincroniza con iCloud y ofrece búsqueda, transcripción y resúmenes en dispositivos compatibles, pero no tiene historial de versiones ni app para Windows o Android.</p>
 <h2 id="pinto">Otra ruta con Pinto Notes</h2>
 <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain" alt="Menú de importación de Pinto Notes en un Mac, en inglés, con Evernote entre las opciones." caption="Pinto Notes acepta archivos ENEX de Evernote." />
 <p>En un Mac, importa todos los ENEX: cada cuaderno se vuelve carpeta, con etiquetas, adjuntos y fechas de creación y edición. Evernote no cambia. Después puedes conectar ChatGPT o Claude para buscar, leer y editar las notas; Pinto Notes conserva versiones. Solo funciona en iPhone y Mac. <a href="/blog/import-your-notes" hrefLang="en">Consulta los pasos de importación</a>.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-version-history" hrefLang="en">historial de versiones de Notas</a>, <a href="/blog/best-notes-app-for-mac" hrefLang="en">apps de notas para Mac</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
