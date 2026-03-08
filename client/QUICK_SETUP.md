# 🚀 Quick Setup Guide - Persona Orb & AI Chat Panel

## ⏱️ Setup Time: ~10 minutes

### Step 1: Copy New Files ✅

Copy these two files to your project:

```bash
# 1. Persona logic library
lib/elevenlabs.ts                 (200 lines)

# 2. Chat panel component with audio
components/AIChatPanelV2.tsx       (380 lines)
```

### Step 2: Get ElevenLabs API Key 🔑

1. Go to https://elevenlabs.io
2. Sign up (free tier available)
3. Go to "API Keys" section
4. Copy your API key: `sk_xxxxxxxxxxxxxxxx`

### Step 3: Add Environment Variable 🌍

Create/update `.env.local`:

```bash
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxx
```

### Step 4: Create `/api/speak` Endpoint 🎙️

Create new file: `app/api/speak/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!
const VOICE_ID = 'nPczCjzI2Devp7XbNicU' // Sarah voice

export async function POST(req: NextRequest) {
  try {
    const { text, voiceSettings, language } = await req.json()

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings,
          language_code: language,
        }),
      }
    )

    if (!res.ok) throw new Error('ElevenLabs error')
    const audio = await res.arrayBuffer()
    
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Speech generation failed' },
      { status: 500 }
    )
  }
}
```

### Step 5: Add to Your Page Component 📄

In your mapview/page.tsx (or wherever you want the chat):

```typescript
'use client'

import { useState } from 'react'
import { AIChatPanel, PersonaOrb } from '@/components/AIChatPanelV2'
import { HARDCODED_PERSONA, type PersonaWeights } from '@/lib/elevenlabs'

export default function MapView() {
  // NEW: Persona state
  const [persona, setPersona] = useState<PersonaWeights>(HARDCODED_PERSONA)
  const [showChat, setShowChat] = useState(false)
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false)

  return (
    <div>
      {/* Header with Persona Orb */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
        <h1>MapleEstate AI</h1>

        {/* Persona Button in Navbar */}
        <button 
          onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <PersonaOrb w={persona} size={24} glow={false} />
          <span>Buyer Persona</span>
        </button>

        {/* Dropdown Menu */}
        {personaMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
          }}>
            <div style={{ textAlign: 'center' }}>
              <PersonaOrb w={persona} size={100} glow={true} />
              <div style={{ marginTop: '15px', fontSize: '14px' }}>
                <p>🏠 Family: {persona.family}%</p>
                <p>💰 Finance: {persona.finance}%</p>
                <p>🏘️ Community: {persona.community}%</p>
                <p>📈 Investment: {persona.investment}%</p>
              </div>
              <button 
                onClick={() => { setShowChat(true); setPersonaMenuOpen(false); }}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '10px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Chat with Advisor
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {/* Your map/content here */}

        {/* Chat Panel */}
        {showChat && (
          <AIChatPanel
            user={null}                      // Pass your user object
            property={null}                  // Pass selected property
            onClose={() => setShowChat(false)}
            currentPersona={persona}
            onPersonaUpdate={setPersona}     // Key: Updates navbar orb instantly!
          />
        )}

        {/* Chat Toggle Button */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
              zIndex: 99,
            }}
          >
            <PersonaOrb w={persona} size={24} glow={false} />
            <span>Ask AI</span>
          </button>
        )}
      </main>
    </div>
  )
}
```

### Step 6: (Optional) Add CSS Animations ✨

Add to your `globals.css`:

```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out forwards;
}
```

### Step 7: Test! 🧪

```bash
npm run dev
```

Then:
1. ✅ Click "Buyer Persona" button → See dropdown with orb
2. ✅ Click "Chat with Advisor" → Chat panel opens
3. ✅ Type a message → Orb weights update!
4. ✅ Microphone icon changes state when speaking
5. ✅ Switch language with dropdown
6. ✅ Voice plays (if enabled & API key is valid)

---

## 🎨 Key Features

### Persona Orb
- **What it is**: Colorful pie chart showing buyer type distribution
- **Colors**: Yellow (Family), Green (Finance), Red (Community), Blue (Investment)
- **Updates**: Real-time as user chats

### Audio Symbol
- **🟢 Speaking**: Green microphone (currently playing voice)
- **⚫ Ready**: Gray microphone (voice enabled)
- **❌ Muted**: Crossed microphone (voice disabled)
- **Click to toggle** voice on/off

### Language Support
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- More available in ElevenLabs

### Voice Morphing
- **High Family**: Warm, nurturing tone
- **High Finance**: Professional, analytical tone
- **High Community**: Conversational, engaging tone
- **High Investment**: Confident, forward-thinking tone

---

## 🐛 Troubleshooting

### "Module not found: elevenlabs"
✅ Check that `lib/elevenlabs.ts` exists and is properly imported

### "fetch is not defined" in route.ts
✅ This is Node.js environment, fetch should work. If not, use Node-fetch polyfill

### Audio not playing
✅ Check:
1. Is `voiceOn === true`? (green mic icon)
2. Is browser volume turned on?
3. Are cookies/storage allowed?
4. Is ELEVENLABS_API_KEY set in .env.local?

### Orb not updating
✅ Check that `onPersonaUpdate={setPersona}` callback is connected

### Language selector not showing
✅ The dropdown appears when you click the language abbreviation (top-right of chat)

---

## 📊 Real-Time Persona Shift Example

When user types:

| Message | Shift | Result |
|---------|-------|--------|
| "What are the schools?" | +15 Family | Family grows, orb updates |
| "Tell me the ROI" | +15 Finance | Finance grows |
| "What's the neighborhood?" | +15 Community | Community grows |
| "Good investment?" | +15 Investment | Investment grows |

The orb normalizes back to 100% automatically!

---

## 🔗 File Structure After Setup

```
project/
├── app/
│   ├── api/
│   │   └── speak/
│   │       └── route.ts          (NEW - Voice API)
│   ├── mapview/
│   │   └── page.tsx              (UPDATED)
│   └── page.tsx                  (OPTIONAL UPDATE)
├── lib/
│   ├── elevenlabs.ts             (NEW - Persona logic)
│   └── supabase/
├── components/
│   ├── Navbar.tsx                (UNCHANGED)
│   ├── AIChatPanelV2.tsx          (NEW - Chat UI + Audio)
│   └── AskAI.tsx                 (OLD - can remove)
├── .env.local                    (UPDATED - API key)
└── IMPLEMENTATION_GUIDE.md       (NEW - Help docs)
```

---

## 💡 Pro Tips

1. **Persona Persistence**: Save weights to Supabase User Profile
2. **Voice Clone**: Use `VOICE_ID` parameter to swap voices
3. **Real AI**: Replace mock responses with Gemini/Claude API
4. **Analytics**: Track which persona types convert best
5. **Streaming**: Use ElevenLabs streaming API for faster speech

---

## 🎯 Next Steps

Once everything is working:

1. ✅ Connect real AI backend for responses
2. ✅ Save persona weights to database
3. ✅ Add more voice options
4. ✅ Track conversation metrics
5. ✅ A/B test different persona prompts

---

## 📞 Support

- **ElevenLabs Docs**: https://docs.elevenlabs.io/
- **Issue with voice?** Check API key and voice ID
- **Issue with persona?** Check simulatePersonaShift() logic in lib/elevenlabs.ts
- **Issue with UI?** Check CSS animations in globals.css

---

**You're all set! 🎉 Start chatting with persona-driven AI!**
