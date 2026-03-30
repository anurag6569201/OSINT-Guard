from __future__ import annotations

from typing import Any

from .models import OsintLatestSnapshot


def persist_collect_result(
    linkedin: str,
    instagram: str,
    twitter: str,
    datasets: dict[str, Any],
    collect_errors: dict[str, str],
) -> None:
    OsintLatestSnapshot.objects.update_or_create(
        pk=1,
        defaults={
            'linkedin': linkedin or '',
            'instagram': instagram or '',
            'twitter': twitter or '',
            'datasets': datasets,
            'collect_errors': collect_errors or {},
            'ai_bundle': None,
        },
    )


def persist_ai_bundle(bundle: dict[str, Any]) -> None:
    snap = OsintLatestSnapshot.objects.filter(pk=1).first()
    if not snap:
        return
    snap.ai_bundle = bundle
    snap.save(update_fields=['ai_bundle', 'updated_at'])


def get_latest_snapshot() -> OsintLatestSnapshot | None:
    return OsintLatestSnapshot.objects.filter(pk=1).first()
