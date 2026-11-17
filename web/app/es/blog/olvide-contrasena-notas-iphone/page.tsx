import { Figure } from "@/lib/blog";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Capture, FigurePair, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "olvide-contrasena-notas-iphone");

// Spanish version of /blog/forgot-apple-notes-password (language pilot, 17 Nov 2026). Apple's own Spanish words
// for every menu and button, from support.apple.com/es-es/102537 ("Cómo bloquear o desbloquear notas en el iPhone",
// read 17 Nov) and support.apple.com/es-es/guide/notes/apdb021fd5a9/mac ("Cambiar la contraseña de las
// notas bloqueadas", read 17 Nov). Spain says Ajustes; Latin America says Configuración, so the post names both once.
// Facts are the English post's; the screenshots are its English ones, described in Spanish.

const ui = UI.es;

const FAQ = [
  { q: "¿Puede Apple recuperar mis notas bloqueadas si olvido la contraseña?", a: [
    "No. Apple dice que no tiene acceso a las notas bloqueadas y que no puede ayudarte a abrirlas si olvidas la contraseña. Las notas bloqueadas están cifradas con una clave que sale de esa contraseña.",
  ] },
  { q: "¿Restablecer la contraseña de Notas desbloquea mis notas antiguas?", a: [
    "No. Restablecer te deja bloquear notas nuevas con una contraseña nueva. Las notas que bloqueaste antes siguen con la contraseña antigua y la necesitan para abrirse.",
  ] },
  { q: "¿Puedo abrir una nota bloqueada con Face ID o Touch ID?", a: [
    "Pruébalo: si activaste Face ID o Touch ID para Notas, Apple lo da como forma de ver una nota bloqueada. No sirve para cambiar la contraseña, que siempre pide la actual.",
  ] },
  { q: "¿Funcionan las apps que prometen desbloquear Notas?", a: [
    "No pueden descifrar una nota bloqueada sin su contraseña. La clave sale de la contraseña, así que lo único que puede hacer una herramienta es adivinar. Desconfía de cualquiera que te pida la contraseña de tu Cuenta de Apple.",
  ] },
  { q: "¿Cómo evito que me vuelva a pasar?", a: [
    "Usa el código del dispositivo en lugar de una contraseña aparte (iOS 16 o posterior, con el llavero de iCloud activado), o guarda la contraseña de Notas en un gestor de contraseñas.",
  ] },
];

