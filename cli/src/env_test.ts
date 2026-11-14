import { assertEquals } from "@std/assert";
import { env, envName } from "./env.ts";

Deno.test("PINTO_ settings, with the AMBER_ ones still read", () => {
  const was = { p: Deno.env.get("PINTO_TOKEN"), a: Deno.env.get("AMBER_TOKEN") };
  try {
    Deno.env.delete("PINTO_TOKEN");
    Deno.env.delete("AMBER_TOKEN");
    assertEquals(env("TOKEN"), undefined);
    Deno.env.set("AMBER_TOKEN", "old");
    assertEquals([env("TOKEN"), envName("TOKEN")], ["old", "AMBER_TOKEN"]);
    Deno.env.set("PINTO_TOKEN", "new");
    assertEquals([env("TOKEN"), envName("TOKEN")], ["new", "PINTO_TOKEN"]);
  } finally {
    for (const [k, v] of [["PINTO_TOKEN", was.p], ["AMBER_TOKEN", was.a]] as const) v === undefined ? Deno.env.delete(k) : Deno.env.set(k, v);
  }
});
