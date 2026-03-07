import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        rate: 2.1,
        change: -0.2,
        label: 'CPI Inflation'
    })
}
