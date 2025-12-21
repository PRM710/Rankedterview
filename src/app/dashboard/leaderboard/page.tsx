'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { rankingAPI } from '@/lib/api';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { LeaderboardEntry } from '@/types';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [category, setCategory] = useState('overall');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [category]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const data = category === 'overall'
                ? await rankingAPI.getGlobalLeaderboard(100)
                : await rankingAPI.getCategoryLeaderboard(category, 100);
            // Ensure data is an array before setting state
            setLeaderboard(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };


    const categories = [
        { id: 'overall', label: 'Overall', icon: Trophy },
        { id: 'communication', label: 'Communication', icon: TrendingUp },
        { id: 'technical', label: 'Technical', icon: Award },
        { id: 'confidence', label: 'Confidence', icon: Medal },
    ];

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
        if (rank === 2) return <Medal className="text-gray-400" size={24} />;
        if (rank === 3) return <Medal className="text-orange-600" size={24} />;
        return <span className="text-gray-600 font-bold">#{rank}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                <p className="text-gray-600">See how you rank among other users</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${category === cat.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-white hover:bg-gray-100'
                                }`}
                        >
                            <Icon size={18} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 100 {category.charAt(0).toUpperCase() + category.slice(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-12 text-gray-600">
                            No rankings yet. Be the first to complete an interview!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.slice(0, 3).map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-12 text-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                        {entry.userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{entry.userName}</p>
                                        <p className="text-sm text-gray-600">ELO: {entry.elo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary-600">
                                            {entry.score.toFixed(1)}
                                        </p>
                                        <p className="text-sm text-gray-600">Score</p>
                                    </div>
                                </div>
                            ))}

                            {leaderboard.slice(3).map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <div className="flex-shrink-0 w-12 text-center text-gray-600 font-bold">
                                        #{entry.rank}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                                        {entry.userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{entry.userName}</p>
                                        <p className="text-sm text-gray-500">ELO: {entry.elo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">{entry.score.toFixed(1)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
