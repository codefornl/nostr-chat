import { createElementFromTemplate, templates } from './utils/templating.mjs';

export default class RelayManager {
    constructor(relayStatusEl, channels) {
        this._relays = [];
        this._relayStatusEl = relayStatusEl;
        this._channels = channels;
        this._isExpanded = false;
        
        this.setupCollapsibleBehavior();
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
        this.updateCompactIndicators();
        setInterval(() => {
            this.updateRelayStatus(relay, relayItemEl);
            this.updateCompactIndicators();
        }, 2000);
    }

    updateRelayStatus(relay, relayItemEl) {
        const indicator = relayItemEl.querySelector('.relay-indicator');
        const isConnected = relay.getConnectionStatus();
        indicator.className = `relay-indicator ${isConnected ? 'connected' : 'disconnected'}`;
        indicator.title = isConnected ? 'Connected' : 'Disconnected';
    }
    
    setupCollapsibleBehavior() {
        const relayHeader = this._relayStatusEl.querySelector('.relay-header');
        if (!relayHeader) return;
        
        // Click handler
        relayHeader.addEventListener('click', () => this.toggleExpanded());
        
        // Keyboard handler
        relayHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.toggleExpanded();
            }
        });
    }
    
    toggleExpanded() {
        this._isExpanded = !this._isExpanded;
        const relayHeader = this._relayStatusEl.querySelector('.relay-header');
        const relayList = this._relayStatusEl.querySelector('.relay-list');
        
        if (relayHeader && relayList) {
            relayHeader.setAttribute('aria-expanded', this._isExpanded.toString());
            relayList.setAttribute('aria-hidden', (!this._isExpanded).toString());
        }
    }
    
    updateCompactIndicators() {
        const compactContainer = this._relayStatusEl.querySelector('.relay-indicators-compact');
        if (!compactContainer) return;
        
        // Clear existing indicators
        compactContainer.innerHTML = '';
        
        // Add indicator for each relay
        this._relays.forEach(relay => {
            const indicator = document.createElement('span');
            const isConnected = relay.getConnectionStatus();
            indicator.className = `relay-indicator ${isConnected ? 'connected' : 'disconnected'}`;
            indicator.title = `${new URL(relay.getURL()).hostname}: ${isConnected ? 'Connected' : 'Disconnected'}`;
            compactContainer.appendChild(indicator);
        });
    }
}
