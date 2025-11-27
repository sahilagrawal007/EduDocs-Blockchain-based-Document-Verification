// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Certificates {
    address public owner;

    struct Cert {
        address issuer;
        bytes32 docHash; // SHA-256 or keccak256 of the document
        uint256 issuedAt;
        bool revoked;
    }

    // credentialId => Cert
    mapping(bytes32 => Cert) public certificates;

    // issuer address => registered
    mapping(address => bool) public registeredIssuer;

    event IssuerRegistered(address issuer, uint256 at);
    event CertificateIssued(bytes32 credentialId, address issuer, bytes32 docHash, uint256 at);
    event CertificateRevoked(bytes32 credentialId, address issuer, uint256 at);

    constructor() {
        owner = msg.sender;
    }

    // Any address can register itself as issuer
    function registerIssuer() external {
        require(!registeredIssuer[msg.sender], "already registered");
        registeredIssuer[msg.sender] = true;
        emit IssuerRegistered(msg.sender, block.timestamp);
    }

    // Only registered issuers can issue
    function issueCertificate(bytes32 credentialId, bytes32 docHash) external {
        require(registeredIssuer[msg.sender], "not a registered issuer");
        require(certificates[credentialId].issuedAt == 0, "credentialId already used");

        certificates[credentialId] = Cert({
            issuer: msg.sender,
            docHash: docHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CertificateIssued(credentialId, msg.sender, docHash, block.timestamp);
    }

    function revokeCertificate(bytes32 credentialId) external {
        Cert storage c = certificates[credentialId];
        require(c.issuedAt != 0, "not issued");
        require(c.issuer == msg.sender, "only issuer can revoke");
        require(!c.revoked, "already revoked");

        c.revoked = true;
        emit CertificateRevoked(credentialId, msg.sender, block.timestamp);
    }
}
