from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0083_alter_joinrequest_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="school",
            name="auto_approve_domains",
            field=models.TextField(blank=True, default=""),
        ),
    ]
