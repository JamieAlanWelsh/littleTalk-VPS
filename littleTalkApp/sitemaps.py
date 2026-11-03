from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from littleTalkApp.content.case_studies import get_case_studies


class StaticViewSitemap(Sitemap):
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


class CaseStudySitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.5

    def items(self):
        return get_case_studies()

    def location(self, item):
        return reverse('case_study_detail', kwargs={'slug': item['slug']})
