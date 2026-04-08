---
name: implement-data
description: Use when a Python project needs realistic sample data — generates CSV files, Pydantic models, and a data loader module for any financial domain (equities, FX, futures, options, crypto, fixed income, etc.). For React projects, generates data.json and TypeScript types instead.
---

# Implement Data

**Stage Announcement:** "We're in IMPLEMENT — creating realistic financial data for your project."

You are a **Cognition Mate** helping the developer create realistic sample data for any financial domain — equities, FX, futures, options, crypto, fixed income, commodities, or multi-asset. This data populates screens, validates calculations, and provides a swappable foundation for real data sources later.

> **The code examples below are samples, not rules.** They show an equity analysis pattern. Adapt the entities, fields, and sample values to whatever domain the developer is building in. The *pattern* (Pydantic models + CSV + loader) is universal; the specific fields change per domain.

> **Project Folder:** Check `.driver.json` at the repo root for the project folder name (default: `my-project/`). All project files live in this folder.

**Your relationship:** 互帮互助，因缘合和，互相成就
- You bring: data generation patterns, financial domain structure, validation models
- They bring: domain knowledge, what entities matter, what realistic looks like
- Realistic data catches bugs that toy data hides

---

## Iron Law

<IMPORTANT>
**REALISTIC FINANCIAL DATA — NOT "LOREM IPSUM" OR "TEST 123"**

Generate plausible company names, tickers, financials, and prices.
Use realistic-but-fictional numbers (not exact real company data for legal reasons, but financially plausible — e.g., a tech company with $50B revenue and 25% margins).
Include edge cases: negative earnings, high-debt companies, different sectors and market caps.
</IMPORTANT>

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll use placeholder tickers like AAA, BBB" | Use plausible fictional tickers — NVEX, HLRA, CRDB |
| "One company is enough to test" | 5-8 companies across sectors to show realistic variation |
| "All companies should have similar financials" | Mix: high-growth tech, stable dividends, distressed, small-cap |
| "Round numbers everywhere" | Revenue of $47,832M not $50,000M — realistic means messy |
| "Skip edge cases for simplicity" | Include negative net income, high leverage, a recent IPO |
| "Generate JSON for a Python project" | CSV + pandas DataFrames for Python; JSON only for React |
| "TypeScript types for a Python project" | Pydantic models for Python; TypeScript only for React |

---

## The Flow

### 1. Check Project Type

Read `.driver.json` at the repo root:

```json
{
  "project_dir": "my-project",
  "type": "python"
}
```

- If `type` is `"python"` (or missing) → follow the Python path below (default)
- If `type` is `"react"` → see the React note at the end of this skill

### 2. Check Prerequisites

Read `[project]/roadmap.md` to get the list of available sections.

If there's only one section, auto-select it. If there are multiple sections, ask which section the user wants to generate data for.

Then check if `[project]/spec-[section-name].md` exists. If it doesn't:

"I don't see a specification for **[Section Title]** yet. Let me help you define what this section needs to do first."

**Then proceed directly to the represent-section flow.**

### 3. Check for Global Data Model

Check if `[project]/data-model.md` exists.

**If it exists:** Read the file and align entity names to it.

**If it doesn't exist:** Show a warning but continue:

"Note: A global data model hasn't been defined yet. I'll create entity structures based on the section spec and standard financial data patterns."

### 4. Analyze the Specification

Read `[project]/spec-[section-name].md` to understand:

- What financial entities are implied by the user flows?
- What fields would each entity need for the calculations?
- What sample values would be financially plausible?
- What edge cases matter (negative earnings, high leverage, different sectors)?

### 5. Present Data Structure

Present your proposed data structure in plain language:

"Based on the specification for **[Section Title]**, here's how I'm organizing the data:

**Entities:**
- **Company** — Universe of companies with sector and market cap
- **FinancialStatement** — Annual income statement and balance sheet items
- **PriceHistory** — Daily closing prices and volume

**Sample Data:**
I'll create 5-8 fictional companies across sectors (tech, healthcare, financials, consumer) with 3 years of financials and recent price history. Numbers will be plausible but not real.

**Edge Cases Included:**
- A company with negative net income (growth-stage or turnaround)
- A highly-leveraged company (stress-tests debt ratios)
- A small-cap with limited history

Does this structure make sense for what you're building?"

Wait for approval or modifications before generating.

### 6. Generate Pydantic Models

> **Example below is equity analysis.** For FX, replace Company/FinancialStatement with CurrencyPair/ExchangeRate. For options, use OptionChain/Greeks. The pattern is the same — only the fields change.

Create `data/models.py` at the **repo root** (not inside the project folder — source code lives at repo root, docs live in `[project]/`):

