import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, Paths, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "bloquear-carpeta-notas-iphone");
// Versión de /blog/apple-notes-lock-folder. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "bloquear carpeta notas iphone" ofrece la frase completa; "como bloquear notas en" ofrece
// "iphone" y "iphone con face id". Apple, leído el 21 Nov 2026:
// support.apple.com/es-es/102537; /guide/iphone/iphf177bb154/ios (Acciones de nota,
// Bloquear, Ver nota, Bloquear ahora); /guide/notes/not28c5f5468/mac (Notas > Ajustes,
// Notas bloqueadas, Bloquear nota); /apd58edc7964/mac (carpetas inteligentes);
// /guide/iphone/iph00f208d05/ios (bloqueo de la app). Capturas en inglés.
const ui=UI.es;
const FAQ=[
 {q:"¿Puedo poner contraseña a una carpeta de Notas?",a:["No. Apple explica cómo bloquear notas individuales, pero no carpetas. Tampoco se pueden bloquear carpetas inteligentes. Bloquea una por una las notas que quieras proteger."]},
 {q:"¿Por qué no puedo bloquear una nota?",a:["Puede ser una nota rápida, compartida, con etiqueta o ciertos adjuntos, o estar en Gmail u otra cuenta externa. Apple detalla esas restricciones en sus guías."]},
 {q:"¿Se ve el título de una nota bloqueada?",a:["Sí. Aparece en la lista y es lo único que encuentra la búsqueda. No pongas información privada en la primera línea."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="bloquear-carpeta-notas-iphone"
 intro={<>Notas no permite cerrar una carpeta entera con contraseña. Puedes bloquear sus notas una por una, o bloquear la app completa en el iPhone. Estas son las diferencias y los pasos.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#carpeta",label:"Qué se bloquea"},{href:"#configurar",label:"Configurar"},{href:"#notas",label:"Cada nota"},{href:"#app",label:"Toda la app"}]}>
  <p>No hay bloqueo de carpetas en Notas. Configura la contraseña de la cuenta y bloquea cada nota con el botón Más y Bloquear. Puedes abrirla con contraseña, Face ID o Touch ID. Al desbloquear una, las demás notas bloqueadas de esa cuenta quedan abiertas un tiempo.</p>
  <PostCta slug="es/bloquear-carpeta-notas-iphone" path="/es/blog/bloquear-carpeta-notas-iphone" position="answer" ui={ui.cta} title="Tus notas privadas, fuera del alcance de la IA"><p>Pinto Notes deja que ChatGPT o Claude trabajen con notas normales. Las bloqueadas siguen cerradas y la IA solo ve su título.</p></PostCta>
 </Answer>}
 hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760} phone={{src:"/blog/macos27/notes-locked-hint",width:720,height:580}} alt="Notas en un Mac, en inglés: una nota de viaje aparece bloqueada en la lista, dentro de una carpeta visible." caption="La carpeta y el título permanecen visibles; se bloquea el contenido de la nota." />} faq={FAQ}>
 <h2 id="carpeta">Qué bloquea Notas</h2>
 <p>Apple documenta el bloqueo de notas individuales. No describe un bloqueo de carpetas y dice que las carpetas inteligentes no se pueden bloquear. Todas las notas bloqueadas de una cuenta usan el mismo método. El nombre de la carpeta y el título de cada nota siguen visibles. Si añades una nota nueva, tendrás que bloquearla también.</p>
 <h2 id="configurar">Elige contraseña o código del dispositivo</h2>
 <Paths rows={[{on:"iPhone",steps:["Ajustes","Apps","Notas","Contraseña"]},{on:"Mac",steps:["Notas","Ajustes","Notas bloqueadas"]}]} />
 <p>En Latinoamérica, Ajustes se llama Configuración. En iPhone, elige la cuenta y usa el código del dispositivo o una contraseña personalizada; puedes activar Face ID o Touch ID. En Mac, elige la contraseña de inicio de sesión o una personalizada y, si está disponible, Touch ID. Para usar el código o la contraseña del dispositivo necesitas iOS 16 o macOS 13 como mínimo y, con iCloud, el llavero activado. Si olvidas una contraseña personalizada, Apple no puede recuperar esas notas.</p>
 <h2 id="notas">Bloquea cada nota de la carpeta</h2>
 <Steps><li>En iPhone, abre una nota, toca el botón Acciones de nota o Más y elige Bloquear. Repite con las demás.</li><li>En Mac, selecciona la nota, haz clic en Más junto a la búsqueda y elige Bloquear nota. Introduce la contraseña o usa Touch ID.</li></Steps>
 <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300} alt="Nota bloqueada en un iPhone, en inglés, con el botón para verla." caption="El contenido queda oculto, pero el título sigue visible. Imagen: Apple." />
 <p>En iPhone, toca la nota y Ver nota para abrirla con contraseña, Face ID o Touch ID. También se admite el código del dispositivo si elegiste ese método. Bloquear ahora vuelve a cerrar las notas. En Mac, el botón de candado cierra todas las notas bloqueadas de la cuenta; se cierran asimismo por inactividad o al salir de Notas.</p>
 <h2 id="restricciones">Si una nota no se puede bloquear</h2>
 <ul><li>Las notas rápidas, compartidas o con etiquetas no admiten bloqueo.</li><li>Tampoco algunas notas con vídeo, audio, PDF u otros documentos adjuntos. En Mac sí se admiten tablas, imágenes, dibujos, escaneos, mapas y enlaces web.</li><li>Las notas en Gmail, Yahoo u otras cuentas de correo no se bloquean. <a href="/es/blog/pasar-notas-a-icloud">Puedes pasarlas a iCloud</a>.</li><li>Una Cuenta de Apple gestionada y una cuenta iCloud sin actualizar tienen restricciones adicionales.</li></ul>
 <p>Las notas de una carpeta compartida se comparten con sus participantes. Apple no permite colaborar en una carpeta con notas bloqueadas. Mantén lo privado en una carpeta sin compartir. <a href="/es/blog/olvide-contrasena-notas-iphone">Si olvidaste la contraseña de Notas</a>, revisa las opciones antes de restablecerla.</p>
 <h2 id="app">Bloquear toda la app en iPhone</h2>
 <Steps><li>Mantén pulsado el icono de Notas en la pantalla de inicio.</li><li>Elige la opción que exige Face ID, Touch ID o código y confírmala.</li></Steps>
 <p>El nombre exacto de esa opción cambia según el método de desbloqueo; la guía española consultada no ofrece un nombre único para todos. El bloqueo solo se aplica a ese iPhone, no al Mac, y vuelve a activarse al cerrar la app. Las apps integradas pueden bloquearse, pero no ocultarse.</p>
 <h2 id="pinto">Notas bloqueadas en Pinto Notes</h2>
 <Figure shot={SHOTS.notesPassword} caption="Configuración de una contraseña para notas bloqueadas en Pinto Notes, en inglés." />
 <p>Pinto Notes bloquea notas individuales con una contraseña, Face ID o Touch ID, no carpetas. Una nota bloqueada recibe una segunda capa de cifrado con una clave que se genera a partir de la contraseña y no sale de tus dispositivos. No se puede recuperar si la olvidas. ChatGPT o Claude solo ven el título. Las notas bloqueadas de Apple no entran en la importación: desbloquéalas antes y vuelve a bloquearlas después.</p>
 <p>También puedes consultar <a href="/blog/apple-notes-tags-smart-folders" hrefLang="en">etiquetas y carpetas inteligentes</a>, <a href="/blog/encrypted-notes-app-for-ai" hrefLang="en">cifrado de las notas</a> y <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a>.</p>
</LocalPostPage>}
