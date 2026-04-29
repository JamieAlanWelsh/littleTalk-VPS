"""
My Integration - Skolon Marketplace Integration Server

Product: My Integration
URL: 
Description: 

This integration implements:
- OAuth 2.0 client_credentials flow
- SSO callback endpoint for user login
- User mapping via external_id
- Webhook receiver for real-time updates
- Roster sync: realtime_webhook
- License management: Trust platform licenses

Skolon API Documentation: https://developer.skolon.com

Requirements:
    pip install flask requests
"""

import os
import sys
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from flask import Flask, request, jsonify, redirect
import requests

app = Flask(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

class Config:
    """Configuration for Skolon API integration."""

    ENV = os.getenv('SKOLON_ENV', 'test')

    # Server settings
    PORT = int(os.getenv('PORT', 3000))

    # Environment-specific URLs
    TOKEN_URL = (
        'https://idp.skolon.com/oauth/access_token'
        if ENV == 'production'
        else 'https://idp-test.skolon.com/oauth/access_token'
    )

    API_BASE_URL = (
        'https://api.skolon.com'
        if ENV == 'production'
        else 'https://api-test.skolon.com'
    )

    # OAuth Credentials
    CLIENT_ID = os.getenv('SKOLON_CLIENT_ID')
    CLIENT_SECRET = os.getenv('SKOLON_CLIENT_SECRET')

    # SSO Configuration
    SSO_CALLBACK_URL = os.getenv('SSO_CALLBACK_URL', 'https://chatterdillo.com/sso/callback')

    # Integration settings
    OAUTH_TYPE = 'client_credentials'
    USER_MAPPING = 'external_id'
    TRUST_PLATFORM_LICENSES = True

    @classmethod
    def validate(cls) -> bool:
        if not cls.CLIENT_ID or not cls.CLIENT_SECRET:
            print('ERROR: Missing required environment variables.')
            print('Please set SKOLON_CLIENT_ID and SKOLON_CLIENT_SECRET')
            print()
            print('Example:')
            print('  export SKOLON_CLIENT_ID=your_client_id')
            print('  export SKOLON_CLIENT_SECRET=your_client_secret')
            return False
        return True


# Validate configuration
if not Config.validate():
    sys.exit(1)

print(f'Skolon Integration running in {Config.ENV.upper()} mode')
print(f'API Base URL: {Config.API_BASE_URL}')
print(f'SSO Callback URL: {Config.SSO_CALLBACK_URL}')


# =============================================================================
# VERSION TAG STORAGE
# =============================================================================

# Stores version tags for incremental sync
# TODO: In production, store these in a database
version_tags = {
    'users': None,
    'schools': None,
    'groups': None,
    'licenses': None,
    'organizations': None
}


# =============================================================================
# TOKEN MANAGER
# =============================================================================

class TokenManager:
    """OAuth 2.0 Token Manager"""

    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None

    def get_client_credentials_token(self) -> str:
        """Get access token using client credentials flow."""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token

        print('Requesting new access token (client_credentials)...')

        response = requests.post(
            Config.TOKEN_URL,
            data={
                'client_id': Config.CLIENT_ID,
                'client_secret': Config.CLIENT_SECRET,
                'grant_type': 'client_credentials'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['access_token']
        expires_in = data.get('expires_in', 3600)
        self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)

        print('Access token obtained successfully')
        return self.access_token

    def exchange_code_for_token(self, code: str) -> str:
        """Exchange authorization code for access token (SSO flow)."""
        # Ensure redirect_uri uses HTTPS (must match what was sent in auth request)
        redirect_uri = Config.SSO_CALLBACK_URL.replace('http://', 'https://')

        try:
            response = requests.post(
                Config.TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirect_uri,
                    'client_id': Config.CLIENT_ID,
                    'client_secret': Config.CLIENT_SECRET
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )

            if response.status_code != 200:
                response.raise_for_status()

            return response.json()['access_token']
        except Exception as e:
            print(f'Token exchange failed: {e}')
            raise

    def clear_token(self):
        self.access_token = None
        self.token_expiry = None


token_manager = TokenManager()


# =============================================================================
# SKOLON API CLIENT
# =============================================================================

class SkolonAPIClient:
    """Skolon API Client for making authenticated requests."""

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager

    def request(self, endpoint: str, params: Optional[Dict] = None, access_token: str = None) -> Any:
        token = access_token or self.token_manager.get_client_credentials_token()

        response = requests.get(
            f'{Config.API_BASE_URL}{endpoint}',
            headers={
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            },
            params=params or {}
        )
        response.raise_for_status()
        return response.json()

    def get_user_session(self, access_token: str) -> Dict:
        """Get current user session (for SSO)."""
        print('Fetching user session...')
        return self.request('/v2/partner/user/session', access_token=access_token)

    def get_users(self, params: Optional[Dict] = None) -> Dict:
        """Fetch users with optional version tag for incremental sync."""
        print('Fetching users from Skolon...')
        params = params or {}
        if version_tags['users']:
            params['versionTag'] = version_tags['users']

        data = self.request('/v2/partner/user', params)

        if data.get('versionTag'):
            version_tags['users'] = data['versionTag']

        users = data.get('users', data) if isinstance(data, dict) else data or []
        print(f"Fetched {len(users) if isinstance(users, list) else 'unknown'} users (versionTag: {data.get('versionTag', 'none')})")
        return {'users': users, 'versionTag': data.get('versionTag'), 'hasMore': data.get('hasMore')}

    def get_schools(self, params: Optional[Dict] = None) -> Dict:
        """Fetch schools with optional version tag."""
        print('Fetching schools from Skolon...')
        params = params or {}
        if version_tags['schools']:
            params['versionTag'] = version_tags['schools']

        data = self.request('/v2/partner/school', params)

        if data.get('versionTag'):
            version_tags['schools'] = data['versionTag']

        schools = data.get('schools', data) if isinstance(data, dict) else data or []
        print(f"Fetched {len(schools) if isinstance(schools, list) else 'unknown'} schools (versionTag: {data.get('versionTag', 'none')})")
        return {'schools': schools, 'versionTag': data.get('versionTag'), 'hasMore': data.get('hasMore')}

    def get_groups(self, params: Optional[Dict] = None) -> Dict:
        """Fetch groups with optional version tag."""
        print('Fetching groups from Skolon...')
        params = params or {}
        if version_tags['groups']:
            params['versionTag'] = version_tags['groups']

        data = self.request('/v2/partner/group', params)

        if data.get('versionTag'):
            version_tags['groups'] = data['versionTag']

        groups = data.get('groups', data) if isinstance(data, dict) else data or []
        print(f"Fetched {len(groups) if isinstance(groups, list) else 'unknown'} groups (versionTag: {data.get('versionTag', 'none')})")
        return {'groups': groups, 'versionTag': data.get('versionTag'), 'hasMore': data.get('hasMore')}

    def get_licenses(self, params: Optional[Dict] = None) -> Dict:
        """Fetch licenses with optional version tag."""
        print('Fetching licenses from Skolon...')
        params = params or {}
        if version_tags['licenses']:
            params['versionTag'] = version_tags['licenses']

        data = self.request('/v2/partner/license', params)

        if data.get('versionTag'):
            version_tags['licenses'] = data['versionTag']

        licenses = data.get('licenses', data) if isinstance(data, dict) else data or []
        print(f"Fetched {len(licenses) if isinstance(licenses, list) else 'unknown'} licenses (versionTag: {data.get('versionTag', 'none')})")
        return {'licenses': licenses, 'versionTag': data.get('versionTag'), 'hasMore': data.get('hasMore')}


api_client = SkolonAPIClient(token_manager)


# =============================================================================
# SYNC FUNCTIONS
# =============================================================================

def get_user_external_id(user: Dict) -> str:
    """Get external ID based on configured mapping type."""
    if Config.USER_MAPPING == 'email':
        return user.get('email', '')
    elif Config.USER_MAPPING == 'external_id':
        return user.get('externalId', user.get('id', ''))
    elif Config.USER_MAPPING == 'student_number':
        return user.get('studentNumber', user.get('externalId', user.get('id', '')))
    return user.get('email', '')


def sync_users() -> List[Dict]:
    """Process and sync users."""
    try:
        result = api_client.get_users()
        users = result['users']

        for user in users:
            mapped_user = {
                'skolon_id': user.get('id'),
                'name': user.get('name') or f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
                'email': user.get('email'),
                'first_name': user.get('firstName'),
                'last_name': user.get('lastName'),
                'role': user.get('role', user.get('type')),
                'external_id': get_user_external_id(user),
                'is_deleted': user.get('isDeleted', False)
            }

            # TODO: Save user to your database
            # Match by email or external_id, create if not exists
            # Example:
            # existing_user = db.users.find_by_email(mapped_user['email'])
            # if existing_user:
            #     db.users.update(existing_user.id, {'skolon_id': mapped_user['skolon_id'], **mapped_user})
            # else:
            #     db.users.create(mapped_user)

            if mapped_user['is_deleted']:
                # TODO: Soft-delete or deactivate user in your system
                # Example: db.users.deactivate(mapped_user['skolon_id'])
                pass

        print(f'Synced {len(users)} users')
        return users

    except Exception as error:
        print(f'User sync failed: {error}')
        raise


def sync_schools() -> List[Dict]:
    """Process and sync schools."""
    try:
        result = api_client.get_schools()
        schools = result['schools']

        for school in schools:
            mapped_school = {
                'skolon_id': school.get('id'),
                'name': school.get('name'),
                'organization_number': school.get('organizationNumber'),
                'is_deleted': school.get('isDeleted', False)
            }

            # TODO: Save school to your database
            # Example: db.schools.upsert({'skolon_id': mapped_school['skolon_id'], **mapped_school})

        print(f'Synced {len(schools)} schools')
        return schools

    except Exception as error:
        print(f'School sync failed: {error}')
        raise


def sync_groups() -> List[Dict]:
    """Process and sync groups."""
    try:
        result = api_client.get_groups()
        groups = result['groups']

        for group in groups:
            mapped_group = {
                'skolon_id': group.get('id'),
                'name': group.get('name'),
                'type': group.get('type'),
                'school_id': group.get('schoolId'),
                'is_deleted': group.get('isDeleted', False)
            }

            # TODO: Save group to your database
            # Example: db.groups.upsert({'skolon_id': mapped_group['skolon_id'], **mapped_group})

        print(f'Synced {len(groups)} groups')
        return groups

    except Exception as error:
        print(f'Group sync failed: {error}')
        raise


def sync_licenses() -> List[Dict]:
    """
    Process and sync licenses.
    License structure from Skolon:
    { id: str, users: [{ id: str, uuid: str }], expirationDate: str, isDeleted: bool }
    """
    try:
        result = api_client.get_licenses()
        licenses = result['licenses']

        for license in licenses:
            # Extract user info from users array (may be empty for unassigned licenses)
            users = license.get('users', [])
            has_users = len(users) > 0
            user_id = users[0].get('id') if has_users else None
            user_uuid = users[0].get('uuid') if has_users else None

            mapped_license = {
                'skolon_id': license.get('id'),
                'user_id': user_id,
                'user_uuid': user_uuid,
                'users': users,
                'product_id': license.get('productId', license.get('product_id')),
                'expiration_date': license.get('expirationDate'),
                'valid_from': license.get('validFrom', license.get('valid_from')),
                'valid_until': license.get('validUntil', license.get('valid_until', license.get('expirationDate'))),
                'is_deleted': license.get('isDeleted', False),
                'active': True  # Auto-activate based on platform license
            }

            # TODO: Save license to your database
            # Link Skolon license to your user
            # Example:
            # db.licenses.upsert({
            #     'skolon_license_id': mapped_license['skolon_id'],
            #     'user_id': mapped_license['user_id'],
            #     'expiration_date': mapped_license['expiration_date'],
            #     'active': mapped_license['active']
            # })

            if mapped_license['is_deleted']:
                # TODO: Revoke license in your system
                # Example: db.licenses.revoke(mapped_license['skolon_id'])
                pass

        print(f'Synced {len(licenses)} licenses')
        return licenses

    except Exception as error:
        print(f'License sync failed: {error}')
        raise


# =============================================================================
# WEBHOOK ENDPOINT
# =============================================================================

@app.route('/api/skolon-webhook', methods=['POST'])
def webhook_handler():
    """
    Webhook receiver for Skolon notifications.
    Receives notifications when data changes and triggers incremental sync.
    """
    data = request.get_json() or {}
    entities = data.get('entities', [])

    print(f"Webhook received: {', '.join(entities) if entities else 'no entities'}")

    # Respond immediately (important for webhooks!)
    response = jsonify({'received': True, 'timestamp': datetime.now().isoformat()})

    # Process webhook (in production, use a background task queue)
    try:
        process_webhook(entities)
    except Exception as e:
        print(f'Webhook processing error: {e}')

    return response, 200


def process_webhook(entities: List[str]):
    """Process webhook and sync changed entities."""
    if not entities:
        return

    results = {}

    if 'user' in entities:
        results['users'] = sync_users()

    if 'school' in entities:
        results['schools'] = sync_schools()

    if 'group' in entities:
        results['groups'] = sync_groups()

    if 'license' in entities:
        results['licenses'] = sync_licenses()

    return results


# =============================================================================
# SSO CALLBACK ENDPOINT
# =============================================================================

@app.route('/sso/callback', methods=['GET'])
def sso_callback():
    """
    SSO callback handler.
    Receives authorization code from Skolon and exchanges it for user info.
    """
    code = request.args.get('code')
    error = request.args.get('error')
    error_description = request.args.get('error_description')

    # Handle OAuth errors
    if error:
        print(f'SSO error: {error} {error_description}')
        return jsonify({
            'success': False,
            'error': error,
            'error_description': error_description
        }), 400

    # Validate authorization code
    if not code:
        return jsonify({
            'success': False,
            'error': 'missing_code',
            'error_description': 'No authorization code provided'
        }), 400

    try:
        # Exchange authorization code for access token
        access_token = token_manager.exchange_code_for_token(code)

        # Fetch user session (returns IDs for matching against synced data)
        user_session = api_client.get_user_session(access_token)

        print(f"User authenticated: {user_session.get('userId')}")

        # Check license status via Skolon API before granting access
        try:
            result = api_client.get_licenses()
            licenses = result['licenses']
            user_id = user_session.get('userId')
            user_licenses = [
                l for l in licenses
                if l.get('users') and any(u.get('id') == user_id for u in l['users']) and not l.get('isDeleted')
            ]
            has_valid_license = any(
                not l.get('expirationDate') or datetime.fromisoformat(l['expirationDate'].replace('Z', '+00:00')) > datetime.now()
                for l in user_licenses
            )

            if not has_valid_license:
                return jsonify({
                    'success': False,
                    'error': 'no_valid_license',
                    'error_description': 'User does not have a valid license for this product'
                }), 403

            print(f'License verified for user {user_id}')
        except Exception as license_err:
            print(f'License check failed: {license_err}')
            # TODO: Decide whether to block access or allow with warning
            return jsonify({
                'success': False,
                'error': 'license_check_failed',
                'error_description': 'Could not verify license status'
            }), 500

        # TODO: On SSO login, look up user in YOUR database
        # Example:
        # user = db.users.find_by_skolon_id(user_session.get('userId'))
        # if not user:
        #     return jsonify({'error': 'User not found - please wait for sync'}), 404
        # # Create session and redirect to your app
        # session_token = create_session(user)
        # return redirect(f'/app?token={session_token}')

        # Return user session info - publishers match userId against their synced data
        return jsonify({
            'success': True,
            'message': 'SSO login successful',
            'user': {
                'id': user_session.get('userId'),
                'uuid': user_session.get('userUuId'),
                'schoolId': user_session.get('schoolId'),
                'schoolUuid': user_session.get('schoolUuid'),
                'authenticationMethod': user_session.get('authenticationMethod'),
                'access_token': access_token
            },
            'note': 'Match user.id against your synced user data to get full profile'
        })

    except Exception as e:
        print(f'SSO failed: {e}')
        return jsonify({
            'success': False,
            'error': 'sso_failed',
            'error_description': str(e)
        }), 500


# =============================================================================
# MANUAL SYNC ENDPOINT
# =============================================================================

@app.route('/api/sync', methods=['POST'])
def manual_sync():
    """Manually trigger a full sync."""
    print('Manual sync triggered')

    try:
        results = {
            'schools': sync_schools(),
            'users': sync_users(),
            'groups': sync_groups(),
            'licenses': sync_licenses()
        }

        print(f"Sync complete: {len(results['users'])} users, {len(results['schools'])} schools, {len(results['groups'])} groups, {len(results['licenses'])} licenses")

        return jsonify({
            'success': True,
            'summary': {
                'schools': len(results['schools']),
                'users': len(results['users']),
                'groups': len(results['groups']),
                'licenses': len(results['licenses'])
            },
            'version_tags': version_tags
        })

    except Exception as e:
        print(f'Sync failed: {e}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



# =============================================================================
# ROOT ROUTE - Redirect to Skolon OAuth
# =============================================================================

@app.route('/', methods=['GET'])
def index():
    """Redirect user to Skolon OAuth login."""
    idp_url = 'https://idp.skolon.com' if Config.ENV == 'production' else 'https://idp-test.skolon.com'

    # Ensure redirect_uri uses HTTPS
    callback_url = Config.SSO_CALLBACK_URL.replace('http://', 'https://')

    auth_url = (
        f"{idp_url}/oauth/auth?"
        f"client_id={Config.CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(callback_url)}"
        f"&response_type=code"
        f"&scope=authenticatedUser.profile.read"
    )

    return redirect(auth_url)


# =============================================================================
# HEALTH & STATUS ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'My Integration Skolon Integration',
        'environment': Config.ENV,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'ok',
        'environment': Config.ENV,
        'api_base_url': Config.API_BASE_URL,
        'sso_callback_url': Config.SSO_CALLBACK_URL,
        'version_tags': version_tags,
        'config': {
            'oauth_type': Config.OAUTH_TYPE,
            'user_mapping': Config.USER_MAPPING,
            'trust_platform_licenses': Config.TRUST_PLATFORM_LICENSES
        }
    })


# =============================================================================
# START SERVER
# =============================================================================

if __name__ == '__main__':
    print('')
    print('=' * 60)
    print('  My Integration - Skolon Integration Server')
    print('=' * 60)
    print('')
    print(f'Server running on port {Config.PORT}')
    print('')
    print('Endpoints:')
    print(f'  GET  http://localhost:{Config.PORT}/                   - Redirect to Skolon OAuth login')
    print(f'  GET  http://localhost:{Config.PORT}/health             - Health check')
    print(f'  GET  http://localhost:{Config.PORT}/api/status         - Integration status')
    print(f'  GET  http://localhost:{Config.PORT}/sso/callback       - SSO callback')
    print(f'  POST http://localhost:{Config.PORT}/api/skolon-webhook - Webhook receiver')
    print(f'  POST http://localhost:{Config.PORT}/api/sync           - Manual sync')
    print('')
    print('Configuration:')
    print(f'  Environment:      {Config.ENV}')
    print(f'  OAuth Type:       {Config.OAUTH_TYPE}')
    print(f'  User Mapping:     {Config.USER_MAPPING}')
    print(f'  Trust Licenses:   {Config.TRUST_PLATFORM_LICENSES}')
    print(f'  API URL:          {Config.API_BASE_URL}')
    print(f'  SSO Callback:     {Config.SSO_CALLBACK_URL}')
    print('')
    print('=' * 60)

    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.ENV != 'production')
