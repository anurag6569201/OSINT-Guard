"""
Run Apify actors and normalize items to the JSON shapes expected by the React app
(see frontend/public/dummy_data and frontend/src/types/datasets.ts).
"""

from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Callable
from urllib.parse import urlparse

from apify_client import ApifyClient


def normalize_linkedin_profile_url(raw: str | None) -> str | None:
    if not raw or not str(raw).strip():
        return None
    s = raw.strip()
    if s.lower().startswith('http'):
        p = urlparse(s)
        parts = [x for x in p.path.split('/') if x]
        if 'in' in parts:
            i = parts.index('in')
            if i + 1 < len(parts):
                slug = parts[i + 1].split('?')[0]
                if slug:
                    return f'https://www.linkedin.com/in/{slug}/'
        return None
    slug = re.sub(r'^@+', '', s).strip().strip('/').split('/')[-1]
    return f'https://www.linkedin.com/in/{slug}/' if slug else None


def twitter_profile_url(handle: str | None) -> str | None:
    if not handle or not str(handle).strip():
        return None
    h = re.sub(r'^@+', '', handle.strip())
    return f'https://x.com/{h}' if h else None


def instagram_username(handle: str | None) -> str | None:
    if not handle or not str(handle).strip():
        return None
    return re.sub(r'^@+', '', handle.strip()) or None


def _pick(d: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default


def normalize_tweet(raw: dict[str, Any]) -> dict[str, Any]:
    if 'author.name' in raw and 'author.userName' in raw:
        return dict(raw)
    author = raw.get('author')
    if isinstance(author, dict):
        name = _pick(author, 'name', 'displayName', default='')
        un = _pick(author, 'userName', 'username', 'screenName', default='')
        out = {**raw, 'author.name': name, 'author.userName': un}
        return out
    return {
        **raw,
        'author.name': str(raw.get('author.name', '') or ''),
        'author.userName': str(raw.get('author.userName', '') or ''),
    }


def normalize_instagram_post(p: dict[str, Any]) -> dict[str, Any]:
    loc = p.get('location')
    if loc is not None and not isinstance(loc, dict):
        loc = None
    elif isinstance(loc, dict):
        loc = {
            'id': str(_pick(loc, 'id', 'pk', default='')),
            'name': str(_pick(loc, 'name', 'title', default='')),
            **({'slug': loc['slug']} if loc.get('slug') else {}),
        }
    media_type = str(
        _pick(p, 'mediaType', 'media_type', 'type', default='GraphImage') or 'GraphImage'
    )
    return {
        'id': str(_pick(p, 'id', 'pk', default='')),
        'shortCode': str(_pick(p, 'shortCode', 'shortcode', default='')),
        'url': str(_pick(p, 'url', 'link', default='')),
        'caption': p.get('caption'),
        'mediaType': media_type,
        'productType': p.get('productType') or p.get('product_type'),
        'location': loc,
        'locationName': p.get('locationName') or p.get('location_name'),
        'likesCount': int(_pick(p, 'likesCount', 'likes_count', 'like_count', default=0) or 0),
        'commentsCount': int(
            _pick(p, 'commentsCount', 'comments_count', 'comment_count', default=0) or 0
        ),
        'timestamp': str(_pick(p, 'timestamp', 'taken_at_timestamp', 'date', default='') or ''),
        'displayUrl': str(_pick(p, 'displayUrl', 'display_url', 'imageUrl', default='') or ''),
        'alt': p.get('alt'),
        'is_video': bool(_pick(p, 'is_video', 'isVideo', default=False)),
    }


def normalize_instagram_profile(item: dict[str, Any]) -> dict[str, Any]:
    posts_raw = item.get('latestPosts') or item.get('latest_posts') or item.get('posts') or []
    if not isinstance(posts_raw, list):
        posts_raw = []
    latest = [normalize_instagram_post(x) for x in posts_raw if isinstance(x, dict)]
    ext = item.get('externalUrls') or item.get('external_urls') or []
    if not isinstance(ext, list):
        ext = []
    external_urls = []
    for e in ext:
        if isinstance(e, dict) and e.get('url'):
            external_urls.append(
                {
                    'title': e.get('title'),
                    'url': str(e['url']),
                    'link_type': e.get('link_type') or e.get('linkType'),
                }
            )
    return {
        'id': str(_pick(item, 'id', 'pk', default='')),
        'username': str(_pick(item, 'username', 'user_name', default='') or ''),
        'fullName': str(_pick(item, 'fullName', 'full_name', default='') or ''),
        'biography': str(_pick(item, 'biography', 'bio', default='') or ''),
        'followersCount': int(
            _pick(item, 'followersCount', 'followers_count', default=0) or 0
        ),
        'followsCount': int(_pick(item, 'followsCount', 'follows_count', default=0) or 0),
        'postsCount': int(_pick(item, 'postsCount', 'posts_count', 'media_count', default=0) or 0),
        'highlight_reel_count': int(
            _pick(item, 'highlight_reel_count', 'highlightReelCount', default=0) or 0
        ),
        'verified': bool(item.get('verified', False)),
        'private': bool(_pick(item, 'private', 'is_private', default=False)),
        'externalUrls': external_urls,
        'profilePicUrl': str(
            _pick(item, 'profilePicUrl', 'profile_pic_url', 'profilePicture', default='') or ''
        ),
        **(
            {'hdProfilePicUrl': str(item['hdProfilePicUrl'])}
            if item.get('hdProfilePicUrl')
            else {}
        ),
        'latestPosts': latest,
    }


def normalize_linkedin_profile(item: dict[str, Any]) -> dict[str, Any]:
    """Pass-through with shallow copies for nested lists the UI expects."""
    out = dict(item)
    for key in ('positions', 'educations', 'skills', 'certifications'):
        v = out.get(key)
        if isinstance(v, list):
            out[key] = [dict(x) if isinstance(x, dict) else x for x in v]
    return out


def _normalize_li_reactor(p: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(p, dict):
        return None
    r = dict(p)
    if 'publicId' not in r and r.get('publicIdentifier'):
        r['publicId'] = r['publicIdentifier']
    return r


def normalize_linkedin_post(item: dict[str, Any]) -> dict[str, Any]:
    out = dict(item)
    reacts = out.get('reactions')
    if isinstance(reacts, list):
        new_r = []
        for x in reacts:
            if not isinstance(x, dict):
                continue
            y = dict(x)
            if 'profile' in y:
                y['profile'] = _normalize_li_reactor(y.get('profile'))
            new_r.append(y)
        out['reactions'] = new_r
    comments = out.get('comments')
    if isinstance(comments, list):
        new_c = []
        for x in comments:
            if not isinstance(x, dict):
                continue
            y = dict(x)
            if 'author' in y:
                y['author'] = _normalize_li_reactor(y.get('author'))
            new_c.append(y)
        out['comments'] = new_c
    auth = out.get('author')
    if isinstance(auth, dict):
        out['author'] = _normalize_li_reactor(auth)
    return out


def _run_actor(
    client: ApifyClient,
    actor_id: str,
    run_input: dict[str, Any],
    normalize_item: Callable[[dict[str, Any]], dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    run = client.actor(actor_id).call(run_input=run_input)
    ds = run.get('defaultDatasetId')
    if not ds:
        return []
    out: list[dict[str, Any]] = []
    for item in client.dataset(ds).iterate_items():
        if isinstance(item, dict):
            out.append(normalize_item(item) if normalize_item else dict(item))
    return out


def collect_osint(
    token: str,
    *,
    linkedin: str | None,
    instagram: str | None,
    twitter: str | None,
    actor_linkedin_profile: str,
    actor_linkedin_posts: str,
    actor_twitter: str,
    actor_instagram: str,
) -> tuple[dict[str, list[dict[str, Any]]], dict[str, str]]:
    """
    Returns (data, errors) where errors map platform keys to messages.
    Empty lists for skipped platforms.
    """
    client = ApifyClient(token)
    data: dict[str, list[dict[str, Any]]] = {
        'instagram': [],
        'twitter': [],
        'linkedinProfile': [],
        'linkedinPosts': [],
    }
    errors: dict[str, str] = {}

    li_url = normalize_linkedin_profile_url(linkedin)
    ig_user = instagram_username(instagram)
    tw_url = twitter_profile_url(twitter)

    tasks: list[tuple[str, Callable[[], list[dict[str, Any]]]]] = []

    if li_url:
        tasks.append(
            (
                'linkedinProfile',
                lambda u=li_url: _run_actor(
                    client,
                    actor_linkedin_profile,
                    {'urls': [u]},
                    normalize_linkedin_profile,
                ),
            )
        )
        tasks.append(
            (
                'linkedinPosts',
                lambda u=li_url: _run_actor(
                    client,
                    actor_linkedin_posts,
                    {
                        'urls': [u],
                        'limitPerSource': 10,
                        'scrapeUntil': None,
                        'deepScrape': True,
                        'rawData': False,
                    },
                    normalize_linkedin_post,
                ),
            )
        )

    if ig_user:
        tasks.append(
            (
                'instagram',
                lambda u=ig_user: _run_actor(
                    client,
                    actor_instagram,
                    {'usernames': [u]},
                    normalize_instagram_profile,
                ),
            )
        )

    if tw_url:
        tasks.append(
            (
                'twitter',
                lambda u=tw_url: _run_actor(
                    client,
                    actor_twitter,
                    {
                        'customMapFunction': '(object) => { return {...object} }',
                        'getAboutData': False,
                        'getReplies': True,
                        'includeNativeRetweets': True,
                        'maxItems': 1000,
                        'minReplyCount': 0,
                        'onlyImages': False,
                        'startUrls': [u],
                    },
                    normalize_tweet,
                ),
            )
        )

    if not tasks:
        return data, errors

    with ThreadPoolExecutor(max_workers=min(4, len(tasks))) as pool:
        future_map = {pool.submit(fn): key for key, fn in tasks}
        for fut in as_completed(future_map):
            key = future_map[fut]
            try:
                data[key] = fut.result()
            except Exception as e:  # noqa: BLE001 — surface Apify errors to client
                errors[key] = str(e)

    return data, errors
