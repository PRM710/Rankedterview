'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface WebRTCConfig {
    iceServers: RTCIceServer[];
}

const DEFAULT_CONFIG: WebRTCConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

// Helper to get storage key for media state
const getMediaStateKey = (roomId: string, userId: string) =>
    `webrtc_media_state_${roomId}_${userId}`;

interface MediaState {
    isMuted: boolean;
    isVideoOff: boolean;
}

export function useWebRTC(roomId: string, userId: string, role: 'caller' | 'callee' = 'caller') {
    const { connected, on, off, emit } = useWebSocket();

    // Load initial state from localStorage
    const getInitialMediaState = (): MediaState => {
        if (typeof window === 'undefined') return { isMuted: false, isVideoOff: false };
        try {
            const saved = localStorage.getItem(getMediaStateKey(roomId, userId));
            if (saved) return JSON.parse(saved);
        } catch { }
        return { isMuted: false, isVideoOff: false };
    };

    const initialState = getInitialMediaState();

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(initialState.isMuted);
    const [isVideoOff, setIsVideoOff] = useState(initialState.isVideoOff);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
    const [remoteVideoOff, setRemoteVideoOff] = useState(false);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const hasStartedRef = useRef(false);
    const roleRef = useRef(role);

    // Update roleRef when role changes
    useEffect(() => {
        roleRef.current = role;
        console.log('Role updated:', role);
    }, [role]);

    // Initialize media devices
    const startLocalStream = useCallback(async () => {
        try {
            console.log('Requesting media access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // Apply saved media state
            const savedState = getInitialMediaState();

            // Apply mute state
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack && savedState.isMuted) {
                audioTrack.enabled = false;
                console.log('Applied saved mute state: muted');
            }

            // Apply video off state
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && savedState.isVideoOff) {
                videoTrack.enabled = false;
                console.log('Applied saved video state: off');
            }

            localStreamRef.current = stream;
            setLocalStream(stream);
            setMediaError(null);
            return stream;
        } catch (error: any) {
            console.error('Error accessing media devices:', error);
            setMediaError(error.message || 'Failed to access camera/microphone');
            return null;
        }
    }, []);

    // Create peer connection (can work without local stream for receive-only)
    const createPeerConnection = useCallback((stream: MediaStream | null) => {
        if (peerConnection.current) {
            return peerConnection.current;
        }

        console.log('Creating peer connection');
        const pc = new RTCPeerConnection(DEFAULT_CONFIG);

        // Add local stream tracks if available
        if (stream) {
            stream.getTracks().forEach((track) => {
                console.log('Adding track to peer connection:', track.kind);
                pc.addTrack(track, stream);
            });
        }

        // Handle incoming remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            setRemoteStream((prev) => {
                const stream = prev || new MediaStream();
                stream.addTrack(event.track);
                return stream;
            });
            setIsCallActive(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate');
                emit('ice_candidate', {
                    to: roomId,
                    candidate: event.candidate,
                });
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            setConnectionState(pc.connectionState);

            if (pc.connectionState === 'connected') {
                setIsCallActive(true);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setIsCallActive(false);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log('Signaling state:', pc.signalingState);
        };

        peerConnection.current = pc;
        return pc;
    }, [roomId, emit]);

    // Create and send offer (only for caller)
    const createOffer = useCallback(async () => {
        try {
            const pc = peerConnection.current;
            if (!pc) {
                console.error('No peer connection');
                return;
            }

            console.log('Creating offer...');
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });

            await pc.setLocalDescription(offer);
            console.log('Local description set, signaling state:', pc.signalingState);

            console.log('Sending offer to room:', roomId);
            emit('webrtc_offer', {
                to: roomId,
                sdp: offer,
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }, [roomId, emit]);

    // Handle incoming offer (for callee)
    const handleOffer = useCallback(async (message: any) => {
        try {
            if (message.from === userId) {
                console.log('Ignoring our own offer');
                return;
            }

            console.log('Received offer from', message.from);
            console.log('Our userId:', userId);
            console.log('Our role:', roleRef.current);

            if (!message.sdp) {
                console.error('No SDP in offer message!');
                return;
            }

            // Create peer connection if not exists
            let pc = peerConnection.current;
            if (!pc) {
                pc = createPeerConnection(localStreamRef.current);
            }

            console.log('Setting remote description (offer)...');
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
            console.log('Remote description set, signaling state:', pc.signalingState);

            console.log('Creating answer...');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Local description set (answer), signaling state:', pc.signalingState);

            console.log('Sending answer to room:', roomId);
            emit('webrtc_answer', {
                to: roomId,
                sdp: answer,
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }, [createPeerConnection, emit, roomId, userId]);

    // Handle incoming answer (for caller)
    const handleAnswer = useCallback(async (message: any) => {
        try {
            if (message.from === userId) {
                console.log('Ignoring our own answer');
                return;
            }

            console.log('Received answer from', message.from);

            if (!message.sdp) {
                console.error('No SDP in answer message!');
                return;
            }

            const pc = peerConnection.current;
            if (!pc) {
                console.error('No peer connection for answer');
                return;
            }

            console.log('Current signaling state:', pc.signalingState);
            if (pc.signalingState === 'have-local-offer') {
                console.log('Setting remote description (answer)...');
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                console.log('Remote description set, signaling state:', pc.signalingState);
            } else {
                console.log('Ignoring answer - wrong signaling state:', pc.signalingState);
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }, [userId]);

    // Handle ICE candidate
    const handleIceCandidate = useCallback(async (message: any) => {
        try {
            if (message.from === userId) return;

            console.log('Received ICE candidate from', message.from);
            const pc = peerConnection.current;
            if (pc && message.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }, [userId]);

    // Start call
    const startCall = useCallback(async () => {
        if (hasStartedRef.current) {
            console.log('Call already started, skipping');
            return;
        }
        hasStartedRef.current = true;

        try {
            console.log(`Starting call as ${roleRef.current}`);

            // Try to get local stream (may fail if device in use)
            const stream = await startLocalStream();

            if (!stream) {
                console.warn('No local stream available - proceeding in receive-only mode');
                // Still allow connection for receiving remote stream
            }

            if (roleRef.current === 'caller') {
                // Caller creates peer connection and offer
                createPeerConnection(stream);

                // Retry sending offer multiple times to ensure callee receives it
                const sendOfferWithRetry = (attempts: number) => {
                    if (attempts <= 0) return;

                    console.log(`Caller: creating offer (attempt ${4 - attempts + 1}/3)...`);
                    createOffer();

                    // Retry after delay if connection not established
                    setTimeout(() => {
                        if (peerConnection.current?.connectionState !== 'connected' &&
                            peerConnection.current?.connectionState !== 'connecting') {
                            console.log('Connection not established, retrying offer...');
                            sendOfferWithRetry(attempts - 1);
                        }
                    }, 3000);
                };

                // Start offer after short delay for callee to be ready
                setTimeout(() => sendOfferWithRetry(3), 1500);
            } else {
                // Callee: create peer connection immediately so it's ready for offers
                createPeerConnection(stream);
                console.log('Callee: peer connection created, waiting for offer...');
            }
        } catch (error) {
            console.error('Error starting call:', error);
            hasStartedRef.current = false;
        }
    }, [startLocalStream, createPeerConnection, createOffer]);

    // End call
    const endCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIsCallActive(false);
        localStreamRef.current = null;
        hasStartedRef.current = false;

        // Clear persisted media state on call end
        try {
            localStorage.removeItem(getMediaStateKey(roomId, userId));
        } catch { }
    }, [roomId, userId]);

    // Helper to persist and notify media state
    const updateMediaState = useCallback((newMuted: boolean, newVideoOff: boolean) => {
        // Persist to localStorage
        try {
            localStorage.setItem(
                getMediaStateKey(roomId, userId),
                JSON.stringify({ isMuted: newMuted, isVideoOff: newVideoOff })
            );
        } catch { }

        // Notify remote participant
        emit('media_state_changed', {
            roomId,
            isMuted: newMuted,
            isVideoOff: newVideoOff,
        });
    }, [emit, roomId, userId]);

    // Toggle mute - properly mutes audio track so partner doesn't hear
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) {
            console.log('No local stream to mute');
            return;
        }

        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (!audioTrack) {
            console.log('No audio track found');
            return;
        }

        // Toggle the enabled state
        const newEnabled = !audioTrack.enabled;
        audioTrack.enabled = newEnabled;
        const newMuted = !newEnabled;

        console.log(`Audio track enabled: ${newEnabled}, isMuted: ${newMuted}`);

        // Also update the sender if peer connection exists
        if (peerConnection.current) {
            const audioSender = peerConnection.current.getSenders()
                .find(s => s.track?.kind === 'audio');
            if (audioSender && audioSender.track) {
                audioSender.track.enabled = newEnabled;
                console.log('Audio sender track updated');
            }
        }

        setIsMuted(newMuted);
        updateMediaState(newMuted, isVideoOff);
    }, [updateMediaState, isVideoOff]);

    // Toggle video - properly disables video track so partner sees black
    const toggleVideo = useCallback(() => {
        if (!localStreamRef.current) {
            console.log('No local stream to toggle video');
            return;
        }

        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) {
            console.log('No video track found');
            return;
        }

        // Toggle the enabled state
        const newEnabled = !videoTrack.enabled;
        videoTrack.enabled = newEnabled;
        const newVideoOff = !newEnabled;

        console.log(`Video track enabled: ${newEnabled}, isVideoOff: ${newVideoOff}`);

        // Also update the sender if peer connection exists
        if (peerConnection.current) {
            const videoSender = peerConnection.current.getSenders()
                .find(s => s.track?.kind === 'video');
            if (videoSender && videoSender.track) {
                videoSender.track.enabled = newEnabled;
                console.log('Video sender track updated');
            }
        }

        setIsVideoOff(newVideoOff);
        updateMediaState(isMuted, newVideoOff);
    }, [updateMediaState, isMuted]);

    // Setup WebSocket listeners
    useEffect(() => {
        if (!connected) {
            console.log('WebSocket not connected, skipping listener setup');
            return;
        }

        console.log('Setting up WebRTC WebSocket listeners');
        on('webrtc_offer', handleOffer);
        on('webrtc_answer', handleAnswer);
        on('ice_candidate', handleIceCandidate);

        // Listen for remote media state changes
        const handleMediaStateChanged = (data: any) => {
            if (data.roomId === roomId && data.from !== userId) {
                console.log('Remote media state changed:', data);
                if (data.isMuted !== undefined) setRemoteAudioMuted(data.isMuted);
                if (data.isVideoOff !== undefined) setRemoteVideoOff(data.isVideoOff);
            }
        };
        on('media_state_changed', handleMediaStateChanged);

        return () => {
            off('webrtc_offer');
            off('webrtc_answer');
            off('ice_candidate');
            off('media_state_changed');
        };
    }, [connected, on, off, handleOffer, handleAnswer, handleIceCandidate, roomId, userId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        };
    }, [endCall]);

    return {
        localStream,
        remoteStream,
        isCallActive,
        isMuted,
        isVideoOff,
        remoteAudioMuted,
        remoteVideoOff,
        connectionState,
        mediaError,
        startCall,
        endCall,
        toggleMute,
        toggleVideo,
        startLocalStream,
    };
}
