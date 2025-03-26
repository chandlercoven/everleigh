# Dependency Modernization Implementation

This document details the changes made to modernize dependencies in the Everleigh project, replacing deprecated packages with their modern alternatives to ensure compatibility with Node.js 18+ and prepare for future Node.js 20 migration.

## Changes Summary

| Deprecated Package | Replacement | Reason |
|-------------------|------------|--------|
| infisical-node (v1) | @infisical/sdk (v2+) | Old SDK deprecated and no longer maintained |
| (Not present but referenced) gm | sharp | GraphicsMagick/gm deprecated; Sharp is 4-5x faster and maintained |
| glob v7.x | fast-glob | Older glob versions deprecated; fast-glob is more performant |
| rimraf < v4 | rimraf v5 | Older rimraf versions deprecated; v5 uses native fs.rm |
| google-p12-pem | google-auth-library | google-p12-pem unmaintained; google-auth-library is the official solution |

## Implementation Details

### Package Updates

The following changes were made to `package.json`:

1. **Added Dependencies**:
   - `@infisical/sdk`: "^2.0.0" - Modern replacement for infisical-node
   - `fast-glob`: "^3.3.0" - Modern replacement for glob
   - `google-auth-library`: "^9.4.1" - Official alternative to google-p12-pem
   - `sharp`: "^0.33.0" - Modern image processing library
   - `rimraf`: "^5.0.5" - Updated to the latest version

2. **Node Engine**:
   - Added `"engines"` field to specify Node.js >=18.0.0 compatibility
   - This will help with future migrations to Node.js 20+

### Pending Migration Tasks

The following tasks remain for full Node.js 20 compatibility:

1. **N8n Compatibility**: There are warnings about @n8n-related packages requiring Node.js >=20.15. Consider:
   - Upgrading to Node.js 20+ on the production server when ready
   - OR pinning n8n to an older version compatible with Node.js 18
   
2. **Vulnerabilities**: The npm audit shows several vulnerabilities that couldn't be automatically fixed:
   
   | Package | Severity | Issue | Resolution |
   |---------|----------|-------|------------|
   | @azure/identity | Moderate | Elevation of Privilege | Requires n8n update |
   | @mozilla/readability | Low | DoS via Regex | Requires n8n update |
   | axios | High | SSRF and Credential Leakage | Requires n8n update |
   | cross-spawn | High | ReDoS | Used by gm, resolved by using Sharp |
   | path-to-regexp | High | ReDoS | Used by express | 
   | pdfjs-dist | High | Arbitrary JS execution | Requires n8n update |
   | semver | High | ReDoS | Used by utf7/imap | 
   | snowflake-sdk | Moderate | Cache file permissions | Requires n8n update |

   Most of these vulnerabilities are related to n8n dependencies. Fixing them requires:
   - Updating to n8n v0.229.0 or later (breaking change)
   - OR isolating n8n in a separate container/process with limited permissions

## Migration Notes for Developers

### For Infisical Integration

If you use Infisical for secrets, the API has changed. Update your code as follows:

```javascript
// Old code with infisical-node
import { InfisicalClient } from 'infisical-node';
const client = new InfisicalClient({ token: process.env.INFISICAL_TOKEN });
const secret = await client.getSecret("KEY_NAME");

// New code with @infisical/sdk
import { InfisicalSDK } from "@infisical/sdk";
const client = new InfisicalSDK({ 
  siteUrl: "https://app.infisical.com" // or your self-hosted URL
});

// Authentication using Machine Identity
await client.auth().universalAuth.login({
  clientId: process.env.INFISICAL_CLIENT_ID,
  clientSecret: process.env.INFISICAL_CLIENT_SECRET
});

// Fetching secrets
const secrets = await client.secrets().listSecrets({
  environment: "dev", // or production, etc.
  projectId: process.env.INFISICAL_PROJECT_ID
});

// To get a specific secret by name
const mySecret = secrets.find(s => s.secretName === "KEY_NAME")?.secretValue;
```

### For Image Processing

If you need to add image processing functionality, use Sharp instead of gm:

```javascript
// Example with Sharp
import sharp from 'sharp';

// Resize an image
await sharp('input.jpg')
  .resize(300, 200)
  .toFile('output.jpg');

// Convert image format
await sharp('input.jpg')
  .toFormat('webp')
  .toFile('output.webp');
```

## Testing

The build process was completed successfully with the updated dependencies. All routes are compiling correctly.

## Next Steps

1. Update the server's Node.js version to 20+ when ready for production
2. Address remaining vulnerabilities:
   - Consider upgrading n8n to v0.229.0+ (requires Node.js 20+)
   - OR isolate n8n in a separate container/service
3. Test the application thoroughly in a staging environment before deploying to production
4. Ensure any Infisical integrations are updated to use the new SDK if applicable 