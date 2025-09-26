import { getEventHash, utils as nostrUtils } from 'https://esm.sh/nostr-tools';
import { schnorr } from 'https://esm.sh/@noble/curves/secp256k1';
import CodeForNLID from './CodeForNLID.mjs';

export default async function createNostrEvent(content, tag) {
  const privkey = CodeForNLID.getPrivateKey();
  const pubkey = CodeForNLID.getPublicKey();
  const username = CodeForNLID.getCurrentUsername();

  // For anonymous posting, generate a temporary key pair
  let actualPrivkey = privkey;
  let actualPubkey = pubkey;
  
  if (!privkey || !pubkey) {
    // Generate temporary anonymous key pair
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    actualPrivkey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const { getPublicKey } = await import('https://esm.sh/nostr-tools');
    actualPubkey = getPublicKey(actualPrivkey);
  }

  const event = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["t", tag], ["username", username]],
    content,
    pubkey: actualPubkey
  };

  event.id = getEventHash(event);
  const privkeyBytes = nostrUtils.hexToBytes(actualPrivkey);
  const eventIdBytes = nostrUtils.hexToBytes(event.id);
  const sig = await schnorr.sign(eventIdBytes, privkeyBytes);
  event.sig = nostrUtils.bytesToHex(sig);

  return JSON.stringify(["EVENT", event]);
}