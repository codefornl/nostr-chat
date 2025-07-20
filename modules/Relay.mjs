export default function Relay(url) {
    let socket;
    let subscriptions = new Map();
    let subscriptionTags = new Map(); // Store tag for each subscription ID
    let isConnected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // Start with 2 seconds
    let reconnectTimeout;
    
    function connect() {
        socket = new WebSocket(url);
        setupEventHandlers();
    }
    
    function setupEventHandlers() {

        socket.addEventListener('open', () => {
            isConnected = true;
            reconnectAttempts = 0;
            
            // Resubscribe to all existing subscriptions
            subscriptionTags.forEach((tag, subId) => {
                if (tag) {
                    const sub = ["REQ", subId, { kinds: [1], "#t": [tag], limit: 50 }];
                    socket.send(JSON.stringify(sub));
                }
            });
        });

        socket.addEventListener('close', (event) => {
            isConnected = false;
            
            // Only attempt reconnect if not manually closed
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                scheduleReconnect();
            }
        });

        socket.addEventListener('error', () => {
            isConnected = false;
        });
        
        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (Array.isArray(data) && data[0] === 'EVENT') {
                    const subId = data[1];
                    const handler = subscriptions.get(subId);
                    if (handler) handler(data[2]);
                }
            } catch (error) {
                // Silently ignore malformed messages
            }
        });
    }
    
    function scheduleReconnect() {
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        
        reconnectAttempts++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
        
        reconnectTimeout = setTimeout(() => {
            connect();
        }, delay);
    }
    
    // Initialize connection
    connect();

    function subscribe(tag, eventHandler) {
        const subId = `sub-${tag}-${Math.random().toString(36).slice(2, 8)}`;
        const sub = ["REQ", subId, { kinds: [1], "#t": [tag], limit: 50 }];
        sendMessage(JSON.stringify(sub));
        subscriptions.set(subId, eventHandler);
        subscriptionTags.set(subId, tag);
    }

    function sendMessage(message) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else if (socket.readyState === WebSocket.CONNECTING) {
            socket.addEventListener('open', () => socket.send(message), { once: true });
        }
    }

    function getURL() {
        return url;
    }

    function getConnectionStatus() {
        return isConnected;
    }
    
    function disconnect() {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (socket) {
            socket.close(1000); // Normal closure
        }
        isConnected = false;
    }
    
    function forceReconnect() {
        reconnectAttempts = 0;
        disconnect();
        setTimeout(() => connect(), 100);
    }

    return {
        subscribe,
        sendMessage,
        getURL,
        getConnectionStatus,
        disconnect,
        forceReconnect
    };
}