from django.contrib.sitemaps import Sitemap
from django.urls import reverse

class StaticViewSitemap(Sitemap):
    priority = 0.6
    changefreq = 'weekly'

    def items(self):
        return [
            'home',
            'about',
            'support',
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