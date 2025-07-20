/**
 * Factory for creating and configuring manager instances
 * Provides dependency injection and consistent initialization
 */

import UserManager from '../UserManager.mjs';
import RelayManager from '../RelayManager.mjs';
import ChannelManager from '../ChannelManager.mjs';
import SidebarManager from '../SidebarManager.mjs';
import { APP_CONFIG } from '../config/appConfig.mjs';
import { validateConfig } from '../utils/validation.mjs';

/**
 * Manager factory configuration schema
 */
const MANAGER_CONFIG_SCHEMA = {
    userStatusEl: { type: 'dom', required: true },
    relayStatusEl: { type: 'dom', required: true },
    channelsContainerEl: { type: 'dom', required: true },
    channelsMenuEl: { type: 'dom', required: true },
    sidebarOverlayEl: { type: 'dom', required: true },
    channels: { type: 'object', required: true, default: [] },
    relays: { type: 'object', required: false, default: [] }
};

/**
 * Factory class for creating managers with proper dependency injection
 */
export class ManagerFactory {
    constructor(config = {}) {
        this.config = validateConfig(config, MANAGER_CONFIG_SCHEMA);
        this.managers = new Map();
    }

    /**
     * Creates a UserManager instance
     * @returns {UserManager} UserManager instance
     */
    createUserManager() {
        if (this.managers.has('user')) {
            return this.managers.get('user');
        }

        const userManager = new UserManager(this.config.userStatusEl);
        this.managers.set('user', userManager);
        return userManager;
    }

    /**
     * Creates a RelayManager instance
     * @returns {RelayManager} RelayManager instance
     */
    createRelayManager() {
        if (this.managers.has('relay')) {
            return this.managers.get('relay');
        }

        const relayManager = new RelayManager(
            this.config.relayStatusEl, 
            this.config.channels
        );
        this.managers.set('relay', relayManager);
        return relayManager;
    }

    /**
     * Creates a ChannelManager instance
     * @returns {ChannelManager} ChannelManager instance
     */
    createChannelManager() {
        if (this.managers.has('channel')) {
            return this.managers.get('channel');
        }

        const relayManager = this.createRelayManager();
        const channelManager = ChannelManager(
            this.config.channelsContainerEl,
            this.config.channels,
            this.config.channelsMenuEl,
            relayManager._relays
        );
        this.managers.set('channel', channelManager);
        return channelManager;
    }

    /**
     * Creates a SidebarManager instance
     * @returns {SidebarManager} SidebarManager instance
     */
    createSidebarManager() {
        if (this.managers.has('sidebar')) {
            return this.managers.get('sidebar');
        }

        const sidebarManager = new SidebarManager(
            this.config.channelsMenuEl,
            this.config.sidebarOverlayEl
        );
        this.managers.set('sidebar', sidebarManager);
        return sidebarManager;
    }

    /**
     * Creates all managers at once
     * @returns {Object} Object containing all manager instances
     */
    createAllManagers() {
        const userManager = this.createUserManager();
        const relayManager = this.createRelayManager();
        const channelManager = this.createChannelManager();
        const sidebarManager = this.createSidebarManager();

        // Initialize user status
        userManager.updateUserStatus();

        return {
            userManager,
            relayManager,
            channelManager,
            sidebarManager
        };
    }

    /**
     * Gets a manager instance by name
     * @param {string} name - Manager name (user, relay, channel, sidebar)
     * @returns {*} Manager instance or null if not found
     */
    getManager(name) {
        return this.managers.get(name) || null;
    }

    /**
     * Destroys all manager instances and clears cache
     */
    destroy() {
        // Call cleanup methods if managers have them
        for (const [name, manager] of this.managers) {
            if (typeof manager.destroy === 'function') {
                manager.destroy();
            }
        }
        this.managers.clear();
    }
}

/**
 * Convenience function to create a configured manager factory
 * @param {Object} uiElements - UI element configuration
 * @param {Array} channels - Channels array
 * @param {Array} relays - Relays array
 * @returns {ManagerFactory} Configured manager factory
 */
export function createManagerFactory(uiElements, channels = [], relays = []) {
    return new ManagerFactory({
        ...uiElements,
        channels,
        relays
    });
}