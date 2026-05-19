import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building, Mail, Database, FileText, Key,
  Search, User, LogOut, ExternalLink, Download, Trash2,
  Loader2, AlertTriangle
} from 'lucide-react';
import {
  PageWrapper, DashHeader, UserBadge, BtnMuted, BtnLogout, BtnPrimary, BtnRevoke,
  Card, SectionTitle, SectionSubtitle, Field, inputCls, DropZone,
  Table, Th, Td, EmptyRow, RecipientAvatar, CredBadge, LinkAction,
  ResultCard, SpinLabel, IssuingOverlay, Badge
} from './ui';

const IssuerDashboard = ({
  contractAddress, setContractAddress,
  credentialText, setCredentialText,
  file, setFile,
  revokeCredentialId, setRevokeCredentialId,
  issuedDocuments,
  handleIssue, handleRevoke,
  verifyContractAddress, setVerifyContractAddress,
  verifyCredentialText, setVerifyCredentialText,
  verifyFile, setVerifyFile,
  handleVerify, verifyResult,
  handleLogout, hardhatKey, setHardhatKey,
  isIssuing, isVerifying, isRevoking,
  token, fetchIssuedDocuments, showModal
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (token && fetchIssuedDocuments) fetchIssuedDocuments(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <PageWrapper>
      <DashHeader logo={<Shield size={20} />} title="EduDocs">
        <UserBadge icon={<Building size={12} />} label="Issuer Portal" />
        <BtnMuted onClick={() => navigate('/profile')}>My Profile</BtnMuted>
        <BtnLogout onClick={handleLogout}><LogOut size={14} /> Sign Out</BtnLogout>
      </DashHeader>

      <div className="flex flex-col gap-7">
        {/* Issue + Verify side-by-side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">

          {/* Issue Certificate */}
          <Card className="relative overflow-hidden animate-fade-in">
            {isIssuing && <IssuingOverlay />}
            <SectionTitle>Mint Secure Credentials</SectionTitle>
            <SectionSubtitle>
              Anchor new certificates cryptographically to the immutable blockchain ledger.
            </SectionSubtitle>

            <form onSubmit={handleIssue} className="flex flex-col gap-5">
              <Field label="Recipient Email" icon={<Mail size={15} />}>
                <input type="email" placeholder="student@university.edu"
                  value={credentialText} onChange={e => setCredentialText(e.target.value)}
                  required disabled={isIssuing} className={inputCls()} />
              </Field>

              <Field label="Smart Contract Address" icon={<Database size={15} />}>
                <input type="text" placeholder="0x..."
                  value={contractAddress} onChange={e => setContractAddress(e.target.value)}
                  required disabled={isIssuing} className={inputCls()} />
              </Field>

              <DropZone accept="application/pdf" onChange={e => setFile(e.target.files[0])} disabled={isIssuing}>
                <FileText size={32} className="text-indigo-500" />
                <p className="text-sm font-semibold text-slate-700">
                  {file ? file.name : 'Click or drag certificate PDF here'}
                </p>
                {!file && <p className="text-xs text-slate-400">PDF only · max 10 MB</p>}
              </DropZone>

              {/* Hardhat key if missing */}
              {!hardhatKey && (
                <div className="flex flex-col gap-2 animate-fade-in">
                  <label className="text-xs font-semibold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Signing Key Required
                  </label>
                  <div className="relative flex items-center">
                    <Key size={15} className="absolute left-3.5 text-amber-500 pointer-events-none" />
                    <input type="password" placeholder="Paste your 0x... private key"
                      value={hardhatKey || ''} onChange={e => setHardhatKey(e.target.value)}
                      required disabled={isIssuing}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-amber-300 bg-amber-50
                                 text-slate-900 placeholder:text-amber-400 outline-none
                                 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition disabled:opacity-50" />
                  </div>
                  <p className="text-xs text-amber-600">
                    Your session has no linked wallet key. Link it in Profile or paste here.
                  </p>
                </div>
              )}

              <BtnPrimary type="submit" disabled={isIssuing} className="w-full">
                {isIssuing ? <SpinLabel label="Anchoring to Blockchain…" /> : 'Sign and Mint Document'}
              </BtnPrimary>
            </form>
          </Card>

          {/* Verify */}
          <Card className="animate-fade-in delay-100">
            <SectionTitle>Ledger Verification Audit</SectionTitle>
            <SectionSubtitle>
              Perform real-time decentralised audit to confirm document provenance and integrity.
            </SectionSubtitle>

            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <Field label="Audit Contract Address" icon={<Database size={15} />}>
                <input type="text" placeholder="0x..." value={verifyContractAddress}
                  onChange={e => setVerifyContractAddress(e.target.value)}
                  required disabled={isVerifying} className={inputCls()} />
              </Field>

              <Field label="Recipient Identity (Owner Email)" icon={<User size={15} />}>
                <input type="email" placeholder="student@university.edu" value={verifyCredentialText}
                  onChange={e => setVerifyCredentialText(e.target.value)}
                  required disabled={isVerifying} className={inputCls()} />
              </Field>

              <DropZone mini accept="application/pdf"
                onChange={e => setVerifyFile(e.target.files[0])} disabled={isVerifying}>
                {isVerifying ? (
                  <div className="flex flex-col items-center gap-2 py-1">
                    <div className="scanner-line" />
                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                    <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Hashing & Verifying…</p>
                  </div>
                ) : (
                  <>
                    <Search size={20} className="text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-700">
                      {verifyFile ? verifyFile.name : 'Click to select PDF for verification'}
                    </p>
                  </>
                )}
              </DropZone>

              <BtnPrimary type="submit" disabled={isVerifying}
                className="w-full !bg-slate-700 hover:!bg-slate-800 !shadow-none">
                {isVerifying ? <SpinLabel label="Scanning Block Record…" /> : 'Verify Ledger Authenticity'}
              </BtnPrimary>
            </form>

            {verifyResult && !isVerifying && <ResultCard result={verifyResult} />}
          </Card>
        </div>

        {/* Issued Documents History */}
        <Card className="animate-fade-in">
          <SectionTitle badge={<Badge variant="success">{issuedDocuments?.length ?? 0} Anchored Assets</Badge>}>
            History of Issued Credentials
          </SectionTitle>
          <SectionSubtitle>Audit trails of all records cryptographically linked by your institution.</SectionSubtitle>

          <Table>
            <thead>
              <tr>
                <Th>Recipient</Th>
                <Th>Document</Th>
                <Th>Credential ID</Th>
                <Th>Issued</Th>
                <Th center>Access</Th>
                <Th center>Status</Th>
                <Th center>Revoke</Th>
              </tr>
            </thead>
            <tbody>
              {!issuedDocuments?.length ? (
                <EmptyRow cols={7} message="No documents anchored by this profile yet." />
              ) : issuedDocuments.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <Td>
                    <div className="flex items-center gap-3">
                      <RecipientAvatar icon={<User size={14} />} />
                      <span className="font-semibold text-slate-800">{doc.email}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText size={13} className="text-slate-400" />
                      {doc.originalName}
                    </div>
                  </Td>
                  <Td>
                    <CredBadge id={doc.credentialId} onClick={async () => {
                      setRevokeCredentialId(doc.credentialId);
                      if (showModal) await showModal('Credential ID', 'ID populated in revocation input.');
                    }} />
                  </Td>
                  <Td>{new Date(doc.issuedAt).toLocaleDateString()}</Td>
                  <Td center>
                    {doc.documentUrl ? (
                      <div className="flex items-center justify-center gap-2">
                        <LinkAction href={doc.documentUrl}><ExternalLink size={11} />Preview</LinkAction>
                        <LinkAction href={doc.documentUrl.replace('/upload/', '/upload/fl_attachment/')} download>
                          <Download size={11} />Download
                        </LinkAction>
                      </div>
                    ) : <span className="text-xs italic text-slate-400">Local only</span>}
                  </Td>
                  <Td center>
                    {doc.revoked
                      ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Revoked</span>
                      : <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>}
                  </Td>
                  <Td center>
                    {!doc.revoked ? (
                      <BtnRevoke onClick={() => handleRevoke(null, doc.credentialId)} disabled={isRevoking} title="Revoke Credential">
                        <Trash2 size={14} />
                      </BtnRevoke>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default IssuerDashboard;
