import CodeForNLID from './CodeForNLID.mjs';
import { linkifyText, linkifyChannels } from './utils/htmlUtils.mjs';
import { extractUsername, timestampToMilliseconds } from './utils/nostrUtils.mjs';
import { AVATAR } from './utils/constants.mjs';
import ChannelService from './services/ChannelService.mjs';
import { createDiv, createImage, createTime, createHeading, appendChildren } from './utils/domUtils.mjs';
import { generateMessageId } from './utils/idGenerator.mjs';

/**
 * Message component factory function
 * Creates a complete message UI element with avatar, header, and content
 * @param {Object} event - Nostr event object containing message data
 * @param {string} event.id - Unique event identifier
 * @param {string} event.pubkey - Public key of message author
 * @param {string} event.content - Message content text
 * @param {number} event.created_at - Unix timestamp of message creation
 * @returns {Object} Message API with getter methods
 */
export default function Message(event) {
    const _event = event;
    const _messageId = generateMessageId(_event.id);
    const _messageEl = createMessageElement();

    function createAvatar(pubkey, username) {
        return createImage(
            CodeForNLID.getAvatarDataURL(pubkey, AVATAR.MESSAGE_AVATAR_SIZE),
            `Avatar voor ${username}`,
            'message-avatar',
            { title: `Avatar voor ${username}` }
        );
    }

    function createHeader(username, messageId, createdAt) {
        const headerEl = createDiv('message-header');

        const usernameEl = createHeading(3, username, 'message-username', {
            id: `${messageId}-username`
        });

        const messageDate = new Date(timestampToMilliseconds(createdAt));
        const timeEl = createTime(
            messageDate.toISOString(),
            messageDate.toLocaleString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            }),
            'message-time',
            { id: `${messageId}-time` }
        );

        return appendChildren(headerEl, usernameEl, timeEl);
    }

    function createContent(content, messageId) {
        const contentEl = createDiv('message-content', {
            id: `${messageId}-content`,
            role: 'text'
        });
        
        // Eerst urls/escaping, daarna hashtags zodat kanaallinks niet geescaped worden
        let html = linkifyText(content);
        html = linkifyChannels(html, ChannelService.getChannelNames());
        contentEl.innerHTML = html;
        return contentEl;
    }

    function createMessageElement() {
        const messageEl = document.createElement('article');
        messageEl.className = 'message';
        messageEl.setAttribute('data-pubkey', _event.pubkey);
        messageEl.setAttribute('data-event-id', _event.id);
        messageEl.setAttribute('role', 'article');
        messageEl.setAttribute('tabindex', '0');
        messageEl.setAttribute('aria-labelledby', `${_messageId}-username`);
        messageEl.setAttribute('aria-describedby', `${_messageId}-content ${_messageId}-time`);

        const username = extractUsername(_event);
        const avatarEl = createAvatar(_event.pubkey, username);
        const headerEl = createHeader(username, _messageId, _event.created_at);
        const contentEl = createContent(_event.content, _messageId);

        const messageBodyEl = createDiv('message-body');
        appendChildren(messageBodyEl, headerEl, contentEl);

        return appendChildren(messageEl, avatarEl, messageBodyEl);
    }

    // API
    function getElement() { return _messageEl; }
    function getEvent() { return _event; }
    function getId() { return _event.id; }
    function getCreatedAt() { return _event.created_at; }
    function getPubkey() { return _event.pubkey; }
    function getContent() { return _event.content; }
    function getUsername() { return extractUsername(_event); }

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