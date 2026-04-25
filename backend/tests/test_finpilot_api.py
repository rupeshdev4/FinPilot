"""FinPilot backend API tests."""
import os, uuid, time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://finpilot-preview-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EMAIL = f"TEST_{uuid.uuid4().hex[:8]}@finpilot.ai"
PWD = "Test@1234"
NAME = "Test User"

state = {}


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/signup", json={"email": EMAIL, "password": PWD, "name": NAME}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    state["uid"] = data["user"]["id"]
    return data["token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth ----
def test_signup_creates_user_and_seeds(token, auth):
    accounts = requests.get(f"{API}/accounts", headers=auth, timeout=15).json()
    assert len(accounts) == 11, f"Expected 11 accounts, got {len(accounts)}"
    txns = requests.get(f"{API}/transactions", headers=auth, timeout=15).json()
    assert len(txns) >= 50, f"Expected ~55 txns, got {len(txns)}"
    goals = requests.get(f"{API}/goals", headers=auth, timeout=15).json()
    assert len(goals) == 3
    budget = requests.get(f"{API}/budget", headers=auth, timeout=15).json()
    assert budget.get("income", 0) > 0


def test_login_success():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PWD}, timeout=15)
    assert r.status_code == 200
    assert r.json()["user"]["email"] == EMAIL


def test_login_bad_creds():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_signup_duplicate_email():
    r = requests.post(f"{API}/auth/signup", json={"email": EMAIL, "password": PWD, "name": NAME}, timeout=15)
    assert r.status_code == 400


