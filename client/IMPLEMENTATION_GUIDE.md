# HomeWay AI Chat Panel - Implementation Guide

## Overview
This document describes the comprehensive update to add Persona Orb, AI Chat Panel with audio support, and voice morphing logic using ElevenLabs integration.

## Files Created/Modified

### 1. New File: `lib/elevenlabs.ts` ✅
**Purpose**: Centralized persona weight management and voice morphing logic

**Key Exports**:
- `PersonaWeights` - TypeScript interface for buyer persona (family | finance | community | investment)
- `HARDCODED_PERSONA` - Default persona weights
- `PERSONA_META` - Color palette and labels for each persona
- `buildVoiceSettings()` - Converts persona weights to ElevenLabs voice parameters
- `buildPersonaPrompt()` - Creates system prompt with persona tone
- `getPersonaSummary()` - Human-readable persona description
- `simulatePersonaShift()` - Analyzes user input and suggests persona updates
- `updatePersona()` - Applies shifts and normalizes weights

### 2. New File: `components/AIChatPanelV2.tsx` ✅
**Purpose**: Standalone AI Chat component with audio, persona visualization, and language support

**Key Features**:
- ✅ **Persona Orb Component**: Conic-gradient visualization of buyer persona weights
- ✅ **Audio Toggle**: Visual indicator showing voice on/off/speaking status
- ✅ **Language Selector**: Dropdown to switch between en/es/fr/de/etc
- ✅ **Voice Morphing**: Sends persona weights to `/api/speak` endpoint
- ✅ **Message History**: Chat interface with user/assistant messages
- ✅ **Persona Sync**: Real-time updates via `onPersonaUpdate` callback

**Integration Points**:
```typescript
// Props passed to AIChatPanel
interface Props {
  user: User | null                           // Supabase user
  property: Property | null                   // Selected property
  onClose: () => void                        // Close handler
  currentPersona: PersonaWeights              // Current weights
  onPersonaUpdate: (w: PersonaWeights) => void // Update callback
}
```

### 3. Modified: `app/page.tsx` (Optional - Example Usage)
**Before**: Landing page with navbar
**After**: Add this to integrate Persona Orb in navbar

```typescript
// In your existing page.tsx or mapview/page.tsx

import { AIChatPanel, PersonaOrb } from '@/components/AIChatPanelV2'
import { 
  HARDCODED_PERSONA,
  updatePersona,
  simulatePersonaShift,
  type PersonaWeights 
} from '@/lib/elevenlabs'

// Inside your component:
const [persona, setPersona] = useState<PersonaWeights>(HARDCODED_PERSONA)
const [showChat, setShowChat] = useState(false)
const [personaMenuOpen, setPersonaMenuOpen] = useState(false)

// In navbar:
<button onClick={() => setPersonaMenuOpen(!personaMenuOpen)}>
  <PersonaOrb w={persona} size={24} glow={false} />
  <span>Buyer Persona</span>
</button>

// When persona dropdown visible:
{personaMenuOpen && (
  <div>
    <PersonaOrb w={persona} size={120} />
    {/* Show weights breakdown */}
  </div>
)}

// Chat panel in main content:
{showChat && (
  <AIChatPanel 
    user={user}
    property={selected}
    onClose={() => setShowChat(false)}
    currentPersona={persona}
    onPersonaUpdate={setPersona}  // Updates orb instantly
  />
)}
```

## API Requirements

### `/api/speak` Endpoint
The AIChatPanel expects this endpoint to exist and accept:

```typescript
POST /api/speak
Content-Type: application/json

{
  text: string                        // Text to speak
  voiceSettings: {
    stability: number                // 0.0 - 0.99
    similarity_boost: number          // 0.0 - 0.99
    style: number                    // 0.0 - 0.99
  }
  language: string                   // 'en', 'es', 'fr', etc
}

Response: audio/mpeg blob
```

