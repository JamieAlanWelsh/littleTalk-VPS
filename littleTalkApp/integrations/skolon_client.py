"""
Skolon API client — Django port of the starter script.

Provides:
  TokenManager  – caches an OAuth client_credentials token; refreshes automatically.
  SkolonAPIClient – thin wrapper around the six Skolon partner API endpoints.
  token_manager  – module-level singleton for token reuse across requests.
  api_client     – module-level singleton ready to use.

All configuration is read from Django settings (SKOLON_*).
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class TokenManager:
    """OAuth 2.0 token manager — client_credentials flow."""

    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None

    def get_client_credentials_token(self) -> str:
        """Return a cached token, fetching a new one if expired."""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token

        logger.info("Requesting new Skolon access token (client_credentials)...")

        response = requests.post(
            settings.SKOLON_TOKEN_URL,
            data={
                "client_id": settings.SKOLON_CLIENT_ID,
                "client_secret": settings.SKOLON_CLIENT_SECRET,
                "grant_type": "client_credentials",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        # Subtract 60 s so we refresh before the token actually expires.
        self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)

        logger.info("Skolon access token obtained successfully.")
        return self.access_token

    def exchange_code_for_token(self, code: str) -> str:
        """Exchange an authorisation code for an access token (SSO flow)."""
        redirect_uri = settings.SKOLON_SSO_CALLBACK_URL.replace("http://", "https://")

        response = requests.post(
            settings.SKOLON_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.SKOLON_CLIENT_ID,
                "client_secret": settings.SKOLON_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    def clear_token(self):
        self.access_token = None
        self.token_expiry = None


class SkolonAPIClient:
    """Authenticated Skolon partner API client."""

    def __init__(self, token_manager: TokenManager):
        self.token_manager = token_manager

    def _get(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        access_token: str = None,
    ) -> Any:
        token = access_token or self.token_manager.get_client_credentials_token()
        response = requests.get(
            f"{settings.SKOLON_API_BASE_URL}{endpoint}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            },
            params=params or {},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # SSO helpers
    # ------------------------------------------------------------------

    def get_user_session(self, access_token: str) -> Dict:
        """Return the session object for the user who just authenticated via SSO."""
        logger.info("Fetching Skolon user session...")
        return self._get("/v2/partner/user/session", access_token=access_token)

    # ------------------------------------------------------------------
    # Partner roster endpoints
    # ------------------------------------------------------------------

    def get_users(self, version_tag: Optional[str] = None) -> Dict:
        params = {"versionTag": version_tag} if version_tag else {}
        data = self._get("/v2/partner/user", params)
        users = data.get("users", data) if isinstance(data, dict) else data or []
        logger.info(
            "Fetched %s users (versionTag: %s)",
            len(users) if isinstance(users, list) else "?",
            data.get("versionTag"),
        )
        return {
            "users": users,
            "versionTag": data.get("versionTag"),
            "hasMore": data.get("hasMore"),
        }

    def get_schools(self, version_tag: Optional[str] = None) -> Dict:
        params = {"versionTag": version_tag} if version_tag else {}
        data = self._get("/v2/partner/school", params)
        schools = data.get("schools", data) if isinstance(data, dict) else data or []
        logger.info(
            "Fetched %s schools (versionTag: %s)",
            len(schools) if isinstance(schools, list) else "?",
            data.get("versionTag"),
        )
        return {
            "schools": schools,
            "versionTag": data.get("versionTag"),
            "hasMore": data.get("hasMore"),
        }

    def get_groups(self, version_tag: Optional[str] = None) -> Dict:
        params = {"versionTag": version_tag} if version_tag else {}
        data = self._get("/v2/partner/group", params)
        groups = data.get("groups", data) if isinstance(data, dict) else data or []
        logger.info(
            "Fetched %s groups (versionTag: %s)",
            len(groups) if isinstance(groups, list) else "?",
            data.get("versionTag"),
        )
        return {
            "groups": groups,
            "versionTag": data.get("versionTag"),
            "hasMore": data.get("hasMore"),
        }

    def get_licenses(self, version_tag: Optional[str] = None) -> Dict:
        params = {"versionTag": version_tag} if version_tag else {}
        data = self._get("/v2/partner/license", params)
        licenses = data.get("licenses", data) if isinstance(data, dict) else data or []
        logger.info(
            "Fetched %s licenses (versionTag: %s)",
            len(licenses) if isinstance(licenses, list) else "?",
            data.get("versionTag"),
        )
        return {
            "licenses": licenses,
            "versionTag": data.get("versionTag"),
            "hasMore": data.get("hasMore"),
        }


# Module-level singletons — the token cache is reused across Django requests.
token_manager = TokenManager()
api_client = SkolonAPIClient(token_manager)
