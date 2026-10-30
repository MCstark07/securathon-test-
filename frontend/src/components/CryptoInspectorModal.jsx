import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Terminal,
  Binary,
  Hash,
  KeyRound,
  AlertOctagon,
  Flame,
  Fingerprint,
  Lock,
  Unlock
} from 'lucide-react';

export default function CryptoInspectorModal({ verificationData, record, onClose, onTamper }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [tampering, setTampering] = useState(false);

  // Normalize input data from either verificationData or record prop
  const data = verificationData || record || {};

  const isTampered = Boolean(data.tampered);
  const sha256Valid = data.sha256_integrity_match !== undefined 
    ? Boolean(data.sha256_integrity_match) 
    : !isTampered;
  const ed25519Valid = data.ed25519_signature_valid !== undefined 
    ? Boolean(data.ed25519_signature_valid) 
    : !isTampered;

  // Artifact values with standard fallbacks
  const ciphertext = data.ciphertext || data.cipher_text || 'N/A';
  const nonce = data.nonce || data.iv || data.client_iv || '0x4a8b192cd7e51082';
  const storedSha256 = data.stored_sha256 || data.sha256_hash || data.sha256 || 'N/A';
  const digitalSignature = data.digital_signature || data.ed25519_signature || data.signature || 'N/A';
  const serverPublicKey = data.server_public_key || data.public_key || data.ed25519_public_key || 'ed25519_pk_7a8f9021b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0';
  const decryptedPayload = data.decrypted_data || data.decrypted_payload || data.plaintext || data.sensitive_data || '';

  const handleCopy = (field, text) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(field);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTamperClick = async () => {
    if (!onTamper || !data.id || isTampered) return;
    setTampering(true);
    try {
      await onTamper(data.id);
    } finally {
      setTampering(false);
    }
  };

  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 transition-all duration-300 border ${
          isTampered
            ? 'border-rose-500/90 shadow-[0_0_50px_rgba(244,63,94,0.4)] tamper-glow'
            : 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl border transition-colors ${
                isTampered
                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-400'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isTampered ? (
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Cryptographic Inspector
                </h2>
                <span
                  className={`px-3 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider border ${
                    isTampered
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isTampered ? 'INTEGRITY BREACH DETECTED' : 'CRYPTOGRAPHICALLY VERIFIED'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Record: <span className="font-semibold text-slate-200">{data.title || 'Untitled Vault Entry'}</span>
                {data.id && <span className="text-slate-500 ml-2 font-mono">({data.id})</span>}
                {data.owner && <span className="text-cyan-400 ml-2 font-mono">• Owner: {data.owner}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Breach Banner if Tampered */}
        {isTampered && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/70 text-rose-200 flex items-start gap-3.5 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse">
            <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm tracking-wide text-rose-100 uppercase">
                Critical Security Alert: SQLite Database Bit-Flip Detected!
              </h4>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                The ciphertext within the database record has been tampered with. The recomputed SHA-256 digest fails to match the stored hash, and the Ed25519 asymmetric digital signature was rejected. Decryption output is invalidated.
              </p>
            </div>
          </div>
        )}

        {/* 2 Prominent Verification Badges / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Card 1: SHA-256 Checksum Integrity */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              sha256Valid && !isTampered
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" /> Hash Integrity
              </span>
              {sha256Valid && !isTampered ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> VALID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> TAMPERED / MISMATCH
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">SHA-256 Integrity Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {sha256Valid && !isTampered
                ? 'Valid: Recomputed SHA-256 digest matches stored database checksum with 100% precision.'
                : 'Tampered / Hash Mismatch: Payload bytes modified! Checksum does not match stored hash.'}
            </p>
          </div>

          {/* Card 2: Ed25519 Digital Signature */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              ed25519Valid && !isTampered
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-purple-400" /> Non-Repudiation
              </span>
              {ed25519Valid && !isTampered ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CRYPTOGRAPHICALLY VERIFIED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" /> SIGNATURE INVALID
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Ed25519 Digital Signature</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {ed25519Valid && !isTampered
                ? 'Cryptographically Verified: Server authority signature validated with public key.'
                : 'Signature Invalid: Asymmetric cryptographic verification failed. Untrusted payload.'}
            </p>
          </div>
        </div>

        {/* Decrypted Payload Display / Failure Notice */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              Decrypted Payload Display
            </h4>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                isTampered
                  ? 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
                  : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
              }`}
            >
              {isTampered ? 'DECRYPTION_ABORTED' : 'CLEARTEXT_VERIFIED'}
            </span>
          </div>

          {isTampered ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-300 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Decryption Failure Notice
              </div>
              <p className="text-xs text-rose-300 leading-relaxed font-mono">
                [SECURITY_HALT] Decryption aborted. The cryptographic integrity check failed due to a detected bit-flip modification in the SQLite database. Untrusted ciphertext will not be parsed or executed.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Authenticated Plaintext:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('decrypted', decryptedPayload)}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy plaintext"
                >
                  {copiedKey === 'decrypted' ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <pre className="crypto-mono text-sm whitespace-pre-wrap break-all text-slate-100 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                {decryptedPayload || 'No plaintext payload available.'}
              </pre>
            </div>
          )}
        </div>

        {/* Raw Cryptographic Artifacts in styled code blocks */}
        <div className="mt-6 rounded-2xl bg-slate-950/90 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Raw Cryptographic Artifacts
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Live Cryptographic Proofs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Full Ciphertext */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Binary className="w-3.5 h-3.5 text-purple-400" /> Full Ciphertext (AES-256-GCM)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('ciphertext', ciphertext)}
                  className="hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'ciphertext' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="crypto-mono text-slate-300 break-all select-all max-h-20 overflow-y-auto leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                {ciphertext}
              </div>
            </div>

            {/* 2. Nonce / IV */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Nonce / IV (12 Bytes)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('nonce', nonce)}
                  className="hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'nonce' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="crypto-mono text-slate-300 break-all select-all leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                {nonce}
              </div>
            </div>

            {/* 3. Stored SHA-256 Hash */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" /> Stored SHA-256 Hash
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('storedSha256', storedSha256)}
                  className="hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'storedSha256' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="crypto-mono text-slate-300 break-all select-all leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                {storedSha256}
              </div>
            </div>

            {/* 4. Server Public Key */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Server Public Key (Ed25519)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('serverPublicKey', serverPublicKey)}
                  className="hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'serverPublicKey' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="crypto-mono text-slate-300 break-all select-all leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                {serverPublicKey}
              </div>
            </div>

            {/* 5. Ed25519 Digital Signature (Full Width) */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 md:col-span-2">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-400" /> Ed25519 Digital Signature
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('digitalSignature', digitalSignature)}
                  className="hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'digitalSignature' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="crypto-mono text-slate-300 break-all select-all max-h-16 overflow-y-auto leading-relaxed bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                {digitalSignature}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-7 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {onTamper && (
            <button
              type="button"
              onClick={handleTamperClick}
              disabled={tampering || isTampered}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                isTampered
                  ? 'bg-rose-950/60 border border-rose-800/60 text-rose-400 cursor-not-allowed opacity-80'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-[0.98]'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-200" />
              {isTampered
                ? 'Bit-Flip Attack Already Executed'
                : tampering
                ? 'Simulating Bit-Flip in SQLite...'
                : 'Simulate Bit-Flip Attack (Flip 1 Byte)'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white font-medium text-sm transition-colors border border-slate-700/60 cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
