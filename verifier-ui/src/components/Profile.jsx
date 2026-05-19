import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, User, Building, Key, Eye, EyeOff, Loader2,
    CheckCircle2, AlertTriangle, LogOut, ArrowLeft, FileText
} from 'lucide-react';
import { Card, BtnPrimary, RoleBadge } from './ui';

const Profile = ({
    email,
    role,
    issuedDocuments,
    myDocuments,
    handleLogout,
    handleRevoke,
    hardhatKey,
    setHardhatKey,
    token
}) => {
    const navigate = useNavigate();
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleLinkKey = async (e) => {
        e.preventDefault();
        if (!keyInput.trim()) return alert("Please enter your private key.");
        setLoading(true);
        setMessage('');
        setIsError(false);
        try {
            const res = await fetch('http://localhost:3000/api/profile/hardhat-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, hardhatKey: keyInput.trim() })
            });
            const data = await res.json();
            if (data.error) {
                setMessage(data.error);
                setIsError(true);
            } else {
                setMessage(data.message);
                setHardhatKey(keyInput.trim());
                setKeyInput('');
            }
        } catch (err) {
            setMessage("Failed to link cryptographic key.");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-800 pb-12 animate-fade-in">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <Shield size={22} />
                    </div>
                    <h1 className="font-heading text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">EduDocs</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
                    >
                        <ArrowLeft size={16} />
                        <span>Return Dashboard</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold transition"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto mt-10 px-6">
                <div className="mb-8">
                    <h2 className="font-heading text-3xl font-bold text-slate-900">User Account Profile</h2>
                    <p className="text-slate-500 mt-2">Securely manage identity linkages, wallet addresses, and cryptographic authorization tokens.</p>
                </div>

                <div className="space-y-6">
                    <Card>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Identity Email Address</span>
                                <span className="font-heading text-xl font-bold text-slate-800">{email}</span>
                            </div>
                            <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ledger Privilege Role</span>
                                <RoleBadge role={role} />
                                <span className="block text-sm text-slate-500 mt-2 font-medium">
                                    {role === 'issuer' ? 'Institutional Certificate Issuer' : role === 'normal_user' ? 'Standard Academic Student / Verifier' : role}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Cryptographic Wallet Key Management */}
                    <Card>
                        <div className="mb-5 border-b border-slate-100 pb-5">
                            <h3 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-800">
                                <Key className="text-indigo-600" size={24} />
                                Cryptographic Wallet Signature Configuration
                            </h3>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                EduDocs relies on a local Hardhat network key to execute secure block anchors and cryptographic signatures. To protect your keys across sessions without leaving vulnerable browser-cache fingerprints, credentials are encrypted and stored in your profile ledger.
                            </p>
                        </div>

                        {hardhatKey ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 text-emerald-700 font-bold mb-4">
                                    <CheckCircle2 size={20} />
                                    <span>Cryptographic Authority Key Linked to Database Profile</span>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-emerald-100 shadow-sm">
                                    <span className="flex-1 px-3 font-mono text-slate-700 font-medium tracking-tight">
                                        {showKey ? hardhatKey : `${hardhatKey.substring(0, 8)}••••••••••••••••••••••••••••••••••••••••••••••••${hardhatKey.substring(hardhatKey.length - 8)}`}
                                    </span>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-emerald-700 bg-emerald-100 hover:bg-emerald-200 font-bold transition whitespace-nowrap min-w-[120px]"
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        <span>{showKey ? 'Hide Key' : 'Reveal'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-10 rounded-full blur-3xl"></div>
                                <div className="flex items-center gap-3 text-amber-700 font-bold mb-2">
                                    <AlertTriangle size={20} className="animate-pulse" />
                                    <span>Cryptographic Wallet Key Missing from Profile</span>
                                </div>
                                <p className="text-sm text-amber-600 mb-5 max-w-2xl">
                                    Your institutional identity is not configured to authorize ledger mints. Paste the 0x... private key supplied by your system operator to setup signing permission.
                                </p>
                                <form onSubmit={handleLinkKey} className="flex gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-400">
                                            <Key size={18} />
                                        </div>
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            placeholder="Paste your 0x... private key here"
                                            value={keyInput}
                                            onChange={e => setKeyInput(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition font-mono text-sm shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="flex items-center justify-center px-4 rounded-xl text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold transition"
                                        title={showKey ? "Hide input" : "Show input"}
                                    >
                                        {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 px-6 rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 font-bold transition disabled:opacity-70 min-w-[150px]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                <span>Linking...</span>
                                            </>
                                        ) : (
                                            <span>Link to Profile</span>
                                        )}
                                    </button>
                                </form>
                                {message && (
                                    <p className={`mt-4 text-sm font-bold flex items-center gap-2 ${isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                        {message}
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {role === 'normal_user' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 mt-10">
                                <h3 className="font-heading text-xl font-bold text-slate-800">Secured Academic Assets</h3>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold shadow-sm">
                                    {myDocuments ? myDocuments.length : 0} Total Assets
                                </span>
                            </div>
                            <Card className="p-0 overflow-hidden">
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="px-6 py-4 font-semibold">Issuer Source</th>
                                                <th className="px-6 py-4 font-semibold">Document Name</th>
                                                <th className="px-6 py-4 font-semibold">Credential ID</th>
                                                <th className="px-6 py-4 font-semibold">Issuance Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(!myDocuments || myDocuments.length === 0) ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">
                                                        No credentials anchored to your profile ledger.
                                                    </td>
                                                </tr>
                                            ) : (
                                                myDocuments.map((doc, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                                    <Building size={14} />
                                                                </div>
                                                                <span className="font-semibold text-slate-800">{doc.issuer}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <FileText size={16} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">{doc.originalName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono tracking-tight border border-slate-200">
                                                                {doc.credentialId}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                            {new Date(doc.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
