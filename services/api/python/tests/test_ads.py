import json
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from services.api.python.main import app
from services.api.python.routes import ads


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def __init__(self, supabase, name):
        self.supabase = supabase
        self.name = name
        self._filters = []
        self._limit = None
        self._single = False
        self._pending_insert = None
        self._pending_upsert = None
        self._on_conflict = None

    def select(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def eq(self, field, value):
        self._filters.append(("eq", field, value))
        return self

    def contains(self, field, values):
        self._filters.append(("contains", field, values))
        return self

    def single(self):
        self._single = True
        return self

    def limit(self, value):
        self._limit = value
        return self

    def insert(self, payload):
        self._pending_insert = payload
        return self

    def upsert(self, payload, on_conflict=None):
        self._pending_upsert = payload
        self._on_conflict = on_conflict
        return self

    def execute(self):
        if self._pending_insert is not None:
            record = self.supabase._handle_insert(self.name, self._pending_insert)
            return FakeResponse(record)

        if self._pending_upsert is not None:
            record = self.supabase._handle_upsert(
                self.name, self._pending_upsert, self._on_conflict
            )
            return FakeResponse(record)

        records = list(self.supabase.storage.get(self.name, []))
        for op, field, value in self._filters:
            if op == "eq":
                records = [r for r in records if r.get(field) == value]
            elif op == "contains":
                records = [
                    r
                    for r in records
                    if any(val in (r.get(field) or []) for val in value)
                ]

        if self._limit is not None:
            records = records[: self._limit]

        if self._single:
            return FakeResponse(records[0] if records else None)

        return FakeResponse(records)


class FakeSupabase:
    def __init__(self):
        self.storage = {
            "ad_campaigns": [
                {
                    "id": "camp-123",
                    "name": "Spring Push",
                }
            ],
            "neighborhoods": [
                {
                    "id": "hood-30606",
                    "name": "Five Points",
                    "city": "Athens",
                    "state": "GA",
                    "zip_codes": ["30606"],
                    "soil_type": "clay loam",
                    "usda_hardiness_zone": "8a",
                    "common_grass_types": ["Zoysia", "Bermuda"],
                    "avg_home_value": 325000,
                    "household_count": 1200,
                }
            ],
            "ad_creatives": [],
            "ad_placements": [],
            "ad_performance": [],
        }

    def table(self, name):
        return FakeTable(self, name)

    def _handle_insert(self, name, payload):
        if isinstance(payload, list):
            records = [self._ensure_id(dict(item), name) for item in payload]
            self.storage.setdefault(name, []).extend(records)
            return records[0]

        record = self._ensure_id(dict(payload), name)
        self.storage.setdefault(name, []).append(record)
        return record

    def _handle_upsert(self, name, payload, on_conflict):
        record = dict(payload)
        key_fields = []
        if on_conflict:
            key_fields = [field.strip() for field in on_conflict.split(",")]

        existing = None
        for stored in self.storage.setdefault(name, []):
            if key_fields and all(stored.get(field) == record.get(field) for field in key_fields):
                existing = stored
                break

        if existing:
            existing.update(record)
            target = existing
        else:
            target = self._ensure_id(record, name)
            self.storage[name].append(target)

        return target

    @staticmethod
    def _ensure_id(record, name):
        if not record.get("id"):
            record["id"] = f"{name}-{uuid4()}"
        return record


class FakeOpenAIClient:
    class _ChatCompletions:
        @staticmethod
        def create(**kwargs):
            variants = {
                "variants": [
                    {
                        "platform": "facebook",
                        "headline": "Athens lawns stay lush",
                        "body": "Clay loam soils in Five Points hold 40% more moisture—perfect for summer lawns.",
                        "cta": "Get a Local Quote",
                        "hashtags": ["AthensGA", "30606"],
                    }
                ]
            }
            content = json.dumps(variants)
            message = SimpleNamespace(content=content)
            choice = SimpleNamespace(message=message)
            return SimpleNamespace(choices=[choice])

    class _Chat:
        completions = _ChatCompletions()

    def __init__(self):
        self.chat = self._Chat()


@pytest.fixture
def test_client(monkeypatch):
    fake_supabase = FakeSupabase()
    monkeypatch.setattr(
        "services.api.python.core.database.supabase", fake_supabase, raising=False
    )
    monkeypatch.setattr(
        "services.api.python.core.database.get_supabase", lambda: fake_supabase
    )
    monkeypatch.setattr(ads, "get_supabase", lambda: fake_supabase)

    async def _success():
        return True

    monkeypatch.setattr(
        "services.api.python.core.database.test_connection", _success
    )
    monkeypatch.setattr(ads, "get_openai_client", lambda: FakeOpenAIClient())

    with TestClient(app) as client:
        yield client, fake_supabase


def test_generate_ads_returns_creatives(test_client):
    client, fake_supabase = test_client

    response = client.post(
        "/api/ads/generate",
        json={
            "campaign_id": "camp-123",
            "platforms": ["facebook"],
            "ad_type": "image",
            "tone": "friendly",
            "zip_code": "30606",
            "max_neighborhoods": 1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ads"]
    assert fake_supabase.storage["ad_creatives"]


def test_publish_ads_creates_placement(monkeypatch, test_client):
    client, fake_supabase = test_client

    generate_resp = client.post(
        "/api/ads/generate",
        json={
            "campaign_id": "camp-123",
            "platforms": ["facebook"],
            "ad_type": "image",
            "tone": "friendly",
            "zip_code": "30606",
            "max_neighborhoods": 1,
        },
    )
    creative_id = generate_resp.json()["ads"][0]["id"]

    monkeypatch.setattr(
        ads,
        "publish_to_platform",
        lambda **kwargs: {
            "platform": kwargs["platform"],
            "platform_post_id": f"{kwargs['platform']}-post-1",
            "raw_response": {},
        },
    )

    publish_resp = client.post(
        "/api/ads/publish",
        json={
            "creative_id": creative_id,
            "platforms": ["facebook"],
            "zip_code": "30606",
        },
    )

    assert publish_resp.status_code == 200
    payload = publish_resp.json()
    assert payload["results"][0]["status"] == "published"
    assert fake_supabase.storage["ad_placements"]


def test_sync_performance_upserts_metrics(monkeypatch, test_client):
    client, fake_supabase = test_client

    creative_resp = client.post(
        "/api/ads/generate",
        json={
            "campaign_id": "camp-123",
            "platforms": ["facebook"],
            "ad_type": "image",
            "tone": "friendly",
            "zip_code": "30606",
            "max_neighborhoods": 1,
        },
    )
    creative_id = creative_resp.json()["ads"][0]["id"]

    monkeypatch.setattr(
        ads,
        "publish_to_platform",
        lambda **kwargs: {
            "platform": kwargs["platform"],
            "platform_post_id": "fb-post-123",
            "raw_response": {},
        },
    )

    publish_resp = client.post(
        "/api/ads/publish",
        json={
            "creative_id": creative_id,
            "platforms": ["facebook"],
            "zip_code": "30606",
        },
    )
    placement_id = publish_resp.json()["results"][0]["placement"]["id"]

    monkeypatch.setattr(
        ads,
        "fetch_platform_metrics",
        lambda **kwargs: {
            "impressions": "100",
            "reach": "90",
            "clicks": "12",
            "likes": "4",
            "comments": "1",
            "shares": "2",
            "saves": "3",
            "spend": "15.5",
        },
    )

    sync_resp = client.post(
        "/api/ads/sync-performance",
        json={
            "placement_ids": [placement_id],
        },
    )

    assert sync_resp.status_code == 200
    data = sync_resp.json()
    assert data["synced"]
    assert fake_supabase.storage["ad_performance"]
