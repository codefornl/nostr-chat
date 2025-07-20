import { getPublicKey, getEventHash, utils as nostrUtils } from 'https://esm.sh/nostr-tools';
import { schnorr } from 'https://esm.sh/@noble/curves/secp256k1';

export default async function createNostrEvent(content, tag) {
  let privkey = localStorage.getItem("nostr_privkey");
  let pubkey = localStorage.getItem("nostr_pubkey");
  let username = localStorage.getItem("nostr_username");

  if (!privkey || !pubkey) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    privkey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    pubkey = getPublicKey(privkey);
    localStorage.setItem("nostr_privkey", privkey);
    localStorage.setItem("nostr_pubkey", pubkey);
  }
  
  if (!username) {
    username = prompt("Wat is je gebruikersnaam voor de chat?");
    if (username && username.trim()) {
      username = username.trim();
      localStorage.setItem("nostr_username", username);
    } else {
      username = "Anoniem";
      localStorage.setItem("nostr_username", username);
    }
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