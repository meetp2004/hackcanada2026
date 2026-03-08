# 🚀 Complete Gemini Backend Integration Guide

## Overview

You now have a full-stack real estate AI system:

- **Backend Server**: Node.js/Express with Gemini integration
- **API Endpoints**: 5 powerful AI endpoints for different features
- **Frontend Hooks**: React hooks for easy component integration
- **Example Components**: Ready-to-use UI components

---

## 📦 What You Have

### Backend Server (Node.js)
- ✅ `/server/index.js` — Main Express server with all endpoints
- ✅ `/server/package.json` — Dependencies (Gemini, Express, PDFKit)
- ✅ `/server/.env.example` — Environment template
- ✅ `/server/SETUP.md` — Detailed server setup guide

### Frontend Client (Next.js/React)
- ✅ `/lib/geminiAPI.ts` — API client wrapper
- ✅ `/lib/useGemini.ts` — Custom React hooks
- ✅ `/components/BudgetPlannerWithInsights.tsx` — Example component
- ✅ `/components/PropertyComparison.tsx` — Example component
- ✅ `.env.local` — Updated with `NEXT_PUBLIC_API_URL`

---

## ⚙️ Setup Steps

### Step 1: Setup Backend Server (3 minutes)

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Gemini API key
# Get it from: https://aistudio.google.com/app/apikeys
echo "GEMINI_API_KEY=your_key_here" >> .env
echo "PORT=5000" >> .env
```

### Step 2: Start Backend Server (1 minute)

```bash
# From the server/ folder
npm run dev
```

You should see:
```
✅ Homeway Server running on http://localhost:5000
📚 Available endpoints:
   GET  /health
   POST /api/ask-ai
   POST /api/budget-insights
   POST /api/compare-insights
   POST /api/market-analysis
   POST /api/mortgage-advisor
```

### Step 3: Start Frontend Client (1 minute)

```bash
# Open a new terminal, navigate to client folder
cd client

npm run dev
```

Frontend runs at `http://localhost:3000`

### Step 4: Test Integration (2 minutes)

```bash
# Check server is running
curl http://localhost:5000/health

# Should respond with:
# {"status":"Server is running","timestamp":"..."}
```

---

## 🎯 API Endpoints Overview

### 1. Ask AI Chatbot
**Endpoint**: `POST /api/ask-ai`

Persona-aware AI responses for buyer questions.

**Frontend Usage**:
```typescript
import { useAskAI } from '@/lib/useGemini';
import { HARDCODED_PERSONA } from '@/lib/elevenlabs';

function MyComponent() {
  const { ask, loading, response } = useAskAI();

  const handleAsk = async () => {
    const result = await ask(
      "What neighborhoods are good for families?",
      HARDCODED_PERSONA
    );
    console.log(result.response); // AI's answer
  };

  return <button onClick={handleAsk}>Ask AI</button>;
}
```

**Request Body**:
```json
{
  "message": "What neighborhoods have good schools?",
  "personaWeights": {
    "family": 35,
    "finance": 25,
    "community": 25,
    "investment": 15
  },
  "conversationHistory": []
}
```

---

### 2. Budget Insights & PDF Generation
**Endpoint**: `POST /api/budget-insights`

Generates AI insights and downloadable PDF report.

**Frontend Usage**:
```typescript
import { useBudgetInsights } from '@/lib/useGemini';

function BudgetPlanner() {
  const { generate, downloadReport, loading, insights } = useBudgetInsights();

  const handleGenerate = async () => {
    const result = await generate(
      {
        totalBudget: 500000,
        downPayment: 100000,
        monthlyAffordability: 3000,
        interestRate: 6.5,
        loanTerm: 30
      },
      HARDCODED_PERSONA
    );

    console.log(result.insights); // AI insights
    downloadReport(result.pdf, result.fileName); // Download PDF
  };

  return <button onClick={handleGenerate}>Generate Report</button>;
}
```

**Response Includes**:
- AI-generated budget analysis
- Investment recommendations
- Base64-encoded PDF file
- Market positioning advice

---

### 3. Property Comparison
**Endpoint**: `POST /api/compare-insights`

Compare multiple properties and get scoring.

**Frontend Usage**:
```typescript
import { useCompareInsights } from '@/lib/useGemini';

function PropertyComparison() {
  const { compare, loading, comparison } = useCompareInsights();

  const handleCompare = async () => {
    const result = await compare(
      [
        {
          address: "123 Main St",
          price: 450000,
          beds: 3,
          baths: 2,
          sqft: 1800,
          yearBuilt: 2010
        },
        {
          address: "456 Oak Ave",
          price: 500000,
          beds: 4,
          baths: 2.5,
          sqft: 2100,
          yearBuilt: 2005
        }
      ],
      500000, // budget
      HARDCODED_PERSONA
    );

    console.log(result.comparison); // Detailed analysis
    console.log(result.scoring); // Scores for each property
  };

  return <button onClick={handleCompare}>Compare</button>;
}
```

**Response Includes**:
- Detailed property comparison analysis
- Scoring for each property (1-10 scale):
  - Value
  - Investment Potential
  - Location Quality
  - School Quality
  - Community Amenities

---

### 4. Market Analysis
**Endpoint**: `POST /api/market-analysis`

Analyze trends and neighborhood data.

**Frontend Usage**:
```typescript
import { useMarketAnalysis } from '@/lib/useGemini';

function MarketAnalyzer() {
  const { analyze, loading, analysis } = useMarketAnalysis();

  const handleAnalyze = async () => {
    const result = await analyze(
      "San Francisco, CA",
      HARDCODED_PERSONA
    );

    console.log(result.analysis);
  };

  return <button onClick={handleAnalyze}>Analyze Market</button>;
}
```

