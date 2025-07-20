import CodeForNLID from './CodeForNLID.mjs';
import { linkifyText } from './utils/htmlUtils.mjs';
import { extractUsername, timestampToMilliseconds } from './utils/nostrUtils.mjs';
import { AVATAR } from './utils/constants.mjs';

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
        const username = extractUsername(_event);
        
        // Create avatar
        const avatarEl = document.createElement('img');
        avatarEl.className = 'message-avatar';
        avatarEl.src = CodeForNLID.getAvatarDataURL(_event.pubkey, AVATAR.MESSAGE_AVATAR_SIZE);
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
        const messageDate = new Date(timestampToMilliseconds(_event.created_at));
        timeEl.setAttribute('datetime', messageDate.toISOString());
        timeEl.textContent = messageDate.toLocaleString('nl-NL', {
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
        return extractUsername(_event);
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