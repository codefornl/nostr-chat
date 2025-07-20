import createNostrEvent from './createNostrEvent.mjs';

export default function Channel(options) {
    const _id = options.id || 'unnamed';
    const _label = options.label || 'Unnamed Channel';
    const _tag = options.tag || 'unnamed'; // FIXME: _tag = "cfnl-" + _id;

    const _channelEl = document.createElement('div');
    _channelEl.className = 'channel';
    _channelEl.style.display = 'none';
    _channelEl.id = _id;

    const _menuEl = document.createElement('div');
    _menuEl.className = 'channel-menu';
    _menuEl.innerHTML = `
        <span class="channel-name">${_label}</span>
        <span class="unread-counter" style="display: none;">0</span>
    `;

    const _headerEl = document.createElement('div');
    _headerEl.className = 'channel-header';
    _headerEl.innerHTML = `
        <button class="menu-toggle">☰</button>
        <h2>${_label}</h2>
        <div class="header-logo">
            <img src="https://codefor.nl/img/Logo-orange-01.png" alt="Code for NL" class="logo" />
        </div>
    `;
    _channelEl.appendChild(_headerEl);

    const _messagesEl = document.createElement('div');
    _messagesEl.className = 'channel-messages';
    _channelEl.appendChild(_messagesEl);

    const _messageComposer = document.createElement('div');
    _messageComposer.className = 'channel-composer';
    _messageComposer.innerHTML = `
        <input name="message" type="text" placeholder="Schrijf je bericht hier..." />
        <button>Post</button>
    `;
    _channelEl.appendChild(_messageComposer);

    const _inputEl = _messageComposer.querySelector('input[name="message"]');
    const _buttonEl = _messageComposer.querySelector('button');
    
    async function sendMessage() {
        const content = _inputEl.value.trim();
        if (content) {
            _inputEl.value = '';
            const event = await createNostrEvent(content, _tag);
            _relays.forEach(relay => relay.sendMessage(event));
        }
    }
    
    _buttonEl.addEventListener('click', async (event) => {
        event.preventDefault();
        await sendMessage();
    });
    
    _inputEl.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            await sendMessage();
        }
    });

    const _messages = new Map();
    let _relays = [];
    let _unreadCount = 0;
    let _isActive = false;
    let _onUnreadChange = null;
    let _lastViewedTime = getLastViewedTime();
    
    function getLastViewedTime() {
        const stored = localStorage.getItem(`channel_last_viewed_${_id}`);
        return stored ? parseInt(stored) : Math.floor(Date.now() / 1000);
    }
    
    function setLastViewedTime(timestamp) {
        _lastViewedTime = timestamp || Math.floor(Date.now() / 1000);
        localStorage.setItem(`channel_last_viewed_${_id}`, _lastViewedTime.toString());
    }

    function registerRelays(relays) {
        relays.forEach(relay => registerRelay(relay));
    }

    function registerRelay(relay) {
        relay.subscribe(_tag, eventHandler);
        _relays.push(relay);
        console.log(`Relay registered: ${relay.getURL()}`);
    }

    function eventHandler(event) {
        const wasNewMessage = !_messages.has(event.id);
        _messages.set(event.id, event);
        render();
        
        // Check if this message is newer than last viewed time
        const isUnreadMessage = event.created_at > _lastViewedTime;
        
        // Increment unread counter for truly new messages when channel is not active
        if (wasNewMessage && isUnreadMessage && !_isActive) {
            _unreadCount++;
            updateUnreadDisplay();
            if (_onUnreadChange) {
                _onUnreadChange(_unreadCount);
            }
        }
    }

    function render() {
        _messagesEl.innerHTML = '';
        Array.from(_messages.values()).sort((a, b) => a.created_at - b.created_at).forEach(createMessageEl);
        scrollToBottom();
        
        // Recalculate unread count based on last viewed time
        if (!_isActive) {
            recalculateUnreadCount();
        }
    }
    
    function recalculateUnreadCount() {
        _unreadCount = 0;
        _messages.forEach(message => {
            if (message.created_at > _lastViewedTime) {
                _unreadCount++;
            }
        });
        updateUnreadDisplay();
        if (_onUnreadChange) {
            _onUnreadChange(_unreadCount);
        }
    }
    
    function scrollToBottom() {
        _messagesEl.scrollTop = _messagesEl.scrollHeight;
    }

    function createMessageEl(event) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.setAttribute('data-pubkey', event.pubkey);
        
        // Extract username from event tags
        let username = 'Anoniem';
        if (event.tags) {
            const usernameTag = event.tags.find(tag => tag[0] === 'username');
            if (usernameTag && usernameTag[1]) {
                username = usernameTag[1];
            }
        }
        
        const headerEl = document.createElement('div');
        headerEl.className = 'message-header';
        
        const usernameEl = document.createElement('span');
        usernameEl.className = 'message-username';
        usernameEl.textContent = username;
        
        const timeEl = document.createElement('span');
        timeEl.className = 'message-time';
        timeEl.textContent = new Date(event.created_at * 1000).toLocaleString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
        
        headerEl.appendChild(usernameEl);
        headerEl.appendChild(timeEl);
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        contentEl.textContent = event.content;
        
        messageEl.appendChild(headerEl);
        messageEl.appendChild(contentEl);
        _messagesEl.appendChild(messageEl);
    }

    function updateUnreadDisplay() {
        const counterEl = _menuEl.querySelector('.unread-counter');
        if (_unreadCount > 0) {
            counterEl.textContent = _unreadCount;
            counterEl.style.display = 'inline-block';
            _menuEl.classList.add('has-unread');
        } else {
            counterEl.style.display = 'none';
            _menuEl.classList.remove('has-unread');
        }
    }
    
    function markAsRead() {
        setLastViewedTime(); // Update to current time
        _unreadCount = 0;
        updateUnreadDisplay();
        if (_onUnreadChange) {
            _onUnreadChange(_unreadCount);
        }
    }
    
    function setActive(active) {
        _isActive = active;
        if (active) {
            markAsRead();
        } else {
            // When becoming inactive, recalculate unread count
            recalculateUnreadCount();
        }
    }
    
    function getId() {
        return _id;
    }

    function getRootEl() {
        return _channelEl;
    }

    function getMenuEl() {
        return _menuEl;
    }
    
    function getUnreadCount() {
        return _unreadCount;
    }

    // Add resize listener for scroll to bottom
    window.addEventListener('resize', () => {
        // Small delay to ensure layout has updated
        setTimeout(scrollToBottom, 100);
    });
    
    return {
        registerRelays,
        registerRelay,
        getId,
        getRootEl,
        getMenuEl,
        scrollToBottom,
        markAsRead,
        setActive,
        getUnreadCount,
        set onUnreadChange(callback) {
            _onUnreadChange = callback;
        }
    }
}