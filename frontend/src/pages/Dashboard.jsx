import React, { useState, useEffect } from 'react';
import { encryptInBrowser } from '../crypto/webCrypto';
import {
  fetchAllRecords,
  createSecureRecord,
  verifyAndDecryptRecord,
  triggerDatabaseTamper
} from '../services/api';
import CryptoInspectorModal from '../components/CryptoInspectorModal';
import {
  Shield,
  Lock,
  KeyRound,
  Database,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Layers,
  Sparkles,
  Binary,
  Hash,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  // Records state
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [errorRecords, setErrorRecords] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [sensitiveData, setSensitiveData] = useState('');
  const [clientPassphrase, setClientPassphrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Modal inspection state
  const [activeVerification, setActiveVerification] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  // Load records on mount
  const loadRecords = async () => {
    setLoadingRecords(true);
    setErrorRecords('');
    try {
      const data = await fetchAllRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorRecords(err?.message || 'Failed to query live SQLite records.');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Handle form submission
  const handleEncryptAndSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !sensitiveData.trim()) {
      setFormError('Please enter both a title and the sensitive data.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      // 1. Perform client-side encryption via WebCrypto (if passphrase provided)
      const { payloadToSend, clientIv } = await encryptInBrowser(sensitiveData, clientPassphrase);

      // 2. Dispatch secure record creation payload
      await createSecureRecord({
        owner: 'authorized_user',
        title: title.trim(),
        sensitive_data: payloadToSend,
        client_iv: clientIv || null
      });

      setFormSuccess('Record encrypted and stored in SQLite successfully!');
      setTitle('');
      setSensitiveData('');
      setClientPassphrase('');

      // 3. Reload live SQLite database records
      await loadRecords();
    } catch (err) {
      setFormError(err?.message || 'Failed to encrypt or save record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open inspector modal for a record
  const handleVerifyClick = async (recId) => {
    setVerifyingId(recId);
    try {
      const verification = await verifyAndDecryptRecord(recId);
      setActiveVerification(verification);
    } catch (err) {
      alert(`Verification request failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Handle tamper simulation
  const handleTamper = async (recId) => {
    try {
      const tamperedRecord = await triggerDatabaseTamper(recId);
      // Immediately reflect the tampered state in the active modal
      setActiveVerification(tamperedRecord);
      // Refresh the database table view
      await loadRecords();
    } catch (err) {
      alert(`Tamper simulation failed: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Background Glowing Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 sm:w-[540px] h-96 sm:h-[540px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-emerald-500/12 blur-[150px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 sm:w-[600px] h-96 sm:h-[600px] rounded-full bg-indigo-600/15 blur-[160px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 flex flex-col">
        {/* Top Navbar / Header */}
        <header className="mb-10 pb-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero-Knowledge Cryptographic Vault</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-400 font-mono">AES-256-GCM + Ed25519</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Shield className="w-9 h-9 text-purple-400" />
              <span>Securathon Data Shield</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Client-side PBKDF2 zero-knowledge encryption paired with server-side authenticated encryption and cryptographic tamper detection.
            </p>
          </div>

          {/* Quick Metrics / Status Cards */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Storage Engine</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> SQLite Active
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Integrity Guard</span>
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" /> SHA-256 / Ed25519
              </span>
            </div>
          </div>
        </header>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          {/* LEFT COLUMN: Encrypt New Record Form (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="backdrop-blur-md bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Form Title */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800/80">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Encrypt New Record</h2>
                  <p className="text-xs text-slate-400">Zero-Knowledge client & server ciphering</p>
                </div>
              </div>

              {/* Form Notification Messages */}
              {formSuccess && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Encrypt Form */}
              <form onSubmit={handleEncryptAndSave} className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Record Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AWS Production Master Keys"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Sensitive Data Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Sensitive Data Payload
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={sensitiveData}
                    onChange={(e) => setSensitiveData(e.target.value)}
                    placeholder="Enter confidential secrets, credentials, or private JSON payload..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all resize-y"
                  />
                </div>

                {/* Optional Client Passphrase (PBKDF2) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                      Client Passphrase
                    </label>
                    <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded-full">
                      Optional: PBKDF2 ZK
                    </span>
                  </div>
                  <input
                    type="password"
                    value={clientPassphrase}
                    onChange={(e) => setClientPassphrase(e.target.value)}
                    placeholder="Zero-Knowledge passphrase for client encryption..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {clientPassphrase.trim() ? (
                      <span className="text-purple-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Double-encryption active: data will be encrypted in-browser before transmission.
                      </span>
                    ) : (
                      'Leave blank for standard server-managed AES-256-GCM encryption.'
                    )}
                  </p>
                </div>

                {/* Encryption Badge Preview */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Target Encryption:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md ${
                      clientPassphrase.trim()
                        ? 'text-purple-300 bg-purple-950/70 border border-purple-800/60'
                        : 'text-emerald-300 bg-emerald-950/70 border border-emerald-800/60'
                    }`}
                  >
                    {clientPassphrase.trim()
                      ? 'Client (PBKDF2) + Server (AES-GCM)'
                      : 'Server Authenticated AES-256-GCM'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <PlusCircle className="w-4 h-4" />
                  {submitting ? 'Encrypting & Saving Record...' : 'Secure Encrypt & Save'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Live SQLite Database View (lg:col-span-7) */}
          <div className="lg:col-span-7">
            <div className="backdrop-blur-md bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
              {/* Header with Title and Refresh */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-tight">Live SQLite Database View</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-slate-300">
                        {records.length} {records.length === 1 ? 'Record' : 'Records'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Direct query of vaulted SQLite database entities</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadRecords}
                  disabled={loadingRecords}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950/70 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                  title="Reload SQLite records"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>

              {/* Records List */}
              {loadingRecords && records.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500/60" />
                  <p className="text-sm">Querying SQLite records...</p>
                </div>
              ) : errorRecords ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorRecords}</span>
                </div>
              ) : records.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-2xl">
                  <Layers className="w-9 h-9 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No records found in SQLite database.</p>
                  <p className="text-xs text-slate-500">Encrypt and save your first record using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  {records.map((rec) => {
                    const hasClientIv = Boolean(rec.client_iv);
                    const isTampered = Boolean(rec.tampered);

                    return (
                      <div
                        key={rec.id}
                        className={`p-5 rounded-2xl transition-all border ${
                          isTampered
                            ? 'bg-rose-950/20 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                            : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {/* Top: Title & Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              {rec.title || 'Untitled Record'}
                              {isTampered && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" /> Tampered
                                </span>
                              )}
                            </h3>
                            <span className="text-[11px] font-mono text-slate-500">ID: {rec.id}</span>
                          </div>

                          {/* Double Encryption Badge */}
                          {hasClientIv && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-700/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                              <Lock className="w-3 h-3" />
                              Double-Encrypted: Client + Server
                            </span>
                          )}
                        </div>

                        {/* Middle: Truncated Ciphertext and SHA-256 */}
                        <div className="space-y-2 text-xs font-mono mb-4">
                          {/* Truncated Ciphertext */}
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1 flex-shrink-0">
                              <Binary className="w-3 h-3 text-purple-400" /> Ciphertext:
                            </span>
                            <span className="text-slate-300 truncate" title={rec.ciphertext}>
                              {rec.ciphertext
                                ? rec.ciphertext.length > 40
                                  ? `${rec.ciphertext.slice(0, 24)}...${rec.ciphertext.slice(-12)}`
                                  : rec.ciphertext
                                : 'Empty'}
                            </span>
                          </div>

                          {/* SHA-256 Hash */}
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1 flex-shrink-0">
                              <Hash className="w-3 h-3 text-emerald-400" /> SHA-256:
                            </span>
                            <span className="text-slate-300 truncate font-mono" title={rec.sha256_hash}>
                              {rec.sha256_hash
                                ? rec.sha256_hash.length > 32
                                  ? `${rec.sha256_hash.slice(0, 16)}...${rec.sha256_hash.slice(-12)}`
                                  : rec.sha256_hash
                                : 'Empty'}
                            </span>
                          </div>
                        </div>

                        {/* Bottom: Action Button */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recent'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleVerifyClick(rec.id)}
                            disabled={verifyingId === rec.id}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isTampered
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            } active:scale-[0.98] disabled:opacity-50`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {verifyingId === rec.id ? 'Inspecting...' : 'Verify & Decrypt'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Inspector */}
      {activeVerification && (
        <CryptoInspectorModal
          verificationData={activeVerification}
          onClose={() => setActiveVerification(null)}
          onTamper={handleTamper}
        />
      )}
    </div>
  );
}
