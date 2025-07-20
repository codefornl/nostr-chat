/**
 * HTML utility functions for safe content processing
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} The escaped text safe for HTML insertion
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Processes URLs in text and converts them to safe HTML links
 * @param {string} text - The text containing URLs
 * @returns {string} HTML string with linkified URLs
 */
export function linkifyText(text) {
    // Find URLs in the original text BEFORE escaping
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const urls = [];
    let match;
    
    // Collect all URLs and their positions
    while ((match = urlRegex.exec(text)) !== null) {
        urls.push({
            url: match[0],
            start: match.index,
            end: match.index + match[0].length
        });
    }
    
    // If no URLs found, just escape and return
    if (urls.length === 0) {
        return escapeHtml(text);
    }
    
    // Process text in chunks, escaping non-URL parts and linkifying URLs
    let result = '';
    let lastEnd = 0;
    
    urls.forEach(urlMatch => {
        // Escape the text before the URL
        const beforeUrl = text.slice(lastEnd, urlMatch.start);
        result += escapeHtml(beforeUrl);
        
        // Add the linkified URL
        const cleanUrl = urlMatch.url.replace(/[.,;:!?]+$/, '');
        const trailing = urlMatch.url.slice(cleanUrl.length);
        result += `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="message-link">${cleanUrl}</a>${trailing}`;
        
        lastEnd = urlMatch.end;
    });
    
    // Escape the remaining text after the last URL
    const afterUrls = text.slice(lastEnd);
    result += escapeHtml(afterUrls);
    
    return result;
}

/**
 * Linkifies hashtags to channel links if the channel exists
 * @param {string} text - The text containing hashtags
 * @param {string[]} channelNames - Array of kanaalnamen (id's)
 * @returns {string} HTML string with clickable channel links
 */
export function linkifyChannels(text, channelNames) {
    // Regex voor hashtags: #kanaalnaam (letters, cijfers, underscores, minimaal 2 tekens)
    return text.replace(/#([a-zA-Z0-9_\-]{2,})/g, (match, kanaal) => {
        if (channelNames.includes(kanaal)) {
            return `<a href="#" class="channel-link" data-channel="${kanaal}" title="Ga naar #${kanaal} kanaal">
                <span class="channel-hash">#</span><span class="channel-name">${kanaal}</span>
            </a>`;
        }
        return match;
    });
}