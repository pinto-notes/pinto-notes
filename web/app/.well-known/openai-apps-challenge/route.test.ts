import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { challengeToken } from "@/lib/openai-challenge";

describe("openai-apps-challenge", () => {
  it("answers each MCP host with its own plugin's token, bare text", async () => {
    const res = GET(new Request("https://mcp.pintonotes.com/.well-known/openai-apps-challenge", { headers: { host: "mcp.pintonotes.com" } }));
    expect(await res.text()).toBe("k11dzM9GOLGKrm56UKtMrtnzfMMa2vgeoD9qbJ5VaE8");
    expect(challengeToken("mcp.ambernotes.app")).toBe("63ThANIdhp-bJNHKaegib3mD6AXGcWuB4Dvwj-m3eqs");
  });
  it("keeps the Amber Notes token for any other host", () => {
    expect(challengeToken("pintonotes.com")).toBe("63ThANIdhp-bJNHKaegib3mD6AXGcWuB4Dvwj-m3eqs");
  });
});
