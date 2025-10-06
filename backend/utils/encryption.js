const crypto = require('crypto');

class E2EEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  // Generate RSA key pair for each user
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
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

  // Derive shared secret using Diffie-Hellman :cite[7]
  async deriveSharedSecret(myPrivateKey, theirPublicKey) {
    // In production, use proper ECDH implementation
    const sharedSecret = crypto.diffieHellman({
      privateKey: crypto.createPrivateKey(myPrivateKey),
      publicKey: crypto.createPublicKey(theirPublicKey)
    });

    return crypto.createHash('sha256').update(sharedSecret).digest();
  }

  // Encrypt message with shared secret
  encryptMessage(message, sharedSecret) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, sharedSecret);
    
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt message with shared secret
  decryptMessage(encryptedData, sharedSecret) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      sharedSecret
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

module.exports = { E2EEncryption };