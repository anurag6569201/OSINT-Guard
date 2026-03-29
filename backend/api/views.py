from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'osint-guard-api'})
