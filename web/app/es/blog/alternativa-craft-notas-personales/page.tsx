import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-craft-notas-personales");
// Spanish version of /blog/craft-alternative-for-personal-notes, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "alternativa craft" suggests unrelated tools and "alternativa craft notas"
// has no suggestions. Title states the personal-notes intent rather than claiming search volume.
// No Apple menu steps. Other app facts are from the English post. No picture.
const ui = UI.es;
const CHECK = `Prueba de notas personales desde Craft
- [ ] Comparar todo el texto con el documento original
- [ ] Revisar encabezados y elementos marcados de listas
- [ ] Leer todas las celdas de una tabla pequeña
- [ ] Abrir una imagen y un archivo adjunto
- [ ] Seguir un enlace a otro documento importado
- [ ] Buscar el contenido de una página o tarjeta anidada
- [ ] Abrir y editar la nota en iPhone
- [ ] Conservar originales y exportación de Craft`;
const FAQ = [
 {q:"¿Qué alternativa a Craft sirve para notas personales?",a:["Pinto Notes puede servir en Mac y iPhone si quieres editar como en Notas de Apple, con carpetas y ChatGPT o Claude conectados. Prueba unos archivos Markdown. Conserva Craft si dependes de Collections, tarjetas o espacios compartidos."]},
 {q:"¿Tiene Pinto un importador específico de Craft?",a:["No. Esta vía usa la importación general de Markdown y texto en Mac. No garantiza reconstruir un espacio de Craft ni conservar todos los enlaces y diseños."]},
 {q:"¿Debo salir de Craft para usar ChatGPT o Claude?",a:["No. Craft ofrece conexiones MCP para ambos y su propio asistente de IA. Prueba esa conexión si tu único motivo para cambiar es el acceso de una IA."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="alternativa-craft-notas-personales"
 intro={<>Pinto Notes es una alternativa a Craft para notas personales en Mac y iPhone, con un editor parecido a Notas de Apple. Si usas Collections o documentos compartidos, quizá te convenga mantenerlos en Craft.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#elegir",label:"Elegir según tus notas"},{href:"#seguir",label:"Cuándo seguir en Craft"},{href:"#exportar",label:"Probar Markdown"},{href:"#revisar",label:"Revisar el resultado"},{href:"#pinto",label:"Usar Pinto"}]}>
 <p>Para notas personales de texto con encabezados y listas, prueba a exportar unos documentos de Craft en Markdown e importarlos en Pinto. Craft ya tiene IA y exportación Markdown; comprueba con tus documentos qué editor prefieres.</p>
 <PostCta slug="es/alternativa-craft-notas-personales" path="/es/blog/alternativa-craft-notas-personales" position="answer" ui={ui.cta} title="Prueba tus notas personales en Pinto"><p>Descarga Pinto Notes gratis en el Mac e importa una pequeña carpeta Markdown. Conecta ChatGPT o Claude cuando quieras que lea y edite esas notas.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="elegir">Elige según los documentos que usas</h2>
 <p>Empieza por una nota que hayas abierto esta semana. Una lista de reparaciones de casa pide menos que una base de datos de proyectos relacionados. Si tus documentos son texto con algunos encabezados y casillas, prueba esos primero.</p>
 <p>Pinto tiene carpetas, listas, tablas y enlaces entre notas. Su editor funciona como Notas de Apple en Mac y iPhone. No tiene app para Windows ni Android, ni versión web. La <a href="/blog/best-notes-app-for-mac" hrefLang="en">comparación de apps para Mac</a> (en inglés) cubre más opciones.</p>
 <h2 id="seguir">Cuándo conviene seguir en Craft</h2>
 <p>Craft organiza documentos con bloques y tarjetas. Sus <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> tienen propiedades y relaciones, con vistas de tabla, galería y Kanban. Las carpetas y notas enlazadas de Pinto no reconstruyen esas vistas.</p>
 <p>La <a href="https://www.craft.do/pricing">tabla de planes de Craft</a> incluye espacios compartidos en planes que los admiten y publicación de documentos. Si trabajas allí con otras personas, mueve solo tus notas privadas y deja los documentos compartidos accesibles para todos.</p>
 <p>Craft tiene asistente de IA y <a href="https://support.craft.do/en/integrate/mcp">conexiones para ChatGPT y Claude</a>. Con los permisos adecuados, pueden crear y actualizar documentos. Prueba esa opción si tu interés principal es usar una IA.</p>
 <h2 id="exportar">Prueba una pequeña exportación Markdown</h2>
 <p>Elige un documento sencillo, como "Reparaciones del pasillo", con una lista y una nota sobre la pintura. Añade otro con adjuntos o páginas anidadas.</p>
 <ol><li>En Craft, abre el primer documento y haz clic en Share, arriba a la derecha.</li><li>Elige Export As y luego Markdown. Repite con el segundo.</li><li>Guarda los archivos juntos, incluidos los recursos adjuntos.</li><li>En Pinto Notes para Mac, abre File, Import Markdown or Text y selecciona la carpeta.</li></ol>
 <p>Los pasos vienen de la <a href="https://support.craft.do/en/import-and-export/export/document">guía de exportación de Craft</a>. Pinto acepta una carpeta o ZIP de Markdown o texto; cada carpeta pasa a ser una carpeta. Consulta la <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> (en inglés).</p>
 <p>Markdown conserva estructura y formato básicos, pero esta prueba no demuestra que Pinto reconstruya las tarjetas ni convierta bien todos los enlaces. Conserva los originales.</p>
 <h2 id="revisar">Comprueba las copias antes de mover más</h2>
 <p>Lee cada documento junto a su copia hasta el último párrafo y sigue los enlaces importantes. Ver el título en la lista no basta.</p>
 <Keep title="Revisión de la exportación de Craft" text={CHECK} copyLabel={ui.copy} note="Es una lista para comprobar tus datos, no una promesa de que se traslade cada elemento." />
 <p>Craft también exporta elementos de Collections en Markdown con propiedades como texto. Eso no verifica una migración de Collections a Pinto. Conserva las importantes en Craft hasta revisar su contenido y las copias importadas. Las versiones anteriores de Craft tampoco forman parte de este traslado.</p>
 <h2 id="pinto">Escribe y revisa tus notas en Pinto</h2>
 <p>Si la muestra funciona, importa las notas personales que quieras usar. Pinto permite seguir escribiendo, organizarlas en carpetas y enlazarlas. Conserva las versiones anteriores creadas allí; no recupera las revisiones de Craft.</p>
 <p>Si quieres ayuda de una IA, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecta ChatGPT o Claude</a> y aprueba el acceso. Allow le permite leer y editar. Pídele que lea "Reparaciones del pasillo" y proponga un paso a partir de lo pendiente. Comprueba la propuesta antes de pedir que la añada y revisa la edición. La app está en inglés.</p>
 </LocalPostPage>;
}

