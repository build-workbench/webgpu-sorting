# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of WebGPU Sorting seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [INSERT SECURITY EMAIL].

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, code injection, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

After you submit a report, we will:

1. Confirm receipt of your vulnerability report within 48 hours
2. Provide an estimated timeline for a fix
3. Notify you when the vulnerability is fixed
4. Credit you in the release notes (unless you prefer to remain anonymous)

### Preferred Languages

We prefer all communications to be in English.

## Security Best Practices

When using this library, please follow these security best practices:

### WebGPU Security Considerations

1. **Input Validation**: Always validate input data before passing it to GPU sorting functions
2. **Buffer Sizes**: Be mindful of buffer sizes to prevent out-of-memory conditions
3. **Error Handling**: Properly handle GPU errors and device loss events
4. **Resource Cleanup**: Always call `destroy()` methods to release GPU resources

### Browser Security

1. **HTTPS**: WebGPU requires a secure context (HTTPS) in production
2. **CSP**: Configure Content Security Policy headers appropriately
3. **Origin Isolation**: Use Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers

## Acknowledgments

We would like to thank the following individuals for responsibly disclosing security issues:

- (No reports yet)

---

Thank you for helping keep WebGPU Sorting and its users safe!
