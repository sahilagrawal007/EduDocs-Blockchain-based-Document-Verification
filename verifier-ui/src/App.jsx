import React, { useState } from "react";
import { ethers } from "ethers";
import "./styles.css";

/*
  NOTE: I kept the core logic unchanged:
  - credentialId is keccak256 of the credential text
  - docHash is SHA-256 of the uploaded PDF (computed in browser)
  - contract call reads certificates(credentialId)
  - comparison and result structure kept the same
*/

async function sha256File(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

function SmallSpinner() {
  return (
    <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
      <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
    </svg>
  );
}

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [credentialText, setCredentialText] = useState("");
  const [contractAddr, setContractAddr] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function verify() {
    setResult(null);
    setMessage("");
    if (!pdfFile || !credentialText.trim() || !contractAddr.trim()) {
      setMessage("Please provide contract address, credential text and a PDF file.");
      return;
    }

    setLoading(true);
    try {
      // compute credentialId same as issuer: keccak256 of text
      const credentialId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialText.trim()));
      // compute file sha256
      const docHash = await sha256File(pdfFile);

      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

      const abi = [
        "function certificates(bytes32) view returns (address issuer, bytes32 docHash, uint256 issuedAt, bool revoked)"
      ];

      const contract = new ethers.Contract(contractAddr.trim(), abi, provider);

      const cert = await contract.certificates(credentialId);

      const onChainDocHash = cert.docHash;
      const issuer = cert.issuer;
      const issuedAt = cert.issuedAt.toNumber ? cert.issuedAt.toNumber() : Number(cert.issuedAt);
      const revoked = cert.revoked;

      const match = (String(onChainDocHash).toLowerCase() === String(docHash).toLowerCase());

      setResult({
        ok: match && issuer !== ethers.constants.AddressZero && !revoked,
        match,
        onChainDocHash,
        docHash,
        issuer,
        issuedAt,
        revoked
      });
    } catch (err) {
      console.error(err);
      setMessage("Verification error: " + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e) {
    setResult(null);
    setMessage("");
    const f = e.target.files && e.target.files[0];
    setPdfFile(f || null);
  }

  function clearForm() {
    setPdfFile(null);
    setCredentialText("");
    setResult(null);
    setMessage("");
  }

  return (
    <div className="page-root">
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="brand">EduDocs Verifier</h1>
          <p className="tagline">Verify student certificates quickly and securely</p>
        </div>
      </header>

      <main className="main-container">
        <section className="card">
          <div className="card-grid">
            <div className="left">
              <h2 className="card-title">Certificate Verification</h2>
              <p className="hint">
                Provide the contract address, the credential identifier text (exactly what the issuer used), and upload the PDF to verify authenticity.
              </p>

              <label className="field">
                <span className="label">Contract address</span>
                <input
                  className="input"
                  value={contractAddr}
                  onChange={(e) => setContractAddr(e.target.value)}
                  placeholder="0x..."
                  aria-label="Contract address"
                />
              </label>

              <label className="field">
                <span className="label">Credential text</span>
                <input
                  className="input"
                  value={credentialText}
                  onChange={(e) => setCredentialText(e.target.value)}
                  placeholder='e.g. "UNI2025-0001"'
                  aria-label="Credential text"
                />
              </label>

              <div className="field file-field">
                <span className="label">Upload PDF</span>
                <div className="file-row">
                  <label className="file-button">
                    <input accept="application/pdf" type="file" onChange={onFileChange} />
                    Choose file
                  </label>
                  <div className="file-name">{pdfFile ? pdfFile.name : "No file chosen"}</div>
                </div>
              </div>

              <div className="actions">
                <button className="btn primary" onClick={verify} disabled={loading}>
                  {loading ? <><SmallSpinner/> Verifying...</> : "Verify Certificate"}
                </button>
                <button className="btn outline" onClick={clearForm} disabled={loading}>Clear</button>
              </div>

              {message && <div className="note error">{message}</div>}
            </div>

            <div className="right">
              <div className="result-box">
                <h3 className="result-title">Result</h3>

                {!result && !message && (
                  <div className="result-empty">
                    <p>Result will appear here after verification.</p>
                  </div>
                )}

                {result && (
                  <>
                    <div className={`status ${result.ok ? "ok" : "fail"}`}>
                      {result.ok ? "Certificate VERIFIED" : "NOT VERIFIED"}
                    </div>

                    <div className="meta">
                      <div className="meta-row">
                        <div className="meta-label">Issuer</div>
                        <div className="meta-value mono">{result.issuer}</div>
                      </div>

                      <div className="meta-row">
                        <div className="meta-label">Issued at</div>
                        <div className="meta-value">
                          {result.issuedAt ? new Date(result.issuedAt * 1000).toLocaleString() : "N/A"}
                        </div>
                      </div>

                      <div className="meta-row">
                        <div className="meta-label">Revoked</div>
                        <div className="meta-value">{result.revoked ? "Yes" : "No"}</div>
                      </div>

                      <div className="meta-row">
                        <div className="meta-label">On-chain docHash</div>
                        <div className="meta-value mono small">{String(result.onChainDocHash)}</div>
                      </div>

                      <div className="meta-row">
                        <div className="meta-label">Computed PDF hash</div>
                        <div className="meta-value mono small">{String(result.docHash)}</div>
                      </div>
                    </div>
                  </>
                )}

                {message && <div className="note error">{message}</div>}
              </div>

              <div className="help">
                <h4>Tips</h4>
                <ul>
                  <li>Make sure the credential text exactly matches the issuer input.</li>
                  <li>Use the same PDF file bytes. Re-saving the PDF may change the hash.</li>
                  <li>If the UI cannot connect, ensure the Hardhat node is running at 127.0.0.1:8545.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div>Built for demonstration. Do not use private keys on mainnet.</div>
        </footer>
      </main>
    </div>
  );
}
