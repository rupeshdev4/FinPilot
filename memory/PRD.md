# FinPilot — Product Requirements Document

## Original Problem Statement
AI-powered personal finance OS for India. Mobile-first SaaS with all money in one place, automated AI budgeting, idle cash optimization, deep spend analysis, milestone-based net worth, holdings analytics with XIRR, life-stage milestones (Car/House/FIRE), bond/MF recommendations, Gold/Silver tracking, scenario simulation, action-first AI advisor.

## Architecture
- **Backend:** FastAPI + MongoDB + JWT auth + Emergent Google session + emergentintegrations (Claude Sonnet 4.5 + GPT-5.2)
- **Frontend:** React + Tailwind + Shadcn UI + Recharts + Outfit/IBM Plex Sans fonts + Light/Dark mode
- **Theme:** Deep Blue #0B132B + Emerald Green #00D084 + Indigo secondary
- **Auth:** JWT email/password + Emergent Google login

## User Personas
- Indian salaried professional (₹1L-₹3L/month) tracking across HDFC/ICICI/SBI + PhonePe/Paytm + Zerodha/Groww + EPF/PPF + loans
- Aspiring FIRE planner with milestone-based wealth tracking
- Small family planner balancing critical goals (emergency, child education) with mid/long-term goals (car, house, retirement)

## Core Requirements (Static)
- Mobile-first responsive (bottom-nav 5 items + desktop sidebar 9 items)
- ₹ Lakh/Crore notation throughout
- Light + Dark mode

## Implemented Features (as of Apr 2026)

### Iteration 1 (MVP)
- Auth (signup/login/Google session)
- 4-step onboarding (goals → connect accounts → detected profile → AI budget sliders)
- Home dashboard (6 KPIs, networth chart, AI Budget Health, Action Layer feed, recent txns)
- Accounts page (banks/wallets/investments/loans CRUD + manual add + CSV upload mock)
- Transactions page (CRUD + search/filter + export CSV + category sparklines)
- Spend Analysis page (12mo trend, category donut, weekly bar, daily heatmap, top merchants, AI panel)
- Goals page (CRUD + simulator)
- Net Worth page (milestone chart, idle cash optimizer, asset allocation, contribution tracker)
- AI Coach (chat with model selector Claude/GPT)
- Action Center (categorized recommendation hub)
- Profile, Pricing
- Premium fintech UI with Outfit/IBM Plex Sans, Deep Blue + Emerald palette

### Iteration 2
- 16-bucket Holdings (Indian/US Equity, MF, Crypto, FD, Bonds, PPF, EPF, NPS, Gold, Silver, ESOPs/RSUs, PE, Vehicle, Property, Others) with XIRR vs benchmark + live Gold/Silver prices
- AI Holdings Advisor (5 personalized recs based on risk profile)
- CIBIL Score card on Home (gauge, factors, sparkline)
- Upcoming Transactions calendar + tagged list
- AI Auto Budget Builder (rolling 3mo avg) with review/accept dialog
- Life-stage milestones (Car/House/Education/FIRE) with tiers (short/mid/long/critical)

### Iteration 3 (Apr 26, 2026)
- **Super Chart:** combined life + amount milestones, current vs optimized, range tabs (1Y/5Y/10Y/Lifetime), inflation toggle
- **Scenario Simulator:** 5 sliders (SIP boost, step-up%, bonus, salary growth, expected return) live-updating chart
- **Allocation Analytics:** current vs recommended donuts + risk profile tabs + rebalance impact "+₹38L in 15Y"
- **Bond Recommendation Engine:** 9 bonds across AAA/AA/A/A-/BBB/BB with rating filter
- **Mutual Fund Analyst:** 9 categories (Large/Flexi/Mid/Small/Hybrid/Index/Debt/ELSS/International) with 1Y/3Y/5Y returns + expense + Switch CTA
- **Gold/Silver Live Tracker:** spot, 1M/3M/1Y/from-peak, 1Y trend chart, allocation impact, Start staggered buy
- **XIRR Analytics:** asset, XIRR, benchmark, alpha, quality score progress bar
- **Goals tier filter** + tier dropdown in add dialog (6 sample goals seeded)
- **Upcoming-tx click → detail dialog** with reminder Switch + AI low-balance alert for EMI rows

## Test Status
- Iter-3: **45/45 backend tests pass**, 100% frontend flows verified, no defects
- Test credentials: demo@finpilot.ai / demo123 (auto-seeded with 6 goals, 4 milestones, 11 accounts, ~55 txns, default budget)

## Mocked / Phase-2 Backlog (P0/P1/P2)
**P0 (paid integrations):**
- Real broker XIRR sync (Zerodha Console / Groww API / Vested for US stocks)
- Real Gold/Silver live feed (MMTC-PAMP / India Bullion API)
- CIBIL bureau API (paid)

**P1:**
- Real bank/wallet account aggregation (Setu / Finbox / Plaid India)
- Stripe/Razorpay subscription billing (Pro ₹499 / Family ₹799 plans)
- PDF Monthly Review export
- Family mode (shared dashboard, couple goals)
- Real OTP mobile login (Twilio)

**P2:**
- Tax-loss harvesting alerts (booking unrealized losses near year-end)
- Tax estimation engine (80C/80D/80CCD/HRA optimizer)
- Insurance gap analysis
- Will/nominee tracker
- Refactor: split server.py (1140 lines) into routers (auth/networth/holdings/markets/ai)

## Next Tasks
- Phase-2 broker OAuth integration (Zerodha first, ~ Console API)
- Live precious metals feed
- Stripe subscription gating for Pro features
- Polish: aria-describedby on dialogs, fix Recharts width(-1) warnings
