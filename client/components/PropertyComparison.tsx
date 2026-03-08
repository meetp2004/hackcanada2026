/**
 * Property Comparison Tool with Gemini Analysis
 * Shows how to use useCompareInsights hook
 */

'use client';

import { useState } from 'react';
import { useCompareInsights } from '@/lib/useGemini';
import { HARDCODED_PERSONA } from '@/lib/elevenlabs';

interface PropertyInput {
    id: string;
    address: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
    hoaFee: number;
    schoolDistrict: string;
    daysOnMarket: number;
    notes: string;
}

export default function PropertyComparison() {
    const [budget, setBudget] = useState(600000);
    const [properties, setProperties] = useState<PropertyInput[]>([
        {
            id: '1',
            address: '123 Main St, San Francisco, CA',
            price: 500000,
            beds: 3,
            baths: 2,
            sqft: 1800,
            yearBuilt: 2010,
            hoaFee: 200,
            schoolDistrict: 'Top Rated',
            daysOnMarket: 15,
            notes: 'Recently renovated kitchen',
        },
        {
            id: '2',
            address: '456 Oak Ave, San Francisco, CA',
            price: 550000,
            beds: 4,
            baths: 2.5,
            sqft: 2100,
            yearBuilt: 2005,
            hoaFee: 150,
            schoolDistrict: 'Excellent',
            daysOnMarket: 8,
            notes: 'Large backyard, potential ADU',
        },
    ]);

    const { compare, loading, error, comparison } = useCompareInsights();

    const handleAddProperty = () => {
        setProperties([
            ...properties,
            {
                id: Date.now().toString(),
                address: '',
                price: 0,
                beds: 0,
                baths: 0,
                sqft: 0,
                yearBuilt: 2024,
                hoaFee: 0,
                schoolDistrict: '',
                daysOnMarket: 0,
                notes: '',
            },
        ]);
    };

    const handleRemoveProperty = (id: string) => {
        setProperties(properties.filter((p) => p.id !== id));
    };

    const handlePropertyChange = (id: string, field: keyof PropertyInput, value: any) => {
        setProperties(
            properties.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const handleCompare = async () => {
        try {
            const comparableProperties = properties.map((p) => ({
                address: p.address,
                price: p.price,
                beds: p.beds,
                baths: p.baths,
                sqft: p.sqft,
                yearBuilt: p.yearBuilt,
                hoaFee: p.hoaFee,
                schoolDistrict: p.schoolDistrict,
                daysOnMarket: p.daysOnMarket,
                notes: p.notes,
            }));

            await compare(comparableProperties, budget, HARDCODED_PERSONA);
        } catch (err) {
            console.error('Error comparing properties:', err);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">🏡 Compare Properties</h1>

            {/* Budget Input */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Budget ($)
                </label>
                <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(parseInt(e.target.value))}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 gap-4 mb-6">
                {properties.map((prop) => (
                    <div
                        key={prop.id}
                        className="bg-white p-6 rounded-lg shadow-md border border-purple-200"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Address */}
                            <div className="md:col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={prop.address}
                                    onChange={(e) => handlePropertyChange(prop.id, 'address', e.target.value)}
                                    placeholder="123 Main St, City, State"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* Price, Beds, Baths */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Price ($)
                                </label>
                                <input
                                    type="number"
                                    value={prop.price}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'price', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Beds
                                </label>
                                <input
                                    type="number"
                                    value={prop.beds}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'beds', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Baths
                                </label>
                                <input
                                    type="number"
                                    value={prop.baths}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'baths', parseFloat(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* Sqft, Year, HOA */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Square Feet
                                </label>
                                <input
                                    type="number"
                                    value={prop.sqft}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'sqft', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Year Built
                                </label>
                                <input
                                    type="number"
                                    value={prop.yearBuilt}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'yearBuilt', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    HOA Fee ($/month)
                                </label>
                                <input
                                    type="number"
                                    value={prop.hoaFee}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'hoaFee', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* School & Days on Market */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    School District
                                </label>
                                <input
                                    type="text"
                                    value={prop.schoolDistrict}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'schoolDistrict', e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Days on Market
                                </label>
                                <input
                                    type="number"
                                    value={prop.daysOnMarket}
                                    onChange={(e) =>
                                        handlePropertyChange(prop.id, 'daysOnMarket', parseInt(e.target.value))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={prop.notes}
                                    onChange={(e) => handlePropertyChange(prop.id, 'notes', e.target.value)}
                                    placeholder="Any additional notes about this property..."
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            {/* Remove Button */}
                            <div className="md:col-span-3">
                                <button
                                    onClick={() => handleRemoveProperty(prop.id)}
                                    className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                >
                                    ❌ Remove Property
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                    onClick={handleAddProperty}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all"
                >
                    ➕ Add Property
                </button>

                <button
                    onClick={handleCompare}
                    disabled={loading || properties.length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Analyzing...' : '🔍 Compare Properties'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6">
                    ❌ Error: {error}
                </div>
            )}

            {/* Comparison Results */}
            {comparison && (
                <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Comparison Analysis</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{comparison.comparison}</p>
                    </div>

                    {/* Property Scores */}
                    {comparison.scoring.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Property Scores</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {comparison.scoring.map((score, idx) => (
                                    <div key={idx} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold text-gray-900 mb-3">{score.address}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Value:</span>
                                                <span className="font-bold">{score.value}/10</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Investment:</span>
                                                <span className="font-bold">{score.investment}/10</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Location:</span>
                                                <span className="font-bold">{score.location}/10</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Schools:</span>
                                                <span className="font-bold">{score.schools}/10</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Amenities:</span>
                                                <span className="font-bold">{score.amenities}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
