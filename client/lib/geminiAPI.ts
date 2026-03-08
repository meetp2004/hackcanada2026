/**
 * API Client for Homeway Backend Services
 * Communicates with Node.js/Express server for Gemini-powered features
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PersonaWeights {
    family: number;
    finance: number;
    community: number;
    investment: number;
}

// ============ ASK AI ============

export interface AskAIRequest {
    userId: string;
    userQuery: string;
    propertyAddress?: string;
}

export interface AskAIResponse {
    success: boolean;
    response: string;
    personaWeights?: PersonaWeights;
    timestamp: string;
}

export async function askAI(request: AskAIRequest): Promise<AskAIResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            response: data.output && data.output.ttsDialogue 
                      ? data.output.ttsDialogue 
                      : (data.debate && data.debate.oracle && data.debate.oracle.recommendation 
                          ? data.debate.oracle.recommendation 
                          : 'No response available.'),
            personaWeights: data.orchestration?.personaWeights,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Ask AI Error:', error);
        throw error;
    }
}

// ============ BUDGET INSIGHTS ============

export interface BudgetData {
    totalBudget: number;
    downPayment: number;
    monthlyAffordability: number;
    interestRate: number;
    loanTerm: number;
    downPaymentPercent?: number;
}

export interface BudgetInsightsRequest {
    budgetData: BudgetData;
    personaWeights?: PersonaWeights;
}

export interface BudgetInsightsResponse {
    success: boolean;
    insights: string;
    pdf: string; // base64 encoded
    fileName: string;
    budgetData: BudgetData;
    timestamp: string;
}

export async function getBudgetInsights(
    request: BudgetInsightsRequest
): Promise<BudgetInsightsResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/budget-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Budget Insights Error:', error);
        throw error;
    }
}

/**
 * Download PDF from base64 string
 */
export function downloadPDF(base64: string, fileName: string) {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('PDF Download Error:', error);
        throw error;
    }
}

// ============ COMPARE INSIGHTS ============

export interface Property {
    address: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
    hoaFee?: number;
    schoolDistrict?: string;
    daysOnMarket?: number;
    notes?: string;
}

export interface CompareInsightsRequest {
    properties: Property[];
    budget?: number;
    personaWeights?: PersonaWeights;
}

export interface PropertyScore {
    address: string;
    value: number;
    investment: number;
    location: number;
    schools: number;
    amenities: number;
}

export interface CompareInsightsResponse {
    success: boolean;
    comparison: string;
    scoring: PropertyScore[];
    propertiesCount: number;
    timestamp: string;
}

export async function getCompareInsights(
    request: CompareInsightsRequest
): Promise<CompareInsightsResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/compare-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Compare Insights Error:', error);
        throw error;
    }
}

// ============ MARKET ANALYSIS ============

export interface MarketAnalysisRequest {
    location: string;
    personaWeights?: PersonaWeights;
}

export interface MarketAnalysisResponse {
    success: boolean;
    location: string;
    analysis: string;
    timestamp: string;
}

export async function getMarketAnalysis(
    request: MarketAnalysisRequest
): Promise<MarketAnalysisResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/market-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Market Analysis Error:', error);
        throw error;
    }
}

// ============ MORTGAGE ADVISOR ============

export interface MortgageAdvisorRequest {
    price: number;
    downPayment: number;
    interestRate: number;
    loanTerm: number;
    creditScore?: number;
    income?: number;
    personaWeights?: PersonaWeights;
}

export interface MortgageCalculation {
    price: number;
    downPayment: number;
    principal: number;
    interestRate: number;
    loanTerm: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
}

export interface MortgageAdvisorResponse {
    success: boolean;
    calculation: MortgageCalculation;
    advice: string;
    timestamp: string;
}

export async function getMortgageAdvice(
    request: MortgageAdvisorRequest
): Promise<MortgageAdvisorResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mortgage-advisor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Mortgage Advisor Error:', error);
        throw error;
    }
}

// ============ HEALTH CHECK ============

export async function checkServerHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.warn('Server health check failed:', error);
        return false;
    }
}
