'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { interviewAPI } from '@/lib/api';
import { Interview } from '@/types';
import { Trophy, TrendingUp, MessageSquare, Star, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function InterviewDetailsPage() {
    const params = useParams();
    const interviewId = params.id as string;

    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInterview();
    }, [interviewId]);

    const loadInterview = async () => {
        try {
            const data = await interviewAPI.getInterview(interviewId);
            setInterview(data as Interview);
        } catch (error) {
            console.error('Failed to load interview:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (!interview) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Interview not found</p>
                <Link href="/dashboard/interviews">
                    <Button className="mt-4">Back to Interviews</Button>
                </Link>
            </div>
        );
    }

    const scores = interview.evaluation?.scores;
    const feedback = interview.evaluation?.feedback;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Interview Details</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDistanceToNow(new Date(interview.startedAt), { addSuffix: true })}
                    </span>
                    {interview.duration && (
                        <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {Math.floor(interview.duration / 60)} minutes
                        </span>
                    )}
                </div>
            </div>

            {/* Scores */}
            {scores && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="text-yellow-600" />
                            Performance Scores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <ScoreCard label="Overall" score={scores.overall} color="primary" />
                            <ScoreCard label="Communication" score={scores.communication} color="blue" />
                            <ScoreCard label="Technical" score={scores.technical} color="green" />
                            <ScoreCard label="Confidence" score={scores.confidence} color="purple" />
                            <ScoreCard label="Structure" score={scores.structure} color="orange" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Feedback */}
            {feedback && (
                <>
                    {/* Strengths */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="text-green-600" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {feedback.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">✓</span>
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Areas for Improvement */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="text-orange-600" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {feedback.improvements.map((improvement, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">→</span>
                                        <span>{improvement}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="text-primary-600" />
                                AI Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 leading-relaxed">{feedback.summary}</p>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Recording */}
            {interview.recording?.videoUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recording</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <video
                            src={interview.recording.videoUrl}
                            controls
                            className="w-full rounded-lg"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                <Link href="/dashboard/interviews">
                    <Button variant="outline">Back to Interviews</Button>
                </Link>
                <Link href="/dashboard/matchmaking">
                    <Button>Practice Again</Button>
                </Link>
            </div>
        </div>
    );
}

function ScoreCard({
    label,
    score,
    color,
}: {
    label: string;
    score: number;
    color: string;
}) {
    const getColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="text-center p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-2">{label}</p>
            <p className={`text-3xl font-bold ${getColor(score)}`}>{score.toFixed(0)}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${getColor(score).replace('text', 'bg')}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
