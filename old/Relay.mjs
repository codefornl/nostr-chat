// relay.mjs
function Relay(url, onEvent) {
  const socket = new WebSocket(url);
  let ready = false;

  socket.onopen = () => {
    console.log("Connected to", url);
    ready = true;
  };

  socket.onerror = err => {
    console.warn("Relay error:", url, err);
  };

  socket.onmessage = e => {
    const data = JSON.parse(e.data);
    if (data[0] === "EVENT") {
      onEvent(data[2]);
    }
  };

  return {
    send: (msg) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
      } else {
        socket.addEventListener('open', () => socket.send(msg), { once: true });
      }
    },
    subscribe: (tag) => {
      const subId = `sub-${tag}-${Math.random().toString(36).slice(2, 8)}`;
      const sub = ["REQ", subId, { kinds: [1], "#t": [tag], limit: 50 }];
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(sub));
      } else {
        socket.addEventListener('open', () => socket.send(JSON.stringify(sub)), { once: true });
      }
    }
  };
}

export { Relay };
