from urllib.parse import urlsplit

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from littleTalk.context_processors import get_canonical_base_url
from littleTalkApp.content.case_studies import get_case_studies


class CanonicalHostSitemap(Sitemap):
    """Emit URLs on CANONICAL_BASE_URL rather than whichever host was requested."""

    def get_domain(self, site=None):
        base_url = get_canonical_base_url()
        if base_url:
            return urlsplit(base_url).netloc
        return super().get_domain(site)

    def get_protocol(self, protocol=None):
        base_url = get_canonical_base_url()
        if base_url:
            return urlsplit(base_url).scheme
        return super().get_protocol(protocol)


class StaticViewSitemap(CanonicalHostSitemap):
    priority = 0.6
    changefreq = 'weekly'

    def items(self):
        return [
            'home',
            'about',
            'how_it_works',
            'case_studies',
            'exercises',
            'login',
            'parent_signup',
            'school_signup',
            'request_join_school',
        ]

    def location(self, item):
        return reverse(item)


class CaseStudySitemap(CanonicalHostSitemap):
    changefreq = 'monthly'
    priority = 0.5

    def items(self):
        return get_case_studies()

    def location(self, item):
        return reverse('case_study_detail', kwargs={'slug': item['slug']})
