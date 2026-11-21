import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "alternativa-google-keep-iphone-mac");
// Spanish version of /blog/google-keep-alternative-for-iphone-and-mac, 21 Nov 2026.
// Autocomplete hl=es, gl=es: "alternativa google keep" suggests that exact phrase and
// "alternativa ao google keep"; "alternativa google keep iphone" has no suggestions.
// No Apple menu steps. Apple guides /es-es/guide/notes/welcome/mac and
// /es-es/guide/iphone/iph1ac0b3a2/ios read 21 Nov for folders, lists and tables.
// Other app facts and import limits are those of the English post. No picture.
const ui = UI.es;
const CHECK = `Revisión del traslado desde Google Keep
- [ ] Comparar una nota larga con la original
- [ ] Comprobar elementos marcados y sin marcar
- [ ] Abrir una imagen importada
- [ ] Revisar una nota con dos etiquetas
- [ ] Comparar una nota fijada y sus fechas
- [ ] Revisar las archivadas si elegí importarlas
- [ ] Anotar lo que significan los colores
- [ ] Guardar aparte los dibujos importantes
- [ ] Poner los avisos necesarios en la app que usaré
- [ ] Dejar las listas compartidas en Keep hasta acordar el cambio
- [ ] Conservar la descarga original de Takeout`;
const FAQ = [
 {q:"¿Pinto importa las etiquetas de Keep como carpetas?",a:["Sí. Por defecto, la primera etiqueta de cada nota será su carpeta y las demás serán etiquetas. También puedes elegir Etiquetas para conservarlas todas como etiquetas. Revisa una nota con varias antes de decidir."]},
 {q:"¿Se importan los colores y recordatorios?",a:["No. El importador deja fuera colores, dibujos y recordatorios, y el resumen indica qué notas los tenían. Guarda los dibujos importantes y prepara los avisos que necesites."]},
 {q:"¿La importación mantiene Keep conectado a Pinto?",a:["No. Se importa una copia. Los cambios posteriores no pasan de una app a otra ni se trasladan los permisos de las notas compartidas."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="alternativa-google-keep-iphone-mac"
 intro={<>Pinto Notes es una alternativa gratuita a Google Keep para iPhone y Mac, con importación directa de Google Takeout. Si necesitas Android o listas compartidas con las mismas personas, puedes seguir en Keep.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#elegir",label:"Elegir una app"},{href:"#seguir",label:"Cuándo seguir en Keep"},{href:"#datos",label:"Qué se importa"},{href:"#importar",label:"Traer las notas"},{href:"#revisar",label:"Revisar el traslado"}]}>
 <p>Elige Pinto si quieres editar como en Notas de Apple en iPhone y Mac. Importa tus notas de Keep en un Mac: pasan texto, listas, imágenes, etiquetas, notas fijadas y fechas. Los colores, dibujos y recordatorios quedan fuera.</p>
 <PostCta slug="es/alternativa-google-keep-iphone-mac" path="/es/blog/alternativa-google-keep-iphone-mac" position="answer" ui={ui.cta} title="Prueba tus notas de Keep en Pinto"><p>Descarga Pinto Notes gratis en el Mac e importa tu archivo de Google Keep. Tras conectarlos, ChatGPT o Claude pueden leer y editar las notas importadas.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="elegir">Elige según las notas que necesitas</h2>
 <p>Pinto funciona como Notas de Apple y sirve para notas personales en iPhone y Mac, también si quieres trabajar en ellas con ChatGPT o Claude. No tiene app para Windows ni Android, ni versión web. Si necesitas editar en el navegador, Keep ya lo permite.</p>
 <p>Notas de Apple también ofrece carpetas, listas de comprobación y tablas. Consulta la <a href="/es/blog/notas-apple-vs-google-keep">comparación entre Notas y Keep</a>. Si ya has elegido Notas de Apple, sigue la <a href="/es/blog/google-keep-a-notas-iphone">guía de traslado desde Keep</a>. Aquí los pasos son para la importación directa en Pinto.</p>
 <h2 id="seguir">Cuándo conviene seguir en Google Keep</h2>
 <p>Keep funciona en iPhone, Android y <a href="https://support.google.com/keep/answer/2888240?hl=es">el navegador</a>. Pinto no puede sustituirlo en un móvil Android. Keep también permite <a href="https://support.google.com/keep/answer/6101196?hl=es">editar notas con colaboradores</a>. La copia importada a Pinto no conserva esos permisos. Puedes mover tus notas personales y mantener las listas compartidas en Keep hasta que todos acuerden el cambio.</p>
 <h2 id="datos">Qué conserva Pinto de la descarga de Takeout</h2>
 <p>La <a href="https://support.google.com/keep/answer/10017039?hl=es">exportación de Google</a> puede incluir más información de la que admite la app receptora. Pinto importa estos datos:</p>
 <div className="tableWrap"><table><thead><tr><th scope="col">En Google Keep</th><th scope="col">En Pinto Notes</th></tr></thead><tbody>
 <tr><th scope="row">Texto y listas</th><td>Texto y estado de cada elemento marcado o sin marcar</td></tr>
 <tr><th scope="row">Etiquetas</th><td>Carpetas por defecto, o etiquetas si lo eliges</td></tr>
 <tr><th scope="row">Notas fijadas y fechas</th><td>Estado fijado y fechas disponibles de creación y edición</td></tr>
 <tr><th scope="row">Imágenes</th><td>Adjuntos si los archivos están en la descarga</td></tr>
 <tr><th scope="row">Notas archivadas</th><td>Excluidas por defecto; puedes incluirlas en una carpeta Archivo</td></tr>
 <tr><th scope="row">Papelera</th><td>Se omite</td></tr>
 <tr><th scope="row">Colores, dibujos y recordatorios</th><td>No se importan; aparecen en el resumen</td></tr>
 <tr><th scope="row">Permisos de colaboradores</th><td>No pasan a la copia</td></tr>
 </tbody></table></div>
 <p>Con Carpetas, la primera etiqueta de una nota será su carpeta y las demás serán etiquetas. Con Etiquetas, todas serán etiquetas. Una nota marcada Hogar y Reparaciones irá a Hogar con la etiqueta Reparaciones si Hogar figura primero.</p>
 <p>Si el rojo significa urgente en tu Keep, anótalo en las notas importantes antes de moverlas. Guarda dibujos aparte y pasa los avisos necesarios a la app que usarás. Una lista importada no conserva su recordatorio.</p>
 <h2 id="importar">Importa la descarga en Pinto desde un Mac</h2>
 <p>En Pinto Notes, abre File y elige Google Keep. La app abre la página de descarga de Google con solo Keep seleccionado. Descarga el archivo y arrástralo a Pinto. La <a href="/blog/import-your-notes" hrefLang="en">guía de importación</a> (en inglés) muestra el inicio.</p>
 <p>En Google Takeout, elige Siguiente paso, una exportación única y ZIP; después crea la exportación. Descarga el archivo cuando Google te avise. Prepararlo puede llevar de minutos a días. <a href="https://support.google.com/accounts/answer/3024190?hl=es">Descargar tus datos</a> no los borra de Google.</p>
 <p>Pinto acepta el ZIP de Takeout, la carpeta Takeout extraída o su carpeta Keep. Si usas la carpeta extraída, conserva las imágenes junto a las notas. Elige Carpetas o Etiquetas y si quieres incluir las notas archivadas. Revisa el resumen.</p>
 <h2 id="revisar">Compara tus notas antes de dejar Keep</h2>
 <p>Compara una nota larga, una lista con elementos terminados, una imagen y una nota con varias etiquetas. Estas pruebas dicen más que el total de notas.</p>
 <Keep title="Revisión de la importación de Keep" text={CHECK} copyLabel={ui.copy} note="Copia la lista junto a la descarga. Comprueba tus propias notas antes de dejar Keep." />
 <p>Es una copia exportada. Las apps no quedan conectadas. Decide en cuál editarás cada nota para que las copias no diverjan.</p>
 <h2 id="pinto">Trabaja con las notas importadas usando tu IA</h2>
 <p>Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> y aprobar el acceso, puede leer y editar las notas de Pinto. Pídele que encuentre una nota de proyecto importada y añada próximos pasos. Comprueba el resultado, sobre todo fechas y tareas deducidas.</p>
 <p>Pinto guarda las versiones anteriores de los cambios hechos allí, también los de IA. No reconstruye las versiones previas de Keep. La app está en inglés.</p>
 </LocalPostPage>;
}

