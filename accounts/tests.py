from django.test import TestCase

from .models import User


class UserManagerTests(TestCase):
	def test_create_user_requires_username(self):
		with self.assertRaisesMessage(ValueError, "Users must have a username."):
			User.objects.create_user(username="", password="password123")

	def test_create_user_sets_hashed_password(self):
		user = User.objects.create_user(username="test-user", password="password123")

		self.assertEqual(user.username, "test-user")
		self.assertNotEqual(user.password, "password123")
		self.assertTrue(user.check_password("password123"))

	def test_create_superuser_sets_required_flags(self):
		superuser = User.objects.create_superuser(username="admin-user", password="password123")

		self.assertTrue(superuser.is_staff)
		self.assertTrue(superuser.is_superuser)

	def test_create_superuser_rejects_incorrect_is_staff_flag(self):
		with self.assertRaisesMessage(ValueError, "Superuser must have is_staff=True."):
			User.objects.create_superuser(
				username="bad-admin",
				password="password123",
				is_staff=False,
			)

	def test_create_superuser_rejects_incorrect_is_superuser_flag(self):
		with self.assertRaisesMessage(ValueError, "Superuser must have is_superuser=True."):
			User.objects.create_superuser(
				username="bad-super",
				password="password123",
				is_superuser=False,
			)
