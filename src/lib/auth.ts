// Mock auth + onboarding state stored entirely in localStorage.

export type UserRole = "student" | "admin";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  creditsTotal: number;
  plan: "free" | "basic" | "pro" | "unlimited";
  onboarded: boolean;
  college?: string;
  grade?: string;
  boardScore?: string;
  subjects?: string[];
  targetGrade?: string;
  language?: "EN" | "RN";
}

const USER_KEY = "ns-user";

export function getCurrentUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(u: MockUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

export function updateCurrentUser(patch: Partial<MockUser>) {
  const u = getCurrentUser();
  if (!u) return null;
  const next = { ...u, ...patch };
  setCurrentUser(next);
  return next;
}

export function logout() {
  localStorage.removeItem(USER_KEY);
}

export function createMockUser(name: string, email: string): MockUser {
  return {
    id: "u_" + Math.random().toString(36).slice(2, 10),
    name,
    email,
    role: "student",
    credits: 20,
    creditsTotal: 20,
    plan: "free",
    onboarded: false,
    language: "EN",
  };
}
