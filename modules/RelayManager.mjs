import { createElementFromTemplate, templates } from './utils/templating.mjs';

export default class RelayManager {
    constructor(relayStatusEl, channels) {
        this._relays = [];
        this._relayStatusEl = relayStatusEl;
        this._channels = channels;
    }

    registerRelay(relay) {
        this._relays.push(relay);
        this._channels.forEach(channel => {
            channel.registerRelay(relay);
        });
        this.addRelayToStatusDisplay(relay);
    }

    addRelayToStatusDisplay(relay) {
        const relayListEl = this._relayStatusEl.querySelector('.relay-list');
        const relayItemEl = createElementFromTemplate('div', templates.relayItem, {
            hostname: new URL(relay.getURL()).hostname
        }, 'relay-item');
        
        relayListEl.appendChild(relayItemEl);
        this.updateRelayStatus(relay, relayItemEl);
        setInterval(() => this.updateRelayStatus(relay, relayItemEl), 2000);
    }

    updateRelayStatus(relay, relayItemEl) {
        const indicator = relayItemEl.querySelector('.relay-indicator');
        const isConnected = relay.getConnectionStatus();
        indicator.className = `relay-indicator ${isConnected ? 'connected' : 'disconnected'}`;
        indicator.title = isConnected ? 'Connected' : 'Disconnected';
    }
}
