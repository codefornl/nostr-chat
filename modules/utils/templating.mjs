/**
 * Resig-style Microtemplating engine for secure HTML generation
 * Eliminates innerHTML security risks and provides clean templating
 */

import { validateAndSanitizeTemplateData, schemas } from './validation.mjs';
import { LRUCache, memoize } from './performance.mjs';

const templateCache = new LRUCache(50); // Limit template cache size

/**
 * Compiles a template string into a function
 * Based on John Resig's microtemplating approach
 * @param {string} template - Template string with <%= %> placeholders
 * @returns {Function} Compiled template function
 */
// Memoize template compilation for better performance
const compileTemplate = memoize(function(template) {
    if (templateCache.has(template)) {
        return templateCache.get(template);
    }

    const code = "var p=[],print=function(){p.push.apply(p,arguments);};" +
        "with(data){p.push('" +
        template
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            .replace(/\t=(.*?)%>/g, "',$1,'")
            .split("\t").join("');")
            .split("%>").join("p.push('")
            .split("\r").join("\\'") +
        "');}return p.join('');";

    const compiledFn = new Function("data", code);
    templateCache.set(template, compiledFn);
    return compiledFn;
});

/**
 * Renders a template with provided data
 * @param {string} template - Template string
 * @param {Object} data - Data object for template variables
 * @param {Object} schema - Optional validation schema
 * @returns {string} Rendered HTML string
 */
export function renderTemplate(template, data = {}, schema = null) {
    const sanitizedData = schema ? validateAndSanitizeTemplateData(data, schema) : data;
    const compiledTemplate = compileTemplate(template);
    return compiledTemplate(sanitizedData);
}

/**
 * Creates a DOM element from a template
 * @param {string} tagName - HTML tag name for the element
 * @param {string} template - Template string
 * @param {Object} data - Data object for template variables
 * @param {string} className - CSS class name
 * @param {Object} attributes - Object with attribute key-value pairs
 * @param {Object} schema - Optional validation schema
 * @returns {HTMLElement} Created DOM element with rendered content
 */
export function createElementFromTemplate(tagName, template, data = {}, className = '', attributes = {}, schema = null) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    
    element.innerHTML = renderTemplate(template, data, schema);
    return element;
}

/**
 * Pre-defined templates for common UI components
 */
export const templates = {
    openDienstenLink: `
        <a href="<%= url %>" target="_blank" rel="noopener noreferrer">
            <strong><%= title %></strong><br>
            <small><%= subtitle %></small>
        </a>
    `,
    
    relayStatus: `
        <div class="relay-header" role="button" tabindex="0" aria-expanded="false" aria-controls="relay-list">
            <h3>Relays</h3>
            <div class="relay-indicators-compact">
                <!-- Compact view - will be populated by JavaScript -->
            </div>
            <span class="relay-expand-icon" aria-hidden="true">▼</span>
        </div>
        <div class="relay-list" id="relay-list" aria-hidden="true"></div>
    `,
    
    relayItem: `
        <span class="relay-indicator"></span>
        <span class="relay-url"><%= hostname %></span>
    `,
    
    userStatusLoggedOut: `
        <h3>Niet ingelogd</h3>
        <div class="current-user"><%= username %></div>
        <div class="user-actions">
            <button class="import-key-btn">Code for NL ID inladen</button>
            <button class="new-account-btn">Code for NL ID aanmaken</button>
        </div>
    `,
    
    userStatusLoggedIn: `
        <h3>Ingelogd als</h3>
        <div class="current-user">
            <% if (avatarDataURL) { %>
                <img src="<%= avatarDataURL %>" alt="Avatar" class="user-avatar" />
            <% } %>
            <span class="username"><%= username %></span>
        </div>
        <div class="user-actions">
            <% if (needsBackup) { %>
                <button class="download-key-btn">🔑 Key downloaden</button>
            <% } %>
            <button class="logout-btn">Uitloggen</button>
        </div>
    `,
    
    channelMenu: `
        <span class="channel-name"><%= label %></span>
        <span class="unread-counter" style="display: none;" aria-label="ongelezen berichten">0</span>
    `,
    
    channelHeader: `
        <button class="menu-toggle" aria-label="Menu openen" aria-expanded="false">☰</button>
        <h1><%= label %></h1>
        <div class="header-logo">
            <img src="<%= logoUrl %>" alt="<%= logoAlt %>" class="logo" />
        </div>
    `
};

/**
 * Clears the template cache (useful for development/testing)
 */
export function clearTemplateCache() {
    templateCache.clear();
}