/**
 * DOM utility functions for creating common UI elements
 * Promotes DRY principle by centralizing DOM creation patterns
 */

/**
 * Creates a div element with specified class and attributes
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @returns {HTMLDivElement} Created div element
 */
export function createDiv(className, attributes = {}) {
    const element = document.createElement('div');
    element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    
    return element;
}

/**
 * Creates a button element with specified text, class and attributes
 * @param {string} text - Button text
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @returns {HTMLButtonElement} Created button element
 */
export function createButton(text, className = '', attributes = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    if (className) button.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        button.setAttribute(key, value);
    });
    
    return button;
}

/**
 * Creates an image element with specified src, alt text and attributes
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @returns {HTMLImageElement} Created image element
 */
export function createImage(src, alt, className = '', attributes = {}) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    if (className) img.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        img.setAttribute(key, value);
    });
    
    return img;
}

/**
 * Creates a time element with specified datetime and display text
 * @param {string} datetime - ISO datetime string
 * @param {string} displayText - Text to display
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @returns {HTMLTimeElement} Created time element
 */
export function createTime(datetime, displayText, className = '', attributes = {}) {
    const time = document.createElement('time');
    time.setAttribute('datetime', datetime);
    time.textContent = displayText;
    if (className) time.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        time.setAttribute(key, value);
    });
    
    return time;
}

/**
 * Creates a heading element with specified level, text and attributes
 * @param {number} level - Heading level (1-6)
 * @param {string} text - Heading text
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @returns {HTMLHeadingElement} Created heading element
 */
export function createHeading(level, text, className = '', attributes = {}) {
    const heading = document.createElement(`h${level}`);
    heading.textContent = text;
    if (className) heading.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        heading.setAttribute(key, value);
    });
    
    return heading;
}

/**
 * Appends multiple child elements to a parent element
 * @param {HTMLElement} parent - Parent element
 * @param {...HTMLElement} children - Child elements to append
 * @returns {HTMLElement} The parent element for chaining
 */
export function appendChildren(parent, ...children) {
    children.forEach(child => {
        if (child) parent.appendChild(child);
    });
    return parent;
}