/**
 * Centralized service for managing channel-related data and operations
 * Eliminates circular dependencies and provides clean data access
 */
class ChannelService {
    constructor() {
        this._channelNames = [];
        this._switchToChannelCallback = null;
    }

    /**
     * Updates the list of available channel names
     * @param {string[]} channelNames - Array of channel names/IDs
     */
    setChannelNames(channelNames) {
        this._channelNames = [...channelNames];
    }

    /**
     * Gets the current list of channel names
     * @returns {string[]} Array of channel names/IDs
     */
    getChannelNames() {
        return [...this._channelNames];
    }

    /**
     * Registers a callback function for switching channels
     * @param {Function} callback - Function to call when switching channels
     */
    setSwitchToChannelCallback(callback) {
        this._switchToChannelCallback = callback;
    }

    /**
     * Switches to a channel by ID
     * @param {string} channelId - The ID of the channel to switch to
     */
    switchToChannelById(channelId) {
        if (this._switchToChannelCallback) {
            this._switchToChannelCallback(channelId);
        }
    }
}

// Export singleton instance
export default new ChannelService();