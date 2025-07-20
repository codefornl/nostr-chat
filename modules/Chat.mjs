import Channel from '/modules/Channel.mjs';
import Relay from '/modules/Relay.mjs';

export default function Chat(rootEl) {
    const _channels = [];
    const _relays = [];
    let _currentChannel = null;

    fetch('/config/relays.json')
        .then(response => response.json())
        .then(relaysConfig => {
            relaysConfig.forEach(relayConfig => registerRelay(new Relay(relayConfig)));
        });

    function registerRelay(relay) {
        _relays.push(relay);
        _channels.forEach(channel => {
            channel.registerRelay(relay);
        });
        addRelayToStatusDisplay(relay);
    }
    
    function addRelayToStatusDisplay(relay) {
        const relayListEl = relayStatusEl.querySelector('.relay-list');
        const relayItemEl = document.createElement('div');
        relayItemEl.className = 'relay-item';
        relayItemEl.innerHTML = `
            <span class="relay-indicator"></span>
            <span class="relay-url">${new URL(relay.getURL()).hostname}</span>
        `;
        relayListEl.appendChild(relayItemEl);
        
        updateRelayStatus(relay, relayItemEl);
        
        // Poll status every 2 seconds
        setInterval(() => updateRelayStatus(relay, relayItemEl), 2000);
    }
    
    function updateRelayStatus(relay, relayItemEl) {
        const indicator = relayItemEl.querySelector('.relay-indicator');
        const isConnected = relay.getConnectionStatus();
        
        indicator.className = `relay-indicator ${isConnected ? 'connected' : 'disconnected'}`;
        indicator.title = isConnected ? 'Connected' : 'Disconnected';
    }

    const channelsMenuEl = document.createElement('div');
    channelsMenuEl.className = 'channels-menu';
    
    const relayStatusEl = document.createElement('div');
    relayStatusEl.className = 'relay-status';
    relayStatusEl.innerHTML = '<h3>Relays</h3><div class="relay-list"></div>';
    channelsMenuEl.appendChild(relayStatusEl);
    
    rootEl.appendChild(channelsMenuEl);

    const channelsContainerEl = document.createElement('div');
    channelsContainerEl.className = 'channels-container';
    
    const sidebarOverlayEl = document.createElement('div');
    sidebarOverlayEl.className = 'sidebar-overlay';
    
    rootEl.appendChild(channelsContainerEl);
    rootEl.appendChild(sidebarOverlayEl);
    
    // Mobile sidebar toggle functionality
    function toggleSidebar() {
        const isOpen = channelsMenuEl.classList.contains('open');
        
        if (isOpen) {
            channelsMenuEl.classList.remove('open');
            sidebarOverlayEl.classList.remove('active');
            channelsContainerEl.classList.remove('sidebar-open');
        } else {
            channelsMenuEl.classList.add('open');
            sidebarOverlayEl.classList.add('active');
            channelsContainerEl.classList.add('sidebar-open');
        }
        
        // Scroll to bottom after sidebar animation completes
        setTimeout(() => {
            if (_currentChannel && _currentChannel.scrollToBottom) {
                _currentChannel.scrollToBottom();
            }
        }, 350);
    }
    
    // Close sidebar when clicking overlay
    sidebarOverlayEl.addEventListener('click', toggleSidebar);
    
    // Add event delegation for menu toggle buttons
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('menu-toggle')) {
            toggleSidebar();
        }
    });

    function loadChannels(channelsConfig) {
        channelsConfig.forEach(channelConfig => {
            loadChannel(channelConfig);
        });
    }

    function loadChannel(channelConfig) {
        const channel = new Channel(channelConfig);

        const channelRootEl = channel.getRootEl();
        channelsContainerEl.appendChild(channelRootEl);

        const channelMenuEl = channel.getMenuEl();
        channelsMenuEl.appendChild(channelMenuEl);

        if (_currentChannel === null) {
            _currentChannel = channel;
            _currentChannel.getRootEl().style.display = 'block';
        } else {
            channelRootEl.style.display = 'none';
        }
        channelMenuEl.addEventListener('click', () => {
            _currentChannel.getRootEl().style.display = 'none';
            _currentChannel = channel;
            _currentChannel.getRootEl().style.display = 'block';
            
            // Close sidebar on mobile after selecting channel
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
        });
        channel.registerRelays(_relays);
        _channels.push(channel);
        console.log("Channel loaded:", channel.getId());
    }

    return {
        loadChannels,
        loadChannel
    };
}