/**
 * Validation and sanitization utilities
 * Provides robust input validation and data sanitization
 */

/**
 * Validates and sanitizes template data before rendering
 * @param {Object} data - Template data object
 * @param {Object} schema - Validation schema
 * @returns {Object} Sanitized data object
 */
export function validateAndSanitizeTemplateData(data, schema = {}) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        const fieldSchema = schema[key] || { type: 'string', required: false };
        
        if (fieldSchema.required && (value === undefined || value === null)) {
            throw new Error(`Required field '${key}' is missing`);
        }
        
        if (value !== undefined && value !== null) {
            sanitized[key] = sanitizeValue(value, fieldSchema);
        }
    }
    
    return sanitized;
}

/**
 * Sanitizes a single value based on its type
 * @param {*} value - Value to sanitize
 * @param {Object} schema - Field schema
 * @returns {*} Sanitized value
 */
function sanitizeValue(value, schema) {
    switch (schema.type) {
        case 'string':
            return sanitizeString(value, schema);
        case 'url':
            return sanitizeUrl(value);
        case 'number':
            return sanitizeNumber(value);
        case 'boolean':
            return Boolean(value);
        case 'html':
            return sanitizeHtml(value, schema);
        case 'dom':
            return validateDOMElement(value);
        case 'object':
            return value; // Pass through objects as-is
        default:
            return String(value);
    }
}

/**
 * Sanitizes string values
 * @param {*} value - Value to sanitize
 * @param {Object} schema - Field schema
 * @returns {string} Sanitized string
 */
function sanitizeString(value, schema = {}) {
    let str = String(value).trim();
    
    if (schema.maxLength && str.length > schema.maxLength) {
        str = str.substring(0, schema.maxLength);
    }
    
    if (schema.pattern && !schema.pattern.test(str)) {
        throw new Error(`Value '${str}' does not match required pattern`);
    }
    
    return str;
}

/**
 * Sanitizes URL values
 * @param {*} value - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeUrl(value) {
    const str = String(value).trim();
    
    // Allow only http and https protocols
    if (!str.match(/^https?:\/\//)) {
        throw new Error(`Invalid URL protocol: ${str}`);
    }
    
    try {
        const url = new URL(str);
        return url.toString();
    } catch (error) {
        throw new Error(`Invalid URL: ${str}`);
    }
}

/**
 * Sanitizes number values
 * @param {*} value - Value to sanitize
 * @returns {number} Sanitized number
 */
function sanitizeNumber(value) {
    const num = Number(value);
    if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`);
    }
    return num;
}

/**
 * Sanitizes HTML content (very restrictive)
 * @param {*} value - HTML to sanitize
 * @param {Object} schema - Field schema
 * @returns {string} Sanitized HTML
 */
function sanitizeHtml(value, schema = {}) {
    const str = String(value);
    const allowedTags = schema.allowedTags || [];
    
    if (allowedTags.length === 0) {
        // Strip all HTML if no tags are allowed
        return str.replace(/<[^>]*>/g, '');
    }
    
    // Very basic HTML sanitization (in production, use a proper library like DOMPurify)
    const tagPattern = new RegExp(`<(?!/?(?:${allowedTags.join('|')})(?:\\s|>))[^>]*>`, 'gi');
    return str.replace(tagPattern, '');
}

/**
 * Validates DOM element
 * @param {*} value - Value to validate as DOM element
 * @returns {HTMLElement} Validated DOM element
 * @throws {Error} If value is not a valid DOM element
 */
function validateDOMElement(value) {
    if (!value || typeof value !== 'object') {
        throw new Error('Expected DOM element, got ' + typeof value);
    }
    
    if (!(value instanceof Element) && !(value instanceof Node)) {
        throw new Error('Expected DOM element, got non-DOM object');
    }
    
    return value;
}

/**
 * Pre-defined validation schemas for common data types
 */
export const schemas = {
    userStatus: {
        username: { type: 'string', required: true, maxLength: 50 },
        avatarDataURL: { type: 'string', required: false },
        needsBackup: { type: 'boolean', required: false }
    },
    
    openDienstenLink: {
        url: { type: 'url', required: true },
        title: { type: 'string', required: true, maxLength: 100 },
        subtitle: { type: 'string', required: true, maxLength: 200 }
    },
    
    relayItem: {
        hostname: { type: 'string', required: true, maxLength: 100 }
    },
    
    channelMenu: {
        label: { type: 'string', required: true, maxLength: 50 }
    },
    
    channelHeader: {
        label: { type: 'string', required: true, maxLength: 50 },
        logoUrl: { type: 'url', required: true },
        logoAlt: { type: 'string', required: true, maxLength: 50 }
    }
};

/**
 * Validates configuration objects
 * @param {Object} config - Configuration object
 * @param {Object} schema - Configuration schema
 * @returns {Object} Validated configuration
 */
export function validateConfig(config, schema) {
    const validated = {};
    
    for (const [key, fieldSchema] of Object.entries(schema)) {
        const value = config[key];
        
        if (fieldSchema.required && value === undefined) {
            throw new Error(`Required configuration field '${key}' is missing`);
        }
        
        if (value !== undefined) {
            validated[key] = sanitizeValue(value, fieldSchema);
        } else if (fieldSchema.default !== undefined) {
            validated[key] = fieldSchema.default;
        }
    }
    
    return validated;
}