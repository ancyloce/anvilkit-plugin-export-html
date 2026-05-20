const BTOA_CHUNK_SIZE = 0x8000;

export function encodeBase64(bytes: Uint8Array): string {
  const bufferCtor = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from(data: Uint8Array): { toString(encoding: string): string };
      };
    }
  ).Buffer;

  if (bufferCtor) {
    return bufferCtor.from(bytes).toString("base64");
  }

  if (typeof btoa !== "function") {
    throw new Error("Base64 encoding is not supported in this environment.");
  }

  let binary = "";

  for (let index = 0; index < bytes.length; index += BTOA_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BTOA_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}
