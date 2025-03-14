# Generated by Django 3.2.25 on 2025-03-10 13:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('littleTalkApp', '0013_logentry'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='logentry',
            name='exercises_done',
        ),
        migrations.AddField(
            model_name='logentry',
            name='exercises_practised',
            field=models.TextField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='logentry',
            name='goals',
            field=models.TextField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='logentry',
            name='notes',
            field=models.TextField(blank=True, max_length=1000, null=True),
        ),
    ]
