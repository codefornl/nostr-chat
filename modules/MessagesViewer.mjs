import Message from './Message.mjs';

export default function MessagesViewer() {
    const _messagesEl = document.createElement('div');
    _messagesEl.className = 'channel-messages';
    
    const _messages = new Map();
    let _isUserScrolling = false;
    let _scrollTimeout = null;
    
    // Add scroll event listener to detect user scrolling
    _messagesEl.addEventListener('scroll', () => {
        _isUserScrolling = true;
        
        // Clear existing timeout
        if (_scrollTimeout) {
            clearTimeout(_scrollTimeout);
        }
        
        // Reset user scrolling flag after 150ms of no scrolling
        _scrollTimeout = setTimeout(() => {
            _isUserScrolling = false;
        }, 150);
    });
    
    function addMessage(event) {
        if (_messages.has(event.id)) return false; // Already exists
        
        // Create new Message instance
        const message = new Message(event);
        _messages.set(event.id, message);
        
        // Insert in correct chronological order
        insertMessageInOrder(message);
        
        // Auto-scroll unless user is actively scrolling
        if (!_isUserScrolling) {
            scrollToBottom();
        }
        
        return true; // New message added
    }
    
    function insertMessageInOrder(message) {
        const messageEl = message.getElement();
        const existingMessages = Array.from(_messagesEl.children);
        
        // Find the correct position to insert (oldest at top, newest at bottom)
        let insertBeforeElement = null;
        for (const existingEl of existingMessages) {
            const existingId = existingEl.getAttribute('data-event-id');
            const existingMessage = _messages.get(existingId);
            
            if (existingMessage && existingMessage.getCreatedAt() > message.getCreatedAt()) {
                insertBeforeElement = existingEl;
                break;
            }
        }
        
        if (insertBeforeElement) {
            _messagesEl.insertBefore(messageEl, insertBeforeElement);
        } else {
            // This is the newest message, append at the end
            _messagesEl.appendChild(messageEl);
        }
    }
    
    function renderAllMessages() {
        _messagesEl.innerHTML = '';
        
        // Sort messages by timestamp (oldest first)
        const sortedMessages = Array.from(_messages.values())
            .sort((a, b) => a.getCreatedAt() - b.getCreatedAt());
        
        sortedMessages.forEach(message => {
            _messagesEl.appendChild(message.getElement());
        });
        
        scrollToBottom();
    }
    
    function scrollToBottom() {
        requestAnimationFrame(() => {
            _messagesEl.scrollTop = _messagesEl.scrollHeight;
        });
    }
    
    function isScrolledToBottom() {
        const threshold = 50; // pixels
        return _messagesEl.scrollHeight - _messagesEl.clientHeight <= _messagesEl.scrollTop + threshold;
    }
    
    function getMessages() {
        return _messages;
    }
    
    function getElement() {
        return _messagesEl;
    }
    
    function hasMessage(eventId) {
        return _messages.has(eventId);
    }
    
    function getMessageCount() {
        return _messages.size;
    }
    
    // Add resize listener for scroll to bottom
    window.addEventListener('resize', () => {
        // Only scroll to bottom if user was already there
        if (isScrolledToBottom()) {
            setTimeout(scrollToBottom, 100);
        }
    });
    
    return {
        addMessage,
        renderAllMessages,
        scrollToBottom,
        isScrolledToBottom,
        getMessages,
        getElement,
        hasMessage,
        getMessageCount
    };
}