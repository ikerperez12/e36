# Security Policy

This is a static public web project with two small Vercel Functions:

- `GET /api/health`
- `POST /api/track`

The telemetry endpoint is anonymous, same-origin only, rate-limited, and stores no personal data by default.

## Reporting

If you find a security issue, please open a private security advisory on GitHub or contact the repository owner through GitHub.

Do not include credentials, personal data, or exploit details in public issues.

## Scope

In scope:

- Public web assets in this repository.
- Vercel Function request validation and headers.
- Accidental exposure of local-only files or credentials.

Out of scope:

- Third-party brand ownership.
- Generated media provenance.
- Browser or Vercel platform vulnerabilities.
