# Authentication

The HLA-Compass SDK requires authentication to interact with the platform API (uploading modules, querying data, etc.).

## Browser-Based SSO (Default)

The easiest way to log in is using the browser-based Single Sign-On (SSO).

```bash
hla-compass auth login --env dev
```

**How it works:**
1.  The CLI starts a local web server.
2.  It opens your default browser to the HLA-Compass login page.
3.  You log in with your credentials (or via your organization's IdP).
4.  The browser redirects back to your local CLI with a secure token.
5.  The CLI stores credentials in your system keyring when available. If keyring is unavailable, it falls back to an encrypted file at the SDK config directory (default `~/.hla-compass/credentials.json`) with the encryption key in `credentials.key` or `HLA_COMPASS_CREDENTIAL_KEY`.

## Non-browser login (automation)

If you are on a headless machine or need automation, you can authenticate without opening a browser:

```bash
hla-compass auth login --env dev --email you@example.com --password-stdin
```

This reads the password from stdin (avoids leaking it into shell history).

## Environment Variables (CI/CD)

For automated environments (CI/CD pipelines) where interactive login is not possible, use environment variables.

1.  **Generate a Token or API Key:** Log in locally, then export your token (or generate a long-lived API key from the UI).
2.  **Set Variables:**

```bash
export HLA_COMPASS_ENV=prod
export HLA_ACCESS_TOKEN=your_jwt_token_here
# or
export HLA_API_KEY=your_api_key_here
```

When these variables are present, the SDK will use them automatically without requiring `hla-compass auth login`.

> **Config directory override:** Set `HLA_COMPASS_CONFIG_DIR` to move the SDK config/credential files (must be absolute or within your home/current/temp directory).

## Managing Credentials

### Check Status

Verify your current login status:

```bash
hla-compass auth status
```

### Logout

Remove stored credentials:

```bash
hla-compass auth logout
```

### Switch Organization

If your user belongs to multiple organizations, you can switch the active context:

```bash
hla-compass auth use-org <org-id>
```

---

## Next Steps

- [Getting Started](getting-started.md) - Complete workflow guide
- [CLI Reference](../reference/cli.md) - All authentication commands
- [CI/CD Recipes](ci-cd.md) - Automated authentication for pipelines
