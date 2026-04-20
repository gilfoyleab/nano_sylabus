export interface Subject {
  id: string;
  name: string;
  icon: string;
  board: "NEB" | "TU" | "PU" | "KU";
  grade: string;
  category: "Science" | "Humanities" | "Management" | "Technical";
  questions: number;
  lastActivity: string;
  enrolled?: boolean;
}

export const SUBJECTS: Subject[] = [
  { id: "phy11", name: "Physics", icon: "⚛️", board: "NEB", grade: "Class 11", category: "Science", questions: 42, lastActivity: "2h ago", enrolled: true },
  { id: "chem11", name: "Chemistry", icon: "🧪", board: "NEB", grade: "Class 11", category: "Science", questions: 28, lastActivity: "Yesterday", enrolled: true },
  { id: "math11", name: "Mathematics", icon: "∑", board: "NEB", grade: "Class 11", category: "Science", questions: 67, lastActivity: "1h ago", enrolled: true },
  { id: "bio11", name: "Biology", icon: "🧬", board: "NEB", grade: "Class 11", category: "Science", questions: 19, lastActivity: "3d ago", enrolled: true },
  { id: "eng11", name: "English", icon: "✍︎", board: "NEB", grade: "Class 11", category: "Humanities", questions: 14, lastActivity: "5d ago", enrolled: true },
  { id: "cs11", name: "Computer Science", icon: "{ }", board: "NEB", grade: "Class 11", category: "Technical", questions: 31, lastActivity: "1d ago", enrolled: true },
  { id: "acc11", name: "Accountancy", icon: "₨", board: "NEB", grade: "Class 11", category: "Management", questions: 0, lastActivity: "—" },
  { id: "eco11", name: "Economics", icon: "▲", board: "TU", grade: "BBS Yr 1", category: "Management", questions: 0, lastActivity: "—" },
  { id: "stat", name: "Statistics", icon: "📊", board: "TU", grade: "BBS Yr 1", category: "Management", questions: 0, lastActivity: "—" },
];

export const COLLEGES = [
  "Budhanilkantha School",
  "St. Xavier's College",
  "Trinity International College",
  "Kathmandu Model College",
  "GoldenGate International College",
  "Caspian Valley College",
  "Tribhuvan University",
  "Kathmandu University",
  "Pokhara University",
  "Purbanchal University",
];

export const GRADES = [
  "Class 9", "Class 10", "Class 11", "Class 12",
  "BBS Yr 1", "BBS Yr 2", "BBS Yr 3", "BBS Yr 4",
  "BCA Yr 1", "BCA Yr 2", "BCA Yr 3", "BCA Yr 4",
];
