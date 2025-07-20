// nostr.mjs
import { getPublicKey, getEventHash, utils as nostrUtils } from 'https://esm.sh/nostr-tools';
import { schnorr } from 'https://esm.sh/@noble/curves/secp256k1';
import { Relay } from './relay.mjs';

export default function Nostr(relayUrls) {
  const relays = [];
  const seenIds = new Set();
  const handlers = [];

  let currentTag = null;

  let privkey = localStorage.getItem("nostr_privkey");
  let pubkey = localStorage.getItem("nostr_pubkey");

  if (!privkey || !pubkey) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    privkey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    pubkey = getPublicKey(privkey);
    localStorage.setItem("nostr_privkey", privkey);
    localStorage.setItem("nostr_pubkey", pubkey);
  }

  function onEvent(cb) {
    handlers.push(cb);
  }

  function emitEvent(ev) {
    if (seenIds.has(ev.id)) return;
    seenIds.add(ev.id);
    handlers.forEach(cb => cb(ev));
  }

  relayUrls.forEach(url => {
    const relay = Relay(url, emitEvent);
    relays.push(relay);
  });

  async function createEvent(content) {
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["t", currentTag]],
      content,
      pubkey
    };
    event.id = getEventHash(event);
    const privkeyBytes = nostrUtils.hexToBytes(privkey);
    const sig = await schnorr.sign(event.id, privkeyBytes);
    event.sig = nostrUtils.bytesToHex(sig);
    return event;
  }

  function send(event) {
    const msg = JSON.stringify(["EVENT", event]);
    relays.forEach(r => r.send(msg));
  }

  function switchChannel(tag) {
    currentTag = tag;
    relays.forEach(r => r.subscribe(tag));
  }

  return {
    send,
    createEvent,
    onEvent,
    switchChannel
  };
}