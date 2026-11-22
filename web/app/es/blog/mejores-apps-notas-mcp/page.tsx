import { Figure } from "@/lib/blog";
import { MCP_URL } from "@/lib/facts";
import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "mejores-apps-notas-mcp");

// Versión de /blog/best-notes-apps-with-mcp. Autocomplete, hl=es, gl=es,
// 21 Nov 2026: "mejor app de notas con mcp", "app notas mcp" y "notas mcp"
// no devolvieron sugerencias. Se usa "apps de notas con MCP", sin afirmar volumen.
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/
// apd441e46563/mac (iCloud, listas de comprobación, tablas y archivos; sin ruta MCP).
// Los demás datos proceden de las fuentes oficiales citadas en el original inglés:
// Bear CLI, Obsidian, Notion, Notesnook y Standard Notes. No se probaron sus conexiones.
// Captura inglesa reutilizada de una edición con IA en Pinto Notes.
const ui = UI.es;
const ROWS = [
  { app: "Pinto Notes", route: "Servidor MCP oficial alojado", use: "Buscar, leer, crear y editar notas. Apruebas cada app de IA.", fit: "La experiencia de Notas de Apple en iPhone y Mac, con acceso de IA desde otros lugares.", limit: "Solo para dispositivos Apple. No hace falta dejar el Mac encendido." },
  { app: "Obsidian", route: "Complemento MCP de la comunidad", use: "Local REST API con MCP permite buscar, leer y escribir, incluso editar una sección.", fit: "Una biblioteca local de archivos Markdown editables con otras herramientas.", limit: "El complemento se ejecuta dentro de Obsidian en tu ordenador. Lo hizo Adam Coddington, no Obsidian." },
  { app: "Bear", route: "Servidor MCP local oficial", use: "bearcli permite buscar, leer, crear y editar notas.", fit: "Conectar tus notas actuales de Bear a un cliente de IA local.", limit: "Solo en Mac, con Bear 2.8 o posterior. Las notas cifradas no son accesibles por estas herramientas." },
  { app: "Notesnook", route: "Experimento de la comunidad; sin configuración MCP oficial encontrada", use: "Un autor de la comunidad anunció un puente local en sus debates.", fit: "Notas de código abierto con cuadernos, etiquetas y capturador web.", limit: "El puente es experimental y no oficial. La ayuda consultada no documenta una conexión MCP compatible." },
  { app: "Notion", route: "Servidor MCP oficial alojado", use: "Buscar en el espacio de trabajo, crear y editar páginas y gestionar bases de datos.", fit: "Notas junto a documentos y bases de datos de proyectos del equipo.", limit: "La conexión usa tus permisos de Notion. Revisa a qué puede acceder tu cuenta." },
  { app: "Notas de Apple", route: "Sin configuración MCP oficial en la guía de Notas", use: "La guía explica Notas, sin una conexión MCP.", fit: "Notas con iCloud, listas de comprobación, tablas y archivos en dispositivos Apple.", limit: "No se encontró una ruta MCP de Apple en la documentación consultada." },
];
const FAQ = [
  { q: "¿Qué apps de notas documentan un servidor MCP propio?", a: ["Pinto Notes y Notion tienen servidores alojados. Bear documenta uno oficial que funciona localmente en Mac. El complemento de Obsidian y el experimento de Notesnook mencionados aquí son de la comunidad. No hemos probado las conexiones de esas otras apps."] },
  { q: "¿Funciona el MCP de Bear en iPhone?", a: ["No. Bear indica que su CLI, Claude Connector y servidor MCP solo funcionan en macOS con Bear 2.8 o posterior. Claude Connector también necesita la app de escritorio de Claude."] },
  { q: "¿MCP es una función oficial de Notesnook?", a: ["No encontramos una configuración MCP oficial en la ayuda consultada el 21 de noviembre de 2026. Un autor publicó un puente local experimental en los debates del proyecto. No es oficial ni lo hemos probado."] },
  { q: "¿Standard Notes documenta una conexión MCP?", a: ["El índice de ayuda consultado el 21 de noviembre de 2026 no documentaba una configuración MCP. Eso no demuestra que no exista un proyecto de la comunidad. No hemos probado una conexión MCP de Standard Notes."] },
];
export default function Page() {
  return <LocalPostPage lang="es" slug="mejores-apps-notas-mcp"
    intro={<>Pinto Notes y Notion tienen servidores MCP alojados. Bear ofrece uno local y oficial para Mac. Obsidian cuenta con complementos de la comunidad, Notesnook con un experimento y la guía de Notas de Apple no documenta MCP.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#comparar", label: "Las seis apps" }, { href: "#alojados", label: "Conexiones alojadas" },
      { href: "#locales", label: "Conexiones locales" }, { href: "#apple", label: "Notas de Apple" },
      { href: "#pinto", label: "Pinto Notes" },
    ]}>
      <p>Elige Pinto Notes si quieres una app parecida a Notas de Apple cuyo MCP alojado permita a ChatGPT o Claude leer y editar tus notas. Notion sirve para trabajo compartido con páginas y bases de datos. Bear conecta tus notas existentes a una IA en Mac. El complemento de Obsidian encaja con archivos Markdown locales. Investiga el puente experimental de Notesnook antes de cambiarte.</p>
      <PostCta slug="es/mejores-apps-notas-mcp" path="/es/blog/mejores-apps-notas-mcp" position="answer" ui={ui.cta} title="Tus notas, conectadas a tu IA"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Su MCP alojado permite a ChatGPT o Claude buscar, leer y editar notas, con Deshacer y versiones anteriores.</p></PostCta>
    </Answer>} hero={<></>} faq={FAQ}>
      <h2 id="comparar">Seis apps de notas y sus conexiones MCP</h2>
      <p>MCP son las siglas de Model Context Protocol. Permite que una app de IA compatible use herramientas para trabajar con tus notas. La tabla compara lo documentado por cada app, consultado el 21 de noviembre de 2026. Publicamos Pinto Notes. No hemos probado las conexiones de las otras apps ni los servidores comunitarios mencionados.</p>
      <div className="tableWrap"><table><thead><tr><th scope="col">App de notas</th><th scope="col">Ruta MCP</th><th scope="col">Qué describe su documentación</th><th scope="col">Para quién sirve</th><th scope="col">Qué conviene saber</th></tr></thead><tbody>{ROWS.map(row => <tr key={row.app}><th scope="row">{row.app}</th><td>{row.route}</td><td>{row.use}</td><td>{row.fit}</td><td>{row.limit}</td></tr>)}</tbody></table></div>
      <h2 id="alojados">Pinto Notes y Notion tienen conexiones alojadas</h2>
      <p>Un servidor MCP alojado da a la IA una dirección de internet. Autorizas la conexión y después le pides que use sus herramientas. La dirección de Pinto Notes es <code>{MCP_URL}</code>. Apruebas cada app de IA. Puedes deshacer sus cambios y consultar versiones anteriores.</p>
      <p>El <a href="https://developers.notion.com/guides/mcp/get-started-with-mcp">servidor oficial de Notion</a> está en <code>https://mcp.notion.com/mcp</code>. Sus <a href="https://developers.notion.com/guides/mcp/overview">herramientas documentadas</a> buscan en el espacio de trabajo, editan páginas y gestionan bases de datos. Sirve si las notas de reuniones van junto al trabajo del equipo. Respeta los permisos de Notion que ya tienes.</p>
      <h2 id="locales">Bear y Obsidian se conectan en tu ordenador</h2>
      <p>Bear tiene un servidor propio. Su <a href="https://bear.app/faq/command-line-interface/">guía oficial</a> documenta <code>bearcli mcp-server</code>, incluido con Bear para Mac. Claude Connector se instala desde Help, Advanced, Install Claude Connector. Ambos usan la base local de Bear. Puedes limitar las notas visibles por etiqueta. Las notas cifradas quedan fuera de esas herramientas.</p>
      <p>Obsidian guarda una <a href="https://obsidian.md/help/data-storage">carpeta de archivos Markdown</a>. Su directorio comunitario incluye <a href="https://community.obsidian.md/plugins/obsidian-local-rest-api">Local REST API con MCP</a>, de Adam Coddington. Añade un servidor local con clave API y puede editar un encabezado o bloque concreto. Esta ruta necesita que Obsidian y el ordenador sigan encendidos.</p>
      <p>Bear fabrica su conexión. El complemento de Obsidian lo hizo la comunidad. Ninguna de esas dos conexiones es un servicio alojado. La <a href="/blog/obsidian-mcp" hrefLang="en">comparación de MCP para Obsidian</a> (en inglés) trata otras opciones, incluidos servidores que trabajan con los archivos de la bóveda.</p>
      <h2 id="notesnook">Notesnook tiene un experimento comunitario</h2>
      <p><a href="https://notesnook.com/">Notesnook</a> es de código abierto y tiene cuadernos, etiquetas y capturador web. Las <a href="https://notesnook.com/help/">páginas de ayuda</a> consultadas no documentaban una configuración MCP oficial.</p>
      <p>Un autor publicó un <a href="https://github.com/streetwriters/notesnook/discussions/10571">puente MCP local experimental</a> en el repositorio de Notesnook y lo describió como no oficial. Una publicación en los debates no convierte el puente en una función compatible de Notesnook. No lo hemos probado. Si ya usas la app, lee los requisitos actuales del proyecto antes de decidir.</p>
      <h2 id="apple">¿Y MCP para Notas de Apple?</h2>
      <p>Notas de Apple sirve para notas en iCloud con listas de comprobación, tablas y archivos. Su <a href="https://support.apple.com/es-es/guide/notes/apd441e46563/mac">guía de uso</a> explica esas funciones, pero no documenta un servidor MCP. No encontramos una configuración de Apple para MCP en la documentación consultada.</p>
      <p>Tenlo presente si ves un resultado que dice "Apple Notes MCP". Esta tabla no verifica las capacidades de proyectos comunitarios.</p>
      <h2 id="pinto">Pinto Notes conserva el estilo de Notas de Apple</h2>
      <p>Pinto Notes funciona en iPhone y Mac. No tiene app para Windows, Android ni web. Su servidor alojado permite a ChatGPT y Claude usar tus notas sin dejar el Mac encendido. Claude Code y Codex también pueden conectarse. La <a href="/blog/mcp-server" hrefLang="en">guía del servidor MCP</a> (en inglés) enumera las herramientas y explica la aprobación.</p>
      <Figure shot={SHOTS.aiEdit} caption="ChatGPT añadió cinco líneas a una nota de la compra en Pinto Notes para Mac. Los cambios aparecen resaltados, con Deshacer. Captura en inglés." />
      <p>Una IA puede buscar y leer notas, crear una o editar otra. Ves lo que cambió, puedes deshacerlo y volver a una versión anterior. Para traer tu biblioteca, <a href="/blog/import-your-notes" hrefLang="en">importa Notas de Apple en el Mac</a> (guía en inglés). Las originales no cambian.</p>
    </LocalPostPage>;
}
