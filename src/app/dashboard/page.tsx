'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { Trophy, Target, TrendingUp, Clock, Play } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const stats = [
        {
            label: 'Total Interviews',
            value: user?.stats?.totalInterviews || 0,
            icon: Target,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            label: 'Average Score',
            value: user?.stats?.averageScore?.toFixed(1) || '0',
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            label: 'Current Rank',
            value: `#${user?.stats?.currentRank || '-'}`,
            icon: Trophy,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            label: 'Current ELO',
            value: user?.stats?.currentElo || 1000,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-primary-100 mb-6">
                    Ready to practice and improve your interview skills?
                </p>
                <Link href="/dashboard/matchmaking">
                    <Button variant="secondary" size="lg" className="gap-2">
                        <Play size={20} />
                        Find Interview Partner
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={stat.color} size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Interviews */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                    {user?.stats?.totalInterviews === 0 ? (
                        <div className="text-center py-12">
                            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">No interviews yet</p>
                            <Link href="/dashboard/matchmaking">
                                <Button>Start Your First Interview</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Interview items would go here */}
                            <p className="text-gray-600">Your recent interviews will appear here</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card hover>
                    <CardHeader>
                        <CardTitle>Practice Interview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Get matched with a partner and practice your interview skills in real-time
                        </p>
                        <Link href="/dashboard/matchmaking">
                            <Button className="w-full">Find Match</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardHeader>
                        <CardTitle>View Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            See where you rank among other users and track your progress
                        </p>
                        <Link href="/dashboard/leaderboard">
                            <Button variant="outline" className="w-full">
                                View Rankings
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
