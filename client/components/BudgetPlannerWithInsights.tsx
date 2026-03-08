/**
 * Budget Planner with Gemini Insights & PDF Generation
 * Shows how to use useBudgetInsights hook
 */

'use client';

import { useState } from 'react';
import { useBudgetInsights } from '@/lib/useGemini';
import { HARDCODED_PERSONA } from '@/lib/elevenlabs';

export default function BudgetPlannerWithInsights() {
    const [budgetData, setBudgetData] = useState({
        totalBudget: 500000,
        downPayment: 100000,
        monthlyAffordability: 3000,
        interestRate: 6.5,
        loanTerm: 30,
        downPaymentPercent: 20,
    });

    const { generate, downloadReport, loading, error, insights } = useBudgetInsights();

    const handleGenerateInsights = async () => {
        try {
            const result = await generate(budgetData, HARDCODED_PERSONA);
            console.log('Insights generated:', result);
        } catch (err) {
            console.error('Error generating insights:', err);
        }
    };

    const handleDownloadPDF = () => {
        if (insights?.pdf && insights?.fileName) {
            downloadReport(insights.pdf, insights.fileName);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">💰 Budget Planner</h1>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Budget ($)
                    </label>
                    <input
                        type="number"
                        value={budgetData.totalBudget}
                        onChange={(e) =>
                            setBudgetData({ ...budgetData, totalBudget: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Down Payment ($)
                    </label>
                    <input
                        type="number"
                        value={budgetData.downPayment}
                        onChange={(e) =>
                            setBudgetData({ ...budgetData, downPayment: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Monthly Affordability ($)
                    </label>
                    <input
                        type="number"
                        value={budgetData.monthlyAffordability}
                        onChange={(e) =>
                            setBudgetData({
                                ...budgetData,
                                monthlyAffordability: parseInt(e.target.value),
                            })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interest Rate (%)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={budgetData.interestRate}
                        onChange={(e) =>
                            setBudgetData({ ...budgetData, interestRate: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Loan Term (years)
                    </label>
                    <input
                        type="number"
                        value={budgetData.loanTerm}
                        onChange={(e) =>
                            setBudgetData({ ...budgetData, loanTerm: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerateInsights}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? '⏳ Generating Insights...' : '🚀 Generate Insights & PDF'}
            </button>

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ❌ Error: {error}
                </div>
            )}

            {/* Results */}
            {insights && (
                <div className="mt-6 space-y-4">
                    {/* Insights Text */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">📊 AI Insights</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{insights.insights}</p>
                    </div>

                    {/* Download PDF Button */}
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                        📥 Download PDF Report
                    </button>
                </div>
            )}
        </div>
    );
}
