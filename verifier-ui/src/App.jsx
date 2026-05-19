import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import config from './config.json';

// Import Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import UserDashboard from './components/UserDashboard';
import Profile from './components/Profile';
import SuperAdminDashboard from './components/SuperAdminDashboard';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);
  const [isSessionRestoring, setIsSessionRestoring] = useState(true);
  
  // Custom Modal States
  const [modalConfig, setModalConfig] = useState(null);

  const showModal = (title, message, showConfirmBtn = false) => {
    return new Promise((resolve) => {
      setModalConfig({
        title,
        message,
        showConfirmBtn,
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        }
      });
    });
  };
  
  // Safe UI Loading States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Login States
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState('');
  const [hardhatKey, setHardhatKey] = useState(() => localStorage.getItem('hardhatKey') || '');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  // Admin States
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('issuer');
  const [usersList, setUsersList] = useState([]);
  
  // Issuer States
  const [credentialText, setCredentialText] = useState('');
  const [contractAddress, setContractAddress] = useState(config.contractAddress || '');
  const [file, setFile] = useState(null);
  const [revokeCredentialId, setRevokeCredentialId] = useState('');
  const [issuedDocuments, setIssuedDocuments] = useState([]);
  
  // Verify States
  const [verifyCredentialText, setVerifyCredentialText] = useState('');
  const [verifyContractAddress, setVerifyContractAddress] = useState(config.contractAddress || '');
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState('');

  // Verifier / Normal User States
  const [myDocuments, setMyDocuments] = useState([]);

  // Hoisted API fetchers to avoid ReferenceErrors during startup useEffect execution
  const fetchUsers = async (adminToken) => {
      try {
          const res = await fetch(`http://localhost:3000/api/users?masterAdminToken=${adminToken}`);
          const data = await res.json();
          if (data.users) setUsersList(data.users);
      } catch (err) {
          console.error("Failed to fetch users", err);
      }
  };

  const fetchMyDocuments = async (userToken) => {
      try {
          const res = await fetch(`http://localhost:3000/api/my-documents?token=${userToken}`);
          const data = await res.json();
          if (data.documents) setMyDocuments(data.documents);
      } catch (err) {
          console.error("Failed to fetch documents", err);
      }
  };

  const fetchIssuedDocuments = async (userToken) => {
      try {
          const res = await fetch(`http://localhost:3000/api/issued-documents?token=${userToken}`);
          const data = await res.json();
          if (data.documents) setIssuedDocuments(data.documents);
      } catch (err) {
          console.error("Failed to fetch issued documents", err);
      }
  };

  // Recover persistent session on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (savedToken && savedRole) {
      // Immediately pre-fetch cached list data to avoid screen blankness
      if (savedRole === 'master_admin') {
        fetchUsers(savedToken);
      } else if (savedRole === 'issuer') {
        fetchIssuedDocuments(savedToken);
      } else if (savedRole === 'normal_user') {
        fetchMyDocuments(savedToken);
      }

      // Background validate the session silently
      fetch('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedToken })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          // Token expired or invalid, clear localStorage and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('email');
          localStorage.removeItem('hardhatKey');
          setToken(null);
          setRole(null);
          setIsSessionRestoring(false);
          navigate('/login');
        } else {
          setToken(savedToken);
          setRole(data.role);
          setEmail(data.email);
          localStorage.setItem('role', data.role);
          localStorage.setItem('email', data.email);
          if (data.hardhatKey) {
            setHardhatKey(data.hardhatKey);
            localStorage.setItem('hardhatKey', data.hardhatKey);
          }
          setIsSessionRestoring(false);
        }
      })
      .catch(err => {
        console.error("Session background validation failed", err);
        // Do not force log out on server network issues to support local stability
        setIsSessionRestoring(false);
      });
    } else {
      setIsSessionRestoring(false);
    }
  }, []);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const endpoint = isFirstLogin ? '/api/auth/first_login' : '/api/auth/login';
      const payload = { email, password };
      if (isFirstLogin) payload.hardhat_key = hardhatKey;
      
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        await showModal("Access Denied", data.error);
        return;
      }
      
      setToken(data.token);
      setRole(data.role);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', email);
      
      if (data.hardhatKey) {
         setHardhatKey(data.hardhatKey);
         localStorage.setItem('hardhatKey', data.hardhatKey);
      }
      
      if (data.role === 'super_admin') {
          navigate('/super-admin');
      }
      else if (data.role === 'master_admin') {
          navigate('/admin');
          fetchUsers(data.token);
      }
      else if (data.role === 'issuer') {
          navigate('/issuer');
          fetchIssuedDocuments(data.token);
      }
      else {
          navigate('/verifier');
          fetchMyDocuments(data.token);
      }
      
    } catch (err) {
      await showModal("Connection Failed", "Unable to establish secure connection with verification gateway.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('hardhatKey');
    setToken(null);
    setRole(null);
    navigate('/login');
    // Clear sensitive states
    setEmail('');
    setPassword('');
    setHardhatKey('');
  };

  const handleDeleteUser = async (userId) => {
      const confirmed = await showModal("Verify Action", "Are you sure you want to permanently delete this user directory record?", true);
      if (!confirmed) return;
      try {
          const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ masterAdminToken: token })
          });
          const data = await res.json();
          if (data.error) await showModal("System Alert", data.error);
          else {
              await showModal("Success", data.message);
              fetchUsers(token);
          }
      } catch (err) {
          await showModal("System Error", "Failed to delete user directory record.");
      }
  };

  const handleChangePassword = async (userId) => {
      const newPwd = window.prompt('Enter new password for this user (at least 6 characters):');
      if (!newPwd) return;
      try {
          const res = await fetch(`http://localhost:3000/api/users/${userId}/password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ masterAdminToken: token, newPassword: newPwd })
          });
          const data = await res.json();
          if (data.error) await showModal("System Alert", data.error);
          else await showModal("Success", data.message);
      } catch(err) {
          await showModal("System Error", "Failed to update user security password.");
      }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterAdminToken: token,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (data.error) {
          await showModal("Directory Alert", data.error);
      } else {
          if (data.credentials) {
              await showModal("Credentials Provisioned", `USER CREATED!\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}\nHardhat Key: ${data.credentials.hardhat_key}\n\nPlease copy these securely.`);
              fetchUsers(token);
          } else {
              await showModal("Directory Status", data.message);
          }
      }
    } catch (err) {
      await showModal("System Error", "Failed to register operator credentials.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!file) {
      await showModal("Selection Required", "Please select a PDF document to mint on the blockchain.");
      return;
    }
    setIsIssuing(true);
    try {
      const formData = new FormData();
      formData.append('credentialText', credentialText);
      formData.append('contractAddress', contractAddress);
      formData.append('issuerToken', token);
      formData.append('document', file);
      formData.append('hardhatKey', hardhatKey);

      const res = await fetch('http://localhost:3000/api/issue', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) await showModal("Minting Alert", data.error);
      else {
          await showModal("Credential Minted", `Document successfully issued! TX Hash: ${data.transactionHash}`);
          fetchIssuedDocuments(token);
      }
    } catch (err) {
      await showModal("Minting Error", "An error occurred while writing to the blockchain ledger.");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRevoke = async (e, directCredentialId = null) => {
    if (e) e.preventDefault();
    const idToRevoke = directCredentialId || revokeCredentialId;
    if (!idToRevoke) {
      await showModal("Selection Required", "Please enter or select a credential ID to revoke.");
      return;
    }
    const confirmed = await showModal("Verify Action", "Are you sure you want to permanently revoke this document? This operation cannot be undone.", true);
    if (!confirmed) return;
    setIsRevoking(true);
    try {
      const res = await fetch('http://localhost:3000/api/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: idToRevoke,
          contractAddress: contractAddress,
          issuerToken: token,
          hardhatKey: hardhatKey
        })
      });
      const data = await res.json();
      if (data.error) await showModal("Revocation Alert", data.error);
      else {
          await showModal("Credential Revoked", `Document revoked successfully! TX Hash: ${data.transactionHash}`);
          setRevokeCredentialId('');
          fetchIssuedDocuments(token);
      }
    } catch (err) {
      await showModal("Revocation Error", "An error occurred during transaction processing on the ledger.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyFile) {
      await showModal("Selection Required", "Please select a PDF document to verify against the blockchain registry.");
      return;
    }
    setIsVerifying(true);
    try {
      setVerifyResult("Verifying...");
      const formData = new FormData();
      formData.append('credentialText', verifyCredentialText);
      formData.append('contractAddress', verifyContractAddress);
      formData.append('document', verifyFile);

      const res = await fetch('http://localhost:3000/api/verify', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) {
         setVerifyResult("Error: " + data.error);
      } else {
         if (data.verified) {
             setVerifyResult(`✅ VERIFIED! Authentic document issued by ${data.issuer} on ${data.issuedAt}`);
         } else {
             setVerifyResult(`❌ FAILED: ${data.message}`);
         }
      }
    } catch (err) {
      setVerifyResult("Error verifying document");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isSessionRestoring) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid #334155', borderTop: '5px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Securing Session...</h3>
        <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Connecting to blockchain verification gateway</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate to={token ? `/${role === 'super_admin' ? 'super-admin' : role === 'master_admin' ? 'admin' : role === 'issuer' ? 'issuer' : 'verifier'}` : "/login"} />} />
        
        <Route path="/login" element={
          token ? (
            <Navigate to={role === 'super_admin' ? '/super-admin' : role === 'master_admin' ? '/admin' : role === 'issuer' ? '/issuer' : '/verifier'} replace />
          ) : (
            <Login 
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              isFirstLogin={isFirstLogin} setIsFirstLogin={setIsFirstLogin}
              hardhatKey={hardhatKey} setHardhatKey={setHardhatKey}
              handleLogin={handleLogin}
              isLoggingIn={isLoggingIn}
            />
          )
        } />

        <Route path="/super-admin" element={
          role === 'super_admin' ? (
            <SuperAdminDashboard token={token} handleLogout={handleLogout} showModal={showModal} />
          ) : <Navigate to="/login" />
        } />

        <Route path="/admin" element={
          role === 'master_admin' ? (
            <AdminDashboard 
              newEmail={newEmail} setNewEmail={setNewEmail}
              newPassword={newPassword} setNewPassword={setNewPassword}
              newRole={newRole} setNewRole={setNewRole}
              usersList={usersList}
              handleCreateUser={handleCreateUser}
              handleChangePassword={handleChangePassword}
              handleDeleteUser={handleDeleteUser}
              handleLogout={handleLogout}
              token={token}
              isCreatingUser={isCreatingUser}
              fetchUsers={fetchUsers}
              showModal={showModal}
            />
          ) : <Navigate to="/login" />
        } />

        <Route path="/issuer" element={
          role === 'issuer' ? (
            <IssuerDashboard 
              contractAddress={contractAddress} setContractAddress={setContractAddress}
              credentialText={credentialText} setCredentialText={setCredentialText}
              file={file} setFile={setFile}
              revokeCredentialId={revokeCredentialId} setRevokeCredentialId={setRevokeCredentialId}
              issuedDocuments={issuedDocuments}
              handleIssue={handleIssue}
              handleRevoke={handleRevoke}
              verifyContractAddress={verifyContractAddress} setVerifyContractAddress={setVerifyContractAddress}
              verifyCredentialText={verifyCredentialText} setVerifyCredentialText={setVerifyCredentialText}
              verifyFile={verifyFile} setVerifyFile={setVerifyFile}
              handleVerify={handleVerify}
              verifyResult={verifyResult}
              handleLogout={handleLogout}
              hardhatKey={hardhatKey}
              setHardhatKey={setHardhatKey}
              isIssuing={isIssuing}
              isVerifying={isVerifying}
              isRevoking={isRevoking}
              token={token}
              fetchIssuedDocuments={fetchIssuedDocuments}
              showModal={showModal}
            />
          ) : <Navigate to="/login" />
        } />

        <Route path="/verifier" element={
          role === 'normal_user' ? (
            <UserDashboard 
              myDocuments={myDocuments}
              verifyContractAddress={verifyContractAddress} setVerifyContractAddress={setVerifyContractAddress}
              verifyCredentialText={verifyCredentialText} setVerifyCredentialText={setVerifyCredentialText}
              verifyFile={verifyFile} setVerifyFile={setVerifyFile}
              handleVerify={handleVerify}
              verifyResult={verifyResult}
              handleLogout={handleLogout}
              isVerifying={isVerifying}
              token={token}
              fetchMyDocuments={fetchMyDocuments}
              showModal={showModal}
            />
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile" element={
          token ? (
            <Profile 
              email={email} 
              role={role} 
              issuedDocuments={issuedDocuments} 
              myDocuments={myDocuments} 
              handleLogout={handleLogout} 
              handleRevoke={handleRevoke}
              hardhatKey={hardhatKey}
              setHardhatKey={setHardhatKey}
              token={token}
              isRevoking={isRevoking}
            />
          ) : <Navigate to="/login" />
        } />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {modalConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5
                        bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md glass border border-slate-200 rounded-2xl shadow-2xl p-7
                          flex flex-col gap-5 animate-pop-in">
            <div className="flex items-center gap-3">
              <Shield size={22} className="text-indigo-600 shrink-0" />
              <h3 className="font-heading text-lg font-bold text-slate-900">{modalConfig.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-all">
              {modalConfig.message}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              {modalConfig.showConfirmBtn ? (
                <>
                  <button onClick={modalConfig.onCancel}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600
                               text-sm font-semibold hover:bg-slate-100 transition">
                    Cancel
                  </button>
                  <button onClick={modalConfig.onConfirm}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700
                               text-white text-sm font-semibold transition">
                    Confirm
                  </button>
                </>
              ) : (
                <button onClick={modalConfig.onConfirm}
                  className="px-5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50
                             text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition">
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
