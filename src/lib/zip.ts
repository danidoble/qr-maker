/**
 * Minimal ZIP writer (STORE, no compression) that runs in the browser.
 *
 * Images are already compressed, so deflating them again buys almost nothing
 * and costs a lot of CPU. Entries are kept as Blobs and the archive is a Blob
 * made of Blobs, so the browser can page large archives to disk instead of
 * holding one giant ArrayBuffer.
 *
 * Limits (no ZIP64): < 65 535 entries and < 4 GiB in total.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const MAX_U32 = 0xffffffff;
const utf8 = new TextEncoder();

interface Entry {
  name: Uint8Array<ArrayBuffer>;
  crc: number;
  size: number;
  offset: number;
}

export class ZipWriter {
  private parts: BlobPart[] = [];
  private entries: Entry[] = [];
  private offset = 0;
  private readonly time: number;
  private readonly date: number;

  constructor(now = new Date()) {
    this.time =
      (now.getHours() << 11) |
      (now.getMinutes() << 5) |
      Math.floor(now.getSeconds() / 2);
    this.date =
      ((Math.max(1980, now.getFullYear()) - 1980) << 9) |
      ((now.getMonth() + 1) << 5) |
      now.getDate();
  }

  get size() {
    return this.offset;
  }

  async add(name: string, data: Blob | string): Promise<void> {
    const blob = typeof data === "string" ? new Blob([data]) : data;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const nameBytes = utf8.encode(name) as Uint8Array<ArrayBuffer>;
    const crc = crc32(bytes);

    if (this.entries.length >= 0xffff)
      throw new Error("Too many files for one ZIP (max 65 535).");
    if (this.offset + 30 + nameBytes.length + bytes.length > MAX_U32)
      throw new Error(
        "ZIP would exceed 4 GB. Use a smaller size or fewer codes.",
      );

    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); // local file header
    h.setUint16(4, 20, true); // version needed
    h.setUint16(6, 0x0800, true); // flags: UTF-8 names
    h.setUint16(8, 0, true); // method: store
    h.setUint16(10, this.time, true);
    h.setUint16(12, this.date, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, bytes.length, true);
    h.setUint32(22, bytes.length, true);
    h.setUint16(26, nameBytes.length, true);
    h.setUint16(28, 0, true);

    this.entries.push({
      name: nameBytes,
      crc,
      size: bytes.length,
      offset: this.offset,
    });
    // Keep the Blob (not the bytes) so the buffer can be collected.
    this.parts.push(h.buffer, nameBytes, blob);
    this.offset += 30 + nameBytes.length + bytes.length;
  }

  finish(): Blob {
    const start = this.offset;
    const central: BlobPart[] = [];
    let cdSize = 0;
    for (const e of this.entries) {
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); // central directory header
      c.setUint16(4, 20, true); // version made by
      c.setUint16(6, 20, true); // version needed
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, this.time, true);
      c.setUint16(14, this.date, true);
      c.setUint32(16, e.crc, true);
      c.setUint32(20, e.size, true);
      c.setUint32(24, e.size, true);
      c.setUint16(28, e.name.length, true);
      // extra, comment, disk, internal attrs = 0
      c.setUint32(38, 0, true); // external attrs
      c.setUint32(42, e.offset, true);
      central.push(c.buffer, e.name);
      cdSize += 46 + e.name.length;
    }
    if (start + cdSize + 22 > MAX_U32)
      throw new Error(
        "ZIP would exceed 4 GB. Use a smaller size or fewer codes.",
      );

    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); // end of central directory
    end.setUint16(8, this.entries.length, true);
    end.setUint16(10, this.entries.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, start, true);

    return new Blob([...this.parts, ...central, end.buffer], {
      type: "application/zip",
    });
  }
}
