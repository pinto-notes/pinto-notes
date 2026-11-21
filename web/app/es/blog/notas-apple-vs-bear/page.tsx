import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "notas-apple-vs-bear");
// Versión de /blog/apple-notes-vs-bear. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "notas apple vs bear" y "bear vs notas apple" no dieron sugerencias; "apple notes vs bear"
// ofreció "apple notes vs bear app", "reddit" y "2025". Se conserva "vs" en el slug.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apd4e6e2c9a6/mac
// (Compartir un enlace, permisos); /not201900c07/mac (Archivo > Exportar como,
// Archivo > Importar formato Markdown); /guide/icloud/mm8685520792/icloud (sincronización).
// La guía española no confirma la ruta de exportación específica de macOS 27: se describe la acción.
// Los datos de Bear son los del artículo inglés. La captura está en inglés.
const ui = UI.es;
const FAQ = [
  {q:"¿Bear o Notas de Apple para escribir?",a:["Bear conviene para Markdown, índices y enlaces de vuelta. Notas sirve mejor si usas carpetas y compartes notas mediante iCloud. Ambas tienen tablas y listas de verificación."]},
  {q:"¿Necesito Bear Pro para sincronizar con el iPhone?",a:["Sí. La versión gratis guarda notas locales. Bear Pro añade la sincronización con iCloud. Su web indicaba 2,99 USD al mes o 29,99 USD al año el 21 de noviembre de 2026."]},
  {q:"¿Puedo pasar notas de Bear a Notas de Apple?",a:["Sí. Exporta los archivos Markdown en Bear y, en Notas para Mac, usa Archivo > Importar formato Markdown. Prueba primero las notas con imágenes, tablas y enlaces. Los enlaces wiki de Bear pueden necesitar ajustes."]},
  {q:"¿Puede Claude editar mis notas de Bear?",a:["Sí. Desde Bear 2.8, el conector de Claude para Mac, el servidor MCP local y la herramienta de línea de comandos pueden buscar, leer, crear y editar notas. Bear excluye las notas cifradas de ese acceso."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="notas-apple-vs-bear"
  intro={<>Notas de Apple es práctica para compartir listas y ordenar carpetas. Bear favorece la escritura en Markdown y las etiquetas anidadas. Aquí se comparan también la sincronización y el traslado de notas.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#comparacion",label:"Comparación"},{href:"#notas",label:"Notas"},{href:"#bear",label:"Bear"},{href:"#traslado",label:"Traslado"}]}>
    <p>Elige <strong>Notas</strong> para carpetas, carpetas inteligentes y colaboración en iCloud. Elige <strong>Bear</strong> para escribir en Markdown, anidar etiquetas y ver qué notas enlazan a otra. Las dos funcionan en iPhone y Mac; Bear requiere Pro para sincronizar.</p>
    <PostCta slug="es/notas-apple-vs-bear" path="/es/blog/notas-apple-vs-bear" position="answer" ui={ui.cta} title="Notas familiares con acceso para tu IA"><p>Pinto Notes funciona como Notas en iPhone y Mac, conserva versiones anteriores y deja que ChatGPT o Claude lean y editen las notas al conectarlos. En un Mac importa desde Notas y Bear.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="comparacion">De un vistazo</h2>
  <div className="tableWrap"><table><thead><tr><th>Aspecto</th><th>Notas</th><th>Bear</th></tr></thead><tbody>
    <tr><th>Organización</th><td>Carpetas, etiquetas y carpetas inteligentes</td><td>Etiquetas anidadas, como #trabajo/proyecto</td></tr>
    <tr><th>Escritura</th><td>Texto con formato, listas y tablas</td><td>Editor Markdown, tareas, tablas y temas</td></tr>
    <tr><th>Enlaces</th><td>Enlaces entre notas</td><td>Enlaces wiki, referencias de vuelta y enlaces a encabezados</td></tr>
    <tr><th>Sincronización</th><td>iCloud, con Notas activado en cada dispositivo</td><td>iCloud con Bear Pro</td></tr>
    <tr><th>Exportación en Mac</th><td>PDF o Markdown</td><td>Markdown y otros formatos; PDF y Word requieren Pro</td></tr>
  </tbody></table></div>
  <p>Bear permite guardar notas locales gratis. Bear Pro costaba 2,99 USD al mes o 29,99 USD al año en su <a href="https://bear.app/#pricing">página de precios</a> el 21 de noviembre de 2026. También añade búsqueda en imágenes y PDF, y más temas. Consulta el precio de tu región.</p>
  <h2 id="notas">Elige Notas para carpetas y colaboración</h2>
  <p>Notas permite separar trabajo y casa en carpetas, fijar las notas frecuentes y usar tablas o listas de verificación. Las etiquetas sirven cuando un apunte pertenece a varios temas. Una carpeta inteligente reúne notas por reglas, como una etiqueta o tareas sin marcar.</p>
  <p>Para una lista compartida, <a href="https://support.apple.com/es-es/guide/notes/apd4e6e2c9a6/mac">comparte un enlace de iCloud</a> y da permiso para editar o solo ver. Cada participante necesita una Cuenta de Apple. Para ver tus propias notas en ambos dispositivos, activa Notas en iCloud con la misma cuenta.</p>
  <p>Prueba estas opciones con unas pocas notas antes de trasladar toda la biblioteca. Si necesitas ver las notas que enlazan a la actual, Bear ofrece referencias de vuelta. Si buscas tareas pendientes, quizá baste una carpeta inteligente.</p>
  <h2 id="bear">Elige Bear para Markdown y notas enlazadas</h2>
  <p>Bear muestra Markdown en el editor. Su panel Información crea un índice a partir de los encabezados. Escribe [[ para enlazar otra nota. La pestaña de referencias de vuelta muestra enlaces y menciones sin enlace. Bear lo explica en su <a href="https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/">guía del panel</a>.</p>
  <p>Con #trabajo/proyecto anidas una etiqueta dentro de otra. Una nota puede llevar varias. Bear guarda las notas en una base de datos, no como una carpeta de archivos Markdown. Aun así, puedes <a href="https://bear.app/faq/export-your-notes/">exportar varias notas</a> en Markdown gratis. Pro añade PDF, Word y HTML.</p>
  <p>Bear 2.8 o posterior ofrece en Mac un conector para Claude, un servidor MCP local y una herramienta de línea de comandos. Según sus <a href="https://bear.app/faq/command-line-interface/">instrucciones</a>, pueden buscar, leer y editar notas, con filtros por etiqueta. No acceden a las notas cifradas. La ruta de instalación del conector no aparece en la documentación de Apple en español; sigue la guía de Bear en tu versión.</p>
  <h2 id="traslado">Pasar de Notas a Bear y volver</h2>
  <p>En Notas para Mac, exporta una nota como Markdown desde Archivo. La <a href="https://bear.app/faq/migrate-from-apple-notes/">guía de Bear</a> importa después la carpeta Markdown. Su método anterior con Automator convierte tareas en viñetas y omite adjuntos salvo fotos. Revisa qué método corresponde a tu Mac.</p>
  <p>Para volver, exporta las notas de Bear como Markdown. En Notas para Mac usa <a href="https://support.apple.com/es-es/guide/notes/not201900c07/mac">Archivo &gt; Importar formato Markdown</a>. Apple permite conservar la estructura de carpetas al importar. Revisa los enlaces wiki, imágenes, tablas y listas en las copias. Conserva los originales mientras pruebas. Importar no sincroniza ambas apps.</p>
  <h2 id="pinto">Otra opción para iPhone y Mac</h2>
  <Figure shot={SHOTS.aiEdit} caption="ChatGPT añadió elementos a una nota de Pinto Notes en un Mac. La captura está en inglés." />
  <p>Pinto Notes se parece a Notas y guarda las notas como archivos Markdown con versiones anteriores. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leer y editar las notas. Desde Bear, exporta Markdown con los adjuntos y elige la carpeta en el <a href="/blog/import-your-notes" hrefLang="en">importador de Pinto</a>; también se copian las imágenes. Desde Notas de Apple, importa una vez en el Mac sin alterar el original.</p>
</LocalPostPage>; }
