# -*- coding: utf-8 -*-
# Generated by Django 1.11.20 on 2021-09-27 20:12
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('emr', '0171_auto_20210927_1553'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userprofile',
            old_name='weigth_updated_date',
            new_name='weight_updated_date',
        ),
    ]
