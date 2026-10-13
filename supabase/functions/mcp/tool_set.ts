// Which tools the server serves, by the AMBER_MCP_TOOLS setting. One answer for tools/list, tool
// calls, the instructions, the prompts, the resources and the public server card.
//
//   unset or "files"  the file tools (files_tools.ts): notes, files and apps as paths. Production.
//   "pages"           every classic note tool and app tool (tools.ts), the fallback.
//   "classic"         the classic note tools alone, as production served them until 13 October 2026.

// tools.ts first: the modules it and files_tools.ts share load in its order.
import { classicTools, type Tool } from "./tools.ts";
import { FILE_TOOLS } from "./files_tools.ts";

export type ToolSet = "files" | "pages" | "classic";

export function toolSet(set: string | undefined = Deno.env.get("AMBER_MCP_TOOLS")): ToolSet {
  return set === "pages" || set === "classic" ? set : "files";
}

/** The tools this server serves, in the order tools/list gives them. */
export function servedTools(set: string | undefined = Deno.env.get("AMBER_MCP_TOOLS")): Tool[] {
  const s = toolSet(set);
  return s === "files" ? FILE_TOOLS : classicTools(s);
}
