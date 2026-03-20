export interface ImageMeta {
  prompt?: string;
  negativePrompt?: string;
  seed?: string;
  steps?: string;
  cfgScale?: string;
  sampler?: string;
  source: "a1111" | "comfyui" | "none";
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function parsePngTextChunks(buffer: ArrayBuffer): Record<string, string> {
  const data = new Uint8Array(buffer);
  const result: Record<string, string> = {};

  // Verify PNG signature
  if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) return result;

  const decoder = new TextDecoder();
  let offset = 8; // skip 8-byte signature

  while (offset + 12 <= data.length) {
    const length = readUint32BE(data, offset);
    const type = decoder.decode(data.slice(offset + 4, offset + 8));

    if (type === "IEND") break;

    if (type === "tEXt" && length > 0) {
      const chunk = data.slice(offset + 8, offset + 8 + length);
      const nullIdx = chunk.indexOf(0);
      if (nullIdx > 0) {
        const key = decoder.decode(chunk.slice(0, nullIdx));
        const value = decoder.decode(chunk.slice(nullIdx + 1));
        result[key] = value;
      }
    } else if (type === "iTXt" && length > 0) {
      const chunk = data.slice(offset + 8, offset + 8 + length);
      const nullIdx = chunk.indexOf(0);
      if (nullIdx > 0) {
        const key = decoder.decode(chunk.slice(0, nullIdx));
        let pos = nullIdx + 1;
        const compressionFlag = chunk[pos];
        pos += 2; // skip compression flag + method
        while (pos < chunk.length && chunk[pos] !== 0) pos++; // language tag
        pos++;
        while (pos < chunk.length && chunk[pos] !== 0) pos++; // translated keyword
        pos++;
        if (compressionFlag === 0 && pos < chunk.length) {
          result[key] = decoder.decode(chunk.slice(pos));
        }
      }
    }

    offset += 12 + length; // length(4) + type(4) + data(length) + crc(4)
  }

  return result;
}

function parseA1111Params(raw: string): Omit<ImageMeta, "source"> {
  // Format:
  //   <positive prompt lines>
  //   Negative prompt: <negative lines>
  //   Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 12345, ...
  const lines = raw.split("\n");
  const promptLines: string[] = [];
  const negLines: string[] = [];
  let seed = "", steps = "", cfgScale = "", sampler = "";
  let mode: "prompt" | "negative" | "params" = "prompt";

  for (const line of lines) {
    if (mode === "prompt" && line.startsWith("Negative prompt:")) {
      mode = "negative";
      negLines.push(line.replace("Negative prompt:", "").trim());
    } else if (mode !== "params" && /^Steps:\s*\d+/.test(line)) {
      mode = "params";
      const m = {
        steps:    line.match(/Steps:\s*(\d+)/),
        sampler:  line.match(/Sampler:\s*([^,]+)/),
        cfg:      line.match(/CFG scale:\s*([\d.]+)/),
        seed:     line.match(/Seed:\s*(\d+)/),
      };
      if (m.steps)   steps    = m.steps[1];
      if (m.sampler) sampler  = m.sampler[1].trim();
      if (m.cfg)     cfgScale = m.cfg[1];
      if (m.seed)    seed     = m.seed[1];
    } else if (mode === "prompt") {
      promptLines.push(line);
    } else if (mode === "negative") {
      negLines.push(line);
    }
  }

  return {
    prompt:         promptLines.join("\n").trim(),
    negativePrompt: negLines.join("\n").trim(),
    seed, steps, cfgScale, sampler,
  };
}

function parseComfyUI(promptJson: string): Omit<ImageMeta, "source"> {
  try {
    const graph = JSON.parse(promptJson) as Record<string, { class_type: string; inputs: Record<string, unknown> }>;
    let seed = "", steps = "", cfgScale = "", sampler = "";

    for (const node of Object.values(graph)) {
      if (node.class_type === "KSampler" || node.class_type === "KSamplerAdvanced") {
        seed      = String(node.inputs.seed     ?? node.inputs.noise_seed ?? "");
        steps     = String(node.inputs.steps    ?? "");
        cfgScale  = String(node.inputs.cfg      ?? "");
        sampler   = String(node.inputs.sampler_name ?? "");
        break;
      }
    }

    return { seed, steps, cfgScale, sampler };
  } catch {
    return {};
  }
}

export async function extractImageMeta(file: File): Promise<ImageMeta> {
  if (file.type !== "image/png") return { source: "none" };

  const buffer = await file.arrayBuffer();
  const chunks = parsePngTextChunks(buffer);

  // A1111 / Forge / Fooocus — all use "parameters" key
  if (chunks["parameters"]) {
    return { ...parseA1111Params(chunks["parameters"]), source: "a1111" };
  }

  // ComfyUI embeds workflow + prompt JSON
  if (chunks["prompt"] || chunks["workflow"]) {
    const data = parseComfyUI(chunks["prompt"] ?? chunks["workflow"] ?? "");
    return { ...data, source: "comfyui" };
  }

  return { source: "none" };
}
