"""Compatibility facade for migrated view modules.

This module preserves historical import paths (`littleTalkApp.views`) while
routing behavior now lives in domain-oriented modules under
`littleTalkApp.views_modules`.
"""

from littleTalkApp.views_modules.api import *
from littleTalkApp.views_modules.auth import *
from littleTalkApp.views_modules.assessment import *
from littleTalkApp.views_modules.dashboard import *
from littleTalkApp.views_modules.gameplay import *
from littleTalkApp.views_modules.logbook import *
from littleTalkApp.views_modules.parent_access import *
from littleTalkApp.views_modules.profile import *
from littleTalkApp.views_modules.public import *
from littleTalkApp.views_modules.school import *
from littleTalkApp.views_modules.settings_views import *
from littleTalkApp.views_modules.subscription import *
