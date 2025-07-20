/**
 * Nostr protocol utility functions
 */

/**
 * Extracts username from Nostr event tags
 * @param {Object} event - The Nostr event object
 * @returns {string} The username or 'Anoniem' if not found
 */
export function extractUsername(event) {
    if (!event?.tags || !Array.isArray(event.tags)) {
        return 'Anoniem';
    }
    
    const usernameTag = event.tags.find(tag => 
        Array.isArray(tag) && tag[0] === 'username' && tag[1]
    );
    
    return usernameTag?.[1] || 'Anoniem';
}

/**
 * Converts timestamp to milliseconds for JavaScript Date objects
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {number} Timestamp in milliseconds
 */
export function timestampToMilliseconds(timestamp) {
    const SECONDS_TO_MILLISECONDS = 1000;
    return timestamp * SECONDS_TO_MILLISECONDS;
}

/**
 * Converts milliseconds to Unix timestamp in seconds
 * @param {number} milliseconds - Timestamp in milliseconds
 * @returns {number} Unix timestamp in seconds
 */
export function millisecondsToTimestamp(milliseconds = Date.now()) {
    const MILLISECONDS_TO_SECONDS = 1000;
    return Math.floor(milliseconds / MILLISECONDS_TO_SECONDS);
}

/**
 * Validates if an event has required Nostr event structure
 * @param {Object} event - The event to validate
 * @returns {boolean} True if valid Nostr event structure
 */
export function isValidNostrEvent(event) {
    return event && 
           typeof event.id === 'string' &&
           typeof event.pubkey === 'string' &&
           typeof event.created_at === 'number' &&
           typeof event.content === 'string' &&
           Array.isArray(event.tags);
}