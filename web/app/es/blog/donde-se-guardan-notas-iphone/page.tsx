import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Paths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
export const dynamic="force-static";
export const metadata=localPostMetadata("es", "donde-se-guardan-notas-iphone");
// Versión de /blog/where-are-apple-notes-stored. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "donde se guardan las notas del iphone" ofrece esa frase y variantes para notas rápidas y escaneadas.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/iphone/iph7262fd4fe/ios,
// /iph92579feda/ios, /es-es/102537; /es-es/guide/notes/not85d6f7b58/mac,
// /apd97da26aed/mac, /not201900c07/mac; /es-es/guide/icloud/mm8685520792/icloud.
// Ninguna guía da una ruta en Finder. Las capturas inglesas se describen en español.
const ui=UI.es;
const FAQ=[
 {q:"¿Las notas están en el iPhone o en iCloud?",a:["Depende de la cuenta. Bajo iCloud están en la nube y aparecen en tus dispositivos con la misma Cuenta de Apple. Bajo En mi iPhone o En mi Mac permanecen solo en ese dispositivo."]},
 {q:"¿Dónde se guardan las notas de Gmail?",a:["En la cuenta Google, mediante IMAP. Si retiras la cuenta del teléfono, Apple indica que las notas siguen en la cuenta. Ábrelas desde Notas."]},
 {q:"¿Puedo encontrarlas como archivos en Finder?",a:["Apple no da una carpeta de archivos para las notas. En el Mac puedes exportar una nota como PDF o Markdown desde Archivo, Exportar como."]},
 {q:"¿Están cifradas las notas de iCloud?",a:["Sí, durante la transmisión y en los servidores. Por defecto Apple conserva las claves; con Protección de Datos Avanzada, solo tus dispositivos de confianza las guardan."]},
];
export default function Page(){return <LocalPostPage lang="es" slug="donde-se-guardan-notas-iphone"
 intro={<>Cada nota pertenece a una cuenta. Esa cuenta decide dónde se guarda, si llega a otros dispositivos y qué ocurre cuando eliminas la cuenta del iPhone.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#cuenta",label:"Ver la cuenta"},{href:"#icloud",label:"iCloud"},{href:"#local",label:"En el dispositivo"},{href:"#gmail",label:"Gmail"}]}>
  <p>Las notas bajo iCloud se guardan en iCloud y aparecen en tus dispositivos y en iCloud.com. En mi iPhone y En mi Mac guardan notas solo en ese dispositivo. Las carpetas bajo Gmail o Yahoo pertenecen a esas cuentas de correo. Apple no indica una ruta de archivo para buscarlas en Finder.</p>
  <PostCta slug="es/donde-se-guardan-notas-iphone" path="/es/blog/donde-se-guardan-notas-iphone" position="answer" ui={ui.cta} title="Una sola cuenta para todas tus notas"><p>Pinto Notes sincroniza entre iPhone y Mac con un inicio de sesión. Guarda las notas como Markdown y permite conectar ChatGPT o Claude.</p></PostCta>
 </Answer>}
 hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280} alt="Carpetas de Notas en un iPhone, en inglés: iCloud aparece sobre las carpetas de esa cuenta." caption="El encabezado sobre cada carpeta indica su cuenta. Imagen: Apple." />} faq={FAQ}>
 <h2 id="cuenta">Mira a qué cuenta pertenece una nota</h2>
 <p>Vuelve a la lista de carpetas del iPhone o mira la barra lateral del Mac. Encontrarás grupos como iCloud, En mi iPhone, En mi Mac, Gmail, Yahoo o Exchange. Si falta una cuenta, comprueba que Notas esté activado para ella. Quitar una cuenta del dispositivo no borra las notas del servicio.</p>
 <Paths rows={[{on:"iPhone",steps:["Ajustes","Apps","Notas","Cuentas de Notas"]},{on:"Mac",steps:["Notas","Cuentas"]}]} />
 <h2 id="icloud">Notas en iCloud</h2>
 <PostFigure src="/blog/apple/iphone-settings-icloud-storage-notes" width={490} height={1008} maxWidth={250} alt="Pantalla de iCloud en un iPhone, en inglés, con Notas entre los datos guardados." caption="iCloud muestra Notas entre los datos sincronizados. Imagen: Apple." />
 <p>Se guardan en iCloud y aparecen en otros dispositivos con la misma Cuenta de Apple y Notas activado. También puedes abrirlas en iCloud.com/notes. Activa la sincronización desde Ajustes (Configuración en Latinoamérica), tu nombre, iCloud, Notas, en el iPhone; en Mac, desde Ajustes del Sistema, tu nombre, iCloud, Notas. Las pantallas pueden mostrar Ver todo antes de Notas.</p>
 <p>Apple cifra las notas en tránsito y en sus servidores. Con Protección de Datos Avanzada, las claves permanecen en los dispositivos de confianza. Sin ella, Apple las conserva. Sincronizar no sustituye una copia de seguridad: al borrar una nota de iCloud, pasa a Eliminado recientemente en todos los dispositivos y desaparece después de 30 días. <a href="/blog/back-up-apple-notes" hrefLang="en">Cómo guardar una copia</a>.</p>
 <h2 id="local">En mi iPhone y En mi Mac</h2>
 <PostFigure src="/blog/macos27/notes27-settings-default-account-on-my-mac" width={1148} height={1000} maxWidth={500} alt="Ajustes de Notas en un Mac, en inglés, con En mi Mac como cuenta por omisión." caption="Las notas de En mi Mac solo están en ese ordenador." />
 <p>Estas cuentas son locales. Las notas de En mi iPhone se incluyen en la copia de seguridad del teléfono en iCloud; las de En mi Mac dependen de la copia de seguridad del Mac. No aparecen en iCloud.com ni en otro dispositivo. Puedes activarlas en los ajustes de Notas. Apple permite bloquear notas de estas cuentas con contraseña, Face ID o Touch ID.</p>
 <p>Apple no publica una carpeta de Finder donde abrirlas como archivos. Para obtener una nota como archivo, en el Mac usa Archivo, Exportar como, PDF o Markdown. Si esperabas verla en tu otro dispositivo, <a href="/es/blog/pasar-notas-a-icloud">pásala a iCloud</a>.</p>
 <h2 id="gmail">Gmail, Yahoo y otras cuentas</h2>
 <PostFigure src="/blog/apple/iphone-settings-mail-account-notes-switch" width={760} height={894} maxWidth={300} alt="Ajustes de una cuenta Gmail en un iPhone, en inglés, con Notas activado." caption="Una cuenta de correo también puede guardar notas. Imagen: Apple." />
 <p>Las notas bajo una cuenta de correo se sincronizan por IMAP y permanecen en esa cuenta si la retiras del dispositivo. Algunas funciones de Notas faltan allí, incluido el bloqueo. Si borras una, Apple indica que suele ir a la papelera de esa cuenta en Mail. Solo llegan a dispositivos donde configures la misma cuenta con Notas activado.</p>
 <div className="tableWrap"><table><thead><tr><th>Cuenta</th><th>Ubicación</th><th>Otros dispositivos</th><th>Bloqueo</th></tr></thead><tbody><tr><th>iCloud</th><td>iCloud</td><td>Cuenta de Apple e iCloud.com</td><td>Sí</td></tr><tr><th>En mi iPhone o En mi Mac</th><td>Solo el dispositivo</td><td>No</td><td>Sí</td></tr><tr><th>Gmail u otra cuenta</th><td>La cuenta de correo</td><td>Donde esté configurada</td><td>No</td></tr></tbody></table></div>
 <p>Las notas nuevas de Siri o del widget van a la Cuenta por omisión. Puedes elegirla en los ajustes de Notas del iPhone o Mac.</p>
 <h2 id="pinto">Dónde guarda las notas Pinto Notes</h2>
 <Figure shot={SHOTS.connectList} caption="Opciones para conectar ChatGPT, Claude, Claude Code y Codex en Pinto Notes para Mac." />
 <p>Pinto Notes usa una cuenta para iPhone y Mac. Las notas son Markdown cifrado antes de sincronizar y conserva versiones. ChatGPT o Claude pueden leerlas y editarlas tras conectarse. No hay app de Windows, Android ni web. Importa tus Notas de Apple en un Mac sin modificar la biblioteca original.</p>
 <p>También puedes consultar <a href="/es/blog/notas-iphone-no-sincroniza">resolver problemas de sincronización</a>, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT a tus notas</a>, <a href="/blog/move-from-apple-notes" hrefLang="en">pasar de Notas de Apple a Pinto Notes</a> y <a href="/blog/recover-deleted-apple-notes" hrefLang="en">recuperar notas borradas</a>.</p>
</LocalPostPage>}
