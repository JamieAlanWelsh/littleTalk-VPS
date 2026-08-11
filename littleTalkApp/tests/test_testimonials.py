from django.test import SimpleTestCase

from littleTalkApp.content.avatars import AVATAR_COLORS, SELECTABLE_AVATAR_CHARACTERS
from littleTalkApp.content.testimonials import LANDING_TESTIMONIALS, get_landing_testimonials


class LandingTestimonialsTests(SimpleTestCase):
    def test_testimonials_include_avatar_image_and_palette_color(self):
        testimonials = get_landing_testimonials()

        self.assertEqual(len(testimonials), len(LANDING_TESTIMONIALS))

        valid_filenames = {
            character["image_filename"] for character in SELECTABLE_AVATAR_CHARACTERS
        }

        for testimonial in testimonials:
            with self.subTest(name=testimonial["name"]):
                self.assertTrue(
                    testimonial["avatar_image_url"].startswith(
                        "/static/exercise_assets/characters/"
                    )
                )
                self.assertIn(
                    testimonial["avatar_image_url"].rsplit("/", 1)[-1],
                    valid_filenames,
                )
                self.assertIn(testimonial["avatar_background_color"], AVATAR_COLORS)
                self.assertNotIn("initials", testimonial)