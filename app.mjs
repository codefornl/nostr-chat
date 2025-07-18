import { getPublicKey, getEventHash, utils as nostrUtils } from 'https://esm.sh/nostr-tools';
import { schnorr } from 'https://esm.sh/@noble/curves/secp256k1';

function getRandomPrivkeyHex() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getRandomAnonName() {
    return "anon" + Math.floor(10000 + Math.random() * 90000);
}

async function signEvent(event, privkeyHex) {
    const hash = getEventHash(event);
    const privkeyBytes = nostrUtils.hexToBytes(privkeyHex);
    const sig = await schnorr.sign(hash, privkeyBytes);
    return nostrUtils.bytesToHex(sig);
}

window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('resize', () => {
    const messagesDiv = document.getElementById("messages");
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    });

    const relays = [
    "wss://nos.lol",
    "wss://relay.nostr.band",
    "wss://relay.snort.social"
    ];
    const sockets = relays.map(url => new WebSocket(url));

    let channels = [];
    let activeChannel = null;
    let messageBuffer = [];

    let privkey = localStorage.getItem("nostr_privkey");
    let pubkey = localStorage.getItem("nostr_pubkey");

    if (!privkey || !pubkey) {
    privkey = getRandomPrivkeyHex();
    pubkey = getPublicKey(privkey);
    localStorage.setItem("nostr_privkey", privkey);
    localStorage.setItem("nostr_pubkey", pubkey);
    }

    let username = localStorage.getItem("nostr_username");
    if (!username) {
    username = prompt("Enter your name (or leave blank for anonymous):") || getRandomAnonName();
    localStorage.setItem("nostr_username", username);
    }

    const channelsDiv = document.getElementById("channels");
    const messagesDiv = document.getElementById("messages");
    const channelNameDiv = document.getElementById("channelName");
    const inputField = document.getElementById("text");

    inputField.focus();
    inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
    });

    function renderChannels() {
    channelsDiv.innerHTML = "";
    channels.forEach(chan => {
        const btn = document.createElement("button");
        btn.textContent = "#" + chan.label;
        btn.className = "channel-button";
        btn.onclick = () => {
        switchChannel(chan);
        document.getElementById('channels').classList.remove('show');
        };
        channelsDiv.appendChild(btn);
    });
    }

    function renderMessages() {
    messagesDiv.innerHTML = "";
    messageBuffer.sort((a, b) => a.created_at - b.created_at);
    messageBuffer.forEach(ev => {
        const msg = document.createElement("div");
        msg.className = "message";
        msg.textContent = ev.content;
        messagesDiv.appendChild(msg);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function sendToAllSockets(msg) {
    sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
        } else {
        socket.addEventListener('open', () => socket.send(msg), { once: true });
        }
    });
    }

    function switchChannel(channel) {
    activeChannel = channel;
    channelNameDiv.textContent = "#" + channel.label;
    messagesDiv.innerHTML = "";
    const loadingMsg = document.createElement("em");
    loadingMsg.textContent = "Loading...";
    messagesDiv.appendChild(loadingMsg);
    messageBuffer = [];
    const sub = ["REQ", "sub-" + channel.id, { kinds: [1], "#t": [channel.tag], limit: 50 }];
    sendToAllSockets(JSON.stringify(sub));
    }

    window.sendMessage = async function () {
    const content = inputField.value;
    if (!content) return;

    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["t", activeChannel.tag]],
        content: username + ": " + content,
        pubkey: pubkey
    };
    event.id = getEventHash(event);
    event.sig = await signEvent(event, privkey);
    sendToAllSockets(JSON.stringify(["EVENT", event]));
    inputField.value = "";
    }

    sockets.forEach(socket => {
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data[0] === "EVENT") {
        const ev = data[2];
        const loading = messagesDiv.querySelector("em");
        if (loading) loading.remove();
        messageBuffer.push(ev);
        renderMessages();
        }
    };
    });

    Promise.all(sockets.map(s => new Promise(resolve => s.onopen = resolve))).then(() => {
    fetch('channels.json')
        .then(res => res.json())
        .then(data => {
        channels = data;
        activeChannel = channels[0];
        renderChannels();
        switchChannel(activeChannel);
        })
        .catch(err => {
        console.error("Failed to load channels.json", err);
        messagesDiv.innerHTML = '<p style="color:red">Failed to load channels.json</p>';
        });
    });
});