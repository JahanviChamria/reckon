// Builds a branded, shareable result image from a finished session and hands it
// to the native share sheet (mobile) or a download (desktop). All client-side,
// no backend — the image is drawn on a canvas.

type ShareData = {
  cardsSeen: number;
  correct: number;
  total: number; // predictions made
  day: number;
  dateLabel: string;
};

const W = 1080;
const H = 1350;
const ACCENT = "#8b7cff";
const BG = "#0a0a12";
const FG = "#ececf0";
const MUTED = "#8a8a99";
const FAINT = "#55556a";

/** Resolve the app's actual (next/font-hashed) family names from the DOM so the
 *  canvas text matches the site. Falls back to generic families. */
function resolveFonts(): { serif: string; mono: string } {
  if (typeof document === "undefined") {
    return { serif: "Georgia, serif", mono: "monospace" };
  }
  const root = getComputedStyle(document.documentElement);
  const serif = root.getPropertyValue("--font-serif").trim();
  const mono = root.getPropertyValue("--font-mono").trim();
  return {
    serif: serif ? `${serif}, Georgia, serif` : "Georgia, serif",
    mono: mono ? `${mono}, monospace` : "monospace",
  };
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${px}px`;
  } catch {
    // Not supported — labels just render without extra tracking.
  }
}

async function draw(data: ShareData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Ensure web fonts are ready so canvas text uses them.
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* ignore */
  }
  const { serif, mono } = resolveFonts();

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Faint orbital ring motif, echoing the app's progress signature
  ctx.strokeStyle = "#20202e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 - 40, 430, 0, Math.PI * 2);
  ctx.stroke();
  // A short accent arc + travelling dot on the ring
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 - 40, 430, -Math.PI / 2, -Math.PI / 2 + 1.4);
  ctx.stroke();
  const a = -Math.PI / 2 + 1.4;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W / 2 + 430 * Math.cos(a), H / 2 - 40 + 430 * Math.sin(a), 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";

  // Wordmark
  ctx.fillStyle = MUTED;
  ctx.font = `600 30px ${mono}`;
  setLetterSpacing(ctx, 8);
  ctx.fillText("RECKON", W / 2, 250);
  setLetterSpacing(ctx, 0);

  // Accent divider
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 46, 300);
  ctx.lineTo(W / 2 + 46, 300);
  ctx.stroke();

  // Headline
  ctx.fillStyle = FG;
  ctx.font = `400 104px ${serif}`;
  ctx.fillText("That’s today.", W / 2, 500);

  // Subtitle
  ctx.fillStyle = MUTED;
  ctx.font = `400 38px ${serif}`;
  ctx.fillText("A scroll feed that ends.", W / 2, 570);

  // Stats
  const stats: [string, string][] = [
    [String(data.cardsSeen), "CARDS"],
    [data.total ? `${data.correct}/${data.total}` : "—", "PREDICTIONS"],
    [String(data.day), "DAY"],
  ];
  const cols = [W / 2 - 300, W / 2, W / 2 + 300];
  const statsY = 820;
  stats.forEach(([value, label], i) => {
    ctx.fillStyle = FG;
    ctx.font = `600 78px ${mono}`;
    setLetterSpacing(ctx, 0);
    ctx.fillText(value, cols[i], statsY);
    ctx.fillStyle = FAINT;
    ctx.font = `500 26px ${mono}`;
    setLetterSpacing(ctx, 4);
    ctx.fillText(label, cols[i], statsY + 52);
    setLetterSpacing(ctx, 0);
  });

  // Footer
  ctx.fillStyle = FAINT;
  ctx.font = `500 28px ${mono}`;
  setLetterSpacing(ctx, 3);
  ctx.fillText(data.dateLabel.toUpperCase(), W / 2, 1190);
  setLetterSpacing(ctx, 0);
  ctx.fillStyle = MUTED;
  ctx.font = `400 32px ${serif}`;
  ctx.fillText("Bite-size interactive science.", W / 2, 1240);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}

export type ShareResult = "shared" | "downloaded" | "error";

/** Draw the result image, then share it natively or download it. */
export async function shareResult(data: ShareData): Promise<ShareResult> {
  try {
    const blob = await draw(data);
    const file = new File([blob], "reckon-today.png", { type: "image/png" });

    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        files: [file],
        title: "Reckon",
        text: "That’s today. A scroll feed that ends.",
      });
      return "shared";
    }

    // Fallback: download the PNG.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reckon-today.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  } catch (err) {
    // User cancelling the native share sheet throws AbortError — treat as no-op.
    if (err instanceof DOMException && err.name === "AbortError") return "shared";
    return "error";
  }
}