def test_me_with_token(auth):
    r = requests.get(f"{API}/auth/me", headers=auth, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == EMAIL


def test_protected_no_token():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code in (401, 403)


def test_protected_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.xyz"}, timeout=15)
    assert r.status_code == 401


# ---- Onboarding ----
def test_onboarding_complete(auth):
    r = requests.post(f"{API}/onboarding/complete", headers=auth, json={"goals": ["house", "retirement"], "monthly_income": 150000}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["budget"]["income"] == 150000
    me = requests.get(f"{API}/auth/me", headers=auth, timeout=15).json()
    assert me["onboarded"] is True
    assert me["monthly_income"] == 150000


# ---- Accounts CRUD ----
def test_accounts_crud(auth):
    r = requests.post(f"{API}/accounts", headers=auth, json={"name": "TEST_Acct", "type": "bank", "institution": "Axis", "balance": 10000}, timeout=15)
    assert r.status_code == 200
    aid = r.json()["id"]
    state["aid"] = aid
    r2 = requests.get(f"{API}/accounts", headers=auth, timeout=15).json()
    assert any(a["id"] == aid for a in r2)
    rd = requests.delete(f"{API}/accounts/{aid}", headers=auth, timeout=15)
    assert rd.status_code == 200
    r3 = requests.get(f"{API}/accounts", headers=auth, timeout=15).json()
    assert not any(a["id"] == aid for a in r3)


# ---- Transactions CRUD ----
def test_transactions_crud(auth):
    r = requests.post(f"{API}/transactions", headers=auth, json={"amount": -500, "category": "Food", "merchant": "TEST_M"}, timeout=15)
    assert r.status_code == 200
    tid = r.json()["id"]
    rd = requests.delete(f"{API}/transactions/{tid}", headers=auth, timeout=15)
    assert rd.status_code == 200


# ---- Goals CRUD ----
def test_goals_crud(auth):
    r = requests.post(f"{API}/goals", headers=auth, json={"name": "TEST_Goal", "target": 100000, "deadline": "2030-01-01T00:00:00+00:00"}, timeout=15)
    assert r.status_code == 200
    gid = r.json()["id"]
    rd = requests.delete(f"{API}/goals/{gid}", headers=auth, timeout=15)
    assert rd.status_code == 200


# ---- Budget ----
def test_budget_update(auth):
    payload = {"income": 100000, "essentials": 40000, "lifestyle": 20000, "savings": 20000, "sip": 20000}
    r = requests.put(f"{API}/budget", headers=auth, json=payload, timeout=15)
    assert r.status_code == 200
    g = requests.get(f"{API}/budget", headers=auth, timeout=15).json()
    assert g["income"] == 100000
    assert g["essentials"] == 40000


# ---- Net Worth ----
def test_networth_shape(auth):
    r = requests.get(f"{API}/networth", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["total", "assets", "liabilities", "history", "forecast", "milestones", "idle_cash", "idle_options", "annual_loss"]:
        assert k in d
    assert len(d["history"]) == 13
    assert len(d["forecast"]) == 24
    assert len(d["milestones"]) == 5
    assert len(d["idle_options"]) == 4
    labels = [m["label"] for m in d["milestones"]]
    assert labels == ["₹25L", "₹50L", "₹1Cr", "₹2Cr", "₹5Cr"]


# ---- Spend Analysis ----
def test_spend_analysis_shape(auth):
    r = requests.get(f"{API}/spend-analysis", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ["month", "total_spend", "savings_rate", "essential_pct", "lifestyle_pct", "category_breakdown", "trend", "weekly", "heatmap", "top_merchants", "subscriptions"]:
        assert k in d
    assert len(d["trend"]) == 12
    assert len(d["weekly"]) == 4


# ---- Recommendations ----
def test_recommendations(auth):
    r = requests.get(f"{API}/recommendations", headers=auth, timeout=15)
    assert r.status_code == 200
    recs = r.json()
    assert len(recs) == 6
    assert all("title" in x and "impact" in x for x in recs)


# ---- AI Chat ----
def test_ai_chat_claude_and_history(auth):
    r = requests.post(f"{API}/ai/chat", headers=auth, json={"message": "Should I increase SIP?", "model": "claude", "session_id": "default"}, timeout=60)
    assert r.status_code == 200
    assert "reply" in r.json() and len(r.json()["reply"]) > 0
    time.sleep(1)
    h = requests.get(f"{API}/ai/history", headers=auth, timeout=15).json()
    assert len(h) >= 1


def test_ai_chat_gpt(auth):
    r = requests.post(f"{API}/ai/chat", headers=auth, json={"message": "Tax saving tips?", "model": "gpt", "session_id": "default"}, timeout=60)
    assert r.status_code == 200
    assert "reply" in r.json()


# ---- Iteration 2: Holdings ----
def test_holdings_shape(auth):
    r = requests.get(f"{API}/holdings", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "total" in d and "items" in d
    assert d["total"] > 0
    assert len(d["items"]) == 16
    keys_required = {"cat", "value", "pct", "xirr", "benchmark", "icon"}
    for it in d["items"]:
        assert keys_required.issubset(it.keys()), f"Missing keys in {it}"
    cats = [i["cat"] for i in d["items"]]
    for must in ["Indian Equity", "US Equity", "Mutual Funds", "Crypto", "Fixed Deposits", "Bonds", "PPF", "EPF", "NPS", "Gold", "Silver", "ESOPs/RSUs", "Private Equity", "Vehicle", "Property", "Others"]:
        assert must in cats, f"Missing category {must}"
    gold = next(i for i in d["items"] if i["cat"] == "Gold")
    silver = next(i for i in d["items"] if i["cat"] == "Silver")
    assert "live_price" in gold and "change_30d" in gold
    assert "live_price" in silver and "change_30d" in silver


def test_holdings_recommendations(auth):
    r = requests.get(f"{API}/holdings/recommendations", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "risk_profile" in d
    assert "target_allocation" in d and isinstance(d["target_allocation"], dict)
    assert "recommendations" in d
    assert len(d["recommendations"]) == 5
    req = {"id", "type", "asset", "title", "action", "rationale", "confidence", "icon"}
    for rec in d["recommendations"]:
        assert req.issubset(rec.keys())


def test_holdings_no_auth():
    r = requests.get(f"{API}/holdings", timeout=15)
    assert r.status_code in (401, 403)
    r2 = requests.get(f"{API}/holdings/recommendations", timeout=15)
    assert r2.status_code in (401, 403)


# ---- Iteration 2: CIBIL ----
def test_cibil_shape(auth):
    r = requests.get(f"{API}/cibil", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["score"] == 782
    assert d["band"] == "Excellent"
    assert len(d["factors"]) == 5
    assert len(d["history"]) == 12
    assert "next_update" in d
    for f in d["factors"]:
        assert {"label", "pct", "status"}.issubset(f.keys())


def test_cibil_no_auth():
    r = requests.get(f"{API}/cibil", timeout=15)
    assert r.status_code in (401, 403)


# ---- Iteration 2: Upcoming Transactions ----
def test_upcoming_transactions(auth):
    r = requests.get(f"{API}/upcoming-transactions", headers=auth, timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 10
    req = {"day", "name", "amount", "tag", "merchant", "date"}
    for it in items:
        assert req.issubset(it.keys())
    # Sorted by date ascending
    dates = [it["date"] for it in items]
    assert dates == sorted(dates)
    tags = {it["tag"] for it in items}
    expected_any = {"income", "rent", "emi", "investment", "utility", "subscription", "insurance"}
    assert tags & expected_any


def test_upcoming_no_auth():
    r = requests.get(f"{API}/upcoming-transactions", timeout=15)
    assert r.status_code in (401, 403)


# ---- Iteration 2: Auto Budget ----
def test_budget_auto(auth):
    r = requests.post(f"{API}/budget/auto", headers=auth, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "proposed" in d and "notes" in d
    p = d["proposed"]
    assert {"income", "essentials", "lifestyle", "savings", "sip"}.issubset(p.keys())
    assert isinstance(d["notes"], list) and len(d["notes"]) >= 1


def test_budget_auto_no_auth():
    r = requests.post(f"{API}/budget/auto", timeout=15)
    assert r.status_code in (401, 403)


# ---- Iteration 2: Milestones ----
def test_milestones_default_seed_and_crud(auth):
    r = requests.get(f"{API}/milestones", headers=auth, timeout=15)
    assert r.status_code == 200
    items = r.json()
    names = {it["name"] for it in items}
    for must in ["Buy Car", "Buy House", "Child Education", "FIRE"]:
        assert must in names, f"Missing default milestone {must}"
    for it in items:
        assert {"id", "name", "icon", "tier", "target_amount", "target_age"}.issubset(it.keys())

    # POST add
    payload = {"name": "TEST_Vacation", "icon": "Plane", "tier": "short", "target_amount": 200000, "target_age": 33}
    r2 = requests.post(f"{API}/milestones", headers=auth, json=payload, timeout=15)
    assert r2.status_code == 200
    mid = r2.json()["id"]
    assert r2.json()["name"] == "TEST_Vacation"

    # GET verify persistence
    r3 = requests.get(f"{API}/milestones", headers=auth, timeout=15).json()
    assert any(m["id"] == mid for m in r3)

    # DELETE
    rd = requests.delete(f"{API}/milestones/{mid}", headers=auth, timeout=15)
    assert rd.status_code == 200
    r4 = requests.get(f"{API}/milestones", headers=auth, timeout=15).json()
    assert not any(m["id"] == mid for m in r4)


def test_milestones_no_auth():
    r = requests.get(f"{API}/milestones", timeout=15)
    assert r.status_code in (401, 403)
