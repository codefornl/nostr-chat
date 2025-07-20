import CodeForNLID from './CodeForNLID.mjs';

function linkifyText(text) {
    // Find URLs in the original text BEFORE escaping
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const urls = [];
    let match;
    
    // Collect all URLs and their positions
    while ((match = urlRegex.exec(text)) !== null) {
        urls.push({
            url: match[0],
            start: match.index,
            end: match.index + match[0].length
        });
    }
    
    // If no URLs found, just escape and return
    if (urls.length === 0) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // Process text in chunks, escaping non-URL parts and linkifying URLs
    let result = '';
    let lastEnd = 0;
    
    urls.forEach(urlMatch => {
        // Escape the text before the URL
        const beforeUrl = text.slice(lastEnd, urlMatch.start);
        result += beforeUrl
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Add the linkified URL
        const cleanUrl = urlMatch.url.replace(/[.,;:!?]+$/, '');
        const trailing = urlMatch.url.slice(cleanUrl.length);
        result += `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="message-link">${cleanUrl}</a>${trailing}`;
        
        lastEnd = urlMatch.end;
    });
    
    // Escape the remaining text after the last URL
    const afterUrls = text.slice(lastEnd);
    result += afterUrls
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    return result;
}

export default function Message(event) {
    const _event = event;
    const _messageEl = createMessageElement();
    
    function createMessageElement() {
        const messageEl = document.createElement('article');
        messageEl.className = 'message';
        messageEl.setAttribute('data-pubkey', _event.pubkey);
        messageEl.setAttribute('data-event-id', _event.id);
        messageEl.setAttribute('role', 'article');
        messageEl.setAttribute('tabindex', '0');
        messageEl.setAttribute('aria-labelledby', `msg-${_event.id}-username`);
        messageEl.setAttribute('aria-describedby', `msg-${_event.id}-content msg-${_event.id}-time`);
        
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
        
        const usernameEl = document.createElement('h3');
        usernameEl.className = 'message-username';
        usernameEl.id = `msg-${_event.id}-username`;
        usernameEl.textContent = username;
        
        const timeEl = document.createElement('time');
        timeEl.className = 'message-time';
        timeEl.id = `msg-${_event.id}-time`;
        timeEl.setAttribute('datetime', new Date(_event.created_at * 1000).toISOString());
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
        contentEl.id = `msg-${_event.id}-content`;
        contentEl.setAttribute('role', 'text');
        contentEl.innerHTML = linkifyText(_event.content);
        
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