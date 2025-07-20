import Channel from './Channel.mjs';
import Relay from './Relay.mjs';
import CodeForNLID from './CodeForNLID.mjs';

export default function Chat(rootEl) {
    const _channels = [];
    const _relays = [];
    let _currentChannel = null;
    
    // Initialize anonymous user if needed
    if (!CodeForNLID.getCurrentUsername()) {
        CodeForNLID.setAnonymous();
    }
    

    fetch('./config/relays.json')
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
    channelsMenuEl.setAttribute('role', 'navigation');
    channelsMenuEl.setAttribute('aria-label', 'Kanaal navigatie en gebruikersinstellingen');
    
    const userStatusEl = document.createElement('div');
    userStatusEl.className = 'user-status';
    
    function updateUserStatus() {
        const currentUsername = CodeForNLID.getCurrentUsername();
        const isAnonymous = !CodeForNLID.isLoggedIn();
        
        if (isAnonymous) {
            userStatusEl.innerHTML = `
                <h3>Niet ingelogd</h3>
                <div class="current-user">${currentUsername}</div>
                <div class="user-actions">
                    <button class="import-key-btn">Code for NL ID inladen</button>
                    <button class="new-account-btn">Code for NL ID aanmaken</button>
                </div>
            `;
        } else {
            const pubkey = CodeForNLID.getPublicKey();
            const avatarDataURL = pubkey ? CodeForNLID.getAvatarDataURL(pubkey, 48) : '';
            const needsBackup = CodeForNLID.needsBackup();
            
            userStatusEl.innerHTML = `
                <h3>Ingelogd als</h3>
                <div class="current-user">
                    ${avatarDataURL ? `<img src="${avatarDataURL}" alt="Avatar" class="user-avatar" />` : ''}
                    <span class="username">${currentUsername}</span>
                </div>
                <div class="user-actions">
                    ${needsBackup ? '<button class="download-key-btn">🔑 Key downloaden</button>' : ''}
                    <button class="logout-btn">Uitloggen</button>
                </div>
            `;
        }
        
        const downloadKeyBtn = userStatusEl.querySelector('.download-key-btn');
        const logoutBtn = userStatusEl.querySelector('.logout-btn');
        const importKeyBtn = userStatusEl.querySelector('.import-key-btn');
        const newAccountBtn = userStatusEl.querySelector('.new-account-btn');
        
        if (downloadKeyBtn) {
            downloadKeyBtn.addEventListener('click', () => {
                try {
                    CodeForNLID.downloadBackupImage(`nostr-backup-${currentUsername}.png`);
                } catch (error) {
                    alert(error.message);
                }
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const needsBackup = CodeForNLID.needsBackup();
                let shouldLogout = true;
                
                if (needsBackup) {
                    shouldLogout = confirm('Weet je zeker dat je wilt uitloggen? Je verliest je chat identiteit.');
                }
                
                if (shouldLogout) {
                    CodeForNLID.logout();
                    location.reload();
                }
            });
        }
        
        if (importKeyBtn) {
            importKeyBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.png,.jpg,.jpeg';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                fileInput.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            await CodeForNLID.importIDFromImage(file);
                            location.reload();
                        } catch (error) {
                            alert('Kon Code for NL ID niet uit afbeelding halen: ' + error.message);
                        }
                    }
                    document.body.removeChild(fileInput);
                });
                
                fileInput.click();
            });
        }
        
        if (newAccountBtn) {
            newAccountBtn.addEventListener('click', async () => {
                const username = prompt('Wat is je gebruikersnaam voor de chat?');
                if (username && username.trim()) {
                    try {
                        await CodeForNLID.createNewID(username);
                        location.reload();
                    } catch (error) {
                        alert(error.message);
                    }
                }
            });
        }
    }
    
    updateUserStatus();
    channelsMenuEl.appendChild(userStatusEl);
    
    const relayStatusEl = document.createElement('div');
    relayStatusEl.className = 'relay-status';
    relayStatusEl.innerHTML = '<h3>Relays</h3><div class="relay-list"></div>';
    channelsMenuEl.appendChild(relayStatusEl);
    
    // Add OpenDiensten link
    const openDienstenEl = document.createElement('div');
    openDienstenEl.className = 'opendiensten-link';
    openDienstenEl.innerHTML = `
        <a href="https://www.opendiensten.nl/" target="_blank" rel="noopener noreferrer">
            <strong>OpenDiensten.nl</strong><br>
            <small>Videochat, online notes en meer tools</small>
        </a>
    `;
    channelsMenuEl.appendChild(openDienstenEl);
    
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
            // Update ARIA state
            updateMenuToggleAriaExpanded(false);
        } else {
            channelsMenuEl.classList.add('open');
            sidebarOverlayEl.classList.add('active');
            channelsContainerEl.classList.add('sidebar-open');
            // Update ARIA state and focus first menu item
            updateMenuToggleAriaExpanded(true);
            focusFirstChannelMenuItem();
        }
        
        // Scroll to bottom after sidebar animation completes (only if needed)
        setTimeout(() => {
            if (_currentChannel && _currentChannel.scrollToBottom) {
                // Only scroll if this is the active channel
                _currentChannel.scrollToBottom();
            }
        }, 350);
    }
    
    function updateMenuToggleAriaExpanded(isExpanded) {
        const menuToggleButtons = document.querySelectorAll('.menu-toggle');
        menuToggleButtons.forEach(button => {
            button.setAttribute('aria-expanded', isExpanded.toString());
        });
    }
    
    function focusFirstChannelMenuItem() {
        setTimeout(() => {
            const firstMenuItem = channelsMenuEl.querySelector('.channel-menu');
            if (firstMenuItem) {
                firstMenuItem.focus();
            }
        }, 100);
    }
    
    // Close sidebar when clicking overlay
    sidebarOverlayEl.addEventListener('click', toggleSidebar);
    
    // Add keyboard support for sidebar closing
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && channelsMenuEl.classList.contains('open')) {
            toggleSidebar();
            // Return focus to menu toggle button
            const menuToggle = document.querySelector('.menu-toggle');
            if (menuToggle) {
                menuToggle.focus();
            }
        }
    });
    
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
            _currentChannel.setActive(true);
        } else {
            channelRootEl.style.display = 'none';
            channel.setActive(false);
        }
        
        function switchToChannel() {
            // Mark previous channel as inactive
            if (_currentChannel) {
                _currentChannel.getRootEl().style.display = 'none';
                _currentChannel.setActive(false);
            }
            
            // Activate new channel
            _currentChannel = channel;
            _currentChannel.getRootEl().style.display = 'block';
            _currentChannel.setActive(true);
            
            // Auto-scroll to bottom when switching channels
            _currentChannel.scrollToBottom();
            
            // Update menu appearance and ARIA states
            document.querySelectorAll('.channel-menu').forEach(menu => {
                menu.classList.remove('active');
                menu.setAttribute('aria-selected', 'false');
            });
            channelMenuEl.classList.add('active');
            channelMenuEl.setAttribute('aria-selected', 'true');
            
            // Focus management - focus newest message in new channel
            setTimeout(() => {
                const messages = _currentChannel.getRootEl().querySelectorAll('.message');
                if (messages.length > 0) {
                    // Focus on the last (newest) message
                    messages[messages.length - 1].focus();
                } else {
                    // No messages, focus on input
                    const messageInput = _currentChannel.getRootEl().querySelector('#message-input');
                    if (messageInput) {
                        messageInput.focus();
                    }
                }
            }, 100);
            
            // Close sidebar on mobile after selecting channel
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
        }

        channelMenuEl.addEventListener('click', switchToChannel);
        
        // Add keyboard support for channel switching
        channelMenuEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchToChannel();
            }
        });
        
        
        channel.registerRelays(_relays);
        _channels.push(channel);
    }
    

    
    return {
        loadChannels,
        loadChannel
    };
}