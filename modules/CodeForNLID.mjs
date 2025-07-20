import KeySteganography from './KeySteganography.mjs';
import { AVATAR, STORAGE_KEYS, DEFAULTS } from './utils/constants.mjs';

export default class CodeForNLID {
    
    static getCurrentUsername() {
        return localStorage.getItem(STORAGE_KEYS.USERNAME) || DEFAULTS.ANONYMOUS_USERNAME;
    }
    
    static getPrivateKey() {
        return localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    }
    
    static getPublicKey() {
        return localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
    }
    
    static isLoggedIn() {
        return this.getCurrentUsername() !== DEFAULTS.ANONYMOUS_USERNAME && this.getPrivateKey();
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
        localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, privateKey);
        localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, pubkey);
        localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
        localStorage.setItem(STORAGE_KEYS.ID_SOURCE, 'created');
        
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
    
    static generateAvatarFromPubkey(pubkey, size = AVATAR.DEFAULT_SIZE) {
        const canvas = this._createCanvas(size);
        const ctx = canvas.getContext('2d');
        const features = this._extractFeaturesFromPubkey(pubkey);
        
        this._drawBackground(ctx, size);
        this._drawFace(ctx, features.face, size);
        this._drawHair(ctx, features.hair, size);
        this._drawEyes(ctx, features.eyes, size);
        this._drawNose(ctx, features.nose, features.face, size);
        this._drawMouth(ctx, features.mouth, size);
        
        return canvas;
    }
    
    static _createCanvas(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        return canvas;
    }
    
    static _extractFeaturesFromPubkey(pubkey) {
        const hash = this._hashPubkey(pubkey);
        
        return {
            face: {
                color: this._getColorFromHash(hash, 0),
                shape: hash[13] % 2 // 0=round, 1=square
            },
            eyes: {
                color: this._getColorFromHash(hash, 3),
                size: (hash[9] % 3) + 2, // 2-4
                spacing: (hash[10] % 20) + 15 // 15-34
            },
            hair: {
                color: this._getColorFromHash(hash, 6)
            },
            nose: {
                size: (hash[12] % 3) + 1 // 1-3
            },
            mouth: {
                width: (hash[11] % 20) + 15 // 15-34
            }
        };
    }
    
    static _drawBackground(ctx, size) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
    }
    
    static _drawFace(ctx, faceFeatures, size) {
        ctx.fillStyle = faceFeatures.color;
        
        if (faceFeatures.shape === 0) {
            // Round face
            ctx.beginPath();
            ctx.arc(size/2, size/2, size*0.35, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Square face
            const faceSize = size * 0.7;
            ctx.fillRect((size - faceSize)/2, (size - faceSize)/2, faceSize, faceSize);
        }
    }
    
    static _drawHair(ctx, hairFeatures, size) {
        ctx.fillStyle = hairFeatures.color;
        ctx.fillRect(size*0.2, size*0.1, size*0.6, size*0.3);
    }
    
    static _drawEyes(ctx, eyeFeatures, size) {
        const eyeY = size * 0.4;
        const leftEyeX = size/2 - eyeFeatures.spacing;
        const rightEyeX = size/2 + eyeFeatures.spacing;
        
        // Draw eye whites
        ctx.fillStyle = '#ffffff';
        this._drawCircle(ctx, leftEyeX, eyeY, eyeFeatures.size * 2);
        this._drawCircle(ctx, rightEyeX, eyeY, eyeFeatures.size * 2);
        
        // Draw pupils
        ctx.fillStyle = eyeFeatures.color;
        this._drawCircle(ctx, leftEyeX, eyeY, eyeFeatures.size);
        this._drawCircle(ctx, rightEyeX, eyeY, eyeFeatures.size);
    }
    
    static _drawNose(ctx, noseFeatures, faceFeatures, size) {
        ctx.fillStyle = this._darkenColor(faceFeatures.color, 20);
        const noseY = size * 0.55;
        ctx.fillRect(size/2 - noseFeatures.size, noseY, noseFeatures.size * 2, noseFeatures.size * 3);
    }
    
    static _drawMouth(ctx, mouthFeatures, size) {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size * 0.7, mouthFeatures.width/2, 0, Math.PI);
        ctx.stroke();
    }
    
    static _drawCircle(ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
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