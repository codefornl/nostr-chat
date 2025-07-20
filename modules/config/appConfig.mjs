/**
 * Application configuration constants
 * Centralized configuration for maintainability and flexibility
 */

export const APP_CONFIG = {
    // External links
    EXTERNAL_LINKS: {
        OPENDIENSTEN: {
            url: 'https://www.opendiensten.nl/',
            title: 'OpenDiensten.nl',
            subtitle: 'Videochat, online notes en meer tools'
        },
        CODE_FOR_NL_LOGO: {
            url: 'https://codefor.nl/img/Logo-orange-01.png',
            alt: 'Code for NL'
        }
    },

    // Default fallbacks
    FALLBACKS: {
        RELAY: {
            url: 'wss://relay.damus.io',
            name: 'Damus (fallback)'
        },
        CHANNEL: {
            id: 'algemeen',
            label: 'Algemeen',
            tag: 'algemeen'
        }
    },

    // UI settings
    UI: {
        STATUS_UPDATE_INTERVAL: 2000,
        SCROLL_RESET_DELAY: 1000,
        FOCUS_DELAY: 100,
        SCROLL_BOTTOM_THRESHOLD: 5
    },

    // File paths
    CONFIG_PATHS: {
        RELAYS: './config/relays.json',
        CHANNELS: './config/channels.json'
    },

    // Avatar settings
    AVATAR: {
        MESSAGE_SIZE: 32,
        USER_SIZE: 48
    },

    // Validation limits
    LIMITS: {
        USERNAME_MAX_LENGTH: 50,
        CHANNEL_LABEL_MAX_LENGTH: 50,
        URL_DESCRIPTION_MAX_LENGTH: 200,
        HOSTNAME_MAX_LENGTH: 100
    },

    // Accessibility
    ARIA_LABELS: {
        CHANNEL_NAVIGATION: 'Kanaal navigatie en gebruikersinstellingen',
        MENU_TOGGLE: 'Menu openen',
        UNREAD_MESSAGES: 'ongelezen berichten',
        CHAT_MESSAGES: 'Chat berichten'
    }
};

/**
 * Environment-specific configuration
 */
export const ENV_CONFIG = {
    development: {
        DEBUG: true,
        CACHE_TEMPLATES: false,
        LOG_VALIDATION_ERRORS: true
    },
    production: {
        DEBUG: false,
        CACHE_TEMPLATES: true,
        LOG_VALIDATION_ERRORS: false
    }
};

/**
 * Gets current environment configuration
 * @returns {Object} Environment configuration
 */
export function getEnvConfig() {
    const env = process?.env?.NODE_ENV || 'development';
    return ENV_CONFIG[env] || ENV_CONFIG.development;
}