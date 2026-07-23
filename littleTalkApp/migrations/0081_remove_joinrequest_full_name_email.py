from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("littleTalkApp", "0080_joinrequest_user"),
    ]

    operations = [
        migrations.RemoveField(model_name="joinrequest", name="full_name"),
        migrations.RemoveField(model_name="joinrequest", name="email"),
    ]
