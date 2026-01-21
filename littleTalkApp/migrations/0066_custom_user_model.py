from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def copy_auth_user_to_custom_user(apps, schema_editor):
    LegacyUser = apps.get_model('auth', 'User')
    CustomUser = apps.get_model('littleTalkApp', 'User')

    for legacy in LegacyUser.objects.all():
        email = (legacy.email or legacy.username or '').lower()
        if not email:
            # Skip entries without an email/username; these were not usable in the app
            continue

        CustomUser.objects.update_or_create(
            id=legacy.id,
            defaults={
                'email': email,
                'is_staff': legacy.is_staff,
                'is_active': legacy.is_active,
                'is_superuser': legacy.is_superuser,
                'password': legacy.password,
                'last_login': legacy.last_login,
                'date_joined': legacy.date_joined,
            },
        )

    # Align the ID sequence with the migrated records (Postgres-specific)
    if schema_editor.connection.vendor == 'postgresql':
        table = '"littleTalkApp_user"'
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                f"SELECT setval(pg_get_serial_sequence({table}, 'id'), "
                f"GREATEST((SELECT COALESCE(MAX(id), 1) FROM {table}), 1), true);"
            )


def noop_reverse(apps, schema_editor):
    # We intentionally do not delete custom users when reversing.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('littleTalkApp', '0065_encrypt_sensitive_fields_data'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'swappable': 'AUTH_USER_MODEL',
            },
        ),
        migrations.RunPython(copy_auth_user_to_custom_user, noop_reverse),
        migrations.AlterField(
            model_name='joinrequest',
            name='resolved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='handled_join_requests', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='learner',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='learners', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='logentry',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='log_entries', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='profile',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='school',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='schools_created', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='staffinvite',
            name='sent_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_invites', to=settings.AUTH_USER_MODEL),
        ),
    ]
