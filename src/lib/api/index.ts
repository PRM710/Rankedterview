import apiClient from './client';
import { User } from '@/types';

export const authAPI = {
    // OAuth login
    async oauthCallback(provider: string, oauthId: string, email: string, name: string, avatar?: string) {
        return apiClient.post<{ token: string; user: User }>('/auth/callback', {
            provider,
            oauthId,
            email,
            name,
            avatar,
        });
    },

    // Get OAuth URL
    async getGoogleOAuthURL() {
        return apiClient.get<{ authUrl: string }>('/auth/oauth/google');
    },

    async getGitHubOAuthURL() {
        return apiClient.get<{ authUrl: string }>('/auth/oauth/github');
    },

    // Refresh token
    async refreshToken(token: string) {
        return apiClient.post<{ token: string }>('/auth/refresh', { token });
    },

    // Logout
    logout() {
        apiClient.clearAuthToken();
    },
};

export const userAPI = {
    // Get current user
    async getCurrentUser() {
        return apiClient.get<User>('/users/me');
    },

    // Get user by ID
    async getUser(userId: string) {
        return apiClient.get<User>(`/users/${userId}`);
    },

    // Update profile
    async updateProfile(data: { name?: string; avatar?: string }) {
        return apiClient.put<User>('/users/me', data);
    },

    // Get user stats
    async getUserStats(userId: string) {
        return apiClient.get(`/users/${userId}/stats`);
    },
};

export const matchmakingAPI = {
    // Join queue
    async joinQueue(skillLevel?: number) {
        return apiClient.post('/matchmaking/join', { skillLevel });
    },

    // Leave queue
    async leaveQueue() {
        return apiClient.post('/matchmaking/leave');
    },

    // Get queue status
    async getQueueStatus() {
        return apiClient.get<{
            position: number;
            estimatedWait: number;
            totalInQueue: number;
            matchFound?: boolean;
            roomId?: string;
        }>('/matchmaking/status');
    },
};

export const roomAPI = {
    // Get room
    async getRoom(roomId: string) {
        return apiClient.get(`/rooms/${roomId}`);
    },

    // Join room
    async joinRoom(roomId: string) {
        return apiClient.post(`/rooms/${roomId}/join`);
    },

    // Leave room
    async leaveRoom(roomId: string) {
        return apiClient.post(`/rooms/${roomId}/leave`);
    },

    // Get room state
    async getRoomState(roomId: string) {
        return apiClient.get(`/rooms/${roomId}/state`);
    },
};

export const interviewAPI = {
    // List interviews
    async listInterviews(page: number = 1, limit: number = 20) {
        return apiClient.get('/interviews', { page, limit });
    },

    // Get interview
    async getInterview(interviewId: string) {
        return apiClient.get(`/interviews/${interviewId}`);
    },

    // Get transcript
    async getTranscript(interviewId: string) {
        return apiClient.get(`/interviews/${interviewId}/transcript`);
    },

    // Get recording URLs
    async getRecordingURLs(interviewId: string) {
        return apiClient.get(`/interviews/${interviewId}/recording`);
    },

    // Get feedback
    async getFeedback(interviewId: string) {
        return apiClient.get(`/interviews/${interviewId}/feedback`);
    },
};

export const rankingAPI = {
    // Get global leaderboard
    async getGlobalLeaderboard(limit: number = 100) {
        return apiClient.get('/rankings/global', { limit });
    },

    // Get category leaderboard
    async getCategoryLeaderboard(category: string, limit: number = 100) {
        return apiClient.get(`/rankings/category/${category}`, { limit });
    },

    // Get user rank
    async getUserRank(userId: string, category: string = 'overall') {
        return apiClient.get(`/rankings/user/${userId}`, { category });
    },

    // Get rank history
    async getRankHistory(userId: string) {
        return apiClient.get(`/rankings/history/${userId}`);
    },
};
