// backend/utils/encryption.js

const crypto = require('crypto');

// ==========================================
// 1. Diffie-Hellman Key Exchange Class
//    Used to establish a shared symmetric secret between two parties.
// ==========================================
class DiffieHellman {
    /**
     * @param {number} primeLength - The length of the prime modulus in bits.
     */
    constructor(primeLength = 2048) {
        // Use Node.js built-in DiffieHellman
        this.dh = crypto.createDiffieHellman(primeLength);
        this.dh.generateKeys();
    }

    /**
     * Gets the public key for exchange.
     * @returns {string} The public key in Base64 format.
     */
    getPublicKey() {
        return this.dh.getPublicKey('base64');
    }

    /**
     * Computes the shared secret using the other party's public key.
     * @param {string} otherPublicKey - The other party's public key (Base64).
     * @returns {string} The shared secret in Base64 format.
     */
    computeSecret(otherPublicKey) {
        const otherPublicKeyBuffer = Buffer.from(otherPublicKey, 'base64');
        return this.dh.computeSecret(otherPublicKeyBuffer).toString('base64');
    }
}

// ==========================================
// 2. AES Symmetric Message Encryption Class
//    Used for fast encryption/decryption of the message content itself.
// ==========================================
class MessageEncryption {
    constructor() {
        // AES-256-GCM is preferred for its authenticated encryption (AuthTag)
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Generates a 32-byte key suitable for AES-256.
     * @returns {string} A 32-byte (256-bit) random key in Base64 format.
     */
    generateKey() {
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * Encrypts a plaintext message.
     * @param {string} text - The message to encrypt.
     * @param {string} key - The symmetric key (Base64).
     * @returns {{iv: string, encryptedData: string, authTag: string}} Encrypted object.
     */
    encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        // Use 'sha256' as digest if creating from password, but here we use a generated key Buffer
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'base64'), iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypts an encrypted message.
     * @param {{iv: string, encryptedData: string, authTag: string}} encryptedData - The encrypted object.
     * @param {string} key - The symmetric key (Base64).
     * @returns {string} The decrypted message.
     */
    decrypt(encryptedData, key) {
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            Buffer.from(key, 'base64'),
            iv
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(
            encryptedData.encryptedData,
            'hex',
            'utf8'
        );
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

// ==========================================
// 3. Hybrid E2E Encryption Class
//    Uses RSA to secure a randomly generated AES session key.
// ==========================================
class E2EEncryption {
    constructor() {
        this.messageEncryption = new MessageEncryption();
    }

    /**
     * Generates an RSA public/private key pair (used for user profiles).
     * @returns {{publicKey: string, privateKey: string}} PEM-encoded keys.
     */
    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096, // High security modulus
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return { publicKey, privateKey };
    }

    /**
     * Encrypts a message using a new symmetric key, then encrypts that key
     * with the recipient's public key (Hybrid Encryption).
     * @param {string} message - The plaintext message.
     * @param {string} recipientPublicKey - The recipient's PEM-encoded RSA public key.
     * @returns {{iv: string, encryptedData: string, authTag: string, encryptedSessionKey: string}} Hybrid encrypted data.
     */
    encryptMessage(message, recipientPublicKey) {
        // 1. Generate a random session key (symmetric)
        const sessionKey = this.messageEncryption.generateKey();
        
        // 2. Encrypt the message content with the session key (AES)
        const encryptedMessage = this.messageEncryption.encrypt(message, sessionKey);

        // 3. Encrypt the session key with the recipient's public key (RSA)
        const encryptedSessionKey = crypto.publicEncrypt(
            {
                key: recipientPublicKey,
                // OAEP padding is recommended for RSA encryption
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            Buffer.from(sessionKey, 'base64')
        ).toString('base64');

        return {
            ...encryptedMessage,
            encryptedSessionKey // The secret key is included, but encrypted
        };
    }

    /**
     * Decrypts a hybrid encrypted message.
     * @param {{iv: string, encryptedData: string, authTag: string, encryptedSessionKey: string}} encryptedData - Hybrid encrypted object.
     * @param {string} privateKey - The recipient's PEM-encoded RSA private key.
     * @returns {string} The decrypted plaintext message.
     */
    decryptMessage(encryptedData, privateKey) {
        // 1. Decrypt the session key using the recipient's private key (RSA)
        const sessionKeyBuffer = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            Buffer.from(encryptedData.encryptedSessionKey, 'base64')
        );

        const sessionKey = sessionKeyBuffer.toString('base64');

        // 2. Decrypt the message content with the recovered session key (AES)
        return this.messageEncryption.decrypt(
            {
                encryptedData: encryptedData.encryptedData,
                authTag: encryptedData.authTag,
                iv: encryptedData.iv
            },
            sessionKey
        );
    }
}

// Export all classes
module.exports = {
    DiffieHellman,
    MessageEncryption,
    E2EEncryption
};