from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0079_emailverificationcode"),
    ]

    operations = [
        migrations.AddField(
            model_name="joinrequest",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="join_requests",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
