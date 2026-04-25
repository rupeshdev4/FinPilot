"""FinPilot - AI-powered Personal Finance OS for India."""
import os
import uuid
import logging
import random
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import jwt
import bcrypt
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ----- Setup -----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = os.environ['JWT_ALGORITHM']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="FinPilot API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finpilot")


# ----- Models -----
class SignupReq(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class GoogleSessionReq(BaseModel):
    session_id: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    avatar: Optional[str] = None
    onboarded: bool = False
    risk_profile: str = "moderate"
    monthly_income: float = 0
    goals_chosen: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OnboardingReq(BaseModel):
    goals: List[str]
    monthly_income: float

class Account(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str  # bank | wallet | investment | loan
    institution: str
    balance: float
    change_pct: float = 0
    health: str = "good"  # good | warn | bad
    last_sync: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(BaseModel):
    name: str
    type: str
    institution: str
    balance: float

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime
    amount: float  # negative = debit, positive = credit
    category: str
    merchant: str
    account_id: Optional[str] = None
    note: Optional[str] = None

class TransactionCreate(BaseModel):
    date: Optional[datetime] = None
    amount: float
    category: str
    merchant: str
    account_id: Optional[str] = None
    note: Optional[str] = None

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    icon: str = "Target"
    target: float
    current: float = 0
    monthly_contrib: float = 0
    deadline: datetime
    instrument: str = "Mutual Fund SIP"

class GoalCreate(BaseModel):
    name: str
    icon: Optional[str] = "Target"
    target: float
    current: Optional[float] = 0
    monthly_contrib: Optional[float] = 0
    deadline: datetime
    instrument: Optional[str] = "Mutual Fund SIP"

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    income: float
    essentials: float
    lifestyle: float
    savings: float
    sip: float
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetUpdate(BaseModel):
    income: float
    essentials: float
    lifestyle: float
    savings: float
    sip: float

class ChatMsgReq(BaseModel):
    message: str
    session_id: str = "default"
    model: str = "claude"  # claude | gpt


# ----- Helpers -----
def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

def serialize(d: dict) -> dict:
    if not d:
        return d
    out = {k: v for k, v in d.items() if k != "_id" and k != "password_hash"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


# ----- Seed Data -----
INDIA_BANKS = ["HDFC Bank", "ICICI Bank", "SBI"]
WALLETS = ["Paytm", "PhonePe", "Google Pay"]
BROKERS = ["Zerodha", "Groww"]
MERCHANTS = {
    "Food": ["Swiggy", "Zomato", "Blinkit", "Big Basket", "Starbucks", "Cafe Coffee Day"],
    "Travel": ["Uber", "Ola", "IndiGo", "IRCTC", "MakeMyTrip"],
    "Shopping": ["Amazon", "Flipkart", "Myntra", "Nykaa", "Croma"],
    "Bills": ["Airtel", "Jio", "BESCOM", "Tata Power", "Act Fibernet"],
    "Rent": ["NoBroker", "Landlord Transfer"],
    "EMI": ["HDFC Home Loan", "Bajaj Finserv", "ICICI Auto Loan"],
    "Salary": ["Acme Corp Payroll"],
    "Investments": ["Zerodha Coin", "Groww SIP", "ET Money"],
    "Healthcare": ["Apollo Pharmacy", "Practo", "1mg"],
    "Entertainment": ["Netflix", "Spotify", "Hotstar", "BookMyShow"],
    "Other": ["Misc"],
}

async def seed_demo_data(user_id: str):
    """Seed realistic Indian fintech data for a new user."""
    now = datetime.now(timezone.utc)

    # Accounts
    accounts = [
        {"name": "HDFC Savings", "type": "bank", "institution": "HDFC Bank", "balance": 285000, "change_pct": 2.3, "health": "good"},
        {"name": "ICICI Salary", "type": "bank", "institution": "ICICI Bank", "balance": 145000, "change_pct": -1.2, "health": "good"},
        {"name": "SBI Joint", "type": "bank", "institution": "SBI", "balance": 95000, "change_pct": 0.8, "health": "good"},
        {"name": "PhonePe Wallet", "type": "wallet", "institution": "PhonePe", "balance": 4500, "change_pct": 12, "health": "good"},
        {"name": "Paytm", "type": "wallet", "institution": "Paytm", "balance": 2300, "change_pct": -5, "health": "good"},
        {"name": "Zerodha Equity", "type": "investment", "institution": "Zerodha", "balance": 750000, "change_pct": 14.8, "health": "good"},
        {"name": "Groww Mutual Funds", "type": "investment", "institution": "Groww", "balance": 420000, "change_pct": 11.2, "health": "good"},
        {"name": "EPF", "type": "investment", "institution": "EPFO", "balance": 180000, "change_pct": 8.1, "health": "good"},
        {"name": "PPF", "type": "investment", "institution": "SBI PPF", "balance": 95000, "change_pct": 7.1, "health": "good"},
        {"name": "Personal Loan", "type": "loan", "institution": "HDFC Bank", "balance": -150000, "change_pct": -8.2, "health": "warn"},
        {"name": "Car Loan", "type": "loan", "institution": "ICICI Bank", "balance": -50000, "change_pct": -12.5, "health": "good"},
    ]
    docs = []
    for a in accounts:
        d = {**a, "id": str(uuid.uuid4()), "user_id": user_id, "last_sync": now.isoformat()}
        docs.append(d)
    await db.accounts.insert_many([d.copy() for d in docs])

    # Transactions - last 90 days, ~50 txns
    cats_dist = ["Salary"] + ["Food"]*8 + ["Travel"]*6 + ["Shopping"]*7 + ["Bills"]*5 + ["Rent"] + ["EMI"]*2 + ["Investments"]*3 + ["Healthcare"]*3 + ["Entertainment"]*5 + ["Other"]*4
    txns = []
    for i in range(55):
        days_ago = random.randint(0, 90)
        date = now - timedelta(days=days_ago, hours=random.randint(0, 23))
        cat = random.choice(cats_dist)
        merchant = random.choice(MERCHANTS[cat])
        if cat == "Salary":
            amt = 120000
            date = (now - timedelta(days=random.choice([1, 31, 61])))
        elif cat == "Rent":
            amt = -32000
            date = (now - timedelta(days=random.choice([3, 33, 63])))
        elif cat == "EMI":
            amt = -18500 if "Home" in merchant else -8500
        elif cat == "Investments":
            amt = -25000 if "SIP" in merchant else -random.choice([5000, 10000, 15000])
        elif cat == "Bills":
            amt = -random.choice([499, 799, 1500, 2400, 3500])
        elif cat == "Food":
            amt = -random.choice([180, 280, 420, 650, 850, 1200])
        elif cat == "Travel":
            amt = -random.choice([120, 180, 350, 800, 2400, 6500])
        elif cat == "Shopping":
            amt = -random.choice([499, 1200, 2500, 4500, 7800])
        elif cat == "Healthcare":
            amt = -random.choice([300, 850, 1500, 3200])
        elif cat == "Entertainment":
            amt = -random.choice([149, 199, 399, 799])
        else:
            amt = -random.choice([200, 500, 1000, 2000])
        txns.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "date": date.isoformat(),
            "amount": amt,
            "category": cat,
            "merchant": merchant,
        })
    await db.transactions.insert_many(txns)

    # Goals
    goals = [
        {"name": "Buy House", "icon": "Home", "target": 8000000, "current": 1500000, "monthly_contrib": 35000, "deadline": (now + timedelta(days=365*7)).isoformat(), "instrument": "Equity Mutual Funds"},
        {"name": "Emergency Fund", "icon": "Shield", "target": 600000, "current": 285000, "monthly_contrib": 10000, "deadline": (now + timedelta(days=365*2)).isoformat(), "instrument": "Liquid Fund"},
        {"name": "Retirement", "icon": "Sunset", "target": 50000000, "current": 1300000, "monthly_contrib": 25000, "deadline": (now + timedelta(days=365*25)).isoformat(), "instrument": "Index Fund + EPF"},
    ]
    for g in goals:
        await db.goals.insert_one({**g, "id": str(uuid.uuid4()), "user_id": user_id})

    # Budget
    budget = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "income": 120000,
        "essentials": 55000,
        "lifestyle": 20000,
        "savings": 20000,
        "sip": 25000,
        "updated_at": now.isoformat(),
    }
    await db.budgets.insert_one(budget)