**Includes Analysis Of**:
- Current market trends
- Price trends (3-6 months)
- Days on market statistics
- Demographics
- School ratings
- Transportation & commute
- Safety & crime data
- Future development
- Investment potential

---

### 5. Mortgage Advisor
**Endpoint**: `POST /api/mortgage-advisor`

Get financing advice and mortgage calculations.

**Frontend Usage**:
```typescript
import { useMortgageAdvisor } from '@/lib/useGemini';

function MortgageCalculator() {
  const { getAdvice, loading, advice } = useMortgageAdvisor();

  const handleGetAdvice = async () => {
    const result = await getAdvice(
      500000,  // price
      100000,  // downPayment
      6.5,     // interestRate
      30,      // loanTerm
      HARDCODED_PERSONA,
      750,     // creditScore
      120000   // income
    );

    console.log(result.calculation);
    // {
    //   price: 500000,
    //   downPayment: 100000,
    //   principal: 400000,
    //   monthlyPayment: 2398.20,
    //   totalInterest: 263352
    // }

    console.log(result.advice); // AI mortgage advice
  };

  return <button onClick={handleGetAdvice}>Get Advice</button>;
}
```

---

## 🔌 Integration into Existing Pages

### Budget Planner Page
```typescript
// app/Budget-planner/page.tsx

import BudgetPlannerWithInsights from '@/components/BudgetPlannerWithInsights';

export default function BudgetPlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-8">
      <BudgetPlannerWithInsights />
    </div>
  );
}
```

### Compare Properties Page
```typescript
// app/compare/page.tsx (create this route)

import PropertyComparison from '@/components/PropertyComparison';

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-100 p-8">
      <PropertyComparison />
    </div>
  );
}
```

### Ask AI in Chat Panel
The existing `AIChatPanel` already uses `askAI` hook. Just make sure backend is running!

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
```bash
# Check if server is running
curl http://localhost:5000/health

# If not, start it:
cd server
npm run dev
```

### "GEMINI_API_KEY not found"
```bash
# Make sure .env file exists in server/
cat server/.env

# Should contain:
# GEMINI_API_KEY=sk_xxxxxxxxxxxxxxxx
```

### "API response is empty"
- Check browser DevTools Console for errors
- Verify Gemini API key is valid
- Check that server logs show requests being received

### "PDF download doesn't work"
```typescript
// Make sure you're calling it correctly:
if (insights?.pdf && insights?.fileName) {
  downloadReport(insights.pdf, insights.fileName);
}
```

---

## 📊 Example: Complete Integration

Here's a full example integrating all features:

```typescript
'use client';

import { useState } from 'react';
import { useAskAI, useBudgetInsights, useCompareInsights } from '@/lib/useGemini';
import { HARDCODED_PERSONA } from '@/lib/elevenlabs';

export default function DashboardPage() {
  const { ask, response: aiResponse } = useAskAI();
  const { generate, downloadReport, insights } = useBudgetInsights();
  const { compare, comparison } = useCompareInsights();

  const handleAskAboutBudget = async () => {
    await ask(
      "What's the best budget for my family in this market?",
      HARDCODED_PERSONA
    );
  };

  const handleGenerateBudgetPDF = async () => {
    const result = await generate(
      {
        totalBudget: 500000,
        downPayment: 100000,
        monthlyAffordability: 3000,
        interestRate: 6.5,
        loanTerm: 30
      },
      HARDCODED_PERSONA
    );

    if (result.pdf) {
      downloadReport(result.pdf, result.fileName);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Real Estate Dashboard</h1>

      {/* AI Chat */}
      <section className="mb-8 p-6 bg-blue-50 rounded-lg">
        <button
          onClick={handleAskAboutBudget}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Ask AI
        </button>
        {aiResponse && <p className="mt-4">{aiResponse.response}</p>}
      </section>

      {/* Budget Planner */}
      <section className="mb-8 p-6 bg-green-50 rounded-lg">
        <button
          onClick={handleGenerateBudgetPDF}
          className="bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Generate Budget Report
        </button>
        {insights && (
          <div className="mt-4">
            <p>{insights.insights}</p>
            <button
              onClick={() => downloadReport(insights.pdf, insights.fileName)}
              className="mt-4 bg-green-700 text-white px-6 py-2 rounded"
            >
              Download PDF
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## ✅ Production Checklist

Before deploying:

- [ ] Backend has valid `GEMINI_API_KEY` in production `.env`
- [ ] Frontend has correct `NEXT_PUBLIC_API_URL` pointing to backend
- [ ] Both services have proper error logging
- [ ] Rate limiting is configured on backend
- [ ] CORS is configured for production domain
- [ ] PDF generation directory has write permissions
- [ ] API calls have timeout handling
- [ ] Environment variables are not committed to git

---

## 🎉 Next Steps

1. **Test each endpoint** with the examples above
2. **Integrate into your pages** using the provided components
3. **Customize styling** to match your brand
4. **Add more endpoints** for additional features
5. **Deploy backend** to production (Heroku, Railway, etc.)

---

## 📚 API Reference

For detailed API documentation, see:
- `/server/SETUP.md` — Complete endpoint documentation
- `/lib/geminiAPI.ts` — TypeScript interfaces
- `/lib/useGemini.ts` — React hook implementations

---

**🚀 You're ready to go! Start with the backend, then integrate the React hooks into your pages.**
