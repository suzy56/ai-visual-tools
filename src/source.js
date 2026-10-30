import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

/** Fingerprint the original UTF-8 snapshot without normalizing its text. */
export function sourceSha256(markdown) {
  return bytesToHex(sha256(utf8ToBytes(markdown)));
}