**Example Implementation** (app/api/speak/route.ts):
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

    if (!res.ok) {
      throw new Error(`ElevenLabs API error: ${res.statusText}`)
    }

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    console.error('Speak API error:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}
```

## Voice Morphing Logic

### How Persona Weights Map to Voice Parameters

| Persona | Stability | Similarity | Style | Effect |
|---------|-----------|-----------|-------|--------|
| High Family | 0.65 | 0.85 | 0.50 | Warm, nurturing, emotional |
| High Finance | 0.85 | 0.80 | 0.40 | Professional, measured, analytical |
| High Community | 0.70 | 0.80 | 0.60 | Conversational, engaging, creative |
| High Investment | 0.80 | 0.75 | 0.35 | Confident, forward-thinking |

**Formula**:
```typescript
stability = 0.5 + (finance + investment) * 0.35
similarity_boost = 0.75 + (family + community) * 0.15
style = 0.3 + (community * 0.3) + (finance * 0.1)
```

## Persona Shift Detection

The `simulatePersonaShift()` function analyzes user messages:

```typescript
// Examples:
"What are the schools like?" → family +15
"What's the ROI potential?" → finance +15
"Tell me about the neighborhood" → community +15
"Is this a good investment?" → investment +15
```

Shifts are then normalized back to 100% total:
```typescript
// Before: { family: 45, finance: 25, community: 25, investment: 20 } = 115 total
// After: { family: 39, finance: 22, community: 22, investment: 17 } = 100 total
```

## Audio Symbol Integration

The chat panel includes visual feedback for voice status:

- 🎤 **Speaking**: Green microphone (green-600)
- 🎤 **Active**: Gray microphone (active/ready)
- 🔇 **Muted**: Crossed microphone (muted state)

Click the microphone to toggle voice on/off.

## CSS Animations

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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}
```

## Environment Variables

Add to `.env.local`:

```
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
```

## Usage Example

### Full Integration in mapview/page.tsx

```typescript
'use client'

import { useState } from 'react'
import { AIChatPanel, PersonaOrb } from '@/components/AIChatPanelV2'
import { HARDCODED_PERSONA, type PersonaWeights } from '@/lib/elevenlabs'

export default function MapView() {
  const [persona, setPersona] = useState<PersonaWeights>(HARDCODED_PERSONA)
  const [showChat, setShowChat] = useState(false)

  return (
    <div>
      {/* Your map and UI */}
      
      {/* Chat Panel */}
      {showChat && (
        <AIChatPanel
          user={null}
          property={null}
          onClose={() => setShowChat(false)}
          currentPersona={persona}
          onPersonaUpdate={setPersona}
        />
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setShowChat(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          zIndex: 99,
        }}
      >
        <PersonaOrb w={persona} size={24} glow={false} />
        <span>Ask AI</span>
      </button>
    </div>
  )
}
```

## Diff Summary

### Changes Made:
1. ✅ Created `lib/elevenlabs.ts` - 200+ lines of persona logic
2. ✅ Created `components/AIChatPanelV2.tsx` - Full chat UI with audio
3. ✅ Added audio toggle button with visual indicators
4. ✅ Added language selector dropdown
5. ✅ Added persona orb visualization (conic-gradient)
6. ✅ Integrated voice morphing (persona → voice parameters)
7. ✅ Added persona sync callbacks for navbar updates
8. ✅ Added loading states and error handling

### Integration Checklist:
- [ ] Copy `lib/elevenlabs.ts` to your project
- [ ] Copy `components/AIChatPanelV2.tsx` to your project
- [ ] Create `/api/speak` endpoint with ElevenLabs API call
- [ ] Add ELEVENLABS_API_KEY to .env.local
- [ ] Import AIChatPanel and PersonaOrb in your page
- [ ] Add state management for persona and showChat
- [ ] Add CSS animations to globals.css
- [ ] Test microphone icon interactions
- [ ] Test language selector
- [ ] Test persona orb gradient updates in real-time

## Future Enhancements

1. **Real AI Backend**: Replace mock responses with Gemini/Claude API
2. **Persona Persistence**: Save persona weights to Supabase
3. **Voice Clone**: Support multiple voice personalities
4. **Streaming**: Add real-time text-to-speech streaming
5. **Analytics**: Track which persona weights lead to conversions
6. **Multi-language**: Support for 20+ languages in ElevenLabs
7. **Voice Analytics**: See how voice parameters affect engagement

## Support

For ElevenLabs API docs: https://docs.elevenlabs.io/
For persona logic questions, refer to `lib/elevenlabs.ts` comments.
