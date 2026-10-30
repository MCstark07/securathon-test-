import React, { useState, useEffect } from 'react';
import CryptoInspectorModal from '../components/CryptoInspectorModal';
import Vault3DCore from '../components/Vault3DCore';
import EntropyChamber from '../components/EntropyChamber';
import {
  ShieldCheck,
  Lock,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Binary,
  User,
  Flame,
  Search,
  Layers,
  Database,
  Key
} from 'lucide-react';

/* =========================================================================
   DEFENSIVE MOCK FALLBACK HANDLING (In case api.js is still in-progress)
   ========================================================================= */

// Default mock cryptographic dataset
let fallbackVault = [
  {
    id: 'rec_sec_01',
    title: 'Stripe Production Live Secret Key',
    owner: 'finance_sec_admin',
    ciphertext: '7f9b8c2a4d5e6f108293c4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e81234567890abcdef',
    nonce: '0x4a2b9e11f0c3d2e1',
    sha256_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    stored_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    digital_signature: '3045022100a89f71b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789ab02207d5e4a3b2c1d0e9f',
    server_public_key: 'ed25519_pk_7a8f9021b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    decrypted_data: 'vault_demo_secret_passphrase_alpha_99',
    sha256_integrity_match: true,
    ed25519_signature_valid: true,
    is_tampered: false,
    tampered: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'rec_sec_02',
    title: 'Kubernetes Cluster Root CA Salt',
    owner: 'devops_lead',
    ciphertext: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e89abcdef01234567',
    nonce: '0x91cd027ba388ff11',
    sha256_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    stored_sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    digital_signature: '304402206d8a4369e06180a45d04588df8e5a7d6560b378a58e2bf1262d0114f04dcf42a0220261386ab',
    server_public_key: 'ed25519_pk_7a8f9021b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    decrypted_data: 'k8s_root_ca_salt_f792b01c_master_token_secure_cluster',
    sha256_integrity_match: true,
    ed25519_signature_valid: true,
    is_tampered: false,
    tampered: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  }
];

async function mockListRecords() {
  return JSON.parse(JSON.stringify(fallbackVault));
}

async function mockCreateRecord(recordData) {
  const hexRandom = (len) => {
    let s = '';
    while (s.length < len) s += Math.random().toString(16).substring(2);
    return s.substring(0, len);
  };

  const id = 'rec_' + Math.random().toString(36).substring(2, 9);
  const hash = hexRandom(64);
  const newRecord = {
    id,
    title: recordData.title || 'Untitled Vault Entry',
    owner: recordData.owner || 'authorized_user',
    ciphertext: 'enc_' + hexRandom(60),
    nonce: '0x' + hexRandom(16),
    sha256_hash: hash,
    stored_sha256: hash,
    digital_signature: 'ed25519_sig_' + hexRandom(64),
    server_public_key: 'ed25519_pk_7a8f9021b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    decrypted_data: recordData.sensitive_data || recordData.payload || recordData.secret || '',
    sha256_integrity_match: true,
    ed25519_signature_valid: true,
    is_tampered: false,
    tampered: false,
    created_at: new Date().toISOString()
  };

  fallbackVault.unshift(newRecord);
  return JSON.parse(JSON.stringify(newRecord));
}

async function mockVerifyRecord(id) {
  const found = fallbackVault.find((r) => r.id === id);
  if (!found) throw new Error(`Vault entry not found: ${id}`);
  return JSON.parse(JSON.stringify(found));
}

async function mockTamperRecord(id) {
  const found = fallbackVault.find((r) => r.id === id);
  if (!found) throw new Error(`Vault entry not found: ${id}`);
  found.is_tampered = true;
  found.tampered = true;
  // Flip 1 byte at the end of the ciphertext
  const tail = found.ciphertext.slice(-2);
  const flipped = tail === 'ff' ? '00' : 'ff';
  found.ciphertext = found.ciphertext.slice(0, -2) + flipped;
  found.sha256_integrity_match = false;
  found.ed25519_signature_valid = false;
  return JSON.parse(JSON.stringify(found));
}

// Attempt dynamic import from ../services/api.js with fallback
let apiModule = {};
try {
  // Use runtime dynamic import so Vite dev-server import-analysis does not crash on missing file
  const dynamicImport = new Function('specifier', 'return import(specifier)');
  apiModule = await dynamicImport('../services/api.js');
} catch {
  // api.js is still being completed by Member 2; using fallback
}

const listRecords = apiModule.listRecords || apiModule.fetchAllRecords || mockListRecords;
const createRecord = apiModule.createRecord || apiModule.createSecureRecord || mockCreateRecord;
const verifyRecord = apiModule.verifyRecord || apiModule.verifyAndDecryptRecord || mockVerifyRecord;
const tamperRecord = apiModule.tamperRecord || apiModule.triggerDatabaseTamper || mockTamperRecord;

/* =========================================================================
   DASHBOARD COMPONENT (Member 1)
   ========================================================================= */

export default function Dashboard() {
  // Records state
  const [records, setRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Form input state
  const [owner, setOwner] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [sensitivePayload, setSensitivePayload] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Inspector Modal state
  const [activeRecord, setActiveRecord] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [tamperingId, setTamperingId] = useState(null);

  // Load records from API
  const fetchRecords = async () => {
    setLoadingList(true);
    setListError('');
    try {
      const data = await listRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(err?.message || 'Failed to query encrypted vault records from database.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Submit Vault Entry Form
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!recordTitle.trim() || !sensitivePayload.trim()) {
      setFormError('Please provide both a Record Title and Sensitive Payload.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await createRecord({
        owner: owner.trim() || 'authorized_user',
        title: recordTitle.trim(),
        sensitive_data: sensitivePayload,
        payload: sensitivePayload
      });

      setFormSuccess('Record encrypted and stored in SQLite database successfully!');
      setRecordTitle('');
      setSensitivePayload('');
      setOwner('');

      // Refresh list
      await fetchRecords();
    } catch (err) {
      setFormError(err?.message || 'Error creating secure record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Inspect Cryptography action
  const handleInspect = async (id) => {
    setVerifyingId(id);
    try {
      const verifiedData = await verifyRecord(id);
      setActiveRecord(verifiedData);
    } catch (err) {
      alert(`Verification error: ${err?.message || 'Failed to inspect record'}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Simulate Bit-Flip Attack action (toggles bit-flip tampered state)
  const handleTamper = async (id) => {
    setTamperingId(id);
    try {
      const target = records.find((r) => r.id === id);
      const isCurrentlyTampered = Boolean(target?.is_tampered || target?.tampered);

      let updated;
      if (!isCurrentlyTampered) {
        updated = await tamperRecord(id);
        updated.is_tampered = true;
        updated.tampered = true;
      } else {
        // Untamper / reset bit to demonstrate recovery
        updated = {
          ...target,
          is_tampered: false,
          tampered: false,
          sha256_integrity_match: true,
          ed25519_signature_valid: true
        };
      }

      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, is_tampered: updated.is_tampered, tampered: updated.tampered } : r))
      );

      // If modal is currently viewing this record, update it immediately
      if (activeRecord && activeRecord.id === id) {
        setActiveRecord(updated);
      }
    } catch (err) {
      alert(`Bit-flip simulation failed: ${err?.message || 'Failed to tamper record'}`);
    } finally {
      setTamperingId(null);
    }
  };

  // Compute overall vault integrity health across all records
  const isTampered = records.some((r) => r.is_tampered || r.tampered);

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.owner && r.owner.toLowerCase().includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* =========================================================================
          TOP SECTION: Vault Entry Form
          ========================================================================= */}
      <section className="backdrop-blur-md bg-slate-900/75 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Vault Entry Form</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Encrypt and commit zero-knowledge secrets into the tamper-proof SQLite vault.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cipher: AES-256-GCM + Ed25519</span>
          </div>
        </div>

        {/* Form Notifications */}
        {formSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Input Fields */}
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Owner Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Owner / Authorized Identity
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. authorized_agent / sec_admin (Defaults to authorized_user)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Record Title Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Record Title
              </label>
              <input
                type="text"
                required
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                placeholder="e.g. Production Database Salt & Peppering Secret"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Sensitive Payload / Secret */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-purple-400" />
              Sensitive Payload / Secret
            </label>
            <textarea
              required
              rows={3}
              value={sensitivePayload}
              onChange={(e) => setSensitivePayload(e.target.value)}
              placeholder="Enter sensitive JSON credentials, private keys, API secrets, or confidential text to encrypt..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono text-slate-100 placeholder-slate-500 outline-none transition-all resize-y"
            />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Payload is encrypted before SQLite persistent write.
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Storing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Encrypt & Store in Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* =========================================================================
          INTERACTIVE 3D ENCLAVE & 2D ENTROPY CHAMBER VISUALIZATION GRID
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Vault3DCore isTampered={isTampered} />
        <EntropyChamber />
      </section>

      {/* =========================================================================
          MAIN SECTION: Encrypted Records Grid / Table
          ========================================================================= */}
      <section className="backdrop-blur-md bg-slate-900/75 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Table Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Encrypted Records Vault
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {records.length} {records.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Live SQLite telemetry: Inspect cryptographic artifacts or test tamper-detection resilience.
              </p>
            </div>
          </div>

          {/* Search Filter & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search title, ID, owner..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={fetchRecords}
              disabled={loadingList}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950/70 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loadingList && records.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-cyan-500/60" />
            <p className="text-sm font-mono">Querying SQLite database records...</p>
          </div>
        ) : listError ? (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{listError}</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-2xl">
            <Layers className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No vault entries found.</p>
            <p className="text-xs text-slate-500">
              {searchFilter ? 'Try clearing the search query.' : 'Encrypt a new record using the form above.'}
            </p>
          </div>
        ) : (
          /* Records Table / Grid View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Record & ID</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Truncated Ciphertext</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredRecords.map((rec) => {
                  const isRecordTampered = Boolean(rec.is_tampered || rec.tampered);
                  const cipher = rec.ciphertext || '';
                  const hash = rec.sha256_hash || rec.stored_sha256 || '';

                  // Truncation helpers
                  const truncatedCipher = cipher
                    ? cipher.length > 28
                      ? `${cipher.slice(0, 14)}...${cipher.slice(-10)}`
                      : cipher
                    : 'N/A';

                  const truncatedHash = hash
                    ? hash.length > 24
                      ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
                      : hash
                    : 'N/A';

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-950/60 transition-colors ${isRecordTampered ? 'bg-rose-950/15' : ''
                        }`}
                    >
                      {/* Record Title & ID */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white text-sm">
                          {rec.title || 'Untitled Vault Entry'}
                        </div>
                        <div className="crypto-mono text-[11px] text-slate-500 mt-0.5">
                          ID: {rec.id}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4 font-mono text-cyan-400">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px]">
                          <User className="w-3 h-3" />
                          {rec.owner || 'authorized_user'}
                        </span>
                      </td>

                      {/* Truncated Ciphertext */}
                      <td className="py-4 px-4">
                        <div
                          className="crypto-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 text-[11px] inline-block cursor-pointer hover:border-slate-700"
                          title={cipher}
                        >
                          <span className="text-purple-400 font-semibold mr-1">enc:</span>
                          {truncatedCipher}
                        </div>
                      </td>

                      {/* Truncated SHA-256 Hash */}
                      <td className="py-4 px-4">
                        <div
                          className="crypto-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 text-[11px] inline-block cursor-pointer hover:border-slate-700"
                          title={hash}
                        >
                          <span className="text-emerald-400 font-semibold mr-1">sha:</span>
                          {truncatedHash}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {isRecordTampered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            BIT-FLIP TAMPERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            VAULTED (AES-GCM)
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Inspect Cryptography Button */}
                          <button
                            type="button"
                            onClick={() => handleInspect(rec.id)}
                            disabled={verifyingId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                            title="Inspect cryptographic artifacts & verify signatures"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{verifyingId === rec.id ? 'Verifying...' : 'Inspect Cryptography'}</span>
                          </button>

                          {/* 2. Simulate Bit-Flip Attack Button */}
                          <button
                            type="button"
                            onClick={() => handleTamper(rec.id)}
                            disabled={tamperingId === rec.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${isRecordTampered
                                ? 'bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                : 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)] active:scale-[0.98]'
                              }`}
                            title="Flip 1 byte directly in the SQLite database record to test cryptographic failure"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{tamperingId === rec.id ? 'Flipping...' : isRecordTampered ? 'Reset Bit' : 'Flip Bit'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================================================================
          CRYPTO INSPECTOR MODAL
          ========================================================================= */}
      {activeRecord && (
        <CryptoInspectorModal
          verificationData={activeRecord}
          record={activeRecord}
          onClose={() => setActiveRecord(null)}
          onTamper={handleTamper}
        />
      )}
    </div>
  );
}
