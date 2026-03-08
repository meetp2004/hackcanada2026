# ✅ Gemini Backend Setup Checklist

## 🎯 Quick Start (5 minutes)

Follow these steps in order to get the full Gemini backend working:

---

## Step 1: Start Backend Server (2 minutes)

```bash
# Open Terminal 1
cd /root/hackcanada2026/server

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Expected Output**:
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

---

## Step 2: Verify Backend is Working (1 minute)

In a new terminal:
```bash
curl http://localhost:5000/health
```

✅ **Expected Response**:
```json
{"status":"Server is running","timestamp":"2026-03-08T..."}
```

---

## Step 3: Start Frontend (1 minute)

```bash
# Terminal 2
cd /root/hackcanada2026/client

npm run dev
```

✅ **Expected**: Frontend runs at `http://localhost:3000`

---

## Step 4: Test Integration (1 minute)

1. Open browser to `http://localhost:3000`
2. Look for pages that use Gemini features:
   - Ask AI Chat Panel (already integrated)
   - Budget Planner (if you add the component)
   - Property Comparison (if you add the component)

---

## 📁 Files Created/Modified

### ✅ Backend Files
- `server/index.js` — Full Express server with 5 API endpoints
- `server/package.json` — Dependencies configured
- `server/.env.example` — Environment template
- `server/SETUP.md` — Detailed backend documentation

### ✅ Frontend Files
- `client/lib/geminiAPI.ts` — API client wrapper
- `client/lib/useGemini.ts` — 6 custom React hooks
- `client/components/BudgetPlannerWithInsights.tsx` — Complete component
- `client/components/PropertyComparison.tsx` — Complete component
- `client/.env.local` — Updated with API_URL
- `client/GEMINI_INTEGRATION.md` — Full integration guide

---

## 🎯 5 API Endpoints Available

| Endpoint | Purpose | Example Use |
|----------|---------|-------------|
| `POST /api/ask-ai` | Ask AI questions | "What's a good neighborhood for families?" |
| `POST /api/budget-insights` | Generate budget report & PDF | Calculate affordability & get PDF download |
| `POST /api/compare-insights` | Compare multiple properties | Show pros/cons of 2-3 properties |
| `POST /api/market-analysis` | Analyze neighborhood trends | "How is the San Francisco market doing?" |
| `POST /api/mortgage-advisor` | Get financing advice | Calculate payments & get advice |

---

## 🔌 Integration Examples

### Example 1: Use Ask AI Hook
```typescript
import { useAskAI } from '@/lib/useGemini';
import { HARDCODED_PERSONA } from '@/lib/elevenlabs';

export function MyComponent() {
  const { ask, loading, response } = useAskAI();

  const handleAsk = async () => {
    const result = await ask(
      "Tell me about good schools nearby",
      HARDCODED_PERSONA
    );
    console.log(result.response);
  };

  return <button onClick={handleAsk}>Ask</button>;
}
```

### Example 2: Use Budget Insights Hook
```typescript
import { useBudgetInsights } from '@/lib/useGemini';

export function BudgetPlanner() {
  const { generate, downloadReport, insights } = useBudgetInsights();

  const handleGenerate = async () => {
    const result = await generate({
      totalBudget: 500000,
      downPayment: 100000,
      monthlyAffordability: 3000,
      interestRate: 6.5,
      loanTerm: 30
    });

    downloadReport(result.pdf, result.fileName);
  };

  return <button onClick={handleGenerate}>Generate PDF</button>;
}
```

### Example 3: Use Compare Properties Hook
```typescript
import { useCompareInsights } from '@/lib/useGemini';

export function CompareProperties() {
  const { compare, comparison } = useCompareInsights();

  const handleCompare = async () => {
    const result = await compare([
      { address: "123 Main", price: 500000, beds: 3, ... },
      { address: "456 Oak", price: 550000, beds: 4, ... }
    ]);

    console.log(result.comparison);
  };

  return <button onClick={handleCompare}>Compare</button>;
}
```

---

## 🚀 Next Steps

### Immediate (Use Now)
1. ✅ Backend running on http://localhost:5000
2. ✅ Frontend running on http://localhost:3000
3. ✅ Ask AI Chat works (already integrated)
4. ✅ Use the example components as templates

### Soon (Integrate Into Pages)
- [ ] Add `BudgetPlannerWithInsights` to `/app/Budget-planner/page.tsx`
- [ ] Add `PropertyComparison` to `/app/compare/page.tsx`
- [ ] Use hooks in your existing components
- [ ] Add more personalized use cases

### Later (Enhancements)
- [ ] Connect to real property database
- [ ] Save preferences to Supabase
- [ ] Add more voice options
- [ ] Deploy backend to production

---

## 🎯 Key Features Enabled

### ✨ Ask AI Chatbot
- Persona-aware responses
- Multi-language support (with voice)
- Conversation history
- Real-time persona shift detection

### 📊 Budget Insights
- AI-generated budget analysis
- PDF report generation
- Investment recommendations
- Market positioning advice

### 🏡 Property Comparison
- Side-by-side analysis
- Automated scoring (1-10)
- Market value analysis
- Investment potential ratings

### 📈 Market Analysis
- Neighborhood trends
- School ratings
- Demographics data
- Investment potential
- Commute analysis

### 💰 Mortgage Advisor
- Monthly payment calculation
- Total interest analysis
- PMI considerations
- Rate locking recommendations
- Tax strategies

---

## 🔐 Environment Setup

### Backend (.env)
```
GEMINI_API_KEY=your_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_MAPBOX_TOKEN=...
GEMINI_API_KEY=...
```

---

## ✅ Verification Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] `/health` endpoint responds
- [ ] Browser DevTools shows no CORS errors
- [ ] Chat panel opens and responds
- [ ] Ask AI generates responses
- [ ] Can generate budget PDF
- [ ] Can compare properties

---

## 🐛 Quick Troubleshooting

### "Backend not responding"
```bash
# Make sure it's running
curl http://localhost:5000/health

# If not, start it:
cd server && npm run dev
```

### "Cannot find module errors"
```bash
cd server
npm install
```

### "CORS errors in browser"
- Check `NEXT_PUBLIC_API_URL` matches backend URL
- Check backend is running

### "No Gemini responses"
- Verify API key in server/.env
- Check Gemini API account is active
- Check browser console for errors

---

## 📚 Documentation Files

- **`server/SETUP.md`** — Detailed backend setup & API docs
- **`server/GEMINI_INTEGRATION.md`** — Full integration guide
- **`lib/geminiAPI.ts`** — TypeScript interfaces & implementations
- **`lib/useGemini.ts`** — React hook implementations

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ Backend logs show connections from frontend
✅ Chat panel responds to messages
✅ Budget insights generate PDF
✅ Property comparison shows scores
✅ No errors in browser console
✅ Persona weights update in real-time

---

## 💡 Pro Tips

1. **Keep terminals open**: Backend in one, frontend in another
2. **Watch console**: Server logs help debug issues
3. **Test each hook independently**: Use the examples
4. **Use the TypeScript types**: Full IDE support
5. **Customize personas**: Modify `HARDCODED_PERSONA` in `lib/elevenlabs.ts`

---

## 🚀 You're Ready!

Your full-stack real estate AI system is now set up and ready to use.

**Next action**: Start the backend server with `npm run dev`

Happy building! 🏠✨
