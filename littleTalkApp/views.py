"""Compatibility facade for migrated view modules.

This module preserves historical import paths (`littleTalkApp.views`) while
routing behavior now lives in domain-oriented modules under
`littleTalkApp.views_modules`.
"""

from importlib import import_module

VIEW_MODULES = [
	"littleTalkApp.views_modules.api",
	"littleTalkApp.views_modules.auth",
	"littleTalkApp.views_modules.assessment",
	"littleTalkApp.views_modules.dashboard",
	"littleTalkApp.views_modules.practise",
	"littleTalkApp.views_modules.logbook",
	"littleTalkApp.views_modules.parent_access",
	"littleTalkApp.views_modules.profile",
	"littleTalkApp.views_modules.public",
	"littleTalkApp.views_modules.school",
	"littleTalkApp.views_modules.settings_views",
	"littleTalkApp.views_modules.subscription",
]

__all__ = []

for module_path in VIEW_MODULES:
	module = import_module(module_path)
	# Re-export public names to preserve historical `littleTalkApp.views` imports.
	for name in dir(module):
		if name.startswith("_"):
			continue
		globals()[name] = getattr(module, name)
		if name not in __all__:
			__all__.append(name)
