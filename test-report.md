# EduDocs Comprehensive Test Report

Generated: 20/5/2026, 12:57:21 am

## Summary
- Total Tests: 13
- Passed: 6
- Failed: 7
- Success Rate: 46.15%

## Complete Test Results

| Test Case ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TC-01 | Valid Login | Successful | User logged in successfully with valid credentials | Pass |
| TC-02 | Invalid Password | Login rejected | Login correctly rejected with invalid password | Pass |
| TC-03 | Unauthorized Dashboard Access | Access denied | Access correctly denied without proper token | Pass |
| TC-04 | Upload Valid PDF | Successful | Unexpected token 'N', "Not Found" is not valid JSON | Fail |
| TC-05 | Upload Invalid File Type | Upload rejected | Upload correctly rejected for invalid file type | Pass |
| TC-06 | Duplicate Credential Check | Successful | No credential hash available from previous test | Fail |
| TC-07 | Verify Original PDF | Successful | No credential hash available | Fail |
| TC-08 | Verify Modified PDF | Verification failed | Modified PDF correctly failed verification | Pass |
| TC-09 | Verify Revoked Credential | Successful | Missing prerequisites for revocation test | Fail |
| TC-10 | Verify Unknown Credential | Credential not found | Unknown credential correctly not found | Pass |
| TC-11 | Register Issuer | Successful | No issuer token available | Fail |
| TC-12 | Blockchain Transaction | Successful | No transaction hash available | Fail |
| TC-13 | Revoke Credential | Successful | Missing prerequisites for revocation | Fail |