import { NextRequest, NextResponse } from 'next/server'

interface SpeakRequest {
    text: string
    voiceSettings?: {
        stability: number
        similarity_boost: number
        style: number
    }
    language?: string
}

import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const body: SpeakRequest = await request.json()
        const { text, voiceSettings, language = 'en' } = body

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            )
        }

        let apiKey = process.env.ELEVENLABS_API_KEY
        if (!apiKey) {
            // Fallback for Next.js isolated API routes when using a unified root .env
            try {
                const rootEnvPath = path.resolve(process.cwd(), '../.env')
                if (fs.existsSync(rootEnvPath)) {
                    const envData = fs.readFileSync(rootEnvPath, 'utf8')
                    const match = envData.match(/^ELEVENLABS_API_KEY=(.*)$/m)
                    if (match) {
                        apiKey = match[1].trim()
                    }
                }
            } catch (err) {
                console.warn("Failed to load root .env file in server route for ElevenLabs API KEY")
            }
        }
        const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'

        if (!apiKey) {
            console.error('ELEVENLABS_API_KEY is not configured')
            return NextResponse.json(
                { error: 'Voice service not configured' },
                { status: 500 }
            )
        }

        // Build voice settings with defaults
        const settings = {
            stability: voiceSettings?.stability ?? 0.5,
            similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
            style: voiceSettings?.style ?? 0.3,
        }

        // Validate settings
        if (
            settings.stability < 0 || settings.stability > 0.99 ||
            settings.similarity_boost < 0 || settings.similarity_boost > 0.99 ||
            settings.style < 0 || settings.style > 0.99
        ) {
            return NextResponse.json(
                { error: 'Voice settings must be between 0 and 0.99' },
                { status: 400 }
            )
        }

        // Call ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2_5', // Latest model with low latency
                    voice_settings: settings,
                    language_code: language,
                    optimize_streaming_latency: 3, // 0-4, higher = lower latency
                }),
            }
        )

        if (!response.ok) {
            const error = await response.text()
            console.error(`ElevenLabs API error (${response.status}):`, error)
            return NextResponse.json(
                { error: `Voice generation failed: ${response.statusText}` },
                { status: response.status }
            )
        }

        // Get the audio buffer
        const audioBuffer = await response.arrayBuffer()

        // Return as audio/mpeg
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        })
    } catch (error) {
        console.error('Speak endpoint error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Optional: Add health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Voice API endpoint is running',
        timestamp: new Date().toISOString(),
    })
}
