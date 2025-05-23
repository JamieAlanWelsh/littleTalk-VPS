# Generated by Django 4.2.16 on 2024-12-28 12:34

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('littleTalkApp', '0002_rename_firstname_profile_first_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Learner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('age', models.IntegerField()),
                ('diagnosis', models.CharField(blank=True, choices=[('autism', 'Autism'), ('down_syndrome', 'Down Syndrome')], max_length=50, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='learners', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
