// A picture for the browser board (the palette's Insert Image, or 9): made ready as the Mac app
// makes one (CanvasImage in Pane/Model/CanvasBridge.swift), then given to the page as its "image"
// command, which puts it in the middle of the view. A board keeps 4 MB in all, and a screenshot as
// it comes is often 2 MB or more.

export type BoardImage = { dataURL: string; mimeType: string; width: number; height: number };

/** Sharp enough for a retina screenshot's small text, zoomed in. */
export const MAX_SIDE = 2560;
/** A photo needs less: grain costs bytes, and it isn't read up close. */
export const PHOTO_SIDE = 1920;
/** Past this a picture is a JPEG, however it compresses. */
export const PNG_LIMIT = 1_200_000;

/** Its size at most `side` pixels on its long side. */
export function fitSide(width: number, height: number, side: number): { width: number; height: number } {
  const k = Math.min(1, side / Math.max(width, height, 1));
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

/** What a data URL holds, in bytes. */
export function bytesOf(dataURL: string): number {
  const comma = dataURL.indexOf(",");
  return comma < 0 ? 0 : Math.floor(((dataURL.length - comma - 1) * 3) / 4);
}

/** PNG or JPEG, as the app chooses: a PNG when it has see-through parts, or when it's small enough
 *  (a screenshot: flat colours and text stay crisp) and a JPEG isn't under half its size; else a
 *  JPEG. */
export function choose(png: number, jpeg: number, seeThrough: boolean): "png" | "jpeg" {
  if (seeThrough) return "png";
  if (png <= PNG_LIMIT && jpeg * 2 >= png) return "png";
  return "jpeg";
}

/** The picture, drawn at a side, as a data URL. */
function draw(source: CanvasImageSource, w: number, h: number, side: number, type: string, quality?: number): { url: string; width: number; height: number; canvas: HTMLCanvasElement } | null {
  const size = fitSide(w, h, side);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, size.width, size.height);
  return { url: canvas.toDataURL(type, quality), ...size, canvas };
}

/** Whether any pixel is see-through (a PNG with a clear background keeps it). */
function seeThrough(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const w = Math.min(canvas.width, 256), h = Math.min(canvas.height, 256);
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const s = small.getContext("2d");
  if (!s) return true;
  s.drawImage(canvas, 0, 0, w, h);
  const px = s.getImageData(0, 0, w, h).data;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) return true;
  return false;
}

/** A file the visitor picked, ready for the page; null if it isn't a picture the browser can read. */
export async function prepareImage(file: Blob): Promise<BoardImage | null> {
  if (!file.type.startsWith("image/")) return null;
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { return null; }
  try {
    const png = draw(bitmap, bitmap.width, bitmap.height, MAX_SIDE, "image/png");
    if (!png) return null;
    const alpha = seeThrough(png.canvas);
    const jpeg = alpha ? null : draw(bitmap, bitmap.width, bitmap.height, MAX_SIDE, "image/jpeg", 0.85);
    if (choose(bytesOf(png.url), jpeg ? bytesOf(jpeg.url) : Infinity, alpha) === "png") {
      return { dataURL: png.url, mimeType: "image/png", width: png.width, height: png.height };
    }
    const photo = draw(bitmap, bitmap.width, bitmap.height, PHOTO_SIDE, "image/jpeg", 0.82);
    return photo ? { dataURL: photo.url, mimeType: "image/jpeg", width: photo.width, height: photo.height } : null;
  } finally {
    bitmap.close();
  }
}
