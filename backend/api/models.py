from django.db import models


class OsintLatestSnapshot(models.Model):
    """
    Singleton row (pk=1): last successful Apify collect + optional Gemini bundle.
    Survives server restarts when using SQLite/Postgres file or DB.
    """

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    linkedin = models.CharField(max_length=1024, blank=True, default='')
    instagram = models.CharField(max_length=1024, blank=True, default='')
    twitter = models.CharField(max_length=1024, blank=True, default='')
    datasets = models.JSONField(default=dict)
    collect_errors = models.JSONField(default=dict)
    ai_bundle = models.JSONField(null=True, blank=True)

    class Meta:
        verbose_name = 'Latest OSINT snapshot'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
