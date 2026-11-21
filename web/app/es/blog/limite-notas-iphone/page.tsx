import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "limite-notas-iphone");
// Versión de /blog/apple-notes-storage-limit. Autocomplete de Google, hl=es, gl=es, 21 Nov 2026:
// "notas iphone espacio" ofrece "notas iphone ocupa mucho espacio";
// "limite almacenamiento notas iphone" no ofrece sugerencias. Apple, leído el 21 Nov 2026: support.apple.com/es-es/108922 (almacenamiento),
// /108047 (planes), /108429 (almacenamiento del iPhone), /guide/notes/apde615d29c2/mac (enlaces),
// /guide/iphone/iph7262fd4fe/ios (cuentas). La guía de iCloud agrupa Notas en Documentos.
// Apple no publica cifras por nota o adjunto; no se inventan. Captura inglesa.
const ui=UI.es;
const FAQ=[
 {q:"¿Notas tiene un límite de espacio?",a:["Apple no publica uno específico. Las notas de iCloud usan el espacio de iCloud, con 5 GB gratis y planes superiores. La app tiene límites internos para adjuntos y longitud de nota, sin cifras públicas."]},
 {q:"¿Cuántos adjuntos admite una nota?",a:["Apple no da un número. Notas avisa cuando se alcanza el máximo. Los números de foros no son límites confirmados por Apple."]},
 {q:"¿Las notas cuentan para iCloud?",a:["Sí, si están bajo iCloud. En mi iPhone y En mi Mac usan almacenamiento local; las de Gmail pertenecen a esa cuenta."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="limite-notas-iphone"
 intro={<>Si Notas avisa de que iCloud está lleno o de que una nota tiene demasiados adjuntos, son dos límites distintos. Apple solo publica cifras para el espacio total de iCloud.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#icloud",label:"iCloud"},{href:"#limites",label:"Dentro de una nota"},{href:"#comprobar",label:"Comprobar espacio"},{href:"#liberar",label:"Liberar espacio"}]}>
  <p>Apple no publica un máximo de almacenamiento propio de Notas. Las notas de iCloud comparten el plan de iCloud, que empieza con 5 GB gratis y ofrece planes de 50 GB a 12 TB. También hay límites dentro de una nota, pero Apple no da cantidades para tamaño, longitud o número de adjuntos.</p>
  <PostCta slug="es/limite-notas-iphone" path="/es/blog/limite-notas-iphone" position="answer" ui={ui.cta} title="Notas que no usan tu espacio de iCloud"><p>Pinto Notes sincroniza con su propio servicio cifrado. Una cuenta de iCloud llena no detiene su sincronización.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Ajustes de iCloud en iPhone, en inglés, con el espacio usado y Notas entre los datos guardados." caption="Notas comparte el espacio de iCloud con otras apps. Imagen: Apple." />} faq={FAQ}>
 <h2 id="icloud">Notas comparte el espacio de iCloud</h2>
 <p>Los 5 GB gratis de iCloud se comparten con fotos, copias de seguridad, Mail y documentos de otras apps. Apple ofrece planes de 50 GB, 200 GB, 2 TB, 6 TB y 12 TB. Una nota compartida contigo cuenta para el espacio de su propietario, no el tuyo.</p>
 <p>Al llenarse iCloud, dejan de actualizarse datos entre dispositivos y se detienen las copias de seguridad. Por eso parece a veces que <a href="/es/blog/notas-iphone-no-sincroniza">Notas no sincroniza</a>. En Mac, Notas muestra un aviso al mover una nota a una cuenta iCloud sin espacio.</p>
 <h2 id="limites">Límites dentro de una nota</h2>
 <div className="tableWrap"><table><thead><tr><th>Límite</th><th>Qué indica la app</th><th>Cifra publicada</th></tr></thead><tbody><tr><th>Adjuntos</th><td>Se alcanzó el máximo o hay demasiados</td><td>Ninguna</td></tr><tr><th>Tamaño de un adjunto</th><td>La app muestra el máximo al fallar</td><td>No aparece en la guía</td></tr><tr><th>Longitud de una nota</th><td>Se alcanzó la longitud máxima</td><td>Ninguna</td></tr><tr><th>Profundidad de carpetas</th><td>La app indica el número al fallar</td><td>No aparece en la guía</td></tr><tr><th>Bloqueo de una nota grande</th><td>Pide reducir contenido o adjuntos</td><td>Ninguna</td></tr></tbody></table></div>
 <p>Los mensajes proceden de las cadenas de Notas en macOS 27.2; Apple no publica sus cifras. En una cuenta Exchange, Apple tampoco permite adjuntar archivos.</p>
 <h2 id="adjuntos">Si llegaste al máximo de adjuntos</h2>
 <p>Abre otra nota para los archivos siguientes y enlázala desde la primera con Edición, Añadir enlace. En iPhone, desde la lista de notas, abre el menú de acciones de la carpeta y busca la vista de archivos adjuntos. En Mac, usa Visualización y abre el explorador de archivos adjuntos. La guía española consultada no da un nombre uniforme para ese botón en todas las versiones, así que se describe su ubicación. Los adjuntos de notas bloqueadas no aparecen allí.</p>
 <h2 id="comprobar">Comprueba cuánto ocupa Notas</h2>
 <Paths rows={[{on:"iPhone, espacio local",steps:["Ajustes","General","Almacenamiento del iPhone","Notas"]},{on:"iPhone, iCloud",steps:["Ajustes","Tu nombre","iCloud"]},{on:"Mac, iCloud",steps:["Ajustes del Sistema","Tu nombre","iCloud"]}]} />
 <p>En Latinoamérica, Ajustes se llama Configuración. El almacenamiento del iPhone muestra cuánto usa la app en el dispositivo. En iCloud, Apple cuenta las notas bajo Documentos. El botón de gestión del espacio puede variar según la versión. Solo las notas bajo iCloud ocupan ese plan: <a href="/es/blog/donde-se-guardan-notas-iphone">consulta dónde está cada cuenta</a>.</p>
 <h2 id="liberar">Haz espacio</h2>
 <ul><li>Borra datos de iCloud que ya no necesites o amplía el plan.</li><li>En Mac puedes mover notas grandes a En mi Mac, pero dejarán de sincronizarse. Al cambiar de cuenta pueden perderse formato o adjuntos; <a href="/es/blog/pasar-notas-a-icloud">revisa cómo moverlas</a>.</li><li>Las notas borradas quedan 30 días en Eliminado recientemente antes de desaparecer.</li></ul>
 <p>Guarda una copia antes de borrar. <a href="/blog/back-up-apple-notes" hrefLang="en">Estas son las opciones de copia de seguridad</a>.</p>
 <h2 id="pinto">Notas fuera del espacio de iCloud</h2>
 <Figure shot={SHOTS.iphoneFiles} caption="Una nota de Pinto Notes en iPhone con PDF, CSV, foto y enlace, en inglés." />
 <p>Pinto Notes sincroniza mediante su propio servicio cifrado. Puede guardar fotos, PDF y otros archivos; no se indica aquí un límite de almacenamiento de Pinto Notes. Importa texto e imágenes de Notas en un Mac, pero PDF y otros adjuntos permanecen en Notas de Apple. La biblioteca original no cambia.</p>
 <p>También puedes consultar <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
