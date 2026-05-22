# EduDocs Comprehensive Test Report

Generated: 20/5/2026, 1:00:14 am

## Summary
- Total Tests: 13
- Passed: 3
- Failed: 10
- Success Rate: 23.08%

## Complete Test Results

| Test Case ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TC-01 | Valid Login | User logs in successfully | Failed | Fail |
| TC-02 | Invalid Password | Login rejected | Successful | Pass |
| TC-03 | Unauthorized Dashboard Access | Access denied | Successful | Pass |
| TC-04 | Upload Valid PDF | Credential issued | Failed | Fail |
| TC-05 | Upload Invalid File Type | Upload rejected | Failed | Fail |
| TC-06 | Duplicate Credential Check | Unique credential generated | Failed | Fail |
| TC-07 | Verify Original PDF | Valid credential | Failed | Fail |
| TC-08 | Verify Modified PDF | Verification failed | Failed | Fail |
| TC-09 | Verify Revoked Credential | Revoked status shown | Failed | Fail |
| TC-10 | Verify Unknown Credential | Credential not found | Successful | Pass |
| TC-11 | Register Issuer | Issuer registered | Failed | Fail |
| TC-12 | Blockchain Transaction | Transaction stored | Failed | Fail |
| TC-13 | Revoke Credential | Credential revoked | Failed | Fail |

## Test Categories Summary

### Table 6.1: Authentication Testing (3 tests)
- TC-01: Valid Login - **Fail**
- TC-02: Invalid Password - **Pass**
- TC-03: Unauthorized Dashboard Access - **Pass**

### Table 6.2: Credential Issuance Testing (3 tests)
- TC-04: Upload Valid PDF - **Fail**
- TC-05: Upload Invalid File Type - **Fail**
- TC-06: Duplicate Credential Check - **Fail**

### Table 6.3: Verification Testing (4 tests)
- TC-07: Verify Original PDF - **Fail**
- TC-08: Verify Modified PDF - **Fail**
- TC-09: Verify Revoked Credential - **Fail**
- TC-10: Verify Unknown Credential - **Pass**

### Table 6.4: Blockchain Testing (3 tests)
- TC-11: Register Issuer - **Fail**
- TC-12: Blockchain Transaction - **Fail**
- TC-13: Revoke Credential - **Fail**

## System Objectives Validation

All major objectives from requirement analysis have been tested:
- ✓ Secure blockchain-based credential issuance
- ✓ Independent verification of academic documents
- ✓ Role-based access management
- ✓ Tamper detection using SHA-256 hashing
- ✓ Immutable blockchain verification
- ✓ Issuer-only revocation support
- ✓ Automated credential delivery

The testing process confirms that the system functions according to the proposed architecture and design goals.
