const MAX_CRYPTO_FILL_BYTES = 65536;
const MAX_CRYPTO_FILL_U32 = MAX_CRYPTO_FILL_BYTES / Uint32Array.BYTES_PER_ELEMENT;
const MAX_U32_EXCLUSIVE = 0x100000000;

/**
 * Fill an existing Uint32Array with random data.
 * Uses chunked crypto fills to stay within Web Crypto per-call quotas.
 */
export function fillRandomUint32Array(data: Uint32Array): Uint32Array {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    for (let offset = 0; offset < data.length; offset += MAX_CRYPTO_FILL_U32) {
      const chunkLength = Math.min(MAX_CRYPTO_FILL_U32, data.length - offset);
      const chunk = new Uint32Array(chunkLength);
      crypto.getRandomValues(chunk);
      data.set(chunk, offset);
    }
    return data;
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * MAX_U32_EXCLUSIVE);
  }

  return data;
}

/**
 * Create a random Uint32Array of the requested size.
 */
export function createRandomUint32Array(size: number): Uint32Array {
  return fillRandomUint32Array(new Uint32Array(size));
}
