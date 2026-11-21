import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "conectar-notas-gemini-cli");

// Traducción de /blog/connect-notes-to-gemini-cli, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "conectar notas a gemini cli" no dio sugerencias;
// "gemini cli mcp" dio esa frase, "gemini cli mcp servers", "gemini cli mcp configuration"
// y "gemini cli mcp add". Título descriptivo. El original no da pasos de Notas de Apple.
// Comandos, URL de MCP, enlace de extensión y hechos de Google y Pinto siguen el original.
// No se probó una conexión real a Gemini CLI.

const ui = UI.es;
const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Corrección del formulario de contacto

Mostrar una confirmación clara después de enviar un mensaje.
Conservar la dirección de correo en el formulario si el envío falla.

Resultados de la sesión
`;
const READ = `Busca en Pinto Notes la nota "Corrección del formulario de contacto" y léela.
Dime sus requisitos antes de cambiar el código.
Si encuentras varias notas, muéstrame sus rutas y pregúntame cuál usar.`;
const SAVE = `Vuelve a leer "Corrección del formulario de contacto" en Pinto Notes.
En "Resultados de la sesión", añade la fecha de hoy, lo que cambiamos y las comprobaciones que hicimos de verdad.
Indica claramente cuáles no ejecutamos. Conserva los requisitos y las entradas anteriores.
Muéstrame la ruta de la nota al terminar.`;
const FAQ = [
  { q: "¿Qué comando conecta Pinto Notes a Gemini CLI?", a: [
    `Ejecuta gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}. Abre Gemini CLI, usa /mcp auth pinto-notes para iniciar sesión y aprueba la conexión en Pinto Notes desde el Mac.`,
  ] },
  { q: "¿Cómo compruebo si Gemini CLI ve las herramientas?", a: ["Escribe /mcp en Gemini CLI para ver el servidor y sus herramientas. Después, pídele que busque una nota por su título exacto y la lea. Compara la respuesta con la nota en Pinto Notes."] },
  { q: "¿Puede Gemini CLI añadir un resultado a una nota del iPhone?", a: ["Una vez conectado y aprobado, puede buscar, leer y editar tus notas de Pinto. Pídele que lea la nota primero y que añada el resultado bajo un encabezado. La nota se sincroniza entre iPhone y Mac."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="conectar-notas-gemini-cli"
    intro={<>Conecta Gemini CLI a Pinto Notes mediante MCP, inicia sesión y aprueba el acceso en el Mac. Después podrá leer un encargo escrito en el iPhone y añadir a esa misma nota el resultado de la sesión.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#conectar", label: "Conectar" }, { href: "#leer", label: "Leer una nota" },
      { href: "#guardar", label: "Guardar el resultado" }, { href: "#comprobar", label: "Comprobar la conexión" },
    ]}>
      <p>Ejecuta <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code>. Dentro de Gemini CLI, inicia sesión con <code>/mcp auth pinto-notes</code>. Elige Allow en Pinto Notes para permitir tanto la lectura como la edición.</p>
      <PostCta slug="es/conectar-notas-gemini-cli" path="/es/blog/conectar-notas-gemini-cli" position="answer" ui={ui.cta} title="Usa tus notas de proyecto en Gemini CLI"><p>Pinto Notes se descarga gratis en Mac. Guarda un encargo en el iPhone, deja que Gemini CLI lo lea y añade el resultado a la misma nota.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="conectar">Conecta Gemini CLI en el Mac</h2>
    <p>Estos pasos son para Gemini CLI en el Terminal de un Mac. Instala Pinto Notes e inicia sesión. Necesitas tener Gemini CLI instalado para ejecutar los comandos.</p>
    <Keep title="Añade el servidor de notas" text={ADD} code copyLabel={ui.copy} note="Ejecuta el comando en Terminal. El ámbito de usuario lo deja disponible para todos tus proyectos." />
    <p>Inicia Gemini CLI con <code>gemini</code> y escribe esto dentro de la sesión:</p>
    <Keep title="Inicia sesión en Pinto Notes" text="/mcp auth pinto-notes" code copyLabel={ui.copy} note="Termina el inicio de sesión en el navegador y aprueba la conexión cuando Pinto Notes lo pida en el Mac." />
    <p>Google documenta el comando HTTP y el inicio de sesión en la <a href="https://geminicli.com/docs/tools/mcp-server/">guía MCP de Gemini CLI</a>. Este recorrido sigue la documentación; no se probó una conexión real para el artículo.</p>
    <p>Si prefieres la extensión, el README de Pinto da este comando:</p>
    <Keep title="Otra vía: instala la extensión de Pinto" text={EXTENSION} code copyLabel={ui.copy} note="Usa esta vía o el comando directo anterior. Los ejemplos siguientes sirven para ambas." />
    <p>Google explica cómo <a href="https://geminicli.com/docs/extensions/">instalar extensiones desde GitHub</a>. Con esa vía, usa <code>/mcp</code> para ver el nombre del servidor y después <code>/mcp auth</code> para iniciar sesión.</p>
    <h2 id="leer">Lee un encargo guardado en el iPhone</h2>
    <p>Crea en Pinto Notes una nota llamada «Corrección del formulario de contacto». Puedes probar con este ejemplo o escribir tu propio encargo:</p>
    <Keep title="Un encargo de ejemplo" text={BRIEF} copyLabel={ui.copy} />
    <p>En el Mac, pide a Gemini CLI que encuentre esa nota. El título exacto facilita comprobar que eligió la correcta.</p>
    <Keep title="Lee el encargo antes de trabajar" text={READ} copyLabel={ui.copy} />
    <p>Busca una llamada <code>search</code> seguida de <code>fetch</code>. Compara la respuesta con los dos requisitos de la nota. Una respuesta que solo repite tu petición no demuestra que la haya leído.</p>
    <h2 id="guardar">Añade el resultado a la misma nota</h2>
    <p>Al terminar una sesión de programación, pide que guarde lo que pasó de verdad. Deja los requisitos originales encima de los resultados para poder consultarlos en otra sesión.</p>
    <Keep title="Guarda el resultado de la sesión" text={SAVE} copyLabel={ui.copy} />
    <p>La herramienta <code>edit</code> de Pinto modifica texto coincidente de una nota que ya ha leído. Pide que añada el resultado bajo el encabezado y revisa la nota después. La versión anterior queda en el historial y puedes deshacer los cambios de la IA.</p>
    <p>Abre la nota en el iPhone y lee la entrada nueva. Anota también las comprobaciones que fallaron o no se ejecutaron.</p>
    <h2 id="comprobar">Si la conexión necesita atención</h2>
    <p>Escribe <code>/mcp</code> en Gemini CLI para ver servidores y herramientas, o ejecuta <code>gemini mcp list</code> en Terminal. Si falta iniciar sesión para la conexión directa, usa <code>/mcp auth pinto-notes</code>. Con la extensión, usa el nombre que figure en la lista.</p>
    <p>Aprueba la conexión en Pinto antes de pedir una nota. Allow permite leer y editar. Si hay varios títulos iguales, pide sus rutas y elige una antes de cambiar nada.</p>
    <p>La <a href="/blog/mcp-server" hrefLang="en">guía del servidor MCP de Pinto Notes</a> enumera sus herramientas. La <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guía de Claude Code y Codex</a> contiene los comandos para esos agentes.</p>
    <h2 id="pinto">Guarda juntos el encargo y el resultado</h2>
    <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Puedes escribir el encargo tú, dejar que una IA autorizada lo edite y volver a una versión anterior.</p>
    <p>Si tus notas están en Notas de Apple, puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importarlas desde un Mac</a>. Los originales no cambian.</p>
  </LocalPostPage>;
}
