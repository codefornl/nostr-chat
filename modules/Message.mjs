import CodeForNLID from './CodeForNLID.mjs';

export default function Message(event) {
    const _event = event;
    const _messageEl = createMessageElement();
    
    function createMessageElement() {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.setAttribute('data-pubkey', _event.pubkey);
        messageEl.setAttribute('data-event-id', _event.id);
        
        // Extract username from event tags
        let username = 'Anoniem';
        if (_event.tags) {
            const usernameTag = _event.tags.find(tag => tag[0] === 'username');
            if (usernameTag && usernameTag[1]) {
                username = usernameTag[1];
            }
        }
        
        // Create avatar
        const avatarEl = document.createElement('img');
        avatarEl.className = 'message-avatar';
        avatarEl.src = CodeForNLID.getAvatarDataURL(_event.pubkey, 32);
        avatarEl.alt = `Avatar voor ${username}`;
        avatarEl.title = `Avatar voor ${username}`;
        
        const headerEl = document.createElement('div');
        headerEl.className = 'message-header';
        
        const usernameEl = document.createElement('span');
        usernameEl.className = 'message-username';
        usernameEl.textContent = username;
        
        const timeEl = document.createElement('span');
        timeEl.className = 'message-time';
        timeEl.textContent = new Date(_event.created_at * 1000).toLocaleString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
        
        headerEl.appendChild(usernameEl);
        headerEl.appendChild(timeEl);
        
        const messageBodyEl = document.createElement('div');
        messageBodyEl.className = 'message-body';
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        contentEl.textContent = _event.content;
        
        messageBodyEl.appendChild(headerEl);
        messageBodyEl.appendChild(contentEl);
        
        messageEl.appendChild(avatarEl);
        messageEl.appendChild(messageBodyEl);
        
        return messageEl;
    }
    
    function getElement() {
        return _messageEl;
    }
    
    function getEvent() {
        return _event;
    }
    
    function getId() {
        return _event.id;
    }
    
    function getCreatedAt() {
        return _event.created_at;
    }
    
    function getPubkey() {
        return _event.pubkey;
    }
    
    function getContent() {
        return _event.content;
    }
    
    function getUsername() {
        if (_event.tags) {
            const usernameTag = _event.tags.find(tag => tag[0] === 'username');
            if (usernameTag && usernameTag[1]) {
                return usernameTag[1];
            }
        }
        return 'Anoniem';
    }
    
    return {
        getElement,
        getEvent,
        getId,
        getCreatedAt,
        getPubkey,
        getContent,
        getUsername
    };
}