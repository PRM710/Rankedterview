'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/lib/hooks/useWebRTC';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useAuth } from '@/lib/context/AuthContext';
import { VideoCall } from '@/components/interview/VideoCall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, Users, CheckCircle2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

type EndReason = 'self' | 'partner' | 'timeout' | null;

const RECONNECT_TIMEOUT_SECONDS = 30;

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { connected: wsConnected, on, off, emit } = useWebSocket();
    const roomId = params.roomId as string;
    const role = searchParams.get('role') || 'caller';

    const [elapsedTime, setElapsedTime] = useState(0);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    const [endReason, setEndReason] = useState<EndReason>(null);
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);
    const [reconnectCountdown, setReconnectCountdown] = useState(RECONNECT_TIMEOUT_SECONDS);

    // Use refs to track state in callbacks and prevent stale closures
    const isCompleteRef = useRef(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasStartedReconnectTimer = useRef(false);

    const {
        localStream,
        remoteStream,
        isCallActive,
        isMuted,
        isVideoOff,
        connectionState,
        mediaError,
        startCall,
        endCall,
        toggleMute,
        toggleVideo,
    } = useWebRTC(roomId, user?.id || '', role as 'caller' | 'callee');

    // Keep ref in sync with state
    useEffect(() => {
        isCompleteRef.current = isInterviewComplete;
    }, [isInterviewComplete]);

    // Clear reconnection timer helper (defined early to avoid reference errors)
    const clearReconnectionTimer = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        hasStartedReconnectTimer.current = false;
    }, []);

    // Timer for elapsed time
    useEffect(() => {
        if (!isCallActive || isInterviewComplete) return;

        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isCallActive, isInterviewComplete]);

    // Auto-start call when component mounts AND WebSocket is connected
    useEffect(() => {
        if (user?.id && wsConnected && !isCompleteRef.current) {
            console.log(`Starting call as ${role} (WebSocket connected)`);
            startCall();
        }
    }, [startCall, user?.id, role, wsConnected]);

    // Listen for partner ending the call intentionally
    useEffect(() => {
        const handleCallEnded = (data: any) => {
            if (data.roomId === roomId && data.from !== user?.id && !isCompleteRef.current) {
                console.log('Partner ended the call');

                clearReconnectionTimer();
                setEndReason('partner');
                setIsInterviewComplete(true);
                setPartnerDisconnected(false);
                endCall();

                setTimeout(() => {
                    router.push('/dashboard/interviews');
                }, 3000);
            }
        };

        on('call_ended', handleCallEnded);
        return () => off('call_ended');
    }, [on, off, roomId, user?.id, endCall, router, clearReconnectionTimer]);

    // Listen for partner disconnecting (browser close, logout, network loss)
    useEffect(() => {
        const handlePartnerDisconnected = (data: any) => {
            if (data.roomId === roomId && data.from !== user?.id && !isCompleteRef.current) {
                console.log('Partner disconnected (browser/logout)');

                // Start the reconnection countdown
                if (!hasStartedReconnectTimer.current && !partnerDisconnected) {
                    hasStartedReconnectTimer.current = true;
                    setPartnerDisconnected(true);
                    setReconnectCountdown(RECONNECT_TIMEOUT_SECONDS);

                    countdownIntervalRef.current = setInterval(() => {
                        if (isCompleteRef.current) {
                            clearReconnectionTimer();
                            return;
                        }

                        setReconnectCountdown(prev => {
                            if (prev <= 1) {
                                clearReconnectionTimer();
                                setEndReason('timeout');
                                setIsInterviewComplete(true);
                                endCall();
                                setTimeout(() => {
                                    router.push('/dashboard/interviews');
                                }, 3000);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }
            }
        };

        on('partner_disconnected', handlePartnerDisconnected);
        return () => off('partner_disconnected');
    }, [on, off, roomId, user?.id, endCall, router, clearReconnectionTimer, partnerDisconnected]);

    // Handle connection state changes (for reconnection logic)
    useEffect(() => {
        // Skip if already complete
        if (isCompleteRef.current) return;

        if (connectionState === 'disconnected' || connectionState === 'failed') {
            // Start reconnection timer only once
            if (!hasStartedReconnectTimer.current && !partnerDisconnected) {
                console.log('Partner connection lost, starting reconnection timer');
                hasStartedReconnectTimer.current = true;
                setPartnerDisconnected(true);
                setReconnectCountdown(RECONNECT_TIMEOUT_SECONDS);

                countdownIntervalRef.current = setInterval(() => {
                    if (isCompleteRef.current) {
                        clearReconnectionTimer();
                        return;
                    }

                    setReconnectCountdown(prev => {
                        if (prev <= 1) {
                            clearReconnectionTimer();
                            setEndReason('timeout');
                            setIsInterviewComplete(true);
                            endCall();
                            setTimeout(() => {
                                router.push('/dashboard/interviews');
                            }, 3000);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } else if (connectionState === 'connected') {
            // Connection restored
            if (partnerDisconnected) {
                console.log('Partner reconnected!');
                clearReconnectionTimer();
                setPartnerDisconnected(false);
                setReconnectCountdown(RECONNECT_TIMEOUT_SECONDS);
            }
        }
    }, [connectionState, partnerDisconnected, endCall, router, clearReconnectionTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearReconnectionTimer();
        };
    }, [clearReconnectionTimer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndInterview = useCallback(() => {
        // Send call_ended event to partner
        emit('call_ended', { roomId });
        console.log('Sent call_ended event to room:', roomId);

        // End locally
        endCall();
        setEndReason('self');
        setIsInterviewComplete(true);

        // Redirect to results after 3 seconds
        setTimeout(() => {
            router.push('/dashboard/interviews');
        }, 3000);
    }, [emit, roomId, endCall, router]);

    // Interview complete screen
    if (isInterviewComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        {endReason === 'partner' ? (
                            <>
                                <AlertTriangle size={64} className="mx-auto text-yellow-600 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Partner Ended the Call</h2>
                                <p className="text-gray-600 mb-4">
                                    Your interview partner has ended the session.
                                </p>
                            </>
                        ) : endReason === 'timeout' ? (
                            <>
                                <WifiOff size={64} className="mx-auto text-red-600 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Connection Lost</h2>
                                <p className="text-gray-600 mb-4">
                                    Your partner couldn't reconnect within 30 seconds.
                                </p>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={64} className="mx-auto text-green-600 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
                                <p className="text-gray-600 mb-4">
                                    Thank you for participating. Your interview is being processed.
                                </p>
                            </>
                        )}
                        <p className="text-sm text-gray-500">
                            Redirecting to dashboard...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Partner Disconnected Banner */}
                {partnerDisconnected && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <WifiOff className="text-yellow-600" size={24} />
                            <div>
                                <p className="font-medium text-yellow-800">Partner connection lost</p>
                                <p className="text-sm text-yellow-700">
                                    Waiting for reconnection... ({reconnectCountdown}s remaining)
                                </p>
                            </div>
                        </div>
                        <div className="text-2xl font-mono font-bold text-yellow-600">
                            {reconnectCountdown}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mock Interview</h1>
                        <p className="text-gray-600">Room: {roomId}</p>
                        <p className="text-sm text-primary-600">Role: {role}</p>
                        {mediaError && (
                            <p className="text-sm text-red-600">Camera: {mediaError}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
                            <Clock size={20} className="text-primary-600" />
                            <span className="font-mono text-lg font-bold">{formatTime(elapsedTime)}</span>
                        </div>

                        {/* Participants */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
                            <Users size={20} className="text-primary-600" />
                            <span className="font-medium">
                                {remoteStream ? '2' : '1'} / 2
                            </span>
                        </div>

                        {/* Connection Status */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow ${connectionState === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            {connectionState === 'connected' ? (
                                <Wifi size={20} className="text-green-600" />
                            ) : (
                                <WifiOff size={20} className="text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-4">
                    {/* Video Call - Main Area */}
                    <div className="lg:col-span-2">
                        <div className="aspect-video">
                            <VideoCall
                                localStream={localStream}
                                remoteStream={remoteStream}
                                isCallActive={isCallActive}
                                isMuted={isMuted}
                                isVideoOff={isVideoOff}
                                connectionState={connectionState}
                                onToggleMute={toggleMute}
                                onToggleVideo={toggleVideo}
                                onEndCall={handleEndInterview}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Interview Guidelines */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Interview Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        1
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Take turns asking and answering questions
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        2
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Be professional and respectful
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        3
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        Aim for 15-30 minute session
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        4
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        You'll receive AI feedback after completion
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sample Questions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Sample Questions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        Tell me about yourself
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        What are your strengths?
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        Describe a challenging project
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        Where do you see yourself in 5 years?
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* End Interview */}
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={handleEndInterview}
                        >
                            End Interview
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

