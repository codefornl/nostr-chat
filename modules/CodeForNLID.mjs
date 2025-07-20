import KeySteganography from './KeySteganography.mjs';

export default class CodeForNLID {
    
    static getCurrentUsername() {
        return localStorage.getItem('nostr_username') || 'Anoniem';
    }
    
    static getPrivateKey() {
        return localStorage.getItem('nostr_privkey');
    }
    
    static getPublicKey() {
        return localStorage.getItem('nostr_pubkey');
    }
    
    static isLoggedIn() {
        return this.getCurrentUsername() !== 'Anoniem' && this.getPrivateKey();
    }
    
    static async createNewID(username) {
        if (!username || !username.trim()) {
            throw new Error('Gebruikersnaam is verplicht');
        }
        
        // Generate new key pair
        const { getPublicKey } = await import('https://esm.sh/nostr-tools');
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        const privateKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const pubkey = getPublicKey(privateKey);
        
        // Store everything and mark as newly created
        localStorage.setItem('nostr_privkey', privateKey);
        localStorage.setItem('nostr_pubkey', pubkey);
        localStorage.setItem('nostr_username', username.trim());
        localStorage.setItem('nostr_id_source', 'created');
        
        return { privateKey, pubkey, username: username.trim() };
    }
    
    static async importIDFromImage(imageFile) {
        const { privateKey, username } = await KeySteganography.extractKeyFromImage(imageFile);
        const { getPublicKey } = await import('https://esm.sh/nostr-tools');
        const pubkey = getPublicKey(privateKey);
        
        localStorage.setItem('nostr_privkey', privateKey);
        localStorage.setItem('nostr_pubkey', pubkey);
        localStorage.setItem('nostr_username', username);
        localStorage.setItem('nostr_id_source', 'imported');
        
        return { privateKey, pubkey, username };
    }
    
    static downloadBackupImage(filename) {
        const privateKey = this.getPrivateKey();
        const username = this.getCurrentUsername();
        const pubkey = this.getPublicKey();
        
        if (!privateKey) {
            throw new Error('Geen private key gevonden');
        }
        
        // Generate avatar as base image for steganography
        const avatarCanvas = this.generateAvatarFromPubkey(pubkey, 64);
        
        KeySteganography.downloadKeyImage(privateKey, username, filename || `nostr-backup-${username}.png`, avatarCanvas);
    }
    
    static getIDSource() {
        return localStorage.getItem('nostr_id_source') || 'unknown';
    }
    
    static needsBackup() {
        return this.getIDSource() === 'created';
    }
    
    static logout() {
        localStorage.removeItem('nostr_username');
        localStorage.removeItem('nostr_privkey');
        localStorage.removeItem('nostr_pubkey');
        localStorage.removeItem('nostr_id_source');
    }
    
    static setAnonymous() {
        this.logout();
        localStorage.setItem('nostr_username', 'Anoniem');
    }
    
    static generateAvatarFromPubkey(pubkey, size = 64) {
        // Use pubkey as seed for deterministic avatar generation
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create a simple hash function from pubkey
        const hash = this._hashPubkey(pubkey);
        
        // Extract parameters from hash
        const faceColor = this._getColorFromHash(hash, 0);
        const eyeColor = this._getColorFromHash(hash, 3);
        const hairColor = this._getColorFromHash(hash, 6);
        const eyeSize = (hash[9] % 3) + 2; // 2-4
        const eyeSpacing = (hash[10] % 20) + 15; // 15-34
        const mouthWidth = (hash[11] % 20) + 15; // 15-34
        const noseSize = (hash[12] % 3) + 1; // 1-3
        const faceShape = hash[13] % 2; // 0=round, 1=square
        
        // Draw background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        
        // Draw face
        ctx.fillStyle = faceColor;
        if (faceShape === 0) {
            // Round face
            ctx.beginPath();
            ctx.arc(size/2, size/2, size*0.35, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Square face
            const faceSize = size * 0.7;
            ctx.fillRect((size - faceSize)/2, (size - faceSize)/2, faceSize, faceSize);
        }
        
        // Draw hair
        ctx.fillStyle = hairColor;
        ctx.fillRect(size*0.2, size*0.1, size*0.6, size*0.3);
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        const eyeY = size * 0.4;
        const leftEyeX = size/2 - eyeSpacing;
        const rightEyeX = size/2 + eyeSpacing;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, eyeSize * 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Right eye  
        ctx.beginPath();
        ctx.arc(rightEyeX, eyeY, eyeSize * 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, eyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw nose
        ctx.fillStyle = this._darkenColor(faceColor, 20);
        const noseY = size * 0.55;
        ctx.fillRect(size/2 - noseSize, noseY, noseSize * 2, noseSize * 3);
        
        // Draw mouth
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size * 0.7, mouthWidth/2, 0, Math.PI);
        ctx.stroke();
        
        return canvas;
    }
    
    static _hashPubkey(pubkey) {
        // Simple hash function to convert pubkey to array of numbers
        const hash = [];
        for (let i = 0; i < pubkey.length && hash.length < 16; i += 4) {
            const chunk = pubkey.slice(i, i + 4);
            hash.push(parseInt(chunk, 16) % 256);
        }
        // Pad with zeros if needed
        while (hash.length < 16) {
            hash.push(0);
        }
        return hash;
    }
    
    static _getColorFromHash(hash, offset) {
        const r = hash[offset] || 0;
        const g = hash[offset + 1] || 0;
        const b = hash[offset + 2] || 0;
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    static _darkenColor(color, amount) {
        // Simple color darkening - extract RGB and reduce by amount
        const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (match) {
            const r = Math.max(0, parseInt(match[1]) - amount);
            const g = Math.max(0, parseInt(match[2]) - amount);
            const b = Math.max(0, parseInt(match[3]) - amount);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
    
    static getAvatarDataURL(pubkey, size = 64) {
        const canvas = this.generateAvatarFromPubkey(pubkey, size);
        return canvas.toDataURL('image/png');
    }
}