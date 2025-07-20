import createNostrEvent from './createNostrEvent.mjs';

export default function MessageComposer(tag, relays) {

    const _messageComposerEl = document.createElement('div');
    _messageComposerEl.className = 'channel-composer';
    _messageComposerEl.innerHTML = `
        <label for="message-input" class="sr-only">Type je bericht hier</label>
        <input id="message-input" name="message" type="text" placeholder="Schrijf je bericht hier..." aria-describedby="message-help" />
        <button type="submit" aria-label="Bericht verzenden">Post</button>
        <div id="message-help" class="sr-only">Druk op Enter om je bericht te verzenden</div>
    `;

    const _inputEl = _messageComposerEl.querySelector('input[name="message"]');
    const _buttonEl = _messageComposerEl.querySelector('button');

    async function sendMessage() {
        const content = _inputEl.value.trim();
        if (content) {
            try {
                _inputEl.value = '';
                _buttonEl.disabled = true;
                _buttonEl.textContent = 'Bezig...';
                
                const event = await createNostrEvent(content, tag);
                relays.forEach(relay => relay.sendMessage(event));
                
                // Announce success to screen readers
                announceToScreenReader('Bericht verzonden');
                
                _buttonEl.disabled = false;
                _buttonEl.textContent = 'Post';
            } catch (error) {
                // Restore message and show error
                _inputEl.value = content;
                _buttonEl.disabled = false;
                _buttonEl.textContent = 'Post';
                
                console.error('Error sending message:', error);
                announceToScreenReader(`Fout bij verzenden: ${error.message}`);
            }
        }
    }
    
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement is made
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
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
    
    return _messageComposerEl;
}