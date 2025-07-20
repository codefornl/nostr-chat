import { setChannelSwitchGlobal } from './ChannelManager.mjs';
import Relay from './Relay.mjs';
import { createDiv, appendChildren } from './utils/domUtils.mjs';
import { createElementFromTemplate, templates } from './utils/templating.mjs';
import { schemas } from './utils/validation.mjs';
import { APP_CONFIG } from './config/appConfig.mjs';
import { createManagerFactory } from './factories/ManagerFactory.mjs';

/**
 * Main Chat application factory function
 * Creates and initializes the complete chat interface with all managers
 * @param {HTMLElement} rootEl - Root DOM element to attach the chat interface
 * @returns {Object} Chat API with loadChannels and loadChannel methods
 */
export default function Chat(rootEl) {
    const _channels = [];
    
    const ui = createUI(rootEl);
    const managers = createManagers(ui, _channels);
    
    loadConfigurations(managers);
    setupURLRouting(managers.channelManager);

    return {
        loadChannels: managers.channelManager.loadChannels.bind(managers.channelManager),
        loadChannel: managers.channelManager.loadChannel.bind(managers.channelManager)
    };
}

function createUI(rootEl) {
    const channelsMenuEl = createChannelsMenu();
    const channelsContainerEl = createChannelsContainer();
    const sidebarOverlayEl = createSidebarOverlay();

    rootEl.appendChild(channelsMenuEl);
    rootEl.appendChild(channelsContainerEl);
    rootEl.appendChild(sidebarOverlayEl);

    return { channelsMenuEl, channelsContainerEl, sidebarOverlayEl };
}

function createChannelsMenu() {
    const channelsMenuEl = createDiv('channels-menu', {
        'role': 'navigation',
        'aria-label': APP_CONFIG.ARIA_LABELS.CHANNEL_NAVIGATION
    });

    const userStatusEl = createUserStatus();
    const relayStatusEl = createRelayStatus();
    const openDienstenEl = createOpenDienstenLink();

    return appendChildren(channelsMenuEl, userStatusEl, relayStatusEl, openDienstenEl);
}

function createUserStatus() {
    return createDiv('user-status');
}

function createRelayStatus() {
    return createElementFromTemplate('div', templates.relayStatus, {}, 'relay-status');
}

function createOpenDienstenLink() {
    return createElementFromTemplate('div', templates.openDienstenLink, 
        APP_CONFIG.EXTERNAL_LINKS.OPENDIENSTEN, 
        'opendiensten-link', {}, schemas.openDienstenLink);
}

function createChannelsContainer() {
    return createDiv('channels-container');
}

function createSidebarOverlay() {
    return createDiv('sidebar-overlay');
}

function createManagers(ui, channels) {
    const userStatusEl = ui.channelsMenuEl.querySelector('.user-status');
    const relayStatusEl = ui.channelsMenuEl.querySelector('.relay-status');

    const factory = createManagerFactory({
        userStatusEl,
        relayStatusEl,
        channelsContainerEl: ui.channelsContainerEl,
        channelsMenuEl: ui.channelsMenuEl,
        sidebarOverlayEl: ui.sidebarOverlayEl
    }, channels);

    return factory.createAllManagers();
}

function loadConfigurations(managers) {
    loadRelayConfig(managers.relayManager);
    loadChannelConfig(managers.channelManager);
}

async function loadRelayConfig(relayManager) {
    try {
        const response = await fetch(APP_CONFIG.CONFIG_PATHS.RELAYS);
        if (!response.ok) {
            throw new Error(`Failed to load relays config: ${response.status}`);
        }
        const relaysConfig = await response.json();
        relaysConfig.forEach(relayConfig => relayManager.registerRelay(new Relay(relayConfig)));
    } catch (error) {
        console.error('Error loading relay configuration:', error);
        // Fallback to default relay if config fails
        relayManager.registerRelay(new Relay(APP_CONFIG.FALLBACKS.RELAY));
    }
}

async function loadChannelConfig(channelManager) {
    try {
        const response = await fetch(APP_CONFIG.CONFIG_PATHS.CHANNELS);
        if (!response.ok) {
            throw new Error(`Failed to load channels config: ${response.status}`);
        }
        const channelsConfig = await response.json();
        channelManager.loadChannels(channelsConfig);
        setChannelSwitchGlobal(channelManager.getChannels(), channelManager.switchToChannel);
        
        // Try pending URL channel switch after channels are loaded
        if (channelManager.tryPendingChannelSwitch) {
            channelManager.tryPendingChannelSwitch();
        }
    } catch (error) {
        console.error('Error loading channel configuration:', error);
        // Fallback to default channel if config fails
        channelManager.loadChannel(APP_CONFIG.FALLBACKS.CHANNEL);
        setChannelSwitchGlobal(channelManager.getChannels(), channelManager.switchToChannel);
        
        // Try pending URL channel switch after fallback channel is loaded
        if (channelManager.tryPendingChannelSwitch) {
            channelManager.tryPendingChannelSwitch();
        }
    }
}

function setupURLRouting(channelManager) {
    const URL_RETRY_DELAYS = [50, 200, 500, 1000];
    let pendingChannelId = null;
    
    function extractChannelIdFromHash() {
        const hash = window.location.hash;
        return (hash.startsWith('#/') && hash.length > 2) ? hash.substring(2) : null;
    }
    
    function findChannelById(channelId) {
        return channelManager.getChannels().find(c => c.getId() === channelId);
    }
    
    function attemptChannelSwitch(channelId) {
        const channel = findChannelById(channelId);
        if (channel) {
            channelManager.switchToChannel(channel);
            pendingChannelId = null;
            return true;
        }
        return false;
    }
    
    function handleHashChange() {
        const channelId = extractChannelIdFromHash();
        if (channelId) {
            if (!attemptChannelSwitch(channelId)) {
                // Channel not found yet, store for later retry
                pendingChannelId = channelId;
            }
        }
    }
    
    function tryPendingChannelSwitch() {
        if (pendingChannelId) {
            attemptChannelSwitch(pendingChannelId);
        }
    }
    
    // Set up event listeners and retry logic
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle initial page load with progressive retry delays
    URL_RETRY_DELAYS.forEach(delay => {
        setTimeout(handleHashChange, delay);
    });
    
    // Expose retry function for post-load channel switching
    channelManager.tryPendingChannelSwitch = tryPendingChannelSwitch;
}