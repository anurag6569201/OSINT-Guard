import json
import traceback

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .apify_collect import collect_osint
from .gemini_insights import generate_ai_bundle


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'osint-guard-api'})


def _empty_collect_payload():
    return {
        'instagram': [],
        'twitter': [],
        'linkedinProfile': [],
        'linkedinPosts': [],
    }


@csrf_exempt
@require_http_methods(['POST'])
def collect_osint_view(request):
    """
    JSON body: { "linkedin"?: str, "instagram"?: str, "twitter"?: str }
    MVP: CSRF exempt so the SPA can POST JSON via Vite proxy without a CSRF cookie dance.
    """
    try:
        body = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'invalid_json'}, status=400)

    if not isinstance(body, dict):
        return JsonResponse({'ok': False, 'error': 'body_must_be_object'}, status=400)

    linkedin = body.get('linkedin')
    instagram = body.get('instagram')
    twitter = body.get('twitter')
    if linkedin is not None and not isinstance(linkedin, str):
        return JsonResponse({'ok': False, 'error': 'linkedin_must_be_string'}, status=400)
    if instagram is not None and not isinstance(instagram, str):
        return JsonResponse({'ok': False, 'error': 'instagram_must_be_string'}, status=400)
    if twitter is not None and not isinstance(twitter, str):
        return JsonResponse({'ok': False, 'error': 'twitter_must_be_string'}, status=400)

    if not settings.APIFY_API_TOKEN:
        return JsonResponse(
            {
                'ok': False,
                'error': 'APIFY_API_TOKEN is not configured',
                'data': _empty_collect_payload(),
                'errors': {},
            },
            status=503,
        )

    data, errors = collect_osint(
        settings.APIFY_API_TOKEN,
        linkedin=linkedin or None,
        instagram=instagram or None,
        twitter=twitter or None,
        actor_linkedin_profile=settings.APIFY_ACTOR_LINKEDIN_PROFILE,
        actor_linkedin_posts=settings.APIFY_ACTOR_LINKEDIN_POSTS,
        actor_twitter=settings.APIFY_ACTOR_TWITTER,
        actor_instagram=settings.APIFY_ACTOR_INSTAGRAM,
    )
    return JsonResponse(
        {
            'ok': True,
            'data': data,
            'errors': errors,
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def ai_insights_view(request):
    """
    JSON body: { "datasets": { instagram, twitter, linkedinProfile, linkedinPosts } }
    Runs five sequential Gemini calls and returns one merged JSON payload.
    """
    if not settings.GEMINI_API_KEY:
        return JsonResponse(
            {'ok': False, 'error': 'GEMINI_API_KEY is not configured'},
            status=503,
        )

    try:
        body = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'invalid_json'}, status=400)

    datasets = body.get('datasets') if isinstance(body, dict) else None
    if not isinstance(datasets, dict):
        return JsonResponse({'ok': False, 'error': 'datasets_object_required'}, status=400)

    try:
        bundle = generate_ai_bundle(
            settings.GEMINI_API_KEY,
            settings.GEMINI_MODEL,
            datasets,
        )
    except Exception:  # noqa: BLE001
        payload = {'ok': False, 'error': 'gemini_failed'}
        if settings.DEBUG:
            payload['detail'] = traceback.format_exc()[-2000:]
        return JsonResponse(payload, status=502)

    return JsonResponse({'ok': True, **bundle})