# ----- Auth Routes -----
@api.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(email=req.email, name=req.name)
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["password_hash"] = hash_pw(req.password)
    await db.users.insert_one(doc)
    await seed_demo_data(user.id)
    return {"token": make_token(user.id), "user": serialize(doc)}

@api.post("/auth/login")
async def login(req: LoginReq):
    u = await db.users.find_one({"email": req.email})
    if not u or not verify_pw(req.password, u.get("password_hash", "")):
        raise HTTPException(401, "Invalid credentials")
    return {"token": make_token(u["id"]), "user": serialize(u)}

@api.post("/auth/google-session")
async def google_session(req: GoogleSessionReq):
    """Process Emergent Google Auth session."""
    async with httpx.AsyncClient() as hc:
        try:
            r = await hc.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": req.session_id},
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            raise HTTPException(401, f"Invalid session: {e}")
    email = data.get("email")
    name = data.get("name", email)
    picture = data.get("picture")
    if not email:
        raise HTTPException(401, "Email missing from session")
    u = await db.users.find_one({"email": email})
    if not u:
        user = User(email=email, name=name, avatar=picture)
        doc = user.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["password_hash"] = ""
        await db.users.insert_one(doc)
        await seed_demo_data(user.id)
        u = doc
    return {"token": make_token(u["id"]), "user": serialize(u)}

