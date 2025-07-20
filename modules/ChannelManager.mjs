import Channel from './Channel.mjs';
import ChannelService from './services/ChannelService.mjs';

/**
 * Sets up global channel switching functionality
 * @param {Array} channels - Array of channel objects
 * @param {Function} switchToChannelFn - Function to switch to a channel
 */
export function setChannelSwitchGlobal(channels, switchToChannelFn) {
    const switchById = (kanaalId) => {
        const channel = channels.find(c => c.getId() === kanaalId);
        if (channel) {
            switchToChannelFn(channel);
        }
    };
    
    ChannelService.setSwitchToChannelCallback(switchById);
    window.switchToChannelById = ChannelService.switchToChannelById.bind(ChannelService);
}

/**
 * Channel Manager factory function
 * Manages loading, displaying, and switching between chat channels
 * @param {HTMLElement} channelsContainerEl - Container for channel content
 * @param {Array} channels - Array to store channel instances
 * @param {HTMLElement} channelsMenuEl - Menu element for channel navigation
 * @param {Array} relays - Array of relay connections
 * @returns {Object} ChannelManager API
 */
export default function ChannelManager(channelsContainerEl, channels, channelsMenuEl, relays = []) {
    let _channels = channels;
    let _channelsContainerEl = channelsContainerEl;
    let _channelsMenuEl = channelsMenuEl;
    let _currentChannel = null;
    let _relays = relays;

    function loadChannels(channelsConfig) {
        // Clear previous channels from DOM and array
        _channels.forEach(channel => {
            const rootEl = channel.getRootEl();
            if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            const menuEl = channel.getMenuEl();
            if (menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
        });
        _channels.length = 0; // Clear array without reassigning reference
        _currentChannel = null;

        channelsConfig.forEach(channelConfig => {
            loadChannel(channelConfig);
        });

        ChannelService.setChannelNames(_channels.map(c => c.getId()));
    }

    function loadChannel(channelConfig) {
        const channel = new Channel(channelConfig);

        const channelRootEl = channel.getRootEl();
        _channelsContainerEl.appendChild(channelRootEl);

        const channelMenuEl = channel.getMenuEl();
        _channelsMenuEl.appendChild(channelMenuEl);
        _channels.push(channel);

        if (_currentChannel === null) {
            _currentChannel = channel;
            _currentChannel.getRootEl().style.display = 'block';
            _currentChannel.setActive(true);
        } else {
            channelRootEl.style.display = 'none';
            channel.setActive(false);
        }

        channelMenuEl.addEventListener('click', () => switchToChannel(channel));
        
        // Add keyboard support for accessibility
        channelMenuEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                switchToChannel(channel);
            }
        });

        if (_relays && _relays.length > 0) {
            channel.registerRelays(_relays);
        }
    }

    function switchToChannel(channel) {
        if (_currentChannel) {
            _currentChannel.getRootEl().style.display = 'none';
            _currentChannel.setActive(false);
        }

        _currentChannel = channel;
        _currentChannel.getRootEl().style.display = 'block';
        _currentChannel.setActive(true);

        // Update menu visual and accessibility states
        updateChannelMenuStates(channel);
        
        // Focus management - focus newest message in new channel
        setTimeout(() => {
            const messages = _currentChannel.getRootEl().querySelectorAll('.message');
            if (messages.length > 0) {
                messages[messages.length - 1].focus();
            } else {
                // No messages, focus on input if available
                const messageInput = _currentChannel.getRootEl().querySelector('input[name="message"]');
                if (messageInput) {
                    messageInput.focus();
                }
            }
        }, 100);

        _currentChannel.scrollToBottom();
        
        // Update URL to reflect current channel
        const newHash = `#/${channel.getId()}`;
        if (window.location.hash !== newHash) {
            history.replaceState(null, null, newHash);
        }
    }
    
    function updateChannelMenuStates(activeChannel) {
        _channels.forEach(channel => {
            const menuEl = channel.getMenuEl();
            const isActive = channel === activeChannel;
            
            // Update ARIA state for screen readers
            menuEl.setAttribute('aria-selected', isActive.toString());
            
            // Update CSS class for visual feedback
            menuEl.classList.toggle('active', isActive);
        });
    }

    return {
        loadChannels,
        loadChannel,
        switchToChannel,
        getChannels: () => _channels,
        tryPendingChannelSwitch: null // Will be set by setupURLRouting
    };
}
