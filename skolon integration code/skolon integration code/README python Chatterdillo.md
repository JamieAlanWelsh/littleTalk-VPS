# My Integration - Skolon Marketplace Integration

## Overview

This integration connects **My Integration** with the Skolon education platform.

## Features

This integration implements the following capabilities:

- **Authentication:** OAuth 2.0 client_credentials flow
- **User Mapping:** Maps users via external_id
- **Roster Sync:** Real-time webhook updates
- **License Management:** Automatically trusts and activates platform licenses

## Skolon API Environments

This integration supports both test and production environments:

| Environment | IDP URL | API Base URL |
|-------------|---------|--------------|
| **Test** | https://idp-test.skolon.com | https://api-test.skolon.com |
| **Production** | https://idp.skolon.com | https://api.skolon.com |

The environment is controlled by the `SKOLON_ENV` environment variable (default: `test`).

## API Endpoints Used

The integration uses these Skolon API endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /v2/partner/user` | Fetch users |
| `GET /v2/partner/school` | Fetch schools |
| `GET /v2/partner/organization` | Fetch organizations |
| `GET /v2/partner/group` | Fetch groups |
| `GET /v2/partner/license` | Fetch licenses |
| `GET /v2/partner/user/session` | Get current user session |

## Prerequisites

- Python 3.7 or higher
- Skolon API credentials (Client ID and Client Secret)
- Network access to Skolon API endpoints

## Installation

### 1. Install Dependencies

```bash
pip install requests
```

### 2. Configure Environment Variables

You need to set your Skolon API credentials as environment variables.

```bash
# Required credentials
export SKOLON_CLIENT_ID="your_client_id_here"
export SKOLON_CLIENT_SECRET="your_client_secret_here"

# Optional: Set environment (default is 'test')
export SKOLON_ENV="test"  # or "production"
```

Or create a `.env` file:
```
SKOLON_CLIENT_ID=your_client_id_here
SKOLON_CLIENT_SECRET=your_client_secret_here
SKOLON_ENV=test
```

Then use a package like `python-dotenv`:
```bash
pip install python-dotenv
```

And add to the top of your script:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Usage

### Running the Integration

```bash
# Test environment (default)
python skolon_integration.py

# Production environment
SKOLON_ENV=production python skolon_integration.py
```

### What It Does

The integration performs the following steps:

1. **Authenticates** with the Skolon IDP using OAuth 2.0 client_credentials flow
2. **Fetches Schools** from `/v2/partner/school` endpoint
3. **Fetches Users** (students and teachers) from `/v2/partner/user` endpoint
4. **Fetches Groups** from `/v2/partner/group` endpoint
5. **Fetches Licenses** from `/v2/partner/license` endpoint
6. **Processes and Maps Data** based on your configuration

### Output

The script will output detailed logs showing:

- Environment and configuration
- Authentication status
- Number of schools, users, groups, and licenses fetched
- Sync summary

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SKOLON_CLIENT_ID` | Yes | - | Your Skolon OAuth client ID |
| `SKOLON_CLIENT_SECRET` | Yes | - | Your Skolon OAuth client secret |
| `SKOLON_ENV` | No | `test` | Environment: `test` or `production` |

### Integration Settings (Code Constants)

- `OAUTH_TYPE`: OAuth flow type (`client_credentials`)
- `USER_MAPPING`: User mapping field (`external_id`)
- `TRUST_PLATFORM_LICENSES`: Whether to auto-activate licenses (`true`)

## Integration Details

### OAuth Flow

This integration uses the **client_credentials** OAuth 2.0 flow:

- Server-to-server authentication
- No user interaction required
- Access token is cached and automatically refreshed when expired
- Token endpoint: `/oauth/access_token`

### User Mapping Strategy

Users are mapped using the **external_id** field:

- Each user is identified by an external ID
- Suitable for systems with existing user IDs

### Roster Synchronization

The integration supports these roster sync methods:

- **Real-time Webhook:** Changes are pushed immediately via webhooks

### License Management

**Automatic License Activation**

This integration trusts licenses from the Skolon platform and automatically activates them for users. When a license is found for a user, it is immediately available for use.

## Switching to Production

When you're ready to go live:

1. **Get Production Credentials**
   - Contact Skolon to obtain production CLIENT_ID and CLIENT_SECRET

2. **Update Environment Variable**
   ```bash
   export SKOLON_ENV="production"
   ```

3. **Use Production Credentials**
   ```bash
   export SKOLON_CLIENT_ID="your_production_client_id"
   export SKOLON_CLIENT_SECRET="your_production_client_secret"
   ```

4. **Verify Configuration**
   - The script will log the environment and API URL on startup
   - Ensure it shows "PRODUCTION mode" and "https://api.skolon.com"

## Production Checklist

Before deploying to production:

- [ ] Obtained production API credentials from Skolon
- [ ] Implemented database storage for users, schools, groups, and licenses
- [ ] Set up error monitoring and alerting
- [ ] Implemented retry logic for transient failures
- [ ] Configured appropriate logging
- [ ] Set up scheduled sync jobs (if using scheduled synchronization)
- [ ] Tested with production credentials in a staging environment
- [ ] Reviewed rate limiting and added appropriate delays if needed

## Error Handling

The integration handles these common errors:

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 401 | Authentication failed | Check credentials, token may have expired |
| 403 | Access denied | Check API permissions |
| 404 | Endpoint not found | Verify API endpoint path |
| 429 | Rate limit exceeded | Slow down requests |

## Troubleshooting

### Authentication Errors

- Verify SKOLON_CLIENT_ID and SKOLON_CLIENT_SECRET are correct
- Check that you're using the right credentials for the environment (test vs production)
- Ensure the Skolon IDP is accessible from your network

### Empty Data

- Verify you have access to the data you're requesting
- Check API response logs for errors
- Confirm your OAuth scope includes the required permissions

### Connection Errors

- Verify network connectivity to Skolon endpoints
- Check firewall rules allow outbound HTTPS connections
- Test with `curl` to verify API accessibility

### Common Mistakes & Solutions

Having issues? Check our comprehensive troubleshooting guide for help with:

- Authentication errors (500, 401, redirect_uri mismatch)
- Empty user lists
- Duplicate users in your system
- Webhook not firing
- Production deployment problems

**Full troubleshooting guide:** https://developer.skolon.com/docs/common-mistakes

### Quick Fixes

| Problem | Solution |
|---------|----------|
| 500 error on login | You're logged into Partner Portal - use a test teacher/student account |
| 401 Unauthorized | Verify CLIENT_ID and CLIENT_SECRET are correct |
| Empty user list | No licenses assigned, or pre-provisioning not approved |
| Webhook not called | URL must be HTTPS and publicly accessible |

## Support

For issues related to:
- **Skolon API:** Contact Skolon support at support@skolon.com
- **This Integration:** Review the code comments and logs
- **My Integration:** Visit 

## API Documentation

For more information about the Skolon API:
- **Developer Portal:** https://developer.skolon.com
- **API Reference:** https://api-test.skolon.com/docs (test environment)

## License

This integration code is provided as-is for integration with Skolon marketplace.