@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return serialize(user)


# ----- Onboarding -----
@api.post("/onboarding/complete")
async def onboarding_complete(req: OnboardingReq, user: dict = Depends(current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"goals_chosen": req.goals, "monthly_income": req.monthly_income, "onboarded": True}},
    )
    # Generate AI Budget
    income = req.monthly_income or 120000
    budget = {
        "income": income,
        "essentials": round(income * 0.46),
        "lifestyle": round(income * 0.17),
        "savings": round(income * 0.17),
        "sip": round(income * 0.20),
    }
    return {"ok": True, "budget": budget}


# ----- Accounts -----
@api.get("/accounts")
async def get_accounts(user: dict = Depends(current_user)):
    items = await db.accounts.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return items

@api.post("/accounts")
async def create_account(req: AccountCreate, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **req.model_dump(),
        "change_pct": 0,
        "health": "good",
        "last_sync": datetime.now(timezone.utc).isoformat(),
    }
    await db.accounts.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user: dict = Depends(current_user)):
    await db.accounts.delete_one({"id": account_id, "user_id": user["id"]})
    return {"ok": True}


# ----- Transactions -----
@api.get("/transactions")
async def get_transactions(user: dict = Depends(current_user), limit: int = 200):
    items = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(limit)
    return items

@api.post("/transactions")
async def create_transaction(req: TransactionCreate, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "date": (req.date or datetime.now(timezone.utc)).isoformat(),
        "amount": req.amount,
        "category": req.category,
        "merchant": req.merchant,
        "account_id": req.account_id,
        "note": req.note,
    }
    await db.transactions.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: str, user: dict = Depends(current_user)):
    await db.transactions.delete_one({"id": tx_id, "user_id": user["id"]})
    return {"ok": True}


# ----- Goals -----
@api.get("/goals")
async def get_goals(user: dict = Depends(current_user)):
    items = await db.goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return items

@api.post("/goals")
async def create_goal(req: GoalCreate, user: dict = Depends(current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **req.model_dump(),
    }
    doc["deadline"] = doc["deadline"].isoformat()
    await db.goals.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(current_user)):
    await db.goals.delete_one({"id": goal_id, "user_id": user["id"]})
    return {"ok": True}


# ----- Budget -----
@api.get("/budget")
async def get_budget(user: dict = Depends(current_user)):
    b = await db.budgets.find_one({"user_id": user["id"]}, {"_id": 0})
    return b or {"income": 0, "essentials": 0, "lifestyle": 0, "savings": 0, "sip": 0}