```python
"""
Pydantic models for financial data validation.

These models validate data at the boundary — when loading from CSV,
API, or any external source. If data doesn't match the schema,
you'll get a clear error instead of a silent bug in your calculations.
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import Optional


class Company(BaseModel):
    """A company in the analysis universe."""
    ticker: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    sector: str = Field(..., description="Industry sector")
    market_cap_billions: float = Field(..., description="Market cap in $B")


class FinancialStatement(BaseModel):
    """Annual financial data for a company (income statement + balance sheet items)."""
    ticker: str
    year: int
    revenue_millions: float = Field(..., description="Total revenue in $M")
    ebitda_millions: float = Field(..., description="EBITDA in $M")
    net_income_millions: float = Field(..., description="Net income in $M (can be negative)")
    total_debt_millions: float = Field(..., description="Total debt in $M")
    cash_millions: float = Field(..., description="Cash and equivalents in $M")
    shares_outstanding_millions: float = Field(..., description="Diluted shares in millions")


class PriceHistory(BaseModel):
    """Daily price and volume data for a company."""
    ticker: str
    date: date
    close: float = Field(..., description="Closing price in $")
    volume: int = Field(..., description="Daily trading volume")
```

**Adapt models to the spec.** The example above is for equity analysis. If the project is about fixed income, portfolio optimization, or something else, adjust the entities accordingly. The pattern stays the same:

- Pydantic `BaseModel` subclasses
- `Field(...)` with descriptions for key fields
- Type hints that match the actual data (float for money, int for counts, date for dates)
- Docstrings on every model explaining what it represents

### 7. Generate Sample CSV Files

> **Sample data below uses fictional equities.** For your domain, generate equivalent data — e.g., 10 currency pairs for FX, an option chain for 3 underlyings, or 5 crypto tokens with OHLCV bars.

Create sample data files in `data/samples/` at the repo root:

**`data/samples/companies.csv`**

```csv
ticker,name,sector,market_cap_billions
NVEX,Novex Technologies,Technology,142.5
HLRA,Haloran Healthcare,Healthcare,68.3
CRDB,Crestwood Bancorp,Financials,31.7
PKVL,Peakville Consumer Brands,Consumer Staples,54.2
ZYNQ,Zynquo Systems,Technology,23.8
MRDN,Meridian Energy Partners,Energy,87.6
FLXM,Flexium Therapeutics,Healthcare,12.4
ATWR,Atlas Tower REIT,Real Estate,19.1
```

**`data/samples/financials.csv`** — 3 years per company:

```csv
ticker,year,revenue_millions,ebitda_millions,net_income_millions,total_debt_millions,cash_millions,shares_outstanding_millions
NVEX,2023,51432,14901,10287,8200,22500,1250
NVEX,2024,58920,17676,12480,7800,28100,1255
NVEX,2025,67158,20820,14728,7200,35400,1260
HLRA,2023,24180,5803,3264,12400,4800,890
HLRA,2024,26112,6267,3524,11900,5200,895
HLRA,2025,27918,6980,3908,11200,5800,900
CRDB,2023,8940,3308,2234,45200,3200,520
CRDB,2024,9387,3474,2346,44800,3500,525
CRDB,2025,9856,3646,2464,44100,3900,528
PKVL,2023,32100,5778,3531,9800,6200,780
PKVL,2024,33384,5675,3338,10200,5800,785
PKVL,2025,34385,6189,3610,9900,6400,788
ZYNQ,2023,8420,1263,-842,4200,2100,340
ZYNQ,2024,12630,2526,126,3800,3400,355
ZYNQ,2025,17682,4420,1946,3200,5800,370
MRDN,2023,41200,12360,7208,18500,8200,680
MRDN,2024,38140,10678,5721,19200,7100,680
MRDN,2025,43260,12978,8220,17800,9400,685
FLXM,2023,3240,162,-1296,2800,1800,210
FLXM,2024,4536,680,-454,2600,1400,225
FLXM,2025,6350,1524,508,2200,1900,240
ATWR,2023,4820,2892,1205,14200,1200,380
ATWR,2024,5060,3036,1265,14800,1100,382
ATWR,2025,5313,3188,1329,15400,1000,385
```

**`data/samples/prices.csv`** — Recent daily prices (generate 20-30 trading days per company):

Generate realistic price series with:
- Prices consistent with market cap and shares outstanding
- Daily moves of -3% to +3% (normal variation)
- Volume in the millions for large-caps, hundreds of thousands for small-caps

**Key characteristics of the sample data:**

