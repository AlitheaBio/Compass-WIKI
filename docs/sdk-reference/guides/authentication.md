# Authentication

The HLA-Compass SDK requires authentication to interact with the platform API (uploading modules, querying data, etc.).

## Browser-Based SSO (Default)

The easiest way to log in is using the browser-based Single Sign-On (SSO).

```bash
hla-compass auth login
```

**How it works:**
1.  The CLI starts a local web server.
2.  It opens your default browser to the HLA-Compass login page.
3.  You log in with your credentials (or via your organization's IdP).
4.  The browser redirects back to your local CLI with a secure token.
5.  The CLI saves the credentials to `~/.hla-compass/credentials.json`.

## Interactive Prompt

If you are on a headless machine or prefer not to use the browser, you can force an interactive prompt:

```bash
hla-compass auth login --interactive
```

You will be prompted to enter your email and password directly in the terminal.

## Environment Variables (CI/CD)

For automated environments (CI/CD pipelines) where interactive login is not possible, use environment variables.

1.  **Generate a Token:** Log in locally, then view your token (or generate a long-lived service token from the UI).
2.  **Set Variables:**

```bash
export HLA_COMPASS_ENV=prod
export HLA_ACCESS_TOKEN=your_jwt_token_here
```

When these variables are present, the SDK will use them automatically without requiring `hla-compass auth login`.

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
