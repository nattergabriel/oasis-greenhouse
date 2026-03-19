const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const crypto = require('crypto');

const client = new SecretsManagerClient();
let cachedApiKey = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute (reduced from 5 for faster key rotation)

// API key format validation (32 hexadecimal characters)
const API_KEY_REGEX = /^[a-f0-9]{32}$/i;

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Length check (not constant-time, but necessary)
  if (bufA.length !== bufB.length) {
    return false;
  }

  // Constant-time comparison
  return crypto.timingSafeEqual(bufA, bufB);
}

exports.handler = async (event) => {
  // Extract API key from header
  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-API-Key'];

  // Validate API key format before processing
  if (!apiKey || !API_KEY_REGEX.test(apiKey)) {
    return {
      isAuthorized: false
    };
  }

  // Get expected API key from Secrets Manager (with TTL-based caching)
  if (!cachedApiKey || Date.now() > cacheExpiry) {
    try {
      const command = new GetSecretValueCommand({
        SecretId: process.env.API_KEY_SECRET_ARN
      });
      const response = await client.send(command);
      cachedApiKey = response.SecretString;
      cacheExpiry = Date.now() + CACHE_TTL_MS;
    } catch (error) {
      console.error('Failed to load API key');
      return {
        isAuthorized: false
      };
    }
  }

  // Compare API keys using constant-time comparison
  return {
    isAuthorized: secureCompare(apiKey, cachedApiKey)
  };
};