export default function Page() {
  return (
    <LocalPostPage
      lang="es"
      slug="olvide-contrasena-notas-iphone"
      intro={<>¿Olvidaste la contraseña de tus notas bloqueadas? Esto es lo que vale la pena probar, en el orden en que yo lo haría, y lo único que no conviene hacer primero.</>}
      answer={
        <Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
          { href: "#prueba-primero", label: "Prueba esto primero" },
          { href: "#restablecer-iphone", label: "Restablecer en el iPhone" },
          { href: "#restablecer-mac", label: "Restablecer en el Mac" },
          { href: "#la-proxima-vez", label: "Que no vuelva a pasar" },
        ]}>
          <PostFigure src="/blog/macos27/notes-locked-hint" width={720} height={580} maxWidth={360}
            alt="Una nota bloqueada en Notas de Apple en macOS 27 que pide la contraseña, con la indicación City and year of the trip debajo del campo."
            caption="Tras una contraseña incorrecta, Notas muestra la indicación que pusiste." />
          <p>
            Nadie puede abrir una nota bloqueada sin su contraseña, ni Apple ni ninguna app de desbloqueo. Prueba primero Face ID o
            Touch ID, la indicación y el código de tu dispositivo. Si nada funciona, restablece la contraseña: solo cambia para las notas
            que bloquees a partir de ahora, y las antiguas siguen con la contraseña antigua.
          </p>
          <PostCta slug="es/olvide-contrasena-notas-iphone" path="/es/blog/olvide-contrasena-notas-iphone" position="answer" ui={ui.cta}
            title="¿Quieres notas que nunca se queden encerradas?">
            <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac, guarda cada versión de cada nota y ChatGPT o Claude pueden trabajar en ellas. Importa tus notas de Apple en un paso.</p>
          </PostCta>
        </Answer>
      }
      hero={<Capture priority src="/blog/macos27/notes-locked-window" width={1520} height={984} maxWidth={760}
        phone={{ src: "/blog/macos27/notes-locked-hint", width: 720, height: 580 }}
        alt="La ventana de Notas de Apple en macOS 27 con una nota bloqueada: This note is locked. Debajo del campo de contraseña, la indicación City and year of the trip."
        caption="Una nota bloqueada en Notas en macOS 27, tras varios intentos. La indicación aparece bajo el campo de contraseña. En el iPhone se ve igual." />}
      faq={FAQ}
    >
      <h2 id="por-que">Por qué nadie puede abrirla por ti</h2>
      <PostFigure src="/blog/apple/iphone-notes-note-is-locked" width={760} height={910} maxWidth={300}
        alt="Una nota bloqueada en el iPhone: un candado gris, el texto This note is locked y un botón View Note."
        caption="Una nota bloqueada en el iPhone. Imagen: Apple." />
      <p>
        Una nota bloqueada está cifrada con una clave que sale de la contraseña de tus notas. La guía de seguridad de Apple lo describe
        así: la clave se deriva de tu contraseña, y la nota y sus archivos adjuntos se cifran con ella. Apple
        dice <a href="https://support.apple.com/es-es/102537" rel="noopener">que no tiene acceso a las notas bloqueadas</a> y que no
        puede ayudarte si olvidas la contraseña. Para eso sirve bloquear una nota, y por eso restablecer la contraseña no devuelve las
        notas antiguas.
      </p>

      <h2 id="prueba-primero">Prueba esto primero</h2>
      <Steps>
        <li>
          <strong>Face ID o Touch ID</strong>
          Si lo activaste para Notas, abre la nota bloqueada, toca Ver nota y úsalo. Apple lo da como forma de ver una nota bloqueada.
        </li>
        <li>
          <strong>La indicación</strong>
          Introduce una contraseña incorrecta un par de veces y Notas muestra la indicación de contraseña que pusiste, si pusiste una.
        </li>
        <li>
          <strong>El código del iPhone o la contraseña del Mac</strong>
          Desde iOS 16, las notas se pueden bloquear con el código del dispositivo en lugar de una contraseña aparte. Si elegiste eso, usa
          el código de tu iPhone, o la contraseña de inicio de sesión en el Mac.
        </li>
        <li>
          <strong>Contraseñas anteriores</strong>
          Si alguna vez restableciste la contraseña de Notas, las notas más antiguas conservan la contraseña con la que se bloquearon. Si
          escribes la actual en una nota antigua, Notas te dice que es incorrecta y te muestra la indicación de la antigua.
        </li>
        <li>
          <strong>Un gestor de contraseñas</strong>
          Si usas uno, busca &ldquo;notas&rdquo;: puede que guardaras la contraseña ahí cuando la creaste.
        </li>
      </Steps>
      <p>
        No restablezcas primero. Restablecer es seguro y no borra nada, pero en cuanto tienes dos contraseñas cuesta más saber qué nota
        necesita cuál.
      </p>

      <h2 id="que-sirve">Qué puede hacer cada opción</h2>
      <PostFigure src="/blog/drawn/pw-keys" width={1200} height={750} maxWidth={560}
        alt="Un candado naranja dibujado con tres formas de abrirlo alrededor: un escaneo de cara, seis puntos de código y un campo de contraseña."
        caption="Tres formas de entrar: Face ID, tu código o la contraseña de las notas." />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">¿Abre notas antiguas?</th><th scope="col">Conviene saber</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Face ID o Touch ID</th><td>Sí, si estaba activado para Notas</td><td>No cambia la contraseña; eso siempre pide la actual</td></tr>
            <tr><th scope="row">La indicación</th><td>Solo si te refresca la memoria</td><td>Aparece tras un par de intentos fallidos, si pusiste una</td></tr>
            <tr><th scope="row">Código del dispositivo</th><td>Sí, en las notas bloqueadas con él</td><td>Opción desde iOS 16, con el llavero de iCloud activado</td></tr>
            <tr><th scope="row">Restablecer contraseña</th><td>No</td><td>Pone una contraseña para las notas que bloquees desde ahora</td></tr>
            <tr><th scope="row">Soporte de Apple</th><td>No</td><td>Apple no tiene acceso a las notas bloqueadas</td></tr>
            <tr><th scope="row">Apps de desbloqueo</th><td>No</td><td>Solo pueden adivinar contraseñas</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="restablecer">Restablecer la contraseña (para notas nuevas)</h2>
      <p>
        Si nada de lo anterior funciona, restablécela para poder seguir bloqueando notas nuevas. Las notas bloqueadas antiguas se quedan
        como están y se abren con la contraseña antigua si algún día la recuerdas.
      </p>
      <p className="label" id="restablecer-iphone"><strong>En el iPhone</strong></p>
      <Steps>
        <li>Abre Ajustes (Configuración en Latinoamérica), toca Apps, luego Notas y luego Contraseña.</li>
        <li>Elige la cuenta de Notas y toca Restablecer contraseña.</li>
        <li>Introduce la contraseña de tu Cuenta de Apple, toca OK y vuelve a tocar Restablecer contraseña.</li>
        <li>Elige el código del dispositivo, o introduce una contraseña y una indicación nuevas, y toca Listo.</li>
      </Steps>
      <p className="label" id="restablecer-mac"><strong>En el Mac</strong></p>
      <Steps>
        <li>En Notas, elige Notas, Ajustes, haz clic en Restablecer contraseña y luego en Aceptar.</li>
        <li>Introduce la contraseña que pida Notas. En mi prueba con macOS 27 fue la contraseña de inicio de sesión del Mac; la guía de Apple dice que una cuenta de iCloud puede pedir la contraseña de iCloud.</li>
        <li>Vuelve a hacer clic en Restablecer contraseña, escribe la nueva contraseña dos veces y una indicación, y haz clic en Definir contraseña.</li>
      </Steps>
      <p>
        Los pasos son de Apple: <a href="https://support.apple.com/es-es/102537" rel="noopener">Cómo bloquear o desbloquear notas en el
        iPhone</a> y <a href="https://support.apple.com/es-es/guide/notes/apdb021fd5a9/mac" rel="noopener">Cambiar la contraseña
        de las notas bloqueadas</a> en el Mac. Si todavía sabes la contraseña y solo quieres otra, elige Cambiar contraseña: así todas las
        notas bloqueadas pasan a la nueva y no acabas con dos.
      </p>
      <Capture src="/blog/macos27/notes27-reset-password-confirm" width={1148} height={1420} maxWidth={420}
        alt="Notas de Apple en macOS 27 pregunta Reset Notes Password? y explica que la nueva contraseña es para las notas que bloquees a partir de ahora y que las que ya tienen contraseña no cambian. Botones Cancel y OK."
        caption="Al restablecer en macOS 27, Apple lo dice claro: las notas que ya tienen contraseña no cambian." />

      <h2 id="probado">Lo probé en un Mac de pruebas</h2>
      <p>
        Bloqueé una nota con una contraseña, la restablecí y puse otra nueva. Luego abrí la nota antigua. La contraseña nueva no
        funcionó, y la indicación que salió era la antigua. Esa indicación es tu mejor pista: es la que escribiste para la contraseña que
        olvidaste.
      </p>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-after-reset-old-note-rejects-new-password", width: 2000, height: 1320,
          alt: "Una nota bloqueada antes de restablecer, en Notas de Apple en macOS 27: la contraseña no es correcta para esta nota, y la indicación sigue siendo la antigua." },
        { src: "/blog/macos27/notes27-old-password-update-prompt", width: 2000, height: 1320,
          alt: "La misma nota abierta con la contraseña antigua: Notas ofrece pasar todas las notas con esa contraseña a la actual, con los botones Update Password y Not Now." },
      ]} caption="Tras restablecer, la nota antigua rechaza la contraseña nueva y muestra su indicación antigua. Escribe la antigua y Notas ofrece pasar todas esas notas a tu contraseña actual." />
      <p>
        Así que restablecer no hace perder nada. Si más adelante recuerdas la contraseña antigua, Notas ofrece actualizar en un paso todas
        las notas que aún la usan.
      </p>

      <h2 id="apps-desbloqueo">Sobre las apps de desbloqueo</h2>
      <p>
        Los resultados de búsqueda están llenos de apps que prometen desbloquear Notas. Ninguna puede descifrar una nota bloqueada sin su
        contraseña; como mucho prueban contraseñas por ti. Si una te pide la contraseña de tu Cuenta de Apple o tu copia de seguridad,
        piensa bien qué estás entregando.
      </p>

      <h2 id="la-proxima-vez">Para que no vuelva a pasar</h2>
      <ul>
        <li>Cambia al código del dispositivo: Ajustes, Apps, Notas, Contraseña, Usar el código del dispositivo. Necesita el llavero de iCloud activado. En el Mac, la misma opción es Usar la contraseña de inicio de sesión, en el menú Notas bloqueadas de Notas, Ajustes.</li>
        <li>O guarda la contraseña de Notas en un gestor de contraseñas.</li>
        <li>Activa Face ID o Touch ID para Notas, para escribirla muy pocas veces.</li>
        <li>Desbloquea y exporta lo que no puedas permitirte perder, y guarda una copia en un lugar seguro.</li>
      </ul>

      <h2 id="pinto-notes">Si te cambias a otra app</h2>
      <p>
        Las notas bloqueadas no se pueden leer sin la contraseña, así que los exportadores e importadores las dejan atrás. También la
        importación de Pinto Notes desde Notas de Apple: desbloquea antes las notas que necesites, o se quedan en Notas.
      </p>
      <p>
        Pinto Notes, la app de notas para iPhone y Mac que hago yo, también tiene notas bloqueadas, y funcionan igual: cifradas con la
        contraseña de tus notas en tu dispositivo, ilegibles para nosotros y para cualquier IA que conectes, e imposibles de recuperar si
        olvidas la contraseña. Te lo dice al crearla. Todo lo demás en Pinto Notes también se cifra en tus dispositivos, y ChatGPT y
        Claude pueden usar tus otras notas cuando tú lo apruebas. La app está en inglés.
      </p>
      <Figure shot={SHOTS.notesPassword} caption="Crear la contraseña de las notas en Pinto Notes en un Mac. Igual que la de Apple, no se puede recuperar si la olvidas." />
    </LocalPostPage>
  );
}
