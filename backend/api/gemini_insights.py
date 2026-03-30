"""
Multi-prompt Gemini generation: compact OSINT JSON → structured UI payloads.
Each fragment is a separate model call (sequential for client stability).
"""

from __future__ import annotations

import json
from typing import Any

import google.generativeai as genai

BASE = """You are an OSINT analyst helping a user understand their public footprint.
Rules:
- Use ONLY information present in USER_JSON. Do not invent employers, DMs, private facts, or platforms not in USER_JSON.
- If USER_JSON is sparse, say so briefly and lower confidence in evidence strings.
- Return valid JSON only (no markdown fences)."""


def _trunc(s: str | None, n: int = 450) -> str:
    if not s:
        return ''
    return s if len(s) <= n else s[: n - 1] + '…'


def compact_datasets(data: dict[str, Any]) -> str:
    """Shrink payload for token limits while keeping cross-platform signals."""
    out: dict[str, Any] = {}

    ig_list = data.get('instagram') or []
    if ig_list and isinstance(ig_list[0], dict):
        p = ig_list[0]
        posts = p.get('latestPosts') or []
        out['instagram'] = {
            'username': p.get('username'),
            'fullName': p.get('fullName'),
            'biography': _trunc(p.get('biography'), 600),
            'externalUrls': (p.get('externalUrls') or [])[:8],
            'posts_sample': [
                {'caption': _trunc(x.get('caption'), 320), 'locationName': x.get('locationName')}
                for x in posts[:12]
                if isinstance(x, dict)
            ],
        }

    tw = data.get('twitter') or []
    if isinstance(tw, list):
        out['twitter'] = [
            {
                'text': _trunc(t.get('text'), 400),
                'createdAt': t.get('createdAt'),
                'author': {
                    'name': t.get('author.name'),
                    'userName': t.get('author.userName'),
                },
            }
            for t in tw[:40]
            if isinstance(t, dict)
        ]

    li = (data.get('linkedinProfile') or [])[:1]
    if li and isinstance(li[0], dict):
        lp = li[0]
        out['linkedinProfile'] = {
            'firstName': lp.get('firstName'),
            'lastName': lp.get('lastName'),
            'headline': _trunc(lp.get('headline'), 400),
            'locationName': lp.get('locationName'),
            'summary': _trunc(lp.get('summary'), 800),
            'positions': [
                {
                    'title': x.get('title'),
                    'companyName': x.get('companyName'),
                    'locationName': x.get('locationName'),
                    'description': _trunc(x.get('description'), 300),
                }
                for x in (lp.get('positions') or [])[:8]
                if isinstance(x, dict)
            ],
            'educations': (lp.get('educations') or [])[:6],
        }

    lip = data.get('linkedinPosts') or []
    if isinstance(lip, list):
        out['linkedinPosts'] = [
            {'text': _trunc(x.get('text'), 400), 'url': x.get('url')}
            for x in lip[:25]
            if isinstance(x, dict)
        ]

    return json.dumps(out, ensure_ascii=False)


def _generate_fragment(
    model: genai.GenerativeModel,
    schema: str,
    user_json: str,
) -> dict[str, Any]:
    prompt = f'{BASE}\n\nJSON_SCHEMA:\n{schema}\n\nUSER_JSON:\n{user_json}'
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type='application/json',
            temperature=0.2,
        ),
    )
    text = (response.text or '').strip()
    return json.loads(text)


SCHEMA_EXECUTIVE = """{
  "riskScore": <integer 0-100>,
  "riskMax": 100,
  "riskLabel": <short string>,
  "summary": <2-4 sentences string>
}"""

SCHEMA_INFERENCES = """{
  "rows": [
    {
      "targetInfo": <string category>,
      "inferredValue": <string>,
      "evidence": <string ending with (High) or (Medium) or (Low) in parentheses>
    }
  ]
}
Produce 4-8 rows where possible from USER_JSON only."""

SCHEMA_PATTERN = """{
  "entries": [
    {
      "id": <string "1","2",...>,
      "place": <string>,
      "period": <optional string or omit for hometown>,
      "detail": <string>,
      "source": <string citing which field/post in USER_JSON>
    }
  ],
  "polInference": <one sentence attacker takeaway>
}"""

SCHEMA_PHISHING = """{
  "sims": [
    {
      "id": <slug string>,
      "title": <string>,
      "from": <spoofed from line>,
      "to": <target display name>,
      "subject": <string>,
      "body": <string multiline plausible phish body, no real links>,
      "why": <string explaining which public signal was abused>
    }
  ]
}
Produce exactly 2 simulations."""

SCHEMA_METHODOLOGY = """{
  "headline": <string>,
  "intro": <2-4 sentences>,
  "pillars": [
    {"title": <string>, "subtitle": <string>, "text": <string>},
    {"title": <string>, "subtitle": <string>, "text": <string>},
    {"title": <string>, "subtitle": <string>, "text": <string>}
  ]
}"""


def generate_ai_bundle(api_key: str, model_name: str, data: dict[str, Any]) -> dict[str, Any]:
    """
    Run five Gemini requests and merge. Raises on hard failure.
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    user_block = compact_datasets(data)

    executive = _generate_fragment(model, SCHEMA_EXECUTIVE, user_block)
    inferences = _generate_fragment(model, SCHEMA_INFERENCES, user_block)
    pattern = _generate_fragment(model, SCHEMA_PATTERN, user_block)
    phishing = _generate_fragment(model, SCHEMA_PHISHING, user_block)
    methodology = _generate_fragment(model, SCHEMA_METHODOLOGY, user_block)

    rs = executive.get('riskScore')
    if not isinstance(rs, int):
        try:
            executive['riskScore'] = int(float(rs))
        except (TypeError, ValueError):
            executive['riskScore'] = 50
    executive.setdefault('riskMax', 100)
    executive.setdefault('riskLabel', 'Assessed from public footprint')
    executive.setdefault('summary', '')

    rows = inferences.get('rows')
    if not isinstance(rows, list):
        rows = []

    entries = pattern.get('entries')
    if not isinstance(entries, list):
        entries = []
    pol_inf = pattern.get('polInference')
    if not isinstance(pol_inf, str):
        pol_inf = str(pol_inf or '')

    sims = phishing.get('sims')
    if not isinstance(sims, list):
        sims = []

    if not isinstance(methodology, dict):
        methodology = {}
    methodology.setdefault('headline', 'Methodology')
    methodology.setdefault('intro', '')
    methodology.setdefault('pillars', [])

    return {
        'executive': executive,
        'inferenceRows': rows,
        'patternOfLife': entries,
        'polInference': pol_inf,
        'phishingSims': sims,
        'methodology': methodology,
    }
