import Message from './Message.mjs';
import { TIMEOUTS, THRESHOLDS } from './utils/constants.mjs';

export default function MessagesViewer() {
    const _messagesEl = document.createElement('div');
    _messagesEl.className = 'channel-messages';
    _messagesEl.setAttribute('role', 'log');
    _messagesEl.setAttribute('aria-live', 'polite');
    _messagesEl.setAttribute('aria-label', 'Chat berichten');
    _messagesEl.setAttribute('tabindex', '0'); // Make messages container focusable
    
    // When messages container gets focus, focus on newest message
    _messagesEl.addEventListener('focus', () => {
        const messages = _messagesEl.querySelectorAll('.message');
        if (messages.length > 0) {
            // Focus newest message and remove focus from container
            messages[messages.length - 1].focus();
        }
    });
    
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
        
        // Reset user scrolling flag after no scrolling
        _scrollTimeout = setTimeout(() => {
            _isUserScrolling = false;
        }, TIMEOUTS.SCROLL_RESET_DELAY);
    });
    
    // Add keyboard navigation for messages (chat-style navigation)
    _messagesEl.addEventListener('keydown', (event) => {
        const focusedElement = document.activeElement;
        const messages = Array.from(_messagesEl.querySelectorAll('.message'));
        const currentIndex = messages.indexOf(focusedElement);
        
        // Arrow Down = go to newer message (higher index, further down in chat)
        if (event.key === 'ArrowDown' && currentIndex >= 0 && currentIndex < messages.length - 1) {
            event.preventDefault();
            messages[currentIndex + 1].focus();
        } 
        // Arrow Up = go to older message (lower index, further up in chat)
        else if (event.key === 'ArrowUp' && currentIndex > 0) {
            event.preventDefault();
            messages[currentIndex - 1].focus();
        } 
        // Home = go to oldest message (first message)
        else if (event.key === 'Home' && messages.length > 0) {
            event.preventDefault();
            messages[0].focus();
        } 
        // End = go to newest message (last message)
        else if (event.key === 'End' && messages.length > 0) {
            event.preventDefault();
            messages[messages.length - 1].focus();
        }
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
        return _messagesEl.scrollHeight - _messagesEl.clientHeight <= _messagesEl.scrollTop + THRESHOLDS.SCROLL_BOTTOM_PIXELS;
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
            setTimeout(scrollToBottom, TIMEOUTS.FOCUS_DELAY);
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