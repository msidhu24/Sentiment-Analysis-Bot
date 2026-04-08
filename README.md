# Sentify: Advanced Financial Sentiment Dashboard

Sentify is a sophisticated, reactive financial dashboard designed to overlay raw stock market data with live sentiment analyses aggregated from social media (Twitter) and professional journalism (NewsData.io, Tavily).

## 🚀 Features
- **Dual-Axis Market Data Correlation:** Syncs API sentiment metrics perfectly alongside live `yfinance` adjusted closing prices.
- **AI Intelligence Layer ("The Why"):** Integrates Large Language Model reasoning to dynamically cluster data into actionable Market Catalysts, Social Trends, and Risk Factors.
- **Trendline Divergence Detection:** Mathematically analyzes 30-day slope trends to identify early buy/sell divergence badges.

## 🛠️ Installation & Setup
1. Clone the repository
2. Run `npm install` to install frontend dependencies.
3. Rename `.env.example` to `.env` and fill in your API credentials.
4. Set up the Python Backend:
   ```bash
   cd server
   python3 -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn pydantic yfinance
   uvicorn main:app --reload --port 8000
   ```
5. In a separate terminal, start the Vite frontend server:
   ```bash
   npm run dev
   ```

## 🧠 DRIVER™ Framework Methodology
This project was conceptualized, built, and verified utilizing Dr. Cinder Zhang's **DRIVER™ Systematic AI Operation Methodology**:

*   **D (Discover & Define):** Established clear objectives for integrating robust API endpoints without hallucination risk.
*   **R (Represent):** Abstracted React front-end logic away from raw Python `yfinance` architecture.
*   **I (Implement):** Built custom dual-axis visuals strictly paired with AFINN context modeling.
*   **V (Validate):** Cross-checked API divergence boundaries against real-world price gaps (e.g., weekend/holiday gaps).
*   **E (Evolve):** Expanded the UI with real-time responsive sidebar telemetry for the highest and lowest market performers. 
*   **R (Reflect):** Captured API dependencies and fallback mechanisms formally to prevent data-loop freezing.

## 🤖 AI Usage Disclosure
*Transparency is a core professional tenet.* This repository was developed in active partnership with an advanced AI system (Google Gemini/Antigravity framework). The AI operated as a "*Cognition Mate*"—rapidly building structural code, integrating quantitative packages, and designing the glassmorphism UI overlay—under continuous human vision, specification control, and manual validation. We firmly believe true value creation arises from *process over raw capability (The Kasparov Principle).*

**Disclaimer:** This tool provides analysis tracking, not formal financial advice. Evaluate all metrics thoroughly before engaging in live market transactions.
