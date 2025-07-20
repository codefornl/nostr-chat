import { getEventHash, utils as nostrUtils } from 'https://esm.sh/nostr-tools';
import { schnorr } from 'https://esm.sh/@noble/curves/secp256k1';
import CodeForNLID from './CodeForNLID.mjs';

export default async function createNostrEvent(content, tag) {
  const privkey = CodeForNLID.getPrivateKey();
  const pubkey = CodeForNLID.getPublicKey();
  const username = CodeForNLID.getCurrentUsername();

  if (!privkey || !pubkey) {
    throw new Error('Geen Code for NL ID gevonden. Log eerst in of maak een nieuw ID aan.');
  }

  const event = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["t", tag], ["username", username]],
    content,
    pubkey
  };

  event.id = getEventHash(event);
  const privkeyBytes = nostrUtils.hexToBytes(privkey);
  const sig = await schnorr.sign(event.id, privkeyBytes);
  event.sig = nostrUtils.bytesToHex(sig);

  return JSON.stringify(["EVENT", event]);
}