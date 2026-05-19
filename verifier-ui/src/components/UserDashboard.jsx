import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, User, Building, FileText, ExternalLink,
  Download, Database, Mail, Search, LogOut,
  CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import {
  PageWrapper, DashHeader, UserBadge, BtnMuted, BtnLogout, BtnPrimary, BtnProof,
  Card, SectionTitle, SectionSubtitle, Field, inputCls, DropZone,
  Table, Th, Td, EmptyRow, RecipientAvatar, CredBadge, LinkAction,
  ResultCard, SpinLabel, Badge
} from './ui';

const UserDashboard = ({
  myDocuments,
  verifyContractAddress, setVerifyContractAddress,
  verifyCredentialText, setVerifyCredentialText,
  verifyFile, setVerifyFile,
  handleVerify, verifyResult,
  handleLogout, isVerifying,
  token, fetchMyDocuments, showModal
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (token && fetchMyDocuments) fetchMyDocuments(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <PageWrapper>
      <DashHeader logo={<Shield size={20} />} title="EduDocs">
        <UserBadge icon={<User size={12} />} label="User Portal" />
        <BtnMuted onClick={() => navigate('/profile')}>My Profile</BtnMuted>
        <BtnLogout onClick={handleLogout}><LogOut size={14} /> Sign Out</BtnLogout>
      </DashHeader>

      <div className="grid gap-7">
        {/* Documents Table */}
        <Card className="animate-fade-in">
          <SectionTitle badge={<Badge variant="success">{myDocuments.length} Verified Records</Badge>}>
            Secured Identity &amp; Academic Assets
          </SectionTitle>
          <SectionSubtitle>
            These credentials have been cryptographically anchored to your academic profile on the public ledger.
          </SectionSubtitle>

          <Table>
            <thead>
              <tr>
                <Th>Issuer</Th>
                <Th>Document</Th>
                <Th>Credential ID</Th>
                <Th>Issued</Th>
                <Th center>Access</Th>
                <Th center>Ledger Proof</Th>
              </tr>
            </thead>
            <tbody>
              {myDocuments.length === 0 ? (
                <EmptyRow cols={6} message="No documents associated with your profile on this network." />
              ) : myDocuments.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <Td>
                    <div className="flex items-center gap-3">
                      <RecipientAvatar icon={<Building size={14} />} bgCls="bg-violet-100 text-violet-600" />
                      <span className="font-semibold text-slate-800">{doc.issuer}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText size={14} className="text-slate-400" />
                      {doc.originalName}
                    </div>
                  </Td>
                  <Td><CredBadge id={doc.credentialId} /></Td>
                  <Td>{new Date(doc.issuedAt).toLocaleDateString()}</Td>
                  <Td center>
                    {doc.documentUrl ? (
                      <div className="flex items-center justify-center gap-2">
                        <LinkAction href={doc.documentUrl}><ExternalLink size={11} />Preview</LinkAction>
                        <LinkAction href={doc.documentUrl.replace('/upload/', '/upload/fl_attachment/')} download>
                          <Download size={11} />Download
                        </LinkAction>
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">Local only</span>
                    )}
                  </Td>
                  <Td center>
                    <BtnProof onClick={() => showModal
                      ? showModal('Ledger Proof', 'TX Hash: ' + doc.txHash)
                      : alert('TX Hash: ' + doc.txHash)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Verification + Result */}
        <Card className="animate-fade-in delay-100">
          <SectionTitle>Independent Provenance Audit</SectionTitle>
          <SectionSubtitle>
            Perform a blockchain-synchronized validation audit of any credential PDF.
          </SectionSubtitle>

          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Verification Contract" icon={<Database size={15} />}>
                  <input type="text" placeholder="0x..." value={verifyContractAddress}
                    onChange={e => setVerifyContractAddress(e.target.value)}
                    required disabled={isVerifying} className={inputCls()} />
                </Field>

                <Field label="Owner Academic Email" icon={<Mail size={15} />}>
                  <input type="email" placeholder="name@email.com" value={verifyCredentialText}
                    onChange={e => setVerifyCredentialText(e.target.value)}
                    required disabled={isVerifying} className={inputCls()} />
                </Field>
            </div>

            <DropZone mini accept="application/pdf"
              onChange={e => setVerifyFile(e.target.files[0])}
              required disabled={isVerifying}>
              {isVerifying ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="scanner-line" />
                  <Loader2 className="animate-spin text-indigo-600" size={22} />
                  <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase">Hashing & Verifying…</p>
                </div>
              ) : (
                <>
                  <Search size={22} className="text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    {verifyFile ? verifyFile.name : 'Click or drop certificate PDF'}
                  </p>
                </>
              )}
            </DropZone>

            <BtnPrimary type="submit" disabled={isVerifying} className="w-full max-w-sm mx-auto">
              {isVerifying ? <SpinLabel label="Analyzing blockchain blocks…" /> : 'Execute Audit'}
            </BtnPrimary>
          </form>

          {verifyResult && !isVerifying && <ResultCard result={verifyResult} />}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserDashboard;
