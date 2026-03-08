// ── PERSONA WEIGHTS & VOICE MORPHING ────────────────────────────────────────
// Maps buyer personas to ElevenLabs voice parameters

export type PersonaWeights = {
    family: number      // 0-100: Focus on schools, community, family-friendly
    finance: number     // 0-100: Focus on ROI, market trends, financial metrics
    community: number   // 0-100: Focus on neighborhoods, culture, local vibes
    investment: number  // 0-100: Focus on resale value, investment potential
}

export const HARDCODED_PERSONA: PersonaWeights = {
    family: 30,
    finance: 25,
    community: 25,
    investment: 20,
}

export const PERSONA_META: Record<keyof PersonaWeights, { label: string; color: string; emoji: string }> = {
    family: { label: 'Family', color: '#FCD34D', emoji: '👨‍👩‍👧‍👦' },
    finance: { label: 'Finance', color: '#10B981', emoji: '📊' },
    community: { label: 'Community', color: '#F87171', emoji: '🏘️' },
    investment: { label: 'Investment', color: '#60A5FA', emoji: '📈' },
}

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']

// ── VOICE SETTINGS BUILDER ──────────────────────────────────────────────────
// Morphs stability, similarity, and style based on persona weights
export function buildVoiceSettings(weights: PersonaWeights) {
    const total = weights.family + weights.finance + weights.community + weights.investment || 100

    // Normalize
    const fam = weights.family / total
    const fin = weights.finance / total
    const com = weights.community / total
    const inv = weights.investment / total

    // Stability: Family & Community = warmer, more emotional → lower stability (0.5)
    // Finance & Investment = more analytical, steady → higher stability (0.85)
    const stability = 0.5 + (fin + inv) * 0.35

    // Similarity Boost: Family = closer to original (0.9), Finance = more variation (0.7)
    const similarity_boost = 0.75 + (fam + com) * 0.15

    // Style: Family & Community = conversational, Community = creative
    // Finance & Investment = professional, measured
    const style = 0.3 + (com * 0.3) + (fin * 0.1)

    return {
        stability: Math.min(0.99, Math.max(0.3, stability)),
        similarity_boost: Math.min(0.99, Math.max(0.5, similarity_boost)),
        style: Math.min(0.99, Math.max(0.0, style)),
    }
}

// ── PERSONA PROMPT BUILDER ──────────────────────────────────────────────────
// Injects persona tone into system prompt for voice
export function buildPersonaPrompt(weights: PersonaWeights, language: string): string {
    const total = weights.family + weights.finance + weights.community + weights.investment || 100
    const fam = weights.family / total
    const fin = weights.finance / total
    const com = weights.community / total
    const inv = weights.investment / total

    let tone = ''
    if (fam > 0.3) tone += 'warm, family-oriented, '
    if (fin > 0.3) tone += 'analytical, data-driven, '
    if (com > 0.3) tone += 'community-focused, local-insider, '
    if (inv > 0.3) tone += 'investment-savvy, forward-looking, '

    return tone ? `Speak in a ${tone}manner. ` : 'Speak naturally. '
}

// ── PERSONA SUMMARY ────────────────────────────────────────────────────────
export function getPersonaSummary(weights: PersonaWeights): string {
    const total = weights.family + weights.finance + weights.community + weights.investment || 100
    const fam = Math.round((weights.family / total) * 100)
    const fin = Math.round((weights.finance / total) * 100)
    const com = Math.round((weights.community / total) * 100)
    const inv = Math.round((weights.investment / total) * 100)

    const descriptions = []
    if (fam > 30) descriptions.push('I care about schools and family life')
    if (fin > 30) descriptions.push('I focus on financial returns')
    if (com > 30) descriptions.push('Community is important to me')
    if (inv > 30) descriptions.push('I see this as an investment')

    return descriptions.join('. ') || 'I balance multiple factors in my home search.'
}

// ── SIMULATE PERSONA SHIFT ──────────────────────────────────────────────────
// Analyzes user input and returns a shift to apply
export function simulatePersonaShift(userInput: string): Partial<PersonaWeights> {
    const input = userInput.toLowerCase()
    const shift: Partial<PersonaWeights> = {}

    // Family keywords
    if (/school|kids|family|children|playground|safe|daycare/i.test(input)) {
        shift.family = 15
    }

    // Finance keywords
    if (/roi|return|investment|cash flow|mortgage|price|appreciation|market|value/i.test(input)) {
        shift.finance = 15
    }

    // Community keywords
    if (/neighborhood|community|vibe|culture|restaurants|walkable|transit|local/i.test(input)) {
        shift.community = 15
    }

    // Investment keywords
    if (/flip|resale|future|growth|portfolio|diversif|exposure/i.test(input)) {
        shift.investment = 15
    }

    return shift
}

// ── UPDATE PERSONA ──────────────────────────────────────────────────────────
// Applies a shift and normalizes back to 100%
export function updatePersona(current: PersonaWeights, shift: Partial<PersonaWeights>): PersonaWeights {
    const updated = { ...current }

    Object.entries(shift).forEach(([key, val]) => {
        if (val) {
            updated[key as keyof PersonaWeights] += val
        }
    })

    // Normalize back to ~100 total
    const total = Object.values(updated).reduce((a, b) => a + b, 0)
    const factor = 100 / total

    const result: PersonaWeights = {
        family: Math.round(updated.family * factor),
        finance: Math.round(updated.finance * factor),
        community: Math.round(updated.community * factor),
        investment: Math.round(updated.investment * factor),
    }

    return result
}