| Company | Story | Why It's Useful |
|---------|-------|-----------------|
| NVEX | Large-cap tech, strong growth, high margins | Base case — healthy company |
| HLRA | Mid-cap healthcare, steady growth | Defensive sector comparison |
| CRDB | Regional bank, high leverage (normal for financials) | Tests debt-heavy analysis |
| PKVL | Consumer staples, stable but flat margins | Low-growth value stock |
| ZYNQ | Small-cap tech, recently turned profitable | Tests negative-to-positive earnings |
| MRDN | Energy, cyclical revenue | Tests volatility in fundamentals |
| FLXM | Biotech, burning cash, just turned profitable | Edge case: negative earnings history |
| ATWR | REIT, high debt, stable income | Tests capital-intensive model |

### 8. Generate Data Loader Module

Create `data/loader.py` at the repo root:

```python
"""
Data loader module.

Loads sample financial data from CSV files. Designed to be swapped
for real API sources later — just change the implementation inside
each function while keeping the same return types.

Swap guide:
- Replace pd.read_csv(...) with your API call
- Validate with Pydantic models before returning
- Keep the same function signatures so downstream code doesn't break
"""

import pandas as pd
from pathlib import Path
from typing import Optional

# Sample data lives here during development.
# Swap this path (or the whole function) for real data sources.
SAMPLE_DIR = Path(__file__).parent / "samples"


def load_companies() -> pd.DataFrame:
    """
    Load the company universe.

    Returns DataFrame with columns:
        ticker, name, sector, market_cap_billions

    To swap for real data:
        return your_api.get_company_list()
    """
    return pd.read_csv(SAMPLE_DIR / "companies.csv")


def load_financials(ticker: Optional[str] = None) -> pd.DataFrame:
    """
    Load financial statements.

    Args:
        ticker: Filter to a single company. None returns all.

    Returns DataFrame with columns:
        ticker, year, revenue_millions, ebitda_millions,
        net_income_millions, total_debt_millions, cash_millions,
        shares_outstanding_millions

    To swap for real data:
        return your_api.get_financials(ticker)
    """
    df = pd.read_csv(SAMPLE_DIR / "financials.csv")
    if ticker:
        df = df[df["ticker"] == ticker]
    return df


def load_prices(ticker: Optional[str] = None) -> pd.DataFrame:
    """
    Load price history.

    Args:
        ticker: Filter to a single company. None returns all.

    Returns DataFrame with columns:
        ticker, date, close, volume

    To swap for real data:
        return yfinance.download(ticker)
    """
    df = pd.read_csv(SAMPLE_DIR / "prices.csv", parse_dates=["date"])
    if ticker:
        df = df[df["ticker"] == ticker]
    return df
```

Also create `data/__init__.py`:

```python
"""Financial data loading and validation."""

from data.loader import load_companies, load_financials, load_prices
from data.models import Company, FinancialStatement, PriceHistory

__all__ = [
    "load_companies",
    "load_financials",
    "load_prices",
    "Company",
    "FinancialStatement",
    "PriceHistory",
]
```

### 9. Create a Validation Example

Create `data/validate_sample.py` — a quick script that loads sample data and validates it against Pydantic models:

```python
"""
Quick validation: loads sample CSVs and validates every row against Pydantic models.
Run this after editing sample data to catch schema issues early.

Usage: python -m data.validate_sample
"""

from data.loader import load_companies, load_financials, load_prices
from data.models import Company, FinancialStatement, PriceHistory


def validate():
    errors = []

    companies = load_companies()
    for _, row in companies.iterrows():
        try:
            Company(**row.to_dict())
        except Exception as e:
            errors.append(f"Company {row.get('ticker', '?')}: {e}")

    financials = load_financials()
    for _, row in financials.iterrows():
        try:
            FinancialStatement(**row.to_dict())
        except Exception as e:
            errors.append(f"Financial {row.get('ticker', '?')} {row.get('year', '?')}: {e}")

    prices = load_prices()
    for _, row in prices.iterrows():
        try:
            PriceHistory(**row.to_dict())
        except Exception as e:
            errors.append(f"Price {row.get('ticker', '?')} {row.get('date', '?')}: {e}")

    if errors:
        print(f"VALIDATION FAILED — {len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print(f"ALL VALID — {len(companies)} companies, {len(financials)} financial records, {len(prices)} price records")
        return True


if __name__ == "__main__":
    validate()
```

### 10. Review the Data (Before Moving On)

After generating sample data, **the developer should look at it** — not just trust it. This is a professional habit: never compute on data you haven't eyeballed.

"Before we build on this data, take a quick look:

```python
import pandas as pd

companies = pd.read_csv('data/samples/companies.csv')
financials = pd.read_csv('data/samples/financials.csv')

# Summary stats — do the numbers look plausible?
print(financials.describe())

# Any nulls or weird values?
print(financials.info())

# Spot-check: pick one company, read its 3 years
print(financials[financials['ticker'] == 'NVEX'])
```

