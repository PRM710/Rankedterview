'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { matchmakingAPI } from '@/lib/api';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useAuth } from '@/lib/context/AuthContext';
import { Users, Clock, Loader2, CheckCircle2, UserCheck } from 'lucide-react';

type MatchState = 'idle' | 'searching' | 'found' | 'accepted' | 'ready';

export default function MatchmakingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { connected, on, off, emit } = useWebSocket();
    const [matchState, setMatchState] = useState<MatchState>('idle');
    const [queueStatus, setQueueStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState<{ roomId: string; opponentId?: string } | null>(null);
    const [partnerAccepted, setPartnerAccepted] = useState(false);

    // Listen for match found event via WebSocket
    useEffect(() => {
        on('match_found', (data: any) => {
            console.log('Match found via WebSocket!', data);
            setMatchData({ roomId: data.roomId, opponentId: data.opponentId });
            setMatchState('found');
        });

        on('partner_accepted', (data: any) => {
            console.log('Partner accepted!', data);
            setPartnerAccepted(true);
            // If we already accepted, go to room
            if (matchState === 'accepted') {
                setMatchState('ready');
                setTimeout(() => {
                    router.push(`/dashboard/interview/${matchData?.roomId}?role=callee`);
                }, 1000);
            }
        });

        on('both_ready', (data: any) => {
            console.log('Both users ready!', data);
            setMatchState('ready');
            // Role is determined by who accepted first or by backend
            const role = data.role || 'caller';
            setTimeout(() => {
                router.push(`/dashboard/interview/${data.roomId}?role=${role}`);
            }, 1000);
        });

        return () => {
            off('match_found');
            off('partner_accepted');
            off('both_ready');
        };
    }, [on, off, router, matchState, matchData]);

    // Poll queue status while searching
    useEffect(() => {
        if (matchState !== 'searching') return;

        const interval = setInterval(async () => {
            try {
                const status = await matchmakingAPI.getQueueStatus();

                // Check if match was found during polling
                if (status.matchFound && status.roomId) {
                    console.log('Match found via polling!', status);
                    setMatchData({ roomId: status.roomId });
                    setMatchState('found');
                    return;
                }

                setQueueStatus(status);
            } catch (error) {
                console.error('Failed to get queue status:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [matchState]);

    const joinQueue = async () => {
        setLoading(true);
        try {
            await matchmakingAPI.joinQueue();
            setMatchState('searching');
        } catch (error: any) {
            if (error.response?.status === 409) {
                setMatchState('searching');
            } else {
                console.error('Failed to join queue:', error);
                alert('Failed to join queue. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const leaveQueue = async () => {
        setLoading(true);
        try {
            await matchmakingAPI.leaveQueue();
            setMatchState('idle');
            setQueueStatus(null);
        } catch (error) {
            console.error('Failed to leave queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const acceptMatch = useCallback(() => {
        if (!matchData?.roomId) return;

        console.log('Accepting match...', { roomId: matchData.roomId, connected });
        setMatchState('accepted');

        // Retry sending accept_match if needed
        const sendAccept = (retries = 3) => {
            console.log(`Sending accept_match (retries left: ${retries})`);
            emit('accept_match', { roomId: matchData.roomId });

            // If not connected, retry after a delay
            if (!connected && retries > 0) {
                setTimeout(() => sendAccept(retries - 1), 500);
            }
        };

        sendAccept();

        // If partner already accepted, we're the callee - go to room
        if (partnerAccepted) {
            setMatchState('ready');
            setTimeout(() => {
                router.push(`/dashboard/interview/${matchData.roomId}?role=callee`);
            }, 1000);
        }
    }, [matchData, partnerAccepted, emit, router, connected]);

    const declineMatch = async () => {
        setMatchState('idle');
        setMatchData(null);
        setPartnerAccepted(false);
        try {
            await matchmakingAPI.leaveQueue();
        } catch (error) {
            console.error('Failed to leave queue:', error);
        }
    };

    // Ready state - going to room
    if (matchState === 'ready') {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        <CheckCircle2 size={64} className="mx-auto text-green-600 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Both Ready!</h2>
                        <p className="text-gray-600 mb-4">Entering interview room...</p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Accepted state - waiting for partner
    if (matchState === 'accepted') {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        <UserCheck size={64} className="mx-auto text-primary-600 mb-4 animate-pulse" />
                        <h2 className="text-2xl font-bold mb-2">You're Ready!</h2>
                        <p className="text-gray-600 mb-4">Waiting for partner to accept...</p>
                        <Loader2 size={32} className="mx-auto text-primary-600 animate-spin" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Match found - show accept buttons
    if (matchState === 'found' && matchData) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        <div className="relative">
                            <CheckCircle2 size={64} className="mx-auto text-green-600 mb-4 animate-bounce" />
                            {partnerAccepted && (
                                <span className="absolute top-0 right-1/4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                    Partner Ready!
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Match Found!</h2>
                        <p className="text-gray-600 mb-6">
                            A partner is ready for the interview
                        </p>

                        {!connected && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
                                Reconnecting to server...
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button
                                onClick={acceptMatch}
                                size="lg"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={!connected}
                            >
                                {connected ? 'Accept Match' : 'Reconnecting...'}
                            </Button>
                            <Button
                                onClick={declineMatch}
                                variant="outline"
                                className="w-full"
                            >
                                Decline
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Searching state
    if (matchState === 'searching') {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Finding Interview Partner...</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                        <Loader2 size={64} className="mx-auto text-primary-600 mb-6 animate-spin" />

                        <h3 className="text-xl font-semibold mb-2">Searching for a match</h3>
                        <p className="text-gray-600 mb-6">
                            We're finding the perfect interview partner for you
                        </p>

                        {queueStatus && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-primary-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Position in Queue</p>
                                    <p className="text-2xl font-bold text-primary-600">
                                        #{queueStatus.position}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Estimated Wait</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {Math.ceil(queueStatus.estimatedWait)}s
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Users in Queue</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {queueStatus.totalInQueue}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={leaveQueue}
                            disabled={loading}
                            className="w-full max-w-xs"
                        >
                            Cancel Search
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>While You Wait...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600">✓</span>
                                <span>Make sure your camera and microphone are working</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600">✓</span>
                                <span>Find a quiet place with good lighting</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600">✓</span>
                                <span>Prepare to introduce yourself professionally</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600">✓</span>
                                <span>Be ready to both ask and answer questions</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Idle state - initial view
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Start Practice Interview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users size={64} className="mx-auto text-primary-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Ready to Practice?</h3>
                        <p className="text-gray-600 mb-6">
                            Get matched with another user and practice your interview skills in a real-time mock interview
                        </p>

                        {!connected && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                                Connecting to matchmaking server...
                            </div>
                        )}

                        <Button
                            onClick={joinQueue}
                            loading={loading}
                            disabled={!connected}
                            size="lg"
                            className="px-12"
                        >
                            Find Interview Partner
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                            1
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Join the Queue</h4>
                            <p className="text-gray-600 text-sm">
                                Click the button above to enter the matchmaking queue
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                            2
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Get Matched & Accept</h4>
                            <p className="text-gray-600 text-sm">
                                When a partner is found, both of you must accept to continue
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                            3
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Start Interview</h4>
                            <p className="text-gray-600 text-sm">
                                Begin your practice interview with video and audio
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                            4
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Get AI Feedback</h4>
                            <p className="text-gray-600 text-sm">
                                Receive detailed evaluation and feedback from our AI
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
