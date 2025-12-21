'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

// Configuration for scalability
const WS_CONFIG = {
    RECONNECT_DELAY_MS: 1000,
    MAX_RECONNECT_DELAY_MS: 30000,
    RECONNECT_BACKOFF_MULTIPLIER: 1.5,
    HEARTBEAT_INTERVAL_MS: 25000,
    MESSAGE_QUEUE_MAX_SIZE: 100,
};

type MessageHandler = (data: any) => void;

interface QueuedMessage {
    type: string;
    data?: any;
    timestamp: number;
}

interface WebSocketContextType {
    connected: boolean;
    on: (event: string, callback: MessageHandler) => void;
    off: (event: string, callback?: MessageHandler) => void;
    send: (type: string, data?: any) => boolean;
    emit: (event: string, data?: any) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectDelayRef = useRef(WS_CONFIG.RECONNECT_DELAY_MS);
    const messageQueueRef = useRef<QueuedMessage[]>([]);
    const cleanupRef = useRef(false);
    const { user } = useAuth();

    const userId = user?.id;

    // Flush queued messages when connected
    const flushMessageQueue = useCallback(() => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const now = Date.now();
        const validMessages = messageQueueRef.current.filter(
            msg => now - msg.timestamp < 30000
        );

        validMessages.forEach(msg => {
            try {
                const message = { type: msg.type, ...msg.data };
                socket.send(JSON.stringify(message));
            } catch (e) {
                console.error('Failed to send queued message:', e);
            }
        });

        messageQueueRef.current = [];
    }, []);

    // Start heartbeat
    const startHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }

        heartbeatIntervalRef.current = setInterval(() => {
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, WS_CONFIG.HEARTBEAT_INTERVAL_MS);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Reset cleanup flag on mount
        cleanupRef.current = false;

        let ws: WebSocket | null = null;
        let connectionTimeoutId: NodeJS.Timeout | null = null;

        const connect = () => {
            // Don't connect if we're cleaning up
            if (cleanupRef.current) return;

            const wsUrl = `${WS_URL}/ws?userId=${userId}`;
            console.log('WebSocket connecting to:', wsUrl);

            try {
                ws = new WebSocket(wsUrl);
            } catch (error) {
                console.error('WebSocket creation failed:', error);
                scheduleReconnect();
                return;
            }

            // Connection timeout
            connectionTimeoutId = setTimeout(() => {
                if (ws && ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            }, 10000);

            ws.onopen = () => {
                if (connectionTimeoutId) clearTimeout(connectionTimeoutId);

                // Check if cleanup happened during connection (React StrictMode)
                if (cleanupRef.current) {
                    ws?.close();
                    return;
                }

                console.log('WebSocket connected');
                setConnected(true);
                socketRef.current = ws;
                reconnectDelayRef.current = WS_CONFIG.RECONNECT_DELAY_MS;

                startHeartbeat();
                flushMessageQueue();
            };

            ws.onclose = () => {
                if (connectionTimeoutId) clearTimeout(connectionTimeoutId);

                // Skip logging and reconnection for StrictMode cleanup
                if (cleanupRef.current) return;

                console.log('WebSocket disconnected');
                setConnected(false);
                socketRef.current = null;
                stopHeartbeat();
                scheduleReconnect();
            };

            ws.onerror = () => {
                // Silent - onclose will handle reconnection
            };

            ws.onmessage = (event) => {
                if (cleanupRef.current) return;

                try {
                    const message = JSON.parse(event.data);
                    const { type } = message;

                    // Silent handlers
                    if (type === 'pong' || type === 'connected') return;

                    const handlers = handlersRef.current.get(type);
                    if (handlers) {
                        handlers.forEach(handler => {
                            try {
                                handler(message);
                            } catch (e) {
                                console.error(`Handler error for ${type}:`, e);
                            }
                        });
                    }
                } catch (e) {
                    // Silent parse error
                }
            };
        };

        const scheduleReconnect = () => {
            if (cleanupRef.current) return;

            const delay = reconnectDelayRef.current;
            console.log(`WebSocket reconnecting in ${delay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectDelayRef.current = Math.min(
                    reconnectDelayRef.current * WS_CONFIG.RECONNECT_BACKOFF_MULTIPLIER,
                    WS_CONFIG.MAX_RECONNECT_DELAY_MS
                );
                connect();
            }, delay);
        };

        // Initial connection
        connect();

        // Cleanup
        return () => {
            cleanupRef.current = true;
            stopHeartbeat();

            if (connectionTimeoutId) {
                clearTimeout(connectionTimeoutId);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws) {
                ws.onopen = null;
                ws.onclose = null;
                ws.onerror = null;
                ws.onmessage = null;
                ws.close();
            }
            socketRef.current = null;
        };
    }, [userId, flushMessageQueue, startHeartbeat, stopHeartbeat]);

    // Register event handler
    const on = useCallback((event: string, callback: MessageHandler) => {
        if (!handlersRef.current.has(event)) {
            handlersRef.current.set(event, new Set());
        }
        handlersRef.current.get(event)!.add(callback);
    }, []);

    // Unregister handler
    const off = useCallback((event: string, callback?: MessageHandler) => {
        if (callback) {
            handlersRef.current.get(event)?.delete(callback);
        } else {
            handlersRef.current.delete(event);
        }
    }, []);

    // Send message
    const send = useCallback((type: string, data?: any): boolean => {
        const socket = socketRef.current;

        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                const message = { type, ...data };
                socket.send(JSON.stringify(message));
                return true;
            } catch (e) {
                console.error('WebSocket send error:', e);
            }
        }

        // Queue message if not connected
        if (messageQueueRef.current.length < WS_CONFIG.MESSAGE_QUEUE_MAX_SIZE) {
            messageQueueRef.current.push({ type, data, timestamp: Date.now() });
        }

        return false;
    }, []);

    const emit = useCallback((event: string, data?: any): boolean => {
        return send(event, data);
    }, [send]);

    return (
        <WebSocketContext.Provider value={{ connected, on, off, send, emit }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