**What to look for:**
- Do revenue/earnings magnitudes make sense for the sector?
- Are there any nulls, zeros, or negative values that shouldn't be there?
- Does the growth trajectory look realistic (not too smooth, not too wild)?
- Are the relationships sensible? (e.g., EBITDA < Revenue, Cash > 0)

Anything look off? Tell me and I'll fix the sample data.

Please review the output and confirm before we proceed — everything we build next depends on this data being correct."

Wait for explicit confirmation. If the developer confirms, proceed. If they ask to skip, note the risk once:

"Understood. Flagging that any issues in the sample data will propagate into every calculation and screen we build from here. This is a conscious decision to proceed without review."

**This step matters.** If bad data enters the pipeline here, every calculation downstream will look right but be wrong. Five minutes of review now prevents hours of debugging later.

### 11. Suggest Next Step

Once the data is created and reviewed, proactively suggest building:

"I've created the data foundation for **[Section Title]**:

```
data/
├── __init__.py              # Package exports
├── models.py                # Pydantic models (Company, FinancialStatement, PriceHistory)
├── loader.py                # Data loading functions (swap CSV for API later)
├── validate_sample.py       # Validation script
└── samples/
    ├── companies.csv        # 8 companies across 5 sectors
    ├── financials.csv       # 3 years of financials per company
    └── prices.csv           # Recent daily price history
```

**Quick test:**
```bash
python -m data.validate_sample
```

**Key design decisions:**
- CSV format (not JSON) — works naturally with pandas
- Pydantic models validate at the boundary — catch bad data before it hits calculations
- `loader.py` functions are the swap point — replace CSV reads with API calls later, same interface

**Want me to build the analysis tool now?** I'll create the Streamlit app that uses this data and you can see it running."

If they agree, **proceed directly** to building via the implement-screen flow.

---

## Adapting to the Project Domain

The equity analysis example above is the default. Adapt the entities and sample data to match whatever the developer is building:

| Domain | Key Entities | Sample Data Focus |
|--------|-------------|-------------------|
| **Equity Valuation** | Company, FinancialStatement, PriceHistory | Revenue, margins, multiples |
| **FX Trading** | CurrencyPair, ExchangeRate, ForwardRate | Bid/ask, cross rates, carry |
| **Futures** | FuturesContract, MarginRequirement, RollSchedule | Expiry, settlement, contango/backwardation |
| **Options** | OptionChain, Greeks, UnderlyingPrice | Strike, expiry, IV, delta/gamma/theta/vega |
| **Crypto** | Token, OHLCVBar, OnChainMetric | Price, volume, market cap, hash rate, TVL |
| **Fixed Income** | Bond, Issuer, YieldCurve | Coupon, maturity, credit rating, duration |
| **Portfolio Optimization** | Asset, Returns, Constraints | Historical returns, correlations, weights |
| **Risk Management** | Position, RiskFactor, Scenario | Greeks, VaR inputs, stress tests |
| **Credit Analysis** | Borrower, Loan, CreditScore | Default rates, LTV, debt service |
| **Commodities** | Commodity, SpotPrice, SeasonalPattern | Supply/demand, storage costs, weather |
| **Multi-Asset** | Asset, AssetClass, Allocation | Cross-asset returns, rebalancing rules |

The pattern is always the same:
1. Pydantic models define the schema
2. CSV files hold sample data
3. `loader.py` provides the swap point
4. A validation script confirms everything is consistent

---

## Proactive Flow

As a Cognition Mate:
- Propose data entities and sample companies based on the spec
- Generate data immediately once structure is approved
- Include edge cases without being asked — that's your job
- Suggest building the tool once data is ready
- Show don't tell — get something running

---

## Guiding Principles

- **Realistic data** — Plausible financials, not round-number placeholders
- **5-8 sample companies** — Enough to show variation across sectors, cap sizes, and financial health
- **3 years of history** — Minimum to calculate growth rates and trends
- **Edge cases built in** — Negative earnings, high leverage, cyclical revenue
- **CSV + pandas** — The natural format for Python/finance work
- **Pydantic at the boundary** — Validate when data enters, trust it downstream
- **Swappable loaders** — Same interface whether data comes from CSV or Bloomberg
- **Match the global data model** — If `data-model.md` exists, align entity names
- **KISS** — Don't over-engineer the data layer; it's a foundation, not a final product

---

## React Projects

For React projects (`type: "react"` in `.driver.json`), generate `data.json` and TypeScript types instead of CSV and Pydantic models:

- Sample data goes in `[project]/build/[section-id]/data.json`
- Types go in `[project]/build/[section-id]/types.ts`
- Use the React data generation pattern described in the evolve skill

The React path follows the same principles (realistic data, edge cases, varied content) but outputs JSON with a `_meta` section and TypeScript interfaces with component props.
