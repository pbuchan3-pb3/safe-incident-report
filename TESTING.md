[tests_package.json](https://github.com/user-attachments/files/29523874/tests_package.json)
{
  "name": "safe-incident-report-tests",
  "version": "1.0.0",
  "description": "Automated regression suite for the S.A.F.E. Incident Report application",
  "scripts": {
    "test": "node safe_regression_suite.js",
    "test:verbose": "node safe_regression_suite.js 2>&1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
