import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, FileText, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Hash, Calendar, User } from 'lucide-react';
import { 
  PageWrapper, Card, SectionTitle, SectionSubtitle, Field, inputCls, DropZone, SpinLabel, BtnPrimary
} from './ui';

const PublicVerify = ({ showModal }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      if (showModal) {
        await showModal("Selection Required", "Please select a PDF document to verify against the blockchain registry.");
      } else {
        alert("Please select a PDF document to verify.");
      }
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const formData = new FormData();
      formData.append('credentialText', email);
      formData.append('document', file);

      const res = await fetch('http://localhost:3000/api/verify', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.error) {
        setVerifyResult({
          success: false,
          error: data.error,
          message: data.error
        });
      } else {
        setVerifyResult({
          success: data.verified,
          message: data.message,
          issuer: data.issuer,
          issuedAt: data.issuedAt,
          docHash: data.docHash
        });
      }
    } catch (err) {
      setVerifyResult({
        success: false,
        error: true,
        message: "Unable to establish secure connection with verification gateway. Please make sure the local services are running."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
         style={{ background: 'radial-gradient(circle at 50% 0%, #f8fafc 0%, #cbd5e1 100%)' }}>
      
      {/* Top Navigation Row */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 animate-slide-down">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 
                     text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white text-sm font-semibold 
                     shadow-sm transition-all duration-200 hover:-translate-x-1"
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>

        <div className="flex items-center gap-2 font-heading font-extrabold text-slate-800 text-lg">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md text-white">
            <Shield size={18} />
          </div>
          <span>EduDocs Gateway</span>
        </div>
      </div>

      {/* Card */}
      <Card className="w-full max-w-2xl px-8 py-8 animate-pop-in border border-slate-200 bg-white/90 backdrop-blur-md shadow-2xl">
        <SectionTitle badge={<span className="px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700">Zero-Knowledge Public Audit</span>}>
          Instant Trust Verification
        </SectionTitle>
        <SectionSubtitle>
          Verify academic credentials, transcripts, and certificates securely against the immutable Ethereum ledger. No login or wallet required.
        </SectionSubtitle>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Owner Academic Email */}
          <Field label="Recipient / Owner Academic Email" icon={<Mail size={15} />}>
            <input
              type="email"
              placeholder="e.g. graduate@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isVerifying}
              className={inputCls()}
            />
          </Field>

          {/* File Dropzone */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Credential PDF Document
            </label>
            <DropZone
              accept="application/pdf"
              onChange={e => setFile(e.target.files[0])}
              required
              disabled={isVerifying}
            >
              {isVerifying ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase">
                    Hashing & Querying Blockchain...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition duration-200">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {file ? file.name : 'Click to select or drag & drop certificate PDF'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF files up to 10MB'}
                  </p>
                </div>
              )}
            </DropZone>
          </div>

          {/* Action Button */}
          <BtnPrimary type="submit" disabled={isVerifying} className="w-full py-3.5">
            {isVerifying ? <SpinLabel label="Executing Cryptographic Verification..." /> : 'Execute Provenance Audit'}
          </BtnPrimary>
        </form>

        {/* Verification Report */}
        {verifyResult && !isVerifying && (
          <div className={`mt-8 p-6 rounded-2xl border animate-pop-in ${
            verifyResult.success 
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]' 
              : 'bg-rose-50/50 border-rose-200 text-rose-900 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                verifyResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {verifyResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                  <h3 className={`font-heading font-extrabold text-base leading-none ${
                    verifyResult.success ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {verifyResult.success ? 'Provenance Seal Verified' : 'Verification Denied'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {verifyResult.success 
                      ? 'The document hash matches a registered smart contract state' 
                      : 'The document cryptographic profile does not match the ledger state'}
                  </p>
                </div>

                <div className="h-px bg-slate-200" />

                {verifyResult.success ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-3 bg-white/70 p-3 rounded-xl border border-slate-100">
                      <User size={16} className="text-slate-400" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blockchain Issuer</p>
                        <p className="font-mono text-slate-800 truncate" title={verifyResult.issuer}>
                          {verifyResult.issuer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/70 p-3 rounded-xl border border-slate-100">
                      <Calendar size={16} className="text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Timestamp Sealed</p>
                        <p className="text-slate-800">{verifyResult.issuedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/70 p-3 rounded-xl border border-slate-100 md:col-span-2">
                      <Hash size={16} className="text-slate-400" />
                      <div className="overflow-hidden w-full">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document SHA-256 Fingerprint</p>
                        <p className="font-mono text-slate-800 truncate" title={verifyResult.docHash}>
                          {verifyResult.docHash}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/70 p-4 rounded-xl border border-rose-100 text-xs leading-relaxed text-slate-600">
                    <strong>Reason:</strong> {verifyResult.message || 'The digital fingerprint of this file is completely missing from the blockchain records, or the issuer has revoked it.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-8 text-xs text-slate-400 font-medium">
        Secured by Decentralized Blockchain Registry Protocol
      </p>
    </div>
  );
};

export default PublicVerify;
