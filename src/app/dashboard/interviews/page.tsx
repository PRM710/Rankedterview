'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { interviewAPI } from '@/lib/api';
import { Video, Calendar, Clock, Award } from 'lucide-react';
import { Interview } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadInterviews();
    }, [page]);

    const loadInterviews = async () => {
        setLoading(true);
        try {
            const data = await interviewAPI.listInterviews(page, 20) as any;
            setInterviews(data.data || []);
        } catch (error) {
            console.error('Failed to load interviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Interviews</h1>
                    <p className="text-gray-600">View and review your past interviews</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : interviews.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Video size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
                        <p className="text-gray-600 mb-4">
                            Start your first interview to see it here
                        </p>
                        <Button>Find Interview Partner</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {interviews.map((interview) => (
                        <Card key={interview.id} hover>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    interview.status
                                                )}`}
                                            >
                                                {interview.status}
                                            </span>
                                            {interview.evaluation?.scores?.overall && (
                                                <span className="text-sm font-semibold text-primary-600">
                                                    Score: {interview.evaluation.scores.overall.toFixed(1)}/100
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={16} />
                                                {formatDistanceToNow(new Date(interview.startedAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                            {interview.duration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    {Math.floor(interview.duration / 60)} min
                                                </span>
                                            )}
                                        </div>

                                        {interview.evaluation?.scores && (
                                            <div className="flex gap-2 mt-3">
                                                <ScoreBadge
                                                    label="Communication"
                                                    score={interview.evaluation.scores.communication}
                                                />
                                                <ScoreBadge
                                                    label="Technical"
                                                    score={interview.evaluation.scores.technical}
                                                />
                                                <ScoreBadge
                                                    label="Confidence"
                                                    score={interview.evaluation.scores.confidence}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {interview.status === 'completed' && (
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
    const getColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getColor(score)}`}>
            {label}: {score.toFixed(0)}
        </span>
    );
}
