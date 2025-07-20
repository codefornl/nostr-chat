/**
 * ID generation utilities
 * Provides unique ID generation for DOM elements and components
 */

let counter = 0;

/**
 * Generates a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateUniqueId(prefix = 'id') {
    return `${prefix}-${++counter}-${performance.now().toString(36)}`;
}

/**
 * Generates a unique message ID
 * @param {string} eventId - Event ID from nostr event
 * @returns {string} Unique message ID
 */
export function generateMessageId(eventId) {
    return generateUniqueId(`msg-${eventId.slice(0, 8)}`);
}

/**
 * Generates a unique component ID
 * @param {string} componentType - Type of component (channel, relay, etc.)
 * @returns {string} Unique component ID
 */
export function generateComponentId(componentType) {
    return generateUniqueId(componentType);
}

/**
 * Resets the counter (useful for testing)
 */
export function resetCounter() {
    counter = 0;
}