const _alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const _alphabetIdx = [
  62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 64, -1, -1,
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
];

export function encode(input: Uint8Array | string): string {
  if (!(input instanceof Uint8Array || typeof input === 'string')) {
    throw new TypeError('"input" be a string or Uint8Array.');
  }
  if (typeof input === 'string') {
    // convert input to Uint8Array
    input = new TextEncoder().encode(input);
  }
  let output = '';
  let chr1;
  let chr2;
  let chr3;
  let i = 0;
  while (i < input.byteLength) {
    chr1 = input[i++];
    chr2 = input[i++];
    chr3 = input[i++];

    // encode 4 character group
    output += _alphabet.charAt(chr1 >> 2);
    output += _alphabet.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
    if (!isNaN(chr2)) {
      output += _alphabet.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
      if (!isNaN(chr3)) {
        output += _alphabet.charAt(chr3 & 63);
      }
    }
  }
  return output;
}

export function decode(input: string): Uint8Array {
  let length = input.length;
  const mod4 = length % 4;
  if (mod4 === 1) {
    throw new Error('Illegal base64 string.');
  }
  let diff = 0;
  if (mod4 > 0) {
    diff = 4 - mod4;
    length += diff;
  }

  const output = new Uint8Array((length / 4) * 3 - diff);

  let enc1;
  let enc2;
  let enc3;
  let enc4;
  let i = 0;
  let j = 0;

  while (i < length) {
    enc1 = _alphabetIdx[input.charCodeAt(i++) - 45];
    enc2 = _alphabetIdx[input.charCodeAt(i++) - 45];

    output[j++] = (enc1 << 2) | (enc2 >> 4);
    if (i < input.length) {
      // can decode at least 2 bytes
      enc3 = _alphabetIdx[input.charCodeAt(i++) - 45];
      output[j++] = ((enc2 & 15) << 4) | (enc3 >> 2);
      if (i < input.length) {
        // can decode 3 bytes
        enc4 = _alphabetIdx[input.charCodeAt(i++) - 45];
        output[j++] = ((enc3 & 3) << 6) | enc4;
      }
    }
  }

  return output;
}
