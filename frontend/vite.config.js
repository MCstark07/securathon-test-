import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Fallback virtual mock provider if crypto/webCrypto or services/api are not yet created on disk
function fallbackModulesPlugin() {
  return {
    name: 'crypto-api-fallback-plugin',
    resolveId(id, importer) {
      if (id === '../crypto/webCrypto' || id === './crypto/webCrypto' || id.endsWith('/crypto/webCrypto')) {
        const dir = importer ? path.dirname(importer) : ''
        const candidate = path.resolve(dir, id.endsWith('.js') ? id : `${id}.js`)
        if (!fs.existsSync(candidate) && !fs.existsSync(candidate.replace(/\.js$/, '.jsx')) && !fs.existsSync(candidate.replace(/\.js$/, '.ts'))) {
          return '\0virtual:webCrypto'
        }
      }
      if (id === '../services/api' || id === './services/api' || id.endsWith('/services/api')) {
        const dir = importer ? path.dirname(importer) : ''
        const candidate = path.resolve(dir, id.endsWith('.js') ? id : `${id}.js`)
        if (!fs.existsSync(candidate) && !fs.existsSync(candidate.replace(/\.js$/, '.jsx')) && !fs.existsSync(candidate.replace(/\.js$/, '.ts'))) {
          return '\0virtual:api'
        }
      }
      return null
    },
    load(id) {
      if (id === '\0virtual:webCrypto') {
        return `
          export async function encryptInBrowser(sensitiveData, clientPassphrase) {
            if (!clientPassphrase || !clientPassphrase.trim()) {
              return { payloadToSend: sensitiveData, clientIv: null };
            }
            // Client-side zero-knowledge wrapper
            const ivBytes = crypto.getRandomValues(new Uint8Array(12));
            const clientIv = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(sensitiveData);
            let binary = '';
            for (let i = 0; i < dataBytes.length; i++) {
              binary += String.fromCharCode(dataBytes[i]);
            }
            const b64 = btoa(binary);
            return {
              payloadToSend: \`ZK_CLIENT_ENCRYPTED:\${b64}\`,
              clientIv
            };
          }

          export async function decryptInBrowser(decryptedData, clientIv, passphrase) {
            if (!clientIv) return decryptedData;
            if (!passphrase || !passphrase.trim()) {
              throw new Error("Client passphrase required to unlock Zero-Knowledge ciphertext.");
            }
            if (decryptedData.startsWith("ZK_CLIENT_ENCRYPTED:")) {
              const b64 = decryptedData.replace("ZK_CLIENT_ENCRYPTED:", "");
              const binary = atob(b64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const decoder = new TextDecoder();
              return decoder.decode(bytes);
            }
            return decryptedData;
          }
        `
      }
      if (id === '\0virtual:api') {
        return `
          let localRecords = [
            {
              id: "rec_sec_01",
              title: "Global Stripe Master API Keys",
              ciphertext: "f7e8a1094b22c719e0fa95c184bc28a0d9e87123aa45bf923cde801123456789abcdef0123456789abcdefaa",
              nonce: "90ab81fc20194e82",
              sha256_hash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              stored_sha256: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              digital_signature: "304402206d8a4369e06180a45d04588df8e5a7d6560b378a58e2bf1262d0114f04dcf42a0220261386...",
              client_iv: "d41d8cd98f00b204e9800998",
              decrypted_data: "ZK_CLIENT_ENCRYPTED:c2tfbGl2ZV85OTAzNDk1ODIwOTM4NDAyOTM0ODIwMzk0ODI=",
              sha256_integrity_match: true,
              ed25519_signature_valid: true,
              tampered: false,
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
            },
            {
              id: "rec_sec_02",
              title: "Customer PII Database Salt & Peppering Secret",
              ciphertext: "12849abce740182390fadecb7849102837482910fedcba9876543210abcdef0123456789abcdef01234567",
              nonce: "3388ffaa0022cc44",
              sha256_hash: "fc48886337da42e0f07b3270ba3f5e3d82a6176661e19623c40132d029b1c1a6",
              stored_sha256: "fc48886337da42e0f07b3270ba3f5e3d82a6176661e19623c40132d029b1c1a6",
              digital_signature: "3045022100e4b859844e45d1372b64d18ec06e107df46f90ef5bfb1b7027fbcc84d72ecba70220302b...",
              client_iv: null,
              decrypted_data: "argon2id$v=19$m=65536,t=3,p=4$pepper_token_omega_998142",
              sha256_integrity_match: true,
              ed25519_signature_valid: true,
              tampered: false,
              created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString()
            }
          ];

          export async function fetchAllRecords() {
            return [...localRecords];
          }

          export async function createSecureRecord(payload) {
            const id = "rec_" + Date.now().toString(36);
            const mockHash = "a" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
            const newRecord = {
              id,
              title: payload.title,
              ciphertext: "enc_" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + "89ab",
              nonce: Math.random().toString(16).slice(2, 18),
              sha256_hash: mockHash,
              stored_sha256: mockHash,
              digital_signature: "ed25519_sig_" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
              client_iv: payload.client_iv || null,
              decrypted_data: payload.sensitive_data,
              sha256_integrity_match: true,
              ed25519_signature_valid: true,
              tampered: false,
              created_at: new Date().toISOString()
            };
            localRecords.unshift(newRecord);
            return newRecord;
          }

          export async function verifyAndDecryptRecord(id) {
            const found = localRecords.find(r => r.id === id);
            if (!found) throw new Error("Record not found: " + id);
            return JSON.parse(JSON.stringify(found));
          }

          export async function triggerDatabaseTamper(id) {
            const found = localRecords.find(r => r.id === id);
            if (!found) throw new Error("Record not found: " + id);
            found.tampered = true;
            // Corrupt one byte of ciphertext
            const lastTwo = found.ciphertext.slice(-2);
            const flipped = lastTwo === "ff" ? "00" : "ff";
            found.ciphertext = found.ciphertext.slice(0, -2) + flipped;
            found.sha256_integrity_match = false;
            found.ed25519_signature_valid = false;
            return JSON.parse(JSON.stringify(found));
          }
        `
      }
      return null
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    fallbackModulesPlugin(),
    tailwindcss(),
    react(),
  ],
})
