'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { User, Mail, Trophy, TrendingUp, Calendar } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Profile</h1>
                <p className="text-gray-600">Manage your account and view statistics</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                            <p className="text-gray-600 mb-4 flex items-center gap-2">
                                <Mail size={16} />
                                {user?.email}
                            </p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                                    {user?.oauthProvider} Account
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                    Active
                                </span>
                            </div>
                        </div>
                        <Button variant="outline">Edit Profile</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="text-yellow-600" />
                            Interview Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Interviews</span>
                            <span className="font-bold">{user?.stats?.totalInterviews || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Average Score</span>
                            <span className="font-bold">
                                {user?.stats?.averageScore?.toFixed(1) || '0.0'}/100
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Score</span>
                            <span className="font-bold">{user?.stats?.totalScore || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="text-green-600" />
                            Ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Current Rank</span>
                            <span className="font-bold">
                                #{user?.stats?.currentRank || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Current ELO</span>
                            <span className="font-bold">{user?.stats?.currentElo || 1000}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Rank Percentile</span>
                            <span className="font-bold text-green-600">Top 10%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Member Since</span>
                        <span className="font-medium">
                            {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Last Login</span>
                        <span className="font-medium">
                            {user?.lastLoginAt
                                ? new Date(user.lastLoginAt).toLocaleDateString()
                                : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-gray-600">OAuth Provider</span>
                        <span className="font-medium capitalize">{user?.oauthProvider}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive updates about your interviews</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={user?.settings?.emailUpdates}
                            className="w-5 h-5"
                            readOnly
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-600">Get notified about matches and results</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={user?.settings?.notifications}
                            className="w-5 h-5"
                            readOnly
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
