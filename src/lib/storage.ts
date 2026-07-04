import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Lagringsabstraktion för uppladdade bilagor (bilder på arbetsordrar).
 *
 * Just nu finns EN driver: filsystemet. Den skriver till `UPLOAD_DIR`
 * (env, default `<projekt>/uploads`). På Railway pekar man `UPLOAD_DIR` mot en
 * monterad Volume-sökväg (t.ex. `/data/uploads`) så filerna överlever
 * omdeployer – ingen kodändring krävs.
 *
 * Vill man senare byta till objektlagring (Cloudflare R2 / S3) implementerar man
 * en ny driver mot `StorageDriver`-interfacet och pekar `storage` på den. Inget
 * annat i appen känner till hur filerna faktiskt lagras – de refererar bara till
 * `storageKey`.
 */
export interface StorageDriver {
  /** Sparar bytes och returnerar en ogenomskinlig nyckel (`storageKey`). */
  save(
    bytes: Uint8Array,
    opts: { ext: string; prefix?: string },
  ): Promise<string>;
  /** Läser tillbaka bytes för en nyckel, eller null om filen saknas. */
  read(key: string): Promise<Buffer | null>;
  /** Tar bort filen för en nyckel (tyst om den redan är borta). */
  delete(key: string): Promise<void>;
}

const UPLOAD_DIR =
  process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim().length
    ? process.env.UPLOAD_DIR
    : path.join(process.cwd(), "uploads");

/**
 * Löser en nyckel till en absolut sökväg OCH säkerställer att den ligger kvar
 * inuti UPLOAD_DIR – skyddar mot path traversal (t.ex. "../../etc/passwd").
 */
function resolveWithinRoot(key: string): string | null {
  const full = path.resolve(UPLOAD_DIR, key);
  const root = path.resolve(UPLOAD_DIR);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

/** Rensar en filändelse till något ofarligt (bokstäver/siffror, inledande punkt). */
function safeExt(ext: string): string {
  const cleaned = ext.replace(/[^a-z0-9.]/gi, "").toLowerCase();
  if (!cleaned) return "";
  return cleaned.startsWith(".") ? cleaned : `.${cleaned}`;
}

const filesystemDriver: StorageDriver = {
  async save(bytes, { ext, prefix = "workorders" }) {
    const key = `${prefix}/${randomUUID()}${safeExt(ext)}`;
    const full = resolveWithinRoot(key);
    if (!full) throw new Error("Ogiltig lagringsnyckel.");
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    return key;
  },

  async read(key) {
    const full = resolveWithinRoot(key);
    if (!full) return null;
    try {
      return await fs.readFile(full);
    } catch {
      return null;
    }
  },

  async delete(key) {
    const full = resolveWithinRoot(key);
    if (!full) return;
    try {
      await fs.unlink(full);
    } catch {
      // Redan borta – inget att göra.
    }
  },
};

/**
 * Den aktiva lagringsdrivern. Byt ut denna rad (och lägg till en driver ovan)
 * för att flytta lagringen till volym/objektlagring senare.
 */
export const storage: StorageDriver = filesystemDriver;
