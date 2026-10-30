import React, { useState, useEffect } from 'react';
import { decryptInBrowser } from '../crypto/webCrypto';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Lock,
  Unlock,
  Terminal,
  X,
  Copy,
  Check,
  Flame,
  Binary,
  Hash,
  Cpu,
  AlertOctagon
} from 'lucide-react';

export default function CryptoInspectorModal({ verificationData, onClose, onTamper }) {
  const [passphrase, setPassphrase] = useState('');
  const [unlockedText, setUnlockedText] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [tamperLoading, setTamperLoading] = useState(false);

  const isTampered = Boolean(verificationData?.tampered);
  const hasClientIv = Boolean(verificationData?.client_iv);
  const sha256Match = Boolean(verificationData?.sha256_integrity_match);
  const ed25519Valid = Boolean(verificationData?.ed25519_signature_valid);

  // Auto-attempt client-side decryption whenever passphrase changes if double-encrypted
  useEffect(() => {
    let isCancelled = false;

    async function tryDecrypt() {
      if (!hasClientIv || isTampered) {
        setUnlockedText('');
        setDecryptError('');
        return;
      }

      if (!passphrase.trim()) {
        setUnlockedText('');
        setDecryptError('');
        return;
      }

      setIsDecrypting(true);
      setDecryptError('');
      try {
        const result = await decryptInBrowser(
          verificationData.decrypted_data,
          verificationData.client_iv,
          passphrase
        );
        if (!isCancelled) {
          setUnlockedText(result);
          setDecryptError('');
        }
      } catch (err) {
        if (!isCancelled) {
          setUnlockedText('');
          setDecryptError(err?.message || 'Passphrase incorrect or client-side decryption failed.');
        }
      } finally {
        if (!isCancelled) {
          setIsDecrypting(false);
        }
      }
    }

    tryDecrypt();

    return () => {
      isCancelled = true;
    };
  }, [passphrase, verificationData, hasClientIv, isTampered]);

  const handleManualUnlock = async (e) => {
    e?.preventDefault();
    if (!passphrase.trim() || !hasClientIv) return;
    setIsDecrypting(true);
    setDecryptError('');
    try {
      const result = await decryptInBrowser(
        verificationData.decrypted_data,
        verificationData.client_iv,
        passphrase
      );
      setUnlockedText(result);
    } catch (err) {
      setDecryptError(err?.message || 'Decryption failed: check your Zero-Knowledge passphrase.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTamperClick = async () => {
    if (!verificationData?.id) return;
    setTamperLoading(true);
    try {
      await onTamper(verificationData.id);
    } finally {
      setTamperLoading(false);
    }
  };

  if (!verificationData) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-4xl rounded-3xl bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 transition-all duration-300 border ${
          isTampered
            ? 'border-rose-500/90 shadow-[0_0_50px_rgba(244,63,94,0.35)] tamper-alert-glow'
            : 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isTampered
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-400'
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Cryptographic Inspector
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    isTampered
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isTampered ? 'INTEGRITY BREACH' : 'CRYPTOGRAPHICALLY VERIFIED'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Target Record: <span className="font-semibold text-slate-200">{verificationData.title || verificationData.id}</span>
                {verificationData.id && <span className="text-slate-500 ml-2 font-mono">({verificationData.id})</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tamper Alert Banner */}
        {isTampered && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 flex items-start gap-3 animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.25)]">
            <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm tracking-wide text-rose-100 uppercase">
                Tampering Detected: SQLite Bit-Flip Triggered
              </h4>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">
                The ciphertext in the database has been modified. Both the SHA-256 cryptographic digest and the Ed25519 digital signature reject this payload. Server and client decryption routines are aborted.
              </p>
            </div>
          </div>
        )}

        {/* 2 Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Card 1: SHA-256 Checksum Match */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isTampered || !sha256Match
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Integrity Digest
              </span>
              {sha256Match && !isTampered ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MATCH
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> MISMATCH
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">SHA-256 Checksum Match</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {sha256Match && !isTampered
                ? 'Recomputed SHA-256 digest identically matches the database stored checksum.'
                : 'Cryptographic digest collision or payload tampering detected; digest mismatch!'}
            </p>
          </div>

          {/* Card 2: Ed25519 Digital Signature */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isTampered || !ed25519Valid
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Non-Repudiation
              </span>
              {ed25519Valid && !isTampered ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> INVALID
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Ed25519 Digital Signature</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {ed25519Valid && !isTampered
                ? 'Asymmetric Ed25519 signature cryptographically verified against the authority key.'
                : 'Asymmetric signature verification failed. Sender authenticity is compromised!'}
            </p>
          </div>
        </div>

        {/* Decrypted Plaintext / Zero-Knowledge Section */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              Decrypted Plaintext Payload
            </h4>
            {hasClientIv && (
              <span className="text-[11px] font-medium text-purple-300 bg-purple-950/50 border border-purple-800/60 px-2 py-0.5 rounded-full">
                Zero-Knowledge Encrypted (Client PBKDF2)
              </span>
            )}
          </div>

          {/* If Client-side IV exists and record is not tampered, prompt for Zero-Knowledge Passphrase */}
          {hasClientIv && !isTampered ? (
            <div className="space-y-3">
              <form onSubmit={handleManualUnlock} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter Zero-Knowledge Passphrase to unlock in-browser..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!passphrase || isDecrypting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer disabled:cursor-not-allowed"
                >
                  <Unlock className="w-4 h-4" />
                  {isDecrypting ? 'Decrypting...' : 'Unlock Plaintext'}
                </button>
              </form>

              {decryptError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {decryptError}
                </p>
              )}

              {unlockedText ? (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-200">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Unlock className="w-3.5 h-3.5" /> Browser-Decrypted Plaintext:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('unlocked', unlockedText)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy plaintext"
                    >
                      {copiedKey === 'unlocked' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-sm whitespace-pre-wrap break-all text-slate-100">
                    {unlockedText}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Payload is client-side encrypted. Provide the exact PBKDF2 passphrase to decrypt locally in your browser memory.
                </p>
              )}
            </div>
          ) : isTampered ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
              Decryption locked: cryptographic integrity check failed due to database byte manipulation.
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="text-slate-300 font-medium">Server AES-256-GCM Plaintext:</span>
                <button
                  type="button"
                  onClick={() => handleCopy('plaintext', verificationData.decrypted_data)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy plaintext"
                >
                  {copiedKey === 'plaintext' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap break-all text-slate-100">
                {verificationData.decrypted_data || 'No plaintext available.'}
              </pre>
            </div>
          )}
        </div>

        {/* Raw Cryptographic Telemetry Box */}
        <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Raw Cryptographic Telemetry
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-500">SQLite Hex Encodings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {/* Ciphertext */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Binary className="w-3 h-3 text-purple-400" /> ciphertext
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('ciphertext', verificationData.ciphertext)}
                  className="hover:text-white text-slate-400"
                >
                  {copiedKey === 'ciphertext' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all max-h-16 overflow-y-auto leading-relaxed">
                {verificationData.ciphertext || 'N/A'}
              </div>
            </div>

            {/* Nonce */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Cpu className="w-3 h-3 text-cyan-400" /> nonce
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('nonce', verificationData.nonce)}
                  className="hover:text-white text-slate-400"
                >
                  {copiedKey === 'nonce' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all leading-relaxed">
                {verificationData.nonce || 'N/A'}
              </div>
            </div>

            {/* Stored SHA-256 */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Hash className="w-3 h-3 text-emerald-400" /> stored_sha256
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('stored_sha256', verificationData.stored_sha256 || verificationData.sha256_hash)}
                  className="hover:text-white text-slate-400"
                >
                  {copiedKey === 'stored_sha256' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all leading-relaxed">
                {verificationData.stored_sha256 || verificationData.sha256_hash || 'N/A'}
              </div>
            </div>

            {/* Digital Signature */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" /> digital_signature
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('digital_signature', verificationData.digital_signature)}
                  className="hover:text-white text-slate-400"
                >
                  {copiedKey === 'digital_signature' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="text-slate-300 break-all select-all max-h-16 overflow-y-auto leading-relaxed">
                {verificationData.digital_signature || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="mt-7 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleTamperClick}
            disabled={tamperLoading || isTampered}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              isTampered
                ? 'bg-rose-950/50 border border-rose-800/50 text-rose-400 cursor-not-allowed opacity-80'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-[0.98]'
            }`}
          >
            <Flame className={`w-4 h-4 ${isTampered ? '' : 'text-rose-200'}`} />
            {isTampered
              ? 'Database Already Tampered (Bit Flipped)'
              : tamperLoading
              ? 'Flipping Byte in SQLite...'
              : 'Simulate SQLite Database Hack (Flip 1 Byte)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium text-sm transition-colors border border-slate-700/60 cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
