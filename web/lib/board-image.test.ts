// A picture for the browser board, made ready as the app makes one (CanvasImage): at most 2560
// pixels on its long side, a PNG when it has see-through parts or is a small screenshot, else a
// JPEG at most 1920 (a board keeps 4 MB in all).
import { describe, expect, it } from "vitest";
import { bytesOf, choose, fitSide, MAX_SIDE, PHOTO_SIDE, PNG_LIMIT, prepareImage } from "./board-image";

describe("a picture for the board", () => {
  it("is at most so many pixels on its long side, its shape kept, never made bigger", () => {
    expect(fitSide(5120, 2880, MAX_SIDE)).toEqual({ width: 2560, height: 1440 });
    expect(fitSide(3000, 4000, PHOTO_SIDE)).toEqual({ width: 1440, height: 1920 });
    expect(fitSide(800, 600, MAX_SIDE)).toEqual({ width: 800, height: 600 });
  });

  it("is a PNG when it has see-through parts or is small, unless a JPEG is under half its size; else a JPEG", () => {
    expect(choose(3_000_000, 200_000, true)).toBe("png");
    expect(choose(900_000, 600_000, false)).toBe("png");
    expect(choose(900_000, 300_000, false)).toBe("jpeg");
    expect(choose(PNG_LIMIT + 1, PNG_LIMIT, false)).toBe("jpeg");
  });

  it("counts a data URL's bytes", () => {
    expect(bytesOf("data:image/png;base64,AAAA")).toBe(3);
    expect(bytesOf("nonsense")).toBe(0);
  });

  it("is nothing for a file that isn't a picture", async () => {
    expect(await prepareImage(new Blob(["hello"], { type: "text/plain" }))).toBeNull();
  });
});
