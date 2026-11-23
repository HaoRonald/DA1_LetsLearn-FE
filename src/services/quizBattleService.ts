import * as signalR from "@microsoft/signalr";
import axiosInstance from "@/lib/axios";

export interface BattleState {
  id: string;
  joinCode: string;
  status: "waiting" | "active" | "completed";
  questionCount: number;
  durationSeconds: number;
  hostId: string;
  answersThisQuestion: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  createdAt: string;
  startedAt?: string;
  deadline?: string;
  serverNow: string;
  finished: boolean;
  currentQuestionIndex: number;
  answeredCurrentQuestion: boolean;
  myAnswerChoiceId?: string | null;
  questions: { index: number; text: string; choices: { id: string; text: string }[] }[];
  players: { userId: string; username: string; avatar?: string; score: number; answeredCount: number; streak: number; rocketUsed: boolean; isHost: boolean }[];
  results?: { userId: string; username: string; avatar?: string; score: number; correctCount: number; totalAnswerMilliseconds: number; rank: number }[];
  review?: { questionIndex: number; question: string; difficulty: "easy" | "medium" | "hard"; yourAnswer: string | null; correctAnswer: string; isCorrect: boolean | null; explanation: string | null }[];
  rematchBattleId?: string | null;
}

export interface LeaderboardRow { userId: string; username: string; avatar?: string; points: number; rank: number; }
export interface BattleAnswer { questionIndex: number; choiceId: string; correct: boolean; points: number; score: number; }

export const quizBattleService = {
  create: async (courseId: string, difficulty: "easy" | "medium" | "hard" | "mixed", secondsPerQuestion: number, questionCount: number, questionIds?: string[]) => (await axiosInstance.post<BattleState>("/quiz-battles", { courseId, difficulty, secondsPerQuestion, questionCount, questionIds })).data,
  join: async (code: string) => (await axiosInstance.post<BattleState>(`/quiz-battles/join/${encodeURIComponent(code)}`)).data,
  start: async (id: string) => (await axiosInstance.post<BattleState>(`/quiz-battles/${id}/start`)).data,
  end: async (id: string) => (await axiosInstance.post<BattleState>(`/quiz-battles/${id}/end`)).data,
  advance: async (id: string) => (await axiosInstance.post<BattleState>(`/quiz-battles/${id}/advance`)).data,
  rematch: async (id: string) => (await axiosInstance.post<BattleState>(`/quiz-battles/${id}/rematch`)).data,
  leave: async (id: string) => axiosInstance.delete(`/quiz-battles/${id}/leave`),
  get: async (id: string) => (await axiosInstance.get<BattleState>(`/quiz-battles/${id}`, { timeout: 10000 })).data,
  answer: async (id: string, questionIndex: number, choiceId: string, useRocket = false) => (await axiosInstance.post<BattleAnswer>(`/quiz-battles/${id}/answers`, { questionIndex, choiceId, useRocket })).data,
  leaderboard: async (period: "all" | "month" | "week", courseId?: string) => (await axiosInstance.get<LeaderboardRow[]>("/leaderboard", { params: { period, courseId: courseId || undefined } })).data,
  connection: () => {
    const accessTokenFactory = () => {
      const cookie = typeof document === "undefined" ? "" : document.cookie.split("; ").find((item) => item.startsWith("ACCESS_TOKEN="))?.split("=").slice(1).join("=") || "";
      try { return decodeURIComponent(cookie).replace(/^Bearer_/, ""); } catch { return ""; }
    };
    const hubUrl = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "").replace(/\/api$/, "") + "/hubs/quiz-battle";
    return new signalR.HubConnectionBuilder().withUrl(hubUrl, { accessTokenFactory, withCredentials: true })
      .withAutomaticReconnect().configureLogging(signalR.LogLevel.Warning).build();
  },
};
