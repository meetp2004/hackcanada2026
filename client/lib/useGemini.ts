/**
 * React Hooks for Gemini-powered Features
 * Easy integration into React components
 */

import { useCallback, useState } from 'react';
import {
    askAI,
    getBudgetInsights,
    getCompareInsights,
    getMarketAnalysis,
    getMortgageAdvice,
    downloadPDF,
    checkServerHealth,
    type PersonaWeights,
    type AskAIRequest,
    type AskAIResponse,
    type BudgetInsightsRequest,
    type BudgetInsightsResponse,
    type CompareInsightsRequest,
    type CompareInsightsResponse,
    type MarketAnalysisRequest,
    type MarketAnalysisResponse,
    type MortgageAdvisorRequest,
    type MortgageAdvisorResponse,
} from './geminiAPI';

// ============ ASK AI HOOK ============

export function useAskAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<AskAIResponse | null>(null);

    const ask = useCallback(
        async (message: string, persona?: PersonaWeights, history?: any[]) => {
            setLoading(true);
            setError(null);

            try {
                const result = await askAI({
                    userId: 'anonymous-user', // Required by the backend
                    userQuery: message,
                    personaWeights: persona,
                    conversationHistory: history,
                });

                setResponse(result);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { ask, loading, error, response };
}

// ============ BUDGET INSIGHTS HOOK ============

export function useBudgetInsights() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insights, setInsights] = useState<BudgetInsightsResponse | null>(null);

    const generate = useCallback(
        async (budgetData: any, persona?: PersonaWeights) => {
            setLoading(true);
            setError(null);

            try {
                const result = await getBudgetInsights({
                    budgetData,
                    personaWeights: persona,
                });

                setInsights(result);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const downloadReport = useCallback((pdf: string, fileName: string) => {
        try {
            downloadPDF(pdf, fileName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            throw err;
        }
    }, []);

    return { generate, downloadReport, loading, error, insights };
}

// ============ COMPARE INSIGHTS HOOK ============

export function useCompareInsights() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [comparison, setComparison] = useState<CompareInsightsResponse | null>(null);

    const compare = useCallback(
        async (properties: any[], budget?: number, persona?: PersonaWeights) => {
            setLoading(true);
            setError(null);

            try {
                const result = await getCompareInsights({
                    properties,
                    budget,
                    personaWeights: persona,
                });

                setComparison(result);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { compare, loading, error, comparison };
}

// ============ MARKET ANALYSIS HOOK ============

export function useMarketAnalysis() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<MarketAnalysisResponse | null>(null);

    const analyze = useCallback(
        async (location: string, persona?: PersonaWeights) => {
            setLoading(true);
            setError(null);

            try {
                const result = await getMarketAnalysis({
                    location,
                    personaWeights: persona,
                });

                setAnalysis(result);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { analyze, loading, error, analysis };
}

// ============ MORTGAGE ADVISOR HOOK ============

export function useMortgageAdvisor() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [advice, setAdvice] = useState<MortgageAdvisorResponse | null>(null);

    const getAdvice = useCallback(
        async (
            price: number,
            downPayment: number,
            interestRate: number,
            loanTerm: number,
            persona?: PersonaWeights,
            creditScore?: number,
            income?: number
        ) => {
            setLoading(true);
            setError(null);

            try {
                const result = await getMortgageAdvice({
                    price,
                    downPayment,
                    interestRate,
                    loanTerm,
                    creditScore,
                    income,
                    personaWeights: persona,
                });

                setAdvice(result);
                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { getAdvice, loading, error, advice };
}

// ============ SERVER HEALTH HOOK ============

export function useServerHealth() {
    const [isHealthy, setIsHealthy] = useState(false);
    const [checked, setChecked] = useState(false);

    const check = useCallback(async () => {
        try {
            const healthy = await checkServerHealth();
            setIsHealthy(healthy);
            setChecked(true);
            return healthy;
        } catch (err) {
            setIsHealthy(false);
            setChecked(true);
            return false;
        }
    }, []);

    return { check, isHealthy, checked };
}
