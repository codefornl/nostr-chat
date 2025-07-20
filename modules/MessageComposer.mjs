import createNostrEvent from './createNostrEvent.mjs';

export default function MessageComposer(tag, relays) {

    const _messageComposerEl = document.createElement('div');
    _messageComposerEl.className = 'channel-composer';
    _messageComposerEl.innerHTML = `
        <input name="message" type="text" placeholder="Schrijf je bericht hier..." />
        <button>Post</button>
    `;

    const _inputEl = _messageComposerEl.querySelector('input[name="message"]');
    const _buttonEl = _messageComposerEl.querySelector('button');

    async function sendMessage() {
        const content = _inputEl.value.trim();
        if (content) {
            _inputEl.value = '';
            const event = await createNostrEvent(content, tag);
            relays.forEach(relay => relay.sendMessage(event));
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
    
    return _messageComposerEl;
}