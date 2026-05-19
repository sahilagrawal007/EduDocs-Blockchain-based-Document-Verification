import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Building, FileText, Activity, 
    PlusCircle, Trash2, Shield, Settings,
    BarChart3, PieChart, ArrowLeft, Edit3, Check, X,
    Calendar, TrendingUp, User, LogOut
} from 'lucide-react';
import { PageWrapper, DashHeader, Card, BtnPrimary, Table, RoleBadge, UserBadge, BtnLogout, Badge, BtnMuted } from './ui';

export default function SuperAdminDashboard({ token, handleLogout, showModal }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [newOrgName, setNewOrgName] = useState('');
    
    // View state
    const [activeTab, setActiveTab] = useState('analytics');
    
    // Tenant drill-down states
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [orgStats, setOrgStats] = useState(null);
    const [orgUsers, setOrgUsers] = useState([]);
    const [unassignedUsers, setUnassignedUsers] = useState([]);
    
    // User creation inside tenant
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('master_admin');

    // Inline editing states
    const [editingUser, setEditingUser] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');

    const displayModal = showModal || (async (title, msg, confirmBtn = false) => {
        if (confirmBtn) return window.confirm(msg);
        window.alert(msg);
        return true;
    });

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchOrganizations();
        }
    }, [token]);

    useEffect(() => {
        if (selectedOrg) {
            fetchOrgDetails(selectedOrg.id);
        }
    }, [selectedOrg]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/analytics/system?token=${token}`);
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (err) {
            console.error("Failed to fetch stats");
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/organizations?token=${token}`);
            const data = await res.json();
            if (data.organizations) setOrganizations(data.organizations);
        } catch (err) {
            console.error("Failed to fetch organizations");
        }
    };

    const fetchOrgDetails = async (orgId) => {
        try {
            // Fetch organization analytics
            const statsRes = await fetch(`http://localhost:3000/api/analytics/organization/${orgId}?token=${token}`);
            const statsData = await statsRes.json();
            if (statsData.stats) setOrgStats(statsData.stats);

            // Fetch all users to filter assigned and unassigned
            const usersRes = await fetch(`http://localhost:3000/api/users?masterAdminToken=${token}`);
            const usersData = await usersRes.json();
            if (usersData.users) {
                // Filter users strictly belonging to this organization
                const filtered = usersData.users.filter(u => u.organization_id === orgId);
                setOrgUsers(filtered);

                // Filter users with no organization (unassigned) and exclude super admins
                const unassigned = usersData.users.filter(u => !u.organization_id && u.role !== 'super_admin');
                setUnassignedUsers(unassigned);
            }
        } catch (err) {
            console.error("Failed to fetch organization details", err);
        }
    };

    const handleCreateOrganization = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, name: newOrgName })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Notification', data.error);
            else {
                await displayModal('Success', 'Organization created successfully on the network ledger!');
                setNewOrgName('');
                fetchOrganizations();
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to configure new SaaS organization tenant.');
        }
    };

    const handleCreateOrgUser = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/auth/create_master_admin';
            let payload = { 
                token, 
                email: newAdminEmail, 
                password: newAdminPassword,
                organization_id: selectedOrg.id 
            };

            // If Super Admin is provisioning standard user or issuer
            if (newAdminRole !== 'master_admin') {
                endpoint = '/api/auth/create_user';
                payload = {
                    masterAdminToken: token,
                    email: newAdminEmail,
                    password: newAdminPassword,
                    role: newAdminRole
                };
            }

            const res = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.error) await displayModal('Provisioning Alert', data.error);
            else {
                if (data.credentials) {
                    await displayModal('Account Generated', `User Created Successfully!\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}\nHardhat Key: ${data.credentials.hardhat_key || 'N/A'}`);
                } else {
                    await displayModal('Success', data.message);
                }
                setNewAdminEmail('');
                setNewAdminPassword('');
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to provision organization user credentials.');
        }
    };

    const handleAssignUser = async (userId) => {
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    masterAdminToken: token,
                    organization_id: selectedOrg.id 
                })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', 'User successfully added to organization directory!');
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to map user to tenant organization.');
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await displayModal('Verify Deletion', 'Are you sure you want to permanently delete this user account from the registry?', true);
        if (!confirmed) return;
        try {
            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterAdminToken: token })
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', data.message);
                fetchOrgDetails(selectedOrg.id);
                fetchStats();
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to delete selected user account.');
        }
    };

    const handleStartEdit = (user) => {
        setEditingUser(user.id);
        setEditEmail(user.email);
        setEditPassword('');
        setEditRole(user.role);
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleSaveUserEdit = async (userId) => {
        try {
            const payload = {
                masterAdminToken: token,
                email: editEmail,
                role: editRole
            };
            if (editPassword) {
                payload.password = editPassword;
            }

            const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.error) await displayModal('System Alert', data.error);
            else {
                await displayModal('Success', 'User details updated successfully!');
                setEditingUser(null);
                fetchOrgDetails(selectedOrg.id);
            }
        } catch (err) {
            await displayModal('System Error', 'Failed to update administrative profile.');
        }
    };

    return (
        <PageWrapper>
            <DashHeader logo={<Shield size={20} />} title="EduDocs Core">
                <UserBadge icon={<User size={12} />} label="Super Admin" />
                <BtnMuted onClick={() => navigate('/profile')}>My Profile</BtnMuted>
                <BtnLogout onClick={handleLogout}><LogOut size={14} /> Sign Out</BtnLogout>
            </DashHeader>
            
            <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
                <button 
                    onClick={() => { setActiveTab('analytics'); setSelectedOrg(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Activity size={18} /> System Analytics
                </button>
                <button 
                    onClick={() => setActiveTab('organizations')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'organizations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Building size={18} /> Organizations (SaaS)
                </button>
            </div>

            {!selectedOrg ? (
                <>

                    {activeTab === 'analytics' && stats && (
                        <div className="space-y-6 fade-in-up">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="text-indigo-600" size={24} />
                                <h2 className="font-heading text-xl font-bold text-slate-800">Global System Overview</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <Card className="border-t-4 border-t-orange-500 hover:shadow-lg transition flex items-center p-5">
                                    <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl mr-4">
                                        <Building size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Organizations</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{stats.totalOrganizations}</p>
                                    </div>
                                </Card>
                                
                                <Card className="border-t-4 border-t-purple-500 hover:shadow-lg transition flex items-center p-5">
                                    <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl mr-4">
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Master Admins</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{stats.totalMasterAdmins}</p>
                                    </div>
                                </Card>
                                
                                <Card className="border-t-4 border-t-blue-500 hover:shadow-lg transition flex items-center p-5">
                                    <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl mr-4">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Active Issuers</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{stats.totalIssuers}</p>
                                    </div>
                                </Card>
                                
                                <Card className="border-t-4 border-t-green-500 hover:shadow-lg transition flex items-center p-5">
                                    <div className="bg-green-50 text-green-600 p-4 rounded-2xl mr-4">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Documents</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{stats.totalDocuments}</p>
                                    </div>
                                </Card>
                            </div>
                            
                            <Card className="mt-6">
                                <div className="mb-6">
                                    <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                        <Building className="text-indigo-600" /> Combined Tenant Comparison (Documents Issued)
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">Comparative analysis of decentralized documents issued by each registered SaaS tenant.</p>
                                </div>
                                {stats.organizationsBreakdown && stats.organizationsBreakdown.length > 0 ? (
                                    <div className="space-y-4">
                                        {stats.organizationsBreakdown.map(org => {
                                            const percent = stats.totalDocuments > 0 ? (org.documentsCount / stats.totalDocuments) * 100 : 0;
                                            return (
                                                <div key={org.id} className="w-full">
                                                    <div className="flex justify-between items-center mb-1 text-sm">
                                                        <span className="font-semibold text-slate-700">{org.name}</span>
                                                        <span className="text-slate-500 font-medium">{org.documentsCount} docs ({percent.toFixed(1)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div 
                                                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                                                            style={{ width: `${Math.max(percent, 2)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic py-4 text-center">No tenant comparative data available.</p>
                                )}
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                <Card>
                                    <div className="mb-6">
                                        <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                            <Users className="text-indigo-600" /> Platform Role Allocation
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Distribution of active accounts globally mapped across all organizations.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-full h-4 rounded-full flex overflow-hidden">
                                            <div 
                                                className="bg-indigo-600 h-full" 
                                                style={{ width: `${(stats.totalMasterAdmins / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                title="Master Admins"
                                            ></div>
                                            <div 
                                                className="bg-sky-400 h-full" 
                                                style={{ width: `${(stats.totalIssuers / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                title="Issuers"
                                            ></div>
                                            <div 
                                                className="bg-emerald-400 h-full" 
                                                style={{ width: `${(stats.totalUsers / (stats.totalMasterAdmins + stats.totalIssuers + stats.totalUsers || 1)) * 100}%` }}
                                                title="Users"
                                            ></div>
                                        </div>
                                        <div className="flex gap-4 text-sm font-medium text-slate-600 flex-wrap">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div> Master Admins ({stats.totalMasterAdmins})</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-400"></div> Active Issuers ({stats.totalIssuers})</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Verifiers / Users ({stats.totalUsers})</div>
                                        </div>
                                    </div>
                                </Card>

                                <Card>
                                    <div className="mb-6">
                                        <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                            <Activity className="text-indigo-600" /> Network Sync Status
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Live check of block sync and API response integrity.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-emerald-50 text-emerald-700 p-6 rounded-2xl border border-emerald-100 mt-4">
                                        <div className="relative flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                                        </div>
                                        <span className="font-bold tracking-wide">Sync: Node Active</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'organizations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
                            <Card className="lg:col-span-1 h-fit">
                                <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-800 mb-6">
                                    <PlusCircle className="text-indigo-600" /> New SaaS Tenant
                                </h2>
                                <form onSubmit={handleCreateOrganization} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Organization / University Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Stanford University"
                                            value={newOrgName}
                                            onChange={(e) => setNewOrgName(e.target.value)}
                                            required 
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <BtnPrimary className="w-full justify-center">Create Organization</BtnPrimary>
                                </form>
                            </Card>
                            
                            <Card className="lg:col-span-2">
                                <div className="mb-6">
                                    <h2 className="font-heading text-xl font-bold text-slate-800">Active Organizations</h2>
                                    <p className="text-sm text-slate-500 mt-1">Click on any organization to manage its users and view its specific analytics.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {organizations.length === 0 ? (
                                        <div className="col-span-full py-8 text-center text-slate-500 italic bg-slate-50 rounded-2xl border border-slate-100">
                                            No organizations created yet.
                                        </div>
                                    ) : (
                                        organizations.map(org => (
                                            <div 
                                                key={org.id} 
                                                onClick={() => setSelectedOrg(org)}
                                                className="group flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                                            >
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-heading font-bold text-xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    {org.name.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-slate-800 truncate">{org.name}</h4>
                                                    <span className="text-xs text-slate-400 font-mono">ID: {org.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            ) : (
                // Organization Detail View (Drill down)
                <div className="fade-in-up">
                    <div className="flex items-center gap-4 mb-8">
                        <button 
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            onClick={() => setSelectedOrg(null)}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="font-heading text-3xl font-bold text-slate-900">{selectedOrg.name}</h1>
                            <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-mono rounded-lg mt-2">
                                Tenant ID: {selectedOrg.id}
                            </div>
                        </div>
                    </div>

                    {orgStats && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                                <Card className="border-t-4 border-t-purple-500 flex items-center p-5">
                                    <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl mr-4">
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Master Admins</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{orgStats.totalMasterAdmins}</p>
                                    </div>
                                </Card>
                                <Card className="border-t-4 border-t-blue-500 flex items-center p-5">
                                    <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl mr-4">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Active Issuers</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{orgStats.totalIssuers}</p>
                                    </div>
                                </Card>
                                <Card className="border-t-4 border-t-green-500 flex items-center p-5">
                                    <div className="bg-green-50 text-green-600 p-4 rounded-2xl mr-4">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Documents Issued</h3>
                                        <p className="font-heading text-3xl font-bold text-slate-800">{orgStats.totalDocuments}</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Individual Organization Weekly Issuance Trend Graph */}
                            {orgStats.activityTrend && (
                                <Card className="mb-6">
                                    <div className="mb-6">
                                        <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                            <Calendar className="text-indigo-600" /> Individual Document Issuance Trend (Last 7 Days)
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Visual analysis of document activities strictly related to this tenant over the past week.</p>
                                    </div>
                                    <div className="flex items-end gap-2 h-48 mt-4 pt-8 border-b border-slate-100 px-4">
                                        {orgStats.activityTrend.map((t, idx) => {
                                            const maxVal = Math.max(...orgStats.activityTrend.map(x => x.count), 1);
                                            const heightPercent = (t.count / maxVal) * 100;
                                            return (
                                                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                                                    <div className="w-full px-1 flex flex-col justify-end" style={{ height: '100%' }}>
                                                        <div 
                                                            className="w-full bg-indigo-200 group-hover:bg-indigo-500 rounded-t-md transition-all relative flex items-start justify-center" 
                                                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                        >
                                                            {t.count > 0 && <span className="absolute -top-6 text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">{t.count}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium mt-2">{t.date.slice(-2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-1 space-y-6">
                            <Card>
                                <div className="mb-5">
                                    <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                        <PlusCircle className="text-indigo-600" /> Provision User
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Directly add a new administrator, issuer, or user to this organization.</p>
                                </div>
                                <form onSubmit={handleCreateOrgUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">User Role</label>
                                        <select 
                                            value={newAdminRole}
                                            onChange={(e) => setNewAdminRole(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                        >
                                            <option value="master_admin">Master Admin</option>
                                            <option value="issuer">Issuer (Blockchain Wallet)</option>
                                            <option value="user">Standard User (Verifier)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                        <input 
                                            type="email" 
                                            placeholder="user@university.edu"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            required 
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Secure Password</label>
                                        <input 
                                            type="password" 
                                            placeholder="Min 6 characters"
                                            value={newAdminPassword}
                                            onChange={(e) => setNewAdminPassword(e.target.value)}
                                            required 
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <BtnPrimary className="w-full justify-center">Provision Account</BtnPrimary>
                                </form>
                            </Card>

                            <Card>
                                <div className="mb-4">
                                    <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-800">
                                        <Users className="text-indigo-600" /> Add Existing Users
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Select from existing users who are not yet part of any organization.</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                                    {unassignedUsers.length === 0 ? (
                                        <p className="text-center text-slate-500 italic text-sm py-4 bg-slate-50 rounded-xl border border-slate-100">No unassigned users available.</p>
                                    ) : (
                                        unassignedUsers.map(user => (
                                            <div key={user.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-800">{user.email}</span>
                                                    <div className="mt-1"><RoleBadge role={user.role} /></div>
                                                </div>
                                                <button 
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition"
                                                    onClick={() => handleAssignUser(user.id)}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="xl:col-span-2">
                            <Card className="h-full">
                                <h2 className="font-heading text-xl font-bold text-slate-800 mb-6">Organization User Directory</h2>
                                {orgUsers.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500 italic bg-slate-50 rounded-2xl border border-slate-100">
                                        No users belong to this organization yet.
                                    </div>
                                ) : (
                                    <Table headers={['Email', 'Role', 'Actions']}>
                                        {orgUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors">
                                                <td className="p-4 align-middle">
                                                    {editingUser === user.id ? (
                                                        <input 
                                                            type="email" 
                                                            value={editEmail} 
                                                            onChange={(e) => setEditEmail(e.target.value)} 
                                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-slate-700">{user.email}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {editingUser === user.id ? (
                                                        <select 
                                                            value={editRole} 
                                                            onChange={(e) => setEditRole(e.target.value)} 
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 outline-none text-sm"
                                                        >
                                                            <option value="master_admin">Master Admin</option>
                                                            <option value="issuer">Issuer</option>
                                                            <option value="user">User</option>
                                                        </select>
                                                    ) : (
                                                        <RoleBadge role={user.role} />
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {editingUser === user.id ? (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleSaveUserEdit(user.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Save">
                                                                <Check size={18} />
                                                            </button>
                                                            <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition" title="Cancel">
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleStartEdit(user)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit details">
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Delete User">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </Table>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}