@api.put("/budget")
async def update_budget(req: BudgetUpdate, user: dict = Depends(current_user)):
    doc = {**req.model_dump(), "user_id": user["id"], "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.budgets.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return doc


# ----- Net Worth & Idle Cash -----
@api.get("/networth")
async def networth(user: dict = Depends(current_user)):
    accounts = await db.accounts.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    total = sum(a["balance"] for a in accounts)
    assets = sum(a["balance"] for a in accounts if a["balance"] > 0)
    liab = sum(a["balance"] for a in accounts if a["balance"] < 0)

    # 12 month historical (synthetic but stable)
    now = datetime.now(timezone.utc)
    history = []
    base = total - 350000
    for i in range(12, -1, -1):
        v = base + (350000 / 12) * (12 - i) + random.uniform(-15000, 15000)
        history.append({
            "month": (now - timedelta(days=30 * i)).strftime("%b %y"),
            "value": round(v),
        })
    history[-1]["value"] = total

    # Forecast next 24 months - current vs optimized path
    forecast = []
    cur, opt = total, total
    for i in range(1, 25):
        cur += 45000  # current path: 45k/month savings
        opt += 62000  # optimized: 62k/month
        forecast.append({
            "month": (now + timedelta(days=30 * i)).strftime("%b %y"),
            "current": round(cur),
            "optimized": round(opt),
        })

    # Milestones
    milestones_targets = [2500000, 5000000, 10000000, 20000000, 50000000]
    milestone_labels = ["₹25L", "₹50L", "₹1Cr", "₹2Cr", "₹5Cr"]
    milestones = []
    for t, lbl in zip(milestones_targets, milestone_labels):
        achieved = total >= t
        eta_months = None
        if not achieved:
            need = t - total
            eta_months = max(1, round(need / 45000))
        milestones.append({
            "target": t,
            "label": lbl,
            "achieved": achieved,
            "eta_months": eta_months,
        })

    # Idle Cash Optimizer
    bank_idle = sum(a["balance"] for a in accounts if a["type"] == "bank")
    emergency_buffer = 100000
    idle_cash = max(0, bank_idle - emergency_buffer)
    options = [
        {"name": "Liquid Fund", "return_pct": 6.8, "liquidity": "T+1", "risk": "Low", "horizon": "0-6 months", "recommended_amt": round(idle_cash * 0.4)},
        {"name": "Arbitrage Fund", "return_pct": 7.2, "liquidity": "T+2", "risk": "Low", "horizon": "3-12 months", "recommended_amt": round(idle_cash * 0.25)},
        {"name": "FD Ladder (6/12 mo)", "return_pct": 7.1, "liquidity": "Locked", "risk": "Very Low", "horizon": "6-12 months", "recommended_amt": round(idle_cash * 0.2)},
        {"name": "Debt Mutual Fund", "return_pct": 7.5, "liquidity": "T+3", "risk": "Low-Mid", "horizon": "1-3 years", "recommended_amt": round(idle_cash * 0.15)},
    ]

    return {
        "total": round(total),
        "assets": round(assets),
        "liabilities": round(abs(liab)),
        "history": history,
        "forecast": forecast,
        "milestones": milestones,
        "idle_cash": round(idle_cash),
        "idle_options": options,
        "annual_loss": round(idle_cash * 0.05),  # opportunity cost
    }


# ----- Spend Analysis -----
@api.get("/spend-analysis")
async def spend_analysis(user: dict = Depends(current_user)):
    txns = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    now = datetime.now(timezone.utc)

    def parse(d):
        return datetime.fromisoformat(d) if isinstance(d, str) else d

    this_month = [t for t in txns if parse(t["date"]).month == now.month and parse(t["date"]).year == now.year]
    last_month_dt = now.replace(day=1) - timedelta(days=1)
    last_month = [t for t in txns if parse(t["date"]).month == last_month_dt.month and parse(t["date"]).year == last_month_dt.year]

    spend_this = sum(-t["amount"] for t in this_month if t["amount"] < 0 and t["category"] not in ("Investments",))
    spend_last = sum(-t["amount"] for t in last_month if t["amount"] < 0 and t["category"] not in ("Investments",))
    income_this = sum(t["amount"] for t in this_month if t["amount"] > 0)

    # Category breakdown
    cats = {}
    for t in this_month:
        if t["amount"] < 0:
            cats.setdefault(t["category"], 0)
            cats[t["category"]] += -t["amount"]
    cat_break = [{"name": k, "value": round(v)} for k, v in sorted(cats.items(), key=lambda x: -x[1])]

    # 12-month trend
    trend = []
    for i in range(11, -1, -1):
        target = now - timedelta(days=30 * i)
        ts = [t for t in txns if parse(t["date"]).month == target.month and parse(t["date"]).year == target.year and t["amount"] < 0 and t["category"] != "Investments"]
        trend.append({
            "month": target.strftime("%b"),
            "spend": round(sum(-t["amount"] for t in ts)),
        })

    # Weekly pattern (this month)
    weekly = [{"week": f"W{i+1}", "spend": 0} for i in range(4)]
    for t in this_month:
        if t["amount"] < 0:
            day = parse(t["date"]).day
            w = min(3, (day - 1) // 7)
            weekly[w]["spend"] += -t["amount"]
    for w in weekly:
        w["spend"] = round(w["spend"])

    # Daily heatmap (last 30 days)
    heatmap = {}
    for t in txns:
        d = parse(t["date"])
        if (now - d).days <= 31 and t["amount"] < 0 and t["category"] != "Investments":
            key = d.strftime("%Y-%m-%d")
            heatmap[key] = heatmap.get(key, 0) + (-t["amount"])
    heat_arr = [{"date": k, "spend": round(v)} for k, v in sorted(heatmap.items())]

    # Top merchants
    merchants = {}
    for t in this_month:
        if t["amount"] < 0:
            merchants.setdefault(t["merchant"], {"merchant": t["merchant"], "amount": 0, "count": 0, "category": t["category"]})
            merchants[t["merchant"]]["amount"] += -t["amount"]
            merchants[t["merchant"]]["count"] += 1
    top_merchants = sorted(merchants.values(), key=lambda x: -x["amount"])[:8]
    for m in top_merchants:
        m["amount"] = round(m["amount"])

    # Subscriptions (from Bills + Entertainment)
    subs = [m for m in top_merchants if m["category"] in ("Bills", "Entertainment") and m["count"] >= 1]

    return {
        "month": now.strftime("%B %Y"),
        "total_spend": round(spend_this),
        "last_month_spend": round(spend_last),
        "income": round(income_this),
        "savings_rate": round(((income_this - spend_this) / income_this * 100) if income_this else 0, 1),
        "essential_pct": round((sum(cats.get(c, 0) for c in ["Rent", "Bills", "EMI", "Healthcare"]) / spend_this * 100) if spend_this else 0, 1),
        "lifestyle_pct": round((sum(cats.get(c, 0) for c in ["Food", "Shopping", "Entertainment", "Travel"]) / spend_this * 100) if spend_this else 0, 1),
        "category_breakdown": cat_break,
        "trend": trend,
        "weekly": weekly,
        "heatmap": heat_arr,
        "top_merchants": top_merchants,
        "subscriptions": subs,
    }


# ----- Recommendations -----
@api.get("/recommendations")
async def recommendations(user: dict = Depends(current_user)):
    # Pull live data and generate dynamic recommendations
    accounts = await db.accounts.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    bank_idle = sum(a["balance"] for a in accounts if a["type"] == "bank")
    idle = max(0, bank_idle - 100000)
    recs = [
        {
            "id": "r1",
            "title": "Cut dining ₹3,000 → add to SIP",
            "impact": "Retire 8 months earlier",
            "category": "Save More",
            "priority": "high",
            "confidence": 92,
            "icon": "Utensils",
        },
        {
            "id": "r2",
            "title": f"Move ₹{idle//1000}K idle cash → liquid fund",
            "impact": f"Earn +₹{round(idle*0.05)//1000}K extra per year",
            "category": "Optimize Cash",
            "priority": "high",
            "confidence": 96,
            "icon": "Banknote",
        },
        {
            "id": "r3",
            "title": "Increase SIP by ₹5,000",
            "impact": "₹42L more at retirement",
            "category": "Invest Better",
            "priority": "medium",
            "confidence": 88,
            "icon": "TrendingUp",
        },
        {
            "id": "r4",
            "title": "Refinance home loan at 8.4%",
            "impact": "Save ₹1.2L interest over tenure",
            "category": "Reduce Debt",
            "priority": "medium",
            "confidence": 81,
            "icon": "Home",
        },
        {
            "id": "r5",
            "title": "Cancel unused Netflix + Spotify duo",
            "impact": "Save ₹499/month → ₹6K/year",
            "category": "Fix Budget Leaks",
            "priority": "low",
            "confidence": 78,
            "icon": "Scissors",
        },
        {
            "id": "r6",
            "title": "Use bonus ₹50K → prepay car loan",
            "impact": "Free ₹6K/month EMI early",
            "category": "Reach Goals Faster",
            "priority": "medium",
            "confidence": 85,
            "icon": "Zap",
        },
    ]
    return recs


# ----- AI Coach -----
@api.post("/ai/chat")
async def ai_chat(req: ChatMsgReq, user: dict = Depends(current_user)):
    # Build context from user's data
    accounts = await db.accounts.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    goals = await db.goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(20)
    budget = await db.budgets.find_one({"user_id": user["id"]}, {"_id": 0}) or {}

    nw = sum(a["balance"] for a in accounts)
    bank_idle = sum(a["balance"] for a in accounts if a["type"] == "bank")
    invested = sum(a["balance"] for a in accounts if a["type"] == "investment")
    debt = abs(sum(a["balance"] for a in accounts if a["type"] == "loan"))

    sys_msg = f"""You are FinPilot AI, a sharp Indian personal finance coach. User's snapshot:
- Net Worth: ₹{nw:,.0f}
- Cash in banks: ₹{bank_idle:,.0f}
- Investments: ₹{invested:,.0f}
- Debt: ₹{debt:,.0f}
- Monthly Income: ₹{budget.get('income', 0):,.0f}
- SIP: ₹{budget.get('sip', 0):,.0f}, Savings: ₹{budget.get('savings', 0):,.0f}
- Goals: {[g['name'] for g in goals]}

Always give CONCRETE, ACTIONABLE Indian-context advice with specific ₹ numbers. Be concise (3-5 sentences). Use ₹/L/Cr formatting. Recommend Indian instruments (SIPs, Liquid Funds, FDs, EPF, NPS, PPF). Never give generic advice."""

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        provider, model = ("anthropic", "claude-sonnet-4-5-20250929") if req.model == "claude" else ("openai", "gpt-5.2")
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{user['id']}-{req.session_id}",
            system_message=sys_msg,
        ).with_model(provider, model)
        reply = await chat.send_message(UserMessage(text=req.message))
    except Exception as e:
        logger.exception("AI chat failed")
        reply = f"(AI offline: {str(e)[:80]}) Quick advice: Looking at your numbers, deploying idle cash to a liquid fund and increasing your SIP by 10% would meaningfully accelerate your goals."

    # Persist
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": req.session_id,
        "user_msg": req.message,
        "assistant_msg": reply,
        "model": req.model,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chats.insert_one(doc.copy())
    return {"reply": reply}

@api.get("/ai/history")
async def ai_history(user: dict = Depends(current_user), session_id: str = "default"):
    items = await db.chats.find({"user_id": user["id"], "session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return items


# ----- Holdings -----
HOLDINGS_TEMPLATE = [
    {"cat": "Indian Equity", "value": 320000, "xirr": 18.4, "benchmark": 14.2, "icon": "TrendingUp"},
    {"cat": "US Equity", "value": 180000, "xirr": 12.1, "benchmark": 11.8, "icon": "Globe"},
    {"cat": "Mutual Funds", "value": 420000, "xirr": 11.2, "benchmark": 14.0, "icon": "PieChart"},
    {"cat": "Crypto", "value": 45000, "xirr": -8.2, "benchmark": 0, "icon": "Bitcoin"},
    {"cat": "Fixed Deposits", "value": 150000, "xirr": 7.1, "benchmark": 6.8, "icon": "Lock"},
    {"cat": "Bonds", "value": 90000, "xirr": 7.8, "benchmark": 7.2, "icon": "Receipt"},
    {"cat": "PPF", "value": 95000, "xirr": 7.1, "benchmark": 7.1, "icon": "Shield"},
    {"cat": "EPF", "value": 180000, "xirr": 8.1, "benchmark": 8.1, "icon": "Building2"},
    {"cat": "NPS", "value": 65000, "xirr": 9.4, "benchmark": 9.0, "icon": "Sunset"},
    {"cat": "Gold", "value": 120000, "xirr": 10.8, "benchmark": 10.0, "icon": "Coins", "live_price": 7240, "change_30d": -11.4},
    {"cat": "Silver", "value": 35000, "xirr": 6.2, "benchmark": 8.0, "icon": "Coins", "live_price": 92500, "change_30d": -12.8},
    {"cat": "ESOPs/RSUs", "value": 280000, "xirr": 22.5, "benchmark": 14.2, "icon": "Award"},
    {"cat": "Private Equity", "value": 0, "xirr": 0, "benchmark": 0, "icon": "Briefcase"},
    {"cat": "Vehicle", "value": 450000, "xirr": -8.0, "benchmark": 0, "icon": "Car"},
    {"cat": "Property", "value": 0, "xirr": 0, "benchmark": 0, "icon": "Home"},
    {"cat": "Others", "value": 0, "xirr": 0, "benchmark": 0, "icon": "MoreHorizontal"},
]

@api.get("/holdings")
async def holdings(user: dict = Depends(current_user)):
    total = sum(h["value"] for h in HOLDINGS_TEMPLATE)
    out = []
    for h in HOLDINGS_TEMPLATE:
        d = dict(h)
        d["pct"] = round(h["value"] / total * 100, 1) if total else 0
        out.append(d)
    return {"total": total, "items": out}

@api.get("/holdings/recommendations")
async def holdings_recs(user: dict = Depends(current_user)):
    risk = user.get("risk_profile", "moderate")
    target_alloc = {
        "conservative": {"Indian Equity": 20, "US Equity": 5, "Mutual Funds": 15, "Bonds": 25, "Fixed Deposits": 20, "Gold": 10, "PPF/EPF": 5},
        "moderate": {"Indian Equity": 30, "US Equity": 10, "Mutual Funds": 25, "Bonds": 10, "Fixed Deposits": 10, "Gold": 8, "PPF/EPF": 7},
        "aggressive": {"Indian Equity": 40, "US Equity": 15, "Mutual Funds": 25, "Bonds": 5, "Fixed Deposits": 5, "Gold": 5, "Crypto": 5},
    }
    recs = [
        {"id": "h1", "type": "buy", "asset": "Gold", "title": "Gold corrected -11.4% in 30 days", "action": "Good time to add ₹50K to Gold", "rationale": "Historical mean-reversion + INR weakness tailwind. Live: ₹7,240/g (24K)", "confidence": 88, "icon": "Coins"},
        {"id": "h2", "type": "buy", "asset": "Silver", "title": "Silver down -12.8% — accumulation zone", "action": "Add ₹25K to Silver SGB or ETF", "rationale": "Industrial demand intact. Live: ₹92,500/kg", "confidence": 82, "icon": "Coins"},
        {"id": "h3", "type": "switch", "asset": "Mutual Funds", "title": "Your MFs returning 11.2% vs Nifty 14.0%", "action": "Switch under-performing fund → Parag Parikh Flexi Cap or HDFC Mid-Cap Opportunities", "rationale": "Both in top quartile last 5y, lower expense ratio.", "confidence": 91, "icon": "PieChart"},
        {"id": "h4", "type": "add", "asset": "Bonds", "title": "Add high-grade corporate bonds", "action": "AAA: HDFC 8.05% 2029, REC 7.95% 2030 · AA: Tata Capital 8.4% 2027", "rationale": "Lock in pre-rate-cut yields. Tax-efficient via debt MF route.", "confidence": 86, "icon": "Receipt"},
        {"id": "h5", "type": "rebalance", "asset": "Allocation", "title": f"Allocation drift detected — {risk} target", "action": "Trim ESOPs concentration · add to US Equity (currently underweight)", "rationale": f"Your {risk} target wants 10% US Equity; you're at 7.5%.", "confidence": 90, "icon": "Sliders"},
    ]
    return {"risk_profile": risk, "target_allocation": target_alloc.get(risk, target_alloc["moderate"]), "recommendations": recs}


# ----- CIBIL -----
@api.get("/cibil")
async def cibil(user: dict = Depends(current_user)):
    score = 782
    factors = [
        {"label": "Payment History", "pct": 95, "status": "excellent"},
        {"label": "Credit Utilization", "pct": 28, "status": "good"},
        {"label": "Credit Age", "pct": 72, "status": "good"},
        {"label": "Credit Mix", "pct": 80, "status": "good"},
        {"label": "Recent Inquiries", "pct": 90, "status": "excellent"},
    ]
    history = [{"month": (datetime.now(timezone.utc) - timedelta(days=30 * i)).strftime("%b"), "score": score - random.randint(0, 15)} for i in range(11, -1, -1)]
    return {"score": score, "band": "Excellent", "factors": factors, "history": history, "next_update": "in 12 days"}


# ----- Upcoming Transactions -----
@api.get("/upcoming-transactions")
async def upcoming(user: dict = Depends(current_user)):
    now = datetime.now(timezone.utc)
    items = [
        {"day": 1, "name": "Salary Credit", "amount": 120000, "tag": "income", "merchant": "Acme Corp"},
        {"day": 3, "name": "Rent", "amount": -32000, "tag": "rent", "merchant": "NoBroker"},
        {"day": 5, "name": "Home Loan EMI", "amount": -18500, "tag": "emi", "merchant": "HDFC"},
        {"day": 7, "name": "Mutual Fund SIP", "amount": -15000, "tag": "investment", "merchant": "Groww"},
        {"day": 7, "name": "Equity SIP", "amount": -10000, "tag": "investment", "merchant": "Zerodha Coin"},
        {"day": 10, "name": "Electricity Bill", "amount": -2400, "tag": "utility", "merchant": "BESCOM"},
        {"day": 12, "name": "Internet (ACT)", "amount": -1500, "tag": "utility", "merchant": "ACT Fibernet"},
        {"day": 15, "name": "Car Loan EMI", "amount": -8500, "tag": "emi", "merchant": "ICICI"},
        {"day": 18, "name": "Netflix", "amount": -649, "tag": "subscription", "merchant": "Netflix"},
        {"day": 20, "name": "Mobile (Jio)", "amount": -799, "tag": "utility", "merchant": "Jio"},
        {"day": 22, "name": "Spotify", "amount": -149, "tag": "subscription", "merchant": "Spotify"},
        {"day": 25, "name": "Gym Membership", "amount": -1999, "tag": "subscription", "merchant": "Cult.fit"},
        {"day": 28, "name": "Insurance Premium", "amount": -3200, "tag": "insurance", "merchant": "HDFC Ergo"},
    ]
    for it in items:
        dt = now.replace(day=min(it["day"], 28), hour=10, minute=0, second=0, microsecond=0)
        if dt < now:
            dt = (dt.replace(day=1) + timedelta(days=32)).replace(day=min(it["day"], 28))
        it["date"] = dt.isoformat()
    return sorted(items, key=lambda x: x["date"])


# ----- Auto Budget Builder -----
@api.post("/budget/auto")
async def budget_auto(user: dict = Depends(current_user)):
    txns = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    income_avg = 120000
    if txns:
        salaries = [t["amount"] for t in txns if t["category"] == "Salary" and t["amount"] > 0]
        if salaries:
            income_avg = round(sum(salaries) / len(salaries))
    cat_avg = {}
    for t in txns:
        if t["amount"] < 0:
            cat_avg.setdefault(t["category"], []).append(-t["amount"])
    months = 3
    essentials_cats = ["Rent", "EMI", "Bills", "Healthcare"]
    lifestyle_cats = ["Food", "Travel", "Shopping", "Entertainment"]
    essentials = round(sum(sum(cat_avg.get(c, [])) for c in essentials_cats) / months) or 50000
    lifestyle = round(sum(sum(cat_avg.get(c, [])) for c in lifestyle_cats) / months) or 18000
    sip = round(sum(cat_avg.get("Investments", [])) / months) or 25000
    savings = max(5000, income_avg - essentials - lifestyle - sip)
    proposed = {"income": income_avg, "essentials": essentials, "lifestyle": lifestyle, "savings": savings, "sip": sip}
    notes = [
        f"Based on rolling 3-month average across {len(txns)} transactions.",
        f"Essentials trending at {round(essentials/income_avg*100)}% of income — {'healthy' if essentials/income_avg < 0.5 else 'high'}.",
        f"Lifestyle at {round(lifestyle/income_avg*100)}% — {'within range' if lifestyle/income_avg < 0.25 else 'review dining'}.",
        "Auto-rebalances every month based on your behaviour.",
    ]
    return {"proposed": proposed, "notes": notes}


# ----- Life Milestones -----
class MilestoneIn(BaseModel):
    name: str
    icon: str = "Target"
    tier: str = "mid"  # short | mid | long | critical
    target_amount: float
    target_age: int

@api.get("/milestones")
async def list_milestones(user: dict = Depends(current_user)):
    items = await db.milestones.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    if not items:
        defaults = [
            {"name": "Buy Car", "icon": "Car", "tier": "short", "target_amount": 1200000, "target_age": 32},
            {"name": "Buy House", "icon": "Home", "tier": "long", "target_amount": 8000000, "target_age": 38},
            {"name": "Child Education", "icon": "GraduationCap", "tier": "critical", "target_amount": 5000000, "target_age": 48},
            {"name": "FIRE", "icon": "Sunset", "tier": "long", "target_amount": 50000000, "target_age": 55},
        ]
        for d in defaults:
            doc = {"id": str(uuid.uuid4()), "user_id": user["id"], **d}
            await db.milestones.insert_one(doc.copy())
            doc.pop("_id", None)
            items.append(doc)
    return items

@api.post("/milestones")
async def add_milestone(req: MilestoneIn, user: dict = Depends(current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], **req.model_dump()}
    await db.milestones.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api.delete("/milestones/{mid}")
async def del_milestone(mid: str, user: dict = Depends(current_user)):
    await db.milestones.delete_one({"id": mid, "user_id": user["id"]})
    return {"ok": True}


# ----- Health -----
@api.get("/")
async def root():
    return {"app": "FinPilot", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
