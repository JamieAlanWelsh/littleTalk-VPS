# Generated by Django 5.1.3 on 2025-07-03 10:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('littleTalkApp', '0025_alter_learner_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='learner',
            name='assessment1',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='learner',
            name='assessment2',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
