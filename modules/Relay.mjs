export default function Relay(url) {
    const socket = new WebSocket(url);
    let subscriptions = new Map();
    let isConnected = false;

    socket.addEventListener('open', () => {
        isConnected = true;
        console.log(`Connected to relay: ${url}`);
    });

    socket.addEventListener('close', () => {
        isConnected = false;
        console.log(`Disconnected from relay: ${url}`);
    });

    socket.addEventListener('error', (error) => {
        console.error(`Relay error (${url}):`, error);
    });

    socket.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data) && data[0] === 'EVENT') {
                const tag = data[1];
                const handler = subscriptions.get(tag);
                if (handler) handler(data[2]);
            }
        } catch (error) {
            console.error(`Failed to parse message from ${url}:`, error);
        }
    });

    function subscribe(tag, eventHandler) {
        const subId = `sub-${tag}-${Math.random().toString(36).slice(2, 8)}`;
        const sub = ["REQ", subId, { kinds: [1], "#t": [tag], limit: 50 }];
        sendMessage(JSON.stringify(sub));
        subscriptions.set(subId, eventHandler);
        console.log(`Subscribed to tag: ${tag} with ID: ${subId}`);
    }

    function sendMessage(message) {
        console.log(message);
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else if (socket.readyState === WebSocket.CONNECTING) {
            socket.addEventListener('open', () => socket.send(message), { once: true });
        } else {
            console.error(`Cannot send message to ${url}: connection is closed`);
        }
    }

    function getURL() {
        return url;
    }

    function getConnectionStatus() {
        return isConnected;
    }

    return {
        subscribe,
        sendMessage,
        getURL,
        getConnectionStatus
    };
}