import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "conectar-notas-cursor");

// Traducción de /blog/connect-notes-to-cursor, 21 Nov 2026. Autocomplete de Google,
// client=firefox, hl=es, gl=es: "conectar notas a cursor" y "notas cursor mcp" no
// devolvieron sugerencias; "cursor mcp" dio "cursor mcp configuration" y "cursor mcp servers".
// Título descriptivo. No hay pasos de Notas de Apple. Instalación, comandos, URL de MCP y
// datos de Cursor y Pinto siguen exactamente la guía inglesa. No se probó una conexión nueva.

const ui = UI.es;
const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();
const BRIEF = `Encargo: búsqueda en la web

Objetivo: que los visitantes puedan buscar artículos de ayuda publicados.
Primera versión: buscar en los títulos y mostrar los enlaces coincidentes.
Conservar: el diseño actual de la página de ayuda.
Dejar fuera: la búsqueda dentro de adjuntos.
Pregunta abierta: ¿mostrar resultados mientras se escribe o después de pulsar Buscar?

Decisiones
Todavía no hay una decisión de implementación.

Siguiente paso
Comprobar cómo se cargan los artículos de ayuda.`;
const READ_PROMPT = `Busca en mis notas de Pinto Notes "Encargo: búsqueda en la web" y lee la nota entera. Dime el objetivo, qué queda fuera de la primera versión y qué pregunta sigue abierta. No cambies la nota ni el código.`;
const UPDATE_PROMPT = `Vuelve a leer "Encargo: búsqueda en la web" en Pinto Notes. En Decisiones, sustituye "Todavía no hay una decisión de implementación." por "Mostrar resultados después de pulsar Buscar." Sustituye el texto de Siguiente paso por "Añadir un campo de búsqueda y un botón con el diseño actual de la página de ayuda." Conserva el resto. Muéstrame los cambios.`;
const FAQ = [
  { q: "¿Cómo conecto Pinto Notes a Cursor?", a: ["Abre el enlace para añadir Pinto Notes a Cursor en el Mac, confirma el servidor, inicia sesión y elige Allow cuando Pinto Notes lo pida. La conexión permite a Cursor leer y editar tus notas."] },
  { q: "¿Dónde guarda Cursor la configuración MCP?", a: ["Cursor documenta .cursor/mcp.json dentro de un proyecto y ~/.cursor/mcp.json para usarla en varios proyectos. Si ya tienes servidores, añade pinto-notes al objeto mcpServers existente."] },
  { q: "¿Puede Cursor actualizar un encargo escrito en el iPhone?", a: ["Sí. Guarda el encargo en Pinto Notes, conecta Cursor a la misma cuenta y pídele que lea la nota antes de cambiarla. Abre la nota después para revisar el resultado."] },
  { q: "¿También se conectan las notas de Apple?", a: ["No. Cursor accede a tu cuenta de Pinto Notes. Si quieres traer notas de Apple, impórtalas desde un Mac. Las originales no cambian."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="conectar-notas-cursor"
    intro={<>Conecta Pinto Notes a Cursor mediante MCP, inicia sesión y elige Allow. Cursor podrá leer un encargo que escribiste en el iPhone y actualizarlo mientras trabajas en el Mac.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#conectar", label: "Conectar Cursor" }, { href: "#manual", label: "Configuración manual" },
      { href: "#encargo", label: "Probar un encargo" }, { href: "#problemas", label: "Si falla" },
    ]}>
      <p>En un Mac, usa el enlace de instalación, inicia sesión y elige Allow. Esta autorización permite a Cursor leer y editar tus notas. Empieza pidiéndole que lea una nota concreta.</p>
      <PostCta slug="es/conectar-notas-cursor" path="/es/blog/conectar-notas-cursor" position="answer" ui={ui.cta} title="Lleva tu encargo a Cursor"><p>Guarda el encargo en Pinto Notes. Pide a Cursor que lo lea y que anote una decisión después de tomarla.</p></PostCta>
    </Answer>} faq={FAQ}>
    <h2 id="conectar">Conecta Cursor en el Mac</h2>
    <p>Necesitas Cursor instalado en el Mac y una cuenta de Pinto Notes. Pinto Notes solo tiene app para iPhone y Mac; no hay app de notas para Windows o Android ni versión web.</p>
    <ol>
      <li>Abre <a href={CURSOR_INSTALL}>Add Pinto Notes to Cursor</a>. El enlace introduce la dirección del servidor.</li>
      <li>Confirma el servidor en Cursor e inicia sesión.</li>
      <li>Elige Allow cuando Pinto Notes lo pida. Autoriza la lectura y la edición.</li>
    </ol>
    <p>El enlace usa la misma configuración que el instalador de Pinto Notes. La <a href="https://cursor.com/docs/mcp">guía MCP de Cursor</a> documenta servidores remotos e inicio de sesión en el navegador. Esta guía se basa en la documentación y el código del enlace; no se probó la conexión en Cursor.</p>
    <h2 id="manual">Añade el servidor a mano</h2>
    <p>Cursor usa <code>.cursor/mcp.json</code> para un proyecto o <code>~/.cursor/mcp.json</code> para varios. Si ya tienes servidores, incorpora <code>pinto-notes</code> al objeto <code>mcpServers</code> existente.</p>
    <Keep title="Configuración MCP de Pinto Notes" text={CONFIG} code copyLabel={ui.copy} />
    <p>Activa el servidor en Customize, inicia sesión y elige Allow. La <a href="/blog/mcp-server" hrefLang="en">guía del servidor MCP de Pinto Notes</a> explica las herramientas y el acceso.</p>
    <h2 id="encargo">Lee un encargo escrito en el teléfono</h2>
    <p>Antes de abrir el código, escribe en Pinto Notes para iPhone qué debe hacer el cambio y qué queda para después. Puedes copiar este ejemplo y adaptarlo.</p>
    <Keep title="Un encargo para probar" text={BRIEF} copyLabel={ui.copy} />
    <p>En Cursor para Mac, pídele que encuentre la nota:</p>
    <Keep title="Comprueba que Cursor la puede leer" text={READ_PROMPT} copyLabel={ui.copy} />
    <p>Revisa la llamada a la herramienta y la respuesta. Debe mostrar el encargo real e identificar la pregunta sobre cuándo aparecen los resultados. Una respuesta genérica sobre búsquedas no demuestra que haya leído tu nota.</p>
    <h2 id="actualizar">Guarda una decisión en el encargo</h2>
    <p>Cuando decidas cómo debe funcionar la búsqueda, incluye la decisión en tu petición. En este ejemplo, los resultados aparecen después de pulsar Buscar.</p>
    <Keep title="Anota la decisión y el siguiente paso" text={UPDATE_PROMPT} copyLabel={ui.copy} />
    <p>La herramienta de edición de Pinto exige leer una nota antes de cambiarla. Abre el encargo después y comprueba la decisión. Pinto guarda las versiones anteriores. Si solo quieres cambiar una sección, dilo con precisión.</p>
    <h2 id="problemas">Si Cursor no encuentra las notas</h2>
    <p>Comprueba que iniciaste sesión con la cuenta donde está el encargo y que el servidor está activo en Customize. Si hay errores de conexión, abre Output y selecciona MCP Logs. Cursor pide autorización para usar herramientas de forma predeterminada.</p>
    <p>Repite primero la petición de lectura. Si hay varias notas con nombres parecidos, da el título exacto y pide que te muestre cuál encontró antes de editarla.</p>
    <h2 id="pinto">Guarda las decisiones junto al encargo</h2>
    <p>Usa la misma nota para la petición escrita en el teléfono y para las decisiones que tomes al programar. Pide expresamente a Cursor que la actualice cuando algo cambie.</p>
    <p>La <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guía de Claude Code y Codex</a> explica cómo conectar esos agentes. Si los encargos están en Notas de Apple, puedes <a href="/blog/import-your-notes" hrefLang="en">importarlos desde un Mac</a> sin cambiar los originales.</p>
  </LocalPostPage>;
}
