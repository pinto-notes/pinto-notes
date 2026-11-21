import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Steps } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-upnote-iphone-mac");
// Spanish version of /blog/upnote-alternative-for-iphone-and-mac, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "alternativa upnote" and "alternativa upnote iphone mac" return no suggestions.
// The local query uses the natural search construction "alternativa a UpNote".
// No Apple menu steps. UpNote and Pinto facts are those in the English post. No picture.
const ui = UI.es;
const CHECK = `Prueba de importación desde UpNote
- [ ] Comparar número de archivos exportados y notas importadas
- [ ] Leer una nota larga entera
- [ ] Revisar una tabla y una lista de comprobación
- [ ] Abrir las imágenes y los adjuntos de la muestra
- [ ] Seguir un enlace a otra nota
- [ ] Comprobar dónde quedó cada cuaderno
- [ ] Comparar una nota con una sección plegable
- [ ] Abrir las notas importadas en iPhone
- [ ] Conservar la exportación y la biblioteca de UpNote`;
const FAQ = [
 {q:"¿Puede Pinto importar una exportación de UpNote?",a:["Pinto acepta en Mac una carpeta o ZIP de archivos Markdown o de texto. Usa esa importación general y prueba primero unas pocas notas. No hay un importador específico de UpNote."]},
 {q:"¿Incluye UpNote Free la exportación Markdown?",a:["UpNote sitúa la exportación a texto, PDF, HTML y Markdown entre las funciones Premium. Comprueba tu plan antes de contar con ella."]},
 {q:"¿Se conservarán las secciones plegables?",a:["No está comprobado en esta vía. Compara una nota que las use, tanto el texto completo como la presentación, y conserva el original."]},
 {q:"¿Puede Pinto sustituir UpNote en Windows?",a:["No. Pinto solo funciona en iPhone y Mac; no tiene app para Windows, Linux o Android ni versión web."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="alternativa-upnote-iphone-mac"
 intro={<>Pinto Notes es una alternativa gratuita a UpNote para iPhone y Mac si prefieres el aspecto de Notas de Apple y quieres conectar ChatGPT o Claude. Prueba primero una pequeña exportación Markdown.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#seguir",label:"Cuándo seguir en UpNote"},{href:"#exportar",label:"Exportar una muestra"},{href:"#importar",label:"Importar en Mac"},{href:"#revisar",label:"Comprobar el resultado"},{href:"#pinto",label:"Usar tu IA"}]}>
 <p>Elige Pinto si usas iPhone y Mac y quieres que ChatGPT o Claude lean y editen tus notas tras conectarlos. Importa una carpeta de archivos Markdown o de texto y compara las copias. UpNote sigue siendo útil si necesitas Windows, Linux o Android.</p>
 <PostCta slug="es/alternativa-upnote-iphone-mac" path="/es/blog/alternativa-upnote-iphone-mac" position="answer" ui={ui.cta} title="Prueba tus notas de UpNote en Pinto"><p>Descarga Pinto Notes gratis en el Mac. Importa unas pocas notas y compruébalas antes de traer el resto.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="seguir">Cuándo conviene seguir en UpNote</h2>
 <p>UpNote funciona en Mac, iPhone, Windows, Linux y Android. Pinto solo en Mac y iPhone, sin web. Si trabajas con otro sistema, no cubrirá todos tus dispositivos.</p>
 <p>UpNote tiene cuadernos anidados, secciones plegables y un capturador web para Chrome, Safari y Firefox, según su <a href="https://getupnote.com/">página de funciones</a>. Importar Markdown no garantiza que esos flujos de trabajo se reproduzcan.</p>
 <h2 id="exportar">Exporta una muestra pequeña de UpNote</h2>
 <p>Elige una nota de proyecto larga, una lista y una con adjuntos o enlaces a otra nota. Incluye una sección plegable si la usas.</p>
 <Steps><li>En el Mac, selecciona las notas de muestra en la lista de UpNote.</li><li>Haz clic en Export en el panel derecho. Elige Markdown y archivos separados.</li><li>Conserva la carpeta exportada completa, incluida Files para imágenes y adjuntos.</li></Steps>
 <p>Los pasos vienen de la <a href="https://help.getupnote.com/import-and-export/export-notes">guía de UpNote</a>. También admite exportación a texto. Exportar exige Premium según UpNote. Si la muestra sale bien, File, Export all notes es la vía para sacar todas las notas del Mac.</p>
 <h2 id="importar">Usa la importación de Markdown y texto de Pinto</h2>
 <p>En Pinto Notes para Mac, abre File y elige Import Markdown or Text. Selecciona la carpeta exportada. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> (en inglés) explica que admite carpetas o ZIP de Markdown o texto, y que cada carpeta se convierte en una carpeta.</p>
 <p>Eso describe las carpetas exportadas, no garantiza reproducir todos los cuadernos de UpNote. Comprueba dónde termina cada nota. Conserva la biblioteca de UpNote y la exportación original.</p>
 <h2 id="revisar">Compara las notas antes de cambiar</h2>
 <p>Abre cada original junto a su copia. Lee hasta el final, sigue enlaces y mira el contenido de las secciones plegables. Esta vía no se ha probado aquí con una exportación nueva de UpNote.</p>
 <Keep title="Revisión de la prueba con UpNote" text={CHECK} copyLabel={ui.copy} note="Úsala con la muestra y repite las comprobaciones para las partes importantes de tu biblioteca." />
 <p>Anota lo que tengas que reparar. Si falla un enlace o adjunto, conserva el original mientras arreglas la copia. Si depende demasiado de una función que no pasa, sigue usando UpNote.</p>
 <h2 id="pinto">Trabaja con las copias usando tu IA</h2>
 <p>Pinto funciona como Notas de Apple en iPhone y Mac. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y aprobar el acceso, puede leer y editar tus notas. Pídele que resuma en el chat el trabajo pendiente de una nota importada. Compara el resumen antes de pedir que añada un paso y revisa luego la edición.</p>
 <p>Pinto conserva las versiones anteriores creadas allí, pero no las de UpNote. La app está en inglés.</p>
 <h2 id="volver-a-exportar">Conserva una forma de exportar</h2>
 <p>Pinto exporta su biblioteca como archivos Markdown en carpetas dentro de un ZIP. Las notas que sigan bloqueadas con contraseña, Face ID o Touch ID no entran y se informa de los archivos que no se hayan podido descargar. Revisa el resumen y abre algunos archivos antes de confiar en la copia. Conserva aparte la exportación original de UpNote.</p>
 </LocalPostPage>;
}

