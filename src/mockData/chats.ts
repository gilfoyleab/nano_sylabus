export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  language?: "EN" | "RN";
  saved?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: string;
  language: "EN" | "RN";
  updatedAt: string;
  group: "Today" | "Yesterday" | "Last 7 Days" | "Older";
  messages: ChatMessage[];
}

export const SEED_SESSIONS: ChatSession[] = [
  {
    id: "s1",
    title: "Newton's third law in simple words",
    subject: "Physics",
    language: "EN",
    updatedAt: "2h ago",
    group: "Today",
    messages: [
      { id: "m1", role: "user", content: "Newton's third law in simple words?", timestamp: "10:42" },
      {
        id: "m2",
        role: "ai",
        content:
          "**Newton's third law** says: *for every action, there is an equal and opposite reaction.*\n\nIf you push a wall with 10N of force, the wall pushes back at you with 10N. The two forces:\n\n1. Are **equal in magnitude**\n2. Act in **opposite directions**\n3. Act on **different bodies** (this is the key!)\n\nExample for NEB Class 11: when a rocket pushes gas downward, the gas pushes the rocket upward — that's how it lifts off.",
        timestamp: "10:42",
      },
    ],
  },
  {
    id: "s2",
    title: "Logarithm properties cheat sheet",
    subject: "Mathematics",
    language: "EN",
    updatedAt: "Yesterday",
    group: "Yesterday",
    messages: [],
  },
  {
    id: "s3",
    title: "Photosynthesis ko process k ho?",
    subject: "Biology",
    language: "RN",
    updatedAt: "3d ago",
    group: "Last 7 Days",
    messages: [],
  },
  {
    id: "s4",
    title: "Difference between ionic and covalent bonds",
    subject: "Chemistry",
    language: "EN",
    updatedAt: "Last week",
    group: "Last 7 Days",
    messages: [],
  },
  {
    id: "s5",
    title: "Essay structure for grade 11 English",
    subject: "English",
    language: "EN",
    updatedAt: "Mar 22",
    group: "Older",
    messages: [],
  },
];

export const SUGGESTED_FOLLOWUPS = [
  "Give me a quick example",
  "Explain in Roman Nepali",
  "Make 3 MCQs from this",
];

// Mock streamed AI responses
export const MOCK_AI_RESPONSES = [
  "Great question. Let me break it down step by step.\n\n1. First, identify what's being asked.\n2. Then connect it to what you already know.\n3. Finally, apply it with a concrete example from the **NEB curriculum**.\n\nWould you like me to make this into MCQs for revision?",
  "Yes — yo concept simple cha. *Roman Nepali* ma bhanchhu:\n\n- **Definition**: yo ek prakar ko reaction ho jasma energy release hunchha.\n- **Example**: jastai combustion of fuel.\n- **Formula**: ΔH < 0 hunchha exothermic ko lagi.\n\nTimi lai practice question chahincha?",
  "Here's a structured answer aligned with your **Class 11** syllabus:\n\n**Key idea:** the principle states that energy can neither be created nor destroyed.\n\n**Why it matters:** every numerical in your textbook chapter 6 builds on this.\n\n**Common mistake:** forgetting to include potential energy in the system.",
];
