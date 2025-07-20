export default class KeySteganography {
    
    static generateKeyImage(privateKey, username, size = 64, baseCanvas = null) {
        // Create canvas for image generation
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // If a base canvas (avatar) is provided, use it as starting point
        if (baseCanvas) {
            ctx.drawImage(baseCanvas, 0, 0, size, size);
        }
        
        // Get current image data (either from avatar or blank)
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Convert hex private key to binary string
        const keyBinary = this.hexToBinary(privateKey);
        
        // Convert username to binary (UTF-8)
        const usernameBinary = this.stringToBinary(username);
        const usernameLengthBinary = this.numberToBinary(username.length, 8); // 8 bits for length
        
        // Add simple checksum (XOR of all bytes)
        const checksum = this.calculateChecksum(privateKey + username);
        const checksumBinary = this.hexToBinary(checksum.toString(16).padStart(2, '0'));
        
        // Combine: key + username_length + username + checksum
        const totalData = keyBinary + usernameLengthBinary + usernameBinary + checksumBinary;
        
        let dataIndex = 0;
        
        // Embed data in LSBs of existing image or create random noise
        for (let i = 0; i < data.length; i += 4) {
            let r, g, b;
            
            if (baseCanvas) {
                // Use existing pixel values from avatar
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
            } else {
                // Generate random RGB values (fallback)
                r = Math.floor(Math.random() * 256);
                g = Math.floor(Math.random() * 256);
                b = Math.floor(Math.random() * 256);
            }
            
            // Embed data in LSBs if we still have data to embed
            if (dataIndex < totalData.length) {
                r = (r & 0xFE) | parseInt(totalData[dataIndex++] || '0');
            }
            if (dataIndex < totalData.length) {
                g = (g & 0xFE) | parseInt(totalData[dataIndex++] || '0');
            }
            if (dataIndex < totalData.length) {
                b = (b & 0xFE) | parseInt(totalData[dataIndex++] || '0');
            }
            
            data[i] = r;     // Red
            data[i + 1] = g; // Green
            data[i + 2] = b; // Blue
            data[i + 3] = 255; // Alpha (fully opaque)
        }
        
        // Put image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    }
    
    static hexToBinary(hex) {
        return hex.split('').map(char => {
            return parseInt(char, 16).toString(2).padStart(4, '0');
        }).join('');
    }
    
    static calculateChecksum(data) {
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum ^= data.charCodeAt(i);
        }
        return checksum & 0xFF; // Keep it 8 bits
    }
    
    static stringToBinary(str) {
        return str.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }
    
    static binaryToString(binary) {
        let result = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            result += String.fromCharCode(parseInt(byte, 2));
        }
        return result;
    }
    
    static numberToBinary(num, bits) {
        return num.toString(2).padStart(bits, '0');
    }
    
    static downloadKeyImage(privateKey, username, filename = 'nostr-backup.png', baseCanvas = null) {
        const canvas = this.generateKeyImage(privateKey, username, 64, baseCanvas);
        
        // Convert canvas to blob and download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
    
    static extractKeyFromImage(imageFile) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                try {
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;
                    
                    let binaryData = '';
                    
                    // Extract LSBs from RGB channels
                    for (let i = 0; i < data.length; i += 4) {
                        binaryData += (data[i] & 1).toString();     // Red LSB
                        binaryData += (data[i + 1] & 1).toString(); // Green LSB
                        binaryData += (data[i + 2] & 1).toString(); // Blue LSB
                    }
                    
                    // Extract data: key (256 bits) + username_length (8 bits) + username + checksum (8 bits)
                    const keyBits = binaryData.substring(0, 256);
                    const usernameLengthBits = binaryData.substring(256, 264);
                    const usernameLength = parseInt(usernameLengthBits, 2);
                    
                    const usernameStartBit = 264;
                    const usernameEndBit = usernameStartBit + (usernameLength * 8);
                    const usernameBits = binaryData.substring(usernameStartBit, usernameEndBit);
                    
                    const checksumBits = binaryData.substring(usernameEndBit, usernameEndBit + 8);
                    
                    const privateKey = this.binaryToHex(keyBits);
                    const username = this.binaryToString(usernameBits);
                    const extractedChecksum = parseInt(checksumBits, 2);
                    const calculatedChecksum = this.calculateChecksum(privateKey + username);
                    
                    if (extractedChecksum === calculatedChecksum) {
                        resolve({ privateKey, username });
                    } else {
                        reject(new Error('Checksum mismatch - invalid key or corrupted image'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(imageFile);
        });
    }
    
    static binaryToHex(binary) {
        let hex = '';
        for (let i = 0; i < binary.length; i += 4) {
            const nibble = binary.substr(i, 4);
            hex += parseInt(nibble, 2).toString(16);
        }
        return hex;
    }
}