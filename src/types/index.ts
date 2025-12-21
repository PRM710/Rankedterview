export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    oauthProvider: string;
    createdAt: string;
    lastLoginAt: string;
    stats: UserStats;
    settings: UserSettings;
}

export interface UserStats {
    totalInterviews: number;
    totalScore: number;
    averageScore: number;
    currentRank: number;
    currentElo: number;
}

export interface UserSettings {
    notifications: boolean;
    emailUpdates: boolean;
}

export interface Interview {
    id: string;
    roomId: string;
    participants: Participant[];
    status: string;
    startedAt: string;
    endedAt: string;
    duration: number;
    recording: Recording;
    transcript: Transcript;
    evaluation: Evaluation;
    rankingImpact: RankingImpact;
}

export interface Participant {
    userId: string;
    role: string;
    joinedAt: string;
    leftAt: string;
}

export interface Recording {
    recallBotId: string;
    status: string;
    videoUrl: string;
    audioUrl: string;
    transcriptUrl: string;
    metadata: any;
}

export interface Transcript {
    raw: string;
    segments: TranscriptSegment[];
}

export interface TranscriptSegment {
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
}

export interface Evaluation {
    processedAt: string;
    scores: Scores;
    feedback: Feedback;
    aiModel: string;
    tokensUsed: number;
}

export interface Scores {
    communication: number;
    technical: number;
    confidence: number;
    structure: number;
    overall: number;
}

export interface Feedback {
    strengths: string[];
    improvements: string[];
    summary: string;
    highlights: Highlight[];
}

export interface Highlight {
    timestamp: number;
    type: string;
    comment: string;
}

export interface RankingImpact {
    eloChange: number;
    rankChange: number;
}

export interface Room {
    id: string;
    roomId: string;
    status: string;
    participants: string[];
    createdAt: string;
    startedAt: string;
    endedAt: string;
    interviewId?: string;
    metadata: RoomMetadata;
}

export interface RoomMetadata {
    topic: string;
    difficulty: string;
    type: string;
}

export interface Ranking {
    id: string;
    userId: string;
    category: string;
    period: string;
    rank: number;
    score: number;
    elo: number;
    updatedAt: string;
    history: RankingHistory[];
}

export interface RankingHistory {
    date: string;
    rank: number;
    score: number;
    elo: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    avatar: string;
    rank: number;
    score: number;
    elo: number;
}
