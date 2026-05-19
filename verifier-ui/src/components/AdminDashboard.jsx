import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, User, Mail, Lock, PlusCircle, Trash2, Key, LogOut,
  Loader2, Upload, Activity, ShieldCheck, Users
} from 'lucide-react';
import {
  PageWrapper, DashHeader, UserBadge, BtnMuted, BtnLogout, BtnPrimary, BtnOutline, BtnRevoke,
  Card, SectionTitle, SectionSubtitle, Field, inputCls, DropZone,
  Table, Th, Td, EmptyRow, RecipientAvatar, RoleBadge,
  SpinLabel, InfoCallout, Badge
} from './ui';

const AdminDashboard = ({
  newEmail, setNewEmail,
  newPassword, setNewPassword,
  newRole, setNewRole,
  usersList = [],
  handleCreateUser, handleChangePassword, handleDeleteUser,
  handleLogout, token, isCreatingUser = false,
  fetchUsers, showModal
}) => {
  const navigate = useNavigate();
  const [bulkRole, setBulkRole]           = useState('issuer');
  const [parsedEmails, setParsedEmails]   = useState([]);
  const [importing, setImporting]         = useState(false);
  const [importStatus, setImportStatus]   = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  useEffect(() => {
    if (token && fetchUsers) fetchUsers(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault(); setIsSubmitting(true);
    try { await handleCreateUser(e); } finally { setIsSubmitting(false); }
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const matches = ev.target.result.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
      const unique = [...new Set(matches.map(m => m.trim().toLowerCase()))];
      setParsedEmails(unique);
      setImportStatus(`Detected ${unique.length} valid email address(es).`);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!parsedEmails.length) {
      if (showModal) await showModal('Selection Required', 'Please select a valid CSV/TXT with emails.');
      else alert('Please select a valid CSV/TXT.');
      return;
    }
    setImporting(true);
    setImportStatus('Provisioning accounts, generating passwords, sending welcome emails…');
    try {
      const res = await fetch('http://localhost:3000/api/auth/bulk_create_users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterAdminToken: token, emails: parsedEmails, role: bulkRole })
      });
      const data = await res.json();
      if (data.error) setImportStatus(`Import Error: ${data.error}`);
      else {
        setImportStatus(data.message);
        if (showModal) await showModal('Bulk Import Completed', data.message);
        if (fetchUsers) fetchUsers(token);
      }
    } catch { setImportStatus('Network error during bulk import.'); }
    finally { setImporting(false); }
  };

  const downloadSampleCSV = () => {
    const csv = "data:text/csv;charset=utf-8,Emails\r\nstudent1@university.edu\r\nstudent2@university.edu\r\n";
    const a = document.createElement('a');
    a.href = encodeURI(csv); a.download = 'edudocs_bulk_import_sample.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const busy = isSubmitting || isCreatingUser;

  return (
    <PageWrapper>
      <DashHeader logo={<Shield size={20} />} title="EduDocs">
        <UserBadge icon={<User size={12} />} label="Master Admin" />
        <BtnMuted onClick={() => navigate('/profile')}>My Profile</BtnMuted>
        <BtnLogout onClick={handleLogout}><LogOut size={14} /> Sign Out</BtnLogout>
      </DashHeader>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
        {/* Left column: Create + Bulk Import */}
        <div className="flex flex-col gap-7">

          {/* Manual create */}
          <Card className="animate-fade-in">
            <SectionTitle>Provision Single Account</SectionTitle>
            <SectionSubtitle>Add new credentials or administrative operators to the network manually.</SectionSubtitle>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field label="Institutional Email" icon={<Mail size={15} />}>
                <input type="email" placeholder="operator@university.edu"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  required disabled={busy} className={inputCls()} />
              </Field>

              <Field label="Temporary Password" icon={<Lock size={15} />}>
                <input type="password" placeholder="••••••••"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  required disabled={busy} className={inputCls()} />
              </Field>

              <Field label="Access Role" icon={<User size={15} />}>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  disabled={busy} className={inputCls()}>
                  <option value="issuer">Document Issuer Authority</option>
                  <option value="normal_user">Standard Student / Verifier</option>
                </select>
              </Field>

              <BtnPrimary type="submit" disabled={busy} className="w-full mt-1">
                {busy
                  ? <SpinLabel label="Provisioning User…" />
                  : <><PlusCircle size={15} /> Generate Platform Account</>
                }
              </BtnPrimary>
            </form>
          </Card>

          {/* Bulk Import */}
          <Card className="animate-fade-in delay-100">
            <SectionTitle>Bulk Import Credentials</SectionTitle>
            <SectionSubtitle>
              Upload a CSV of academic emails. The platform auto-creates accounts and dispatches credentials.{' '}
              <button onClick={downloadSampleCSV}
                className="text-indigo-600 font-semibold underline cursor-pointer hover:text-indigo-800">
                Download sample template
              </button>.
            </SectionSubtitle>

            <div className="flex flex-col gap-5">
              <Field label="Assigned Role for Batch" icon={<Users size={15} />}>
                <select value={bulkRole} onChange={e => setBulkRole(e.target.value)}
                  disabled={importing} className={inputCls()}>
                  <option value="issuer">Document Issuer Authority</option>
                  <option value="normal_user">Standard Student / Verifier</option>
                </select>
              </Field>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Batch Email Registry File
                </label>
                <DropZone mini accept=".csv,.txt" onChange={handleFileUpload} disabled={importing}>
                  <Upload size={18} className="text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-600">Select .CSV or .TXT registry</span>
                </DropZone>
              </div>

              {importStatus && (
                <InfoCallout>
                  <Activity size={14} className="shrink-0 mt-0.5" />
                  {importStatus}
                </InfoCallout>
              )}

              {parsedEmails.length > 0 && (
                <BtnPrimary onClick={handleBulkImport} disabled={importing}
                  className="w-full !bg-emerald-600 hover:!bg-emerald-700 !shadow-[0_4px_14px_-1px_rgba(16,185,129,0.3)]">
                  {importing
                    ? <SpinLabel label="Anchoring Batch Accounts…" />
                    : `Import ${parsedEmails.length} Users Now`}
                </BtnPrimary>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Managed Directory */}
        <Card className="animate-fade-in delay-200">
          <SectionTitle badge={<Badge variant="success">{usersList.length} Active Operators</Badge>}>
            Managed Directory
          </SectionTitle>
          <SectionSubtitle>Browse all credentials, reset passwords, or suspend access keys.</SectionSubtitle>

          <div className="max-h-[680px] overflow-y-auto rounded-xl">
            <Table>
              <thead>
                <tr>
                  <Th>Identity / Email</Th>
                  <Th>Privilege</Th>
                  <Th>Status</Th>
                  <Th center>Operations</Th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <EmptyRow cols={4} message="No managed operator profiles in directory." />
                ) : usersList.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <Td>
                      <div className="flex items-center gap-3">
                        <RecipientAvatar
                          icon={u.email?.[0]?.toUpperCase() ?? '?'}
                          bgCls="bg-slate-100 text-slate-600"
                        />
                        <span className="font-medium text-slate-800">{u.email || 'Operator Account'}</span>
                      </div>
                    </Td>
                    <Td><RoleBadge role={u.role} /></Td>
                    <Td>
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                        <ShieldCheck size={13} /> Secured
                      </span>
                    </Td>
                    <Td center>
                      {u.role !== 'master_admin' ? (
                        <div className="flex items-center justify-center gap-2">
                          <BtnOutline onClick={() => handleChangePassword(u.id)} title="Reset Password">
                            <Key size={14} />
                          </BtnOutline>
                          <BtnRevoke onClick={() => handleDeleteUser(u.id)} title="De-authenticate User">
                            <Trash2 size={14} />
                          </BtnRevoke>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">System Root</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
