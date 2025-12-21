'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { Button } from '../ui/Button';

interface VideoCallProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isCallActive: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    connectionState: RTCPeerConnectionState;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onEndCall: () => void;
    onStartCall?: () => void;
    showStartButton?: boolean;
}

export function VideoCall({
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    isVideoOff,
    connectionState,
    onToggleMute,
    onToggleVideo,
    onEndCall,
    onStartCall,
    showStartButton = false,
}: VideoCallProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const getConnectionStatusColor = () => {
        switch (connectionState) {
            case 'connected':
                return 'bg-green-500';
            case 'connecting':
                return 'bg-yellow-500';
            case 'disconnected':
            case 'failed':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionState) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'failed':
                return 'Connection Failed';
            default:
                return 'Not Connected';
        }
    };

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden">
            {/* Remote Video (Main) */}
            <div className="absolute inset-0">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                                <VideoOff size={48} className="text-gray-500" />
                            </div>
                            <p className="text-white text-lg">Waiting for partner...</p>
                            <p className="text-gray-400 text-sm mt-2">{getConnectionStatusText()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-64 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                {localStream ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <VideoOff size={32} className="text-gray-500" />
                    </div>
                )}
                {isVideoOff && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                        <VideoOff size={32} className="text-white" />
                    </div>
                )}
            </div>

            {/* Connection Status */}
            <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur-lg flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`} />
                <span className="text-white text-sm font-medium">{getConnectionStatusText()}</span>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-4 px-6 py-4 rounded-full bg-black/50 backdrop-blur-lg">
                    {!isCallActive && showStartButton ? (
                        <Button
                            onClick={onStartCall}
                            className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700"
                        >
                            <Phone size={24} />
                        </Button>
                    ) : (
                        <>
                            {/* Mute Button */}
                            <button
                                onClick={onToggleMute}
                                className={`rounded-full w-14 h-14 flex items-center justify-center transition-colors ${isMuted
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                            >
                                {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                            </button>

                            {/* Video Button */}
                            <button
                                onClick={onToggleVideo}
                                className={`rounded-full w-14 h-14 flex items-center justify-center transition-colors ${isVideoOff
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                            >
                                {isVideoOff ? <VideoOff size={24} className="text-white" /> : <Video size={24} className="text-white" />}
                            </button>

                            {/* End Call Button */}
                            <button
                                onClick={onEndCall}
                                className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                            >
                                <PhoneOff size={24} className="text-white" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
