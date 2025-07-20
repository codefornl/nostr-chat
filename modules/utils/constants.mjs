/**
 * Application constants and configuration values
 */

// Time-related constants
export const TIMEOUTS = {
    SCROLL_RESET_DELAY: 150,           // MessagesViewer scroll detection reset
    SIDEBAR_ANIMATION_DELAY: 350,     // Chat sidebar animation duration
    FOCUS_DELAY: 100,                 // Delay before focusing elements
    SCREEN_READER_ANNOUNCEMENT: 1000, // Time to keep screen reader announcements
    RECONNECT_DELAY: 2000             // Relay reconnection delay
};

// UI thresholds and measurements
export const THRESHOLDS = {
    SCROLL_BOTTOM_PIXELS: 50,         // Pixels from bottom to consider "scrolled to bottom"
    MOBILE_BREAKPOINT: 768,           // Mobile/desktop breakpoint in pixels
    TOUCH_TARGET_MIN_SIZE: 44         // Minimum touch target size for accessibility
};

// LocalStorage keys
export const STORAGE_KEYS = {
    USERNAME: 'nostr_username',
    PRIVATE_KEY: 'nostr_privkey',
    PUBLIC_KEY: 'nostr_pubkey',
    ID_SOURCE: 'nostr_id_source',
    CHANNEL_LAST_VIEWED_PREFIX: 'channel_last_viewed_'
};

// Message limits and constraints
export const MESSAGE_LIMITS = {
    MAX_MESSAGES_PER_CHANNEL: 50,    // Maximum messages to keep in memory per channel
    MAX_MESSAGE_LENGTH: 280,         // Maximum characters per message (like Twitter)
    MAX_USERNAME_LENGTH: 50          // Maximum characters for username
};

// Avatar generation constants
export const AVATAR = {
    DEFAULT_SIZE: 64,                // Default avatar size in pixels
    MESSAGE_AVATAR_SIZE: 32,         // Avatar size in messages
    USER_STATUS_AVATAR_SIZE: 48,     // Avatar size in user status area
    HASH_LENGTH: 16,                 // Number of hash values to extract from pubkey
    COLOR_COMPONENTS: 3              // RGB components for color generation
};

// Default values
export const DEFAULTS = {
    ANONYMOUS_USERNAME: 'Anoniem',
    RECONNECT_ATTEMPTS: 5,
    MESSAGE_PLACEHOLDER: 'Schrijf je bericht hier...',
    ERROR_RETRY_COUNT: 3
};

// External URLs (should be moved to config file in production)
export const URLS = {
    CODE_FOR_NL_LOGO: 'https://codefor.nl/img/Logo-orange-01.png',
    OPENDIENSTEN_LINK: 'https://opendiensten.nl'
};

// Accessibility constants
export const ACCESSIBILITY = {
    SKIP_LINK_OFFSET: 6,             // Pixels to show skip link when focused
    FOCUS_OUTLINE_WIDTH: 2,          // Focus outline width in pixels
    FOCUS_OUTLINE_OFFSET: 2,         // Focus outline offset in pixels
    HIGH_CONTRAST_OUTLINE_WIDTH: 3   // Focus outline width in high contrast mode
};

// Content processing
export const CONTENT = {
    URL_REGEX: /(https?:\/\/[^\s<>"']+)/gi,
    MAX_URL_LENGTH: 100,             // Maximum URL length to display
    LINK_REL_ATTRIBUTES: 'noopener noreferrer'
};