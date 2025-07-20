
import MessagesViewer from './MessagesViewer.mjs';
import MessageComposer from './MessageComposer.mjs';
import { millisecondsToTimestamp } from './utils/nostrUtils.mjs';
import { STORAGE_KEYS } from './utils/constants.mjs';
import { renderTemplate, templates } from './utils/templating.mjs';

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
    _menuEl.setAttribute('role', 'button');
    _menuEl.setAttribute('tabindex', '0');
    _menuEl.setAttribute('aria-label', `Schakel naar ${_label} kanaal`);
    _menuEl.innerHTML = renderTemplate(templates.channelMenu, {
        label: _label
    });

    const _headerEl = document.createElement('div');
    _headerEl.className = 'channel-header';
    _headerEl.setAttribute('role', 'banner');
    _headerEl.innerHTML = renderTemplate(templates.channelHeader, {
        label: _label,
        logoUrl: 'https://codefor.nl/img/Logo-orange-01.png',
        logoAlt: 'Code for NL'
    });

    let _relays = [];
    let _unreadCount = 0;
    let _isActive = false;
    let _onUnreadChange = null;
    let _lastViewedTime = getLastViewedTime();
    
    const _messagesViewer = new MessagesViewer();
    const _messageComposer = new MessageComposer(_tag, _relays);

    _channelEl.appendChild(_headerEl);
    _channelEl.appendChild(_messagesViewer.getElement());
    _channelEl.appendChild(_messageComposer);
    
    function getLastViewedTime() {
        const storageKey = `${STORAGE_KEYS.CHANNEL_LAST_VIEWED_PREFIX}${_id}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? parseInt(stored) : millisecondsToTimestamp();
    }
    
    function setLastViewedTime(timestamp) {
        _lastViewedTime = timestamp || millisecondsToTimestamp();
        const storageKey = `${STORAGE_KEYS.CHANNEL_LAST_VIEWED_PREFIX}${_id}`;
        localStorage.setItem(storageKey, _lastViewedTime.toString());
    }

    function registerRelays(relays) {
        relays.forEach(relay => registerRelay(relay));
    }

    function registerRelay(relay) {
        relay.subscribe(_tag, eventHandler);
        _relays.push(relay);
    }

    function eventHandler(event) {
        // Delegate message handling to MessagesViewer
        const wasNewMessage = _messagesViewer.addMessage(event);
        
        if (wasNewMessage) {
            // Check if this message is newer than last viewed time
            const isUnreadMessage = event.created_at > _lastViewedTime;
            
            // Increment unread counter for truly new messages when channel is not active
            if (isUnreadMessage && !_isActive) {
                _unreadCount++;
                updateUnreadDisplay();
                if (_onUnreadChange) {
                    _onUnreadChange(_unreadCount);
                }
            }
        }
    }
    
    function recalculateUnreadCount() {
        _unreadCount = 0;
        const messages = _messagesViewer.getMessages();
        messages.forEach(message => {
            if (message.getCreatedAt() > _lastViewedTime) {
                _unreadCount++;
            }
        });
        updateUnreadDisplay();
        if (_onUnreadChange) {
            _onUnreadChange(_unreadCount);
        }
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
        
        // Update CSS class for visual feedback
        if (active) {
            _menuEl.classList.add('active');
            markAsRead();
        } else {
            _menuEl.classList.remove('active');
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

    return {
        registerRelays,
        registerRelay,
        getId,
        getRootEl,
        getMenuEl,
        scrollToBottom: () => _messagesViewer.scrollToBottom(),
        markAsRead,
        setActive,
        getUnreadCount,
        set onUnreadChange(callback) {
            _onUnreadChange = callback;
        }
    }
}