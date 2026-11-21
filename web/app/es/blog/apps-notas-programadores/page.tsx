import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "apps-notas-programadores");

// Versión de /blog/notes-app-for-developers. Autocomplete, hl=es, gl=es,
// 21 Nov 2026: "app de notas para programadores" devolvió la misma frase;
// "notas para programadores" devolvió "bloc de notas para programadores"
// y "app de notas para programadores".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/
// apd46c25187e/mac (Monoestilo, Mayúsculas + Comando + M),
// /apde615d29c2/mac (Edición > Añadir enlace), /not201900c07/mac
// (Archivo > Exportar como > Markdown; Edición > Copiar en formato Markdown).
// Datos de Obsidian, Notion, Joplin y Bear de sus páginas oficiales del original.
// Captura inglesa reutilizada de la plantilla Daily standup de Pinto Notes.
const ui = UI.es;
const FAQ = [
  { q: "¿Qué conviene mirar en una app de notas para programar?", a: ["Comprueba el formato del código, la exportación Markdown, la búsqueda y los enlaces entre notas. Si un agente necesita acceder a ellas, decide si usará archivos locales, una herramienta de terminal o MCP."] },
  { q: "¿Qué app deja que un agente lea archivos locales?", a: ["Obsidian guarda su bóveda como archivos Markdown normales. Un agente con acceso a esa carpeta puede leerlos directamente. Obsidian también tiene una CLI oficial que usa la app en ejecución."] },
  { q: "¿Sirve Notas de Apple para apuntes de programación?", a: ["Sí, para explicaciones, listas y fragmentos breves. En Mac, Mayúsculas + Comando + M aplica Monoestilo. Puedes enlazar notas y exportar una como Markdown, aunque la exportación es una copia aparte."] },
  { q: "¿Gemini CLI puede trabajar con Pinto Notes?", a: ["Sí. La guía MCP de Pinto Notes incluye Gemini CLI junto a Claude Code y Codex. Una vez conectado y aprobado, el agente puede buscar, leer y editar tus notas."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="apps-notas-programadores"
    intro={<>Elige Obsidian si quieres archivos Markdown locales que puedas guardar en Git. Elige Pinto Notes si quieres el estilo de Notas de Apple en iPhone y Mac con notas que tu agente de programación pueda leer y editar.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Comparar apps" }, { href: "#comprobar", label: "Qué comprobar" },
      { href: "#obsidian", label: "Archivos locales" }, { href: "#pinto", label: "Pinto Notes" },
      { href: "#plantillas", label: "Plantillas" },
    ]}>
      <p>Obsidian sirve para una biblioteca personal de archivos. Notion encaja con la documentación compartida. Joplin ofrece libretas Markdown y una app de terminal. Bear sirve para notas enlazadas con código, y Notas de Apple para apuntes rápidos. Pinto Notes conecta Claude Code, Codex y Gemini CLI mediante un servidor MCP alojado.</p>
      <PostCta slug="es/apps-notas-programadores" path="/es/blog/apps-notas-programadores" position="answer" ui={ui.cta} title="Apuntes que tu agente puede usar"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Añade Code Block desde el menú / y conecta tu agente para leer y editar tus notas Markdown.</p></PostCta>
    </Answer>}
    hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600} alt="Nota de seguimiento diario en Pinto Notes para Mac, en inglés, con un bloqueo por una clave de API de pruebas y entradas de jueves y viernes." caption="Plantilla de seguimiento diario en Pinto Notes. Un agente conectado puede redactar la sección de ayer a partir de los commits. Captura en inglés." />}
    faq={FAQ}>
      <h2 id="comparar">Seis apps de notas para programadores</h2>
      <div className="tableWrap"><table><thead><tr><th scope="col">App</th><th scope="col">Código y Markdown</th><th scope="col">Cómo accede una herramienta a tus notas</th></tr></thead><tbody>
        <tr><th scope="row">Obsidian</th><td>Bloques de código delimitados y archivos Markdown locales</td><td>Leer la bóveda directamente o usar su CLI oficial</td></tr>
        <tr><th scope="row">Notion</th><td>Bloques con formato por lenguaje; exportación Markdown</td><td>Su MCP oficial busca y edita páginas del espacio de trabajo</td></tr>
        <tr><th scope="row">Joplin</th><td>Editor Markdown con bloques de código</td><td>App de terminal o MCP local oficial mediante Web Clipper</td></tr>
        <tr><th scope="row">Bear</th><td>Markdown con bloques de código; exportación .md</td><td>bearcli y MCP locales oficiales en Mac</td></tr>
        <tr><th scope="row">Notas de Apple</th><td>Monoestilo; exportación Markdown en Mac</td><td>Exportar o copiar Markdown para dárselo a una herramienta</td></tr>
        <tr><th scope="row">Pinto Notes</th><td>Code Block en el menú /; notas como archivos Markdown</td><td>MCP alojado para Claude Code, Codex y Gemini CLI</td></tr>
      </tbody></table></div>
      <p>Funciones comprobadas en la documentación de los fabricantes el 21 de noviembre de 2026. Son rutas documentadas, no pruebas prácticas de todas las apps.</p>
      <h2 id="comprobar">Qué probar antes de mover tus notas</h2>
      <ul><li>Pega un fragmento real y cópialo de vuelta al editor. Revisa la sangría y los signos.</li><li>Decide si necesitas archivos normales para Git o si basta con exportar Markdown.</li><li>Busca una función y parte de un error. Prueba también los signos de puntuación.</li><li>Enlaza una decisión con el informe del bug que la motivó. Comprueba cómo vuelves.</li><li>Pide al agente que lea una nota y cambie una línea. Revisa el resultado y cómo deshacerlo.</li></ul>
      <h2 id="obsidian">Obsidian para una biblioteca Markdown local</h2>
      <p>La bóveda de Obsidian es una carpeta normal del disco. Sus notas son archivos Markdown, así que puedes guardarlos en Git o permitir que un agente lea la carpeta. Los bloques de código admiten una etiqueta de lenguaje. Los enlaces conectan un fragmento con su explicación y la búsqueda puede limitarse por archivo o ruta.</p>
      <p>Su <a href="https://obsidian.md/help/cli">CLI oficial</a> puede buscar, leer y crear notas, y añadir texto. Necesita la app abierta; el primer comando la inicia si hace falta. El acceso directo a archivos sirve si quieres que el terminal trabaje con los mismos archivos que editas en Obsidian.</p>
      <h2 id="notion">Notion para documentación compartida</h2>
      <p>Notion sirve para notas de proyecto junto a tareas y bases de datos del equipo. Escribe <code>/code</code>, elige el lenguaje y usa Copy para llevar el fragmento al editor. Las menciones de páginas crean enlaces de vuelta. La búsqueda del espacio encuentra texto dentro de páginas; la de bases de datos busca títulos y valores de propiedades.</p>
      <p>El <a href="https://developers.notion.com/guides/mcp/overview">MCP oficial de Notion</a> permite buscar, crear y editar páginas y gestionar bases de datos. Puedes exportar páginas como Markdown y bases de datos como CSV. Es una copia para usar fuera; las ediciones actuales siguen en el espacio de trabajo.</p>
      <h2 id="joplin">Joplin para libretas Markdown y terminal</h2>
      <p>Joplin es de código abierto. Tiene editor Markdown y app de terminal, bloques de código delimitados y enlaces entre notas. La búsqueda filtra por libreta y etiqueta. Si antepones <code>/</code> a la consulta, la búsqueda básica incluye signos; Joplin advierte que puede ser más lenta.</p>
      <p>También documenta un <a href="https://joplinapp.org/help/apps/ai_mcp/">servidor MCP local oficial</a>. Web Clipper debe estar en marcha y hay que activar el servidor y cada herramienta. Las notas viven en una base de datos, con exportación Markdown disponible. Usa la app de terminal o MCP para trabajar con las notas actuales.</p>
      <h2 id="bear">Bear para explicaciones y fragmentos enlazados</h2>
      <p>Bear une Markdown y bloques de código coloreados según el lenguaje. Escribe <code>[[</code> para enlazar otra nota o uno de sus encabezados. Sirve para guardar fragmentos con explicación y enlaces a temas relacionados.</p>
      <p>Su <a href="https://bear.app/faq/command-line-interface/">CLI y MCP oficiales</a> pueden buscar, leer y editar notas localmente en un Mac. Bear guarda las notas en SQLite y puede exportar archivos .md. Sus herramientas de automatización son solo para Mac. Comprueba dónde funcionará tu agente.</p>
      <h2 id="apple">Notas de Apple para apuntes rápidos</h2>
      <p>Notas sirve para un registro de investigación, una lista o un fragmento breve con explicación. La búsqueda encuentra palabras y fijar la nota mantiene visible el proyecto actual. En Mac, Mayúsculas + Comando + M aplica Monoestilo. Usa Edición, Añadir enlace para relacionar notas.</p>
      <p>La <a href="https://support.apple.com/es-es/guide/notes/not201900c07/mac">guía de exportación de Apple</a> documenta Archivo, Exportar como, Markdown para una nota y Edición, Copiar en formato Markdown para el contenido seleccionado. Puedes dar esa copia al agente. Los cambios que haga en ella tendrás que llevarlos tú a Notas.</p>
      <h2 id="pinto">Pinto Notes para notas que el agente puede editar</h2>
      <p>Pinto Notes se parece a Notas de Apple en iPhone y Mac. Escribe <code>/</code> al principio de una línea y elige <strong>Code Block</strong>. Las notas son archivos Markdown, con rutas como <code>Work/Decision log.md</code>. Los agentes acceden mediante el servidor MCP alojado para buscar, leer y editar.</p>
      <p>La <a href="/blog/mcp-server" hrefLang="en">guía MCP</a> (en inglés) incluye Claude Code, Codex y Gemini CLI. La <a href="/blog/notes-in-claude-code-and-codex" hrefLang="en">guía de Claude Code y Codex</a> (en inglés) explica la conexión y una primera pregunta. Las ediciones de IA muestran los cambios con Deshacer y conservan todas las versiones anteriores. Pinto solo funciona en iPhone y Mac, sin app para Windows, Android ni web.</p>
      <h2 id="plantillas">Empieza con una plantilla para programar</h2>
      <p>Estas plantillas gratuitas de Pinto Notes dan una estructura a la nota e instrucciones al agente para mantenerla al día.</p>
      <ul><li><a href="/templates/bug-triage">Bug triage</a> clasifica el informe por gravedad y añade los pasos para reproducirlo cuando se proporcionan. Sus instrucciones para Claude Code también piden revisar el código para hallar una causa probable.</li><li><a href="/templates/daily-standup">Daily standup</a> guarda una sección por día de trabajo. Las instrucciones del agente redactan ayer a partir de tus commits y preguntan qué sigue y qué está bloqueado.</li><li><a href="/templates/decision-log">Decision log</a> guarda contexto, opciones y motivo de una decisión. Sus instrucciones nombran los archivos afectados y comprueban decisiones anteriores antes de proponer cambios.</li></ul>
      <p>La parte de IA funciona cuando conectas el agente. Para ChatGPT o Claude, sigue la <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">guía de conexión</a> (en inglés). Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar Notas de Apple</a> (guía en inglés) de una vez en el Mac. Las originales no cambian.</p>
    </LocalPostPage>;
}
