export interface Goal {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'planning' | 'in-progress' | 'completed';
  createdAt: string;
  targetDate: string;
  resultGoal: string;
  successCriteria: string[];
}

export interface Phase {
  id: string;
  goalId: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  tasks: string[];
}

export interface PomodoroTask {
  id: string;
  goalId: string;
  phaseId: string;
  title: string;
  content: string;
  notes: string[];
  duration: number;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: string;
}

export interface PomodoroItem {
  id: string;
  taskId: string;
  order: number;
  title: string;
  successCriteria: string[];
  status: 'pending' | 'completed' | 'partial';
}

export interface ItemCompletion {
  id: string;
  pomodoroItemId: string;
  taskId: string;
  focusRecordId: string;
  completed: boolean;
  completionRate: number;
  notes: string;
  timestamp: string;
}

export interface FocusRecord {
  id: string;
  goalId: string;
  taskId: string;
  date: string;
  duration: number;
  completed: boolean;
}

export interface UserPreferences {
  dailyFocusHours: number;
  preferredStartTime: string;
  preferredEndTime: string;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: 'add_item' | 'remove_item' | 'update_item' | 'complete_task' | 'skip_task' | 'reset_timer' | 'custom';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface AIAnswer {
  question: string;
  answer: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'break';

export type AIProvider = 'deepseek' | 'dashscope' | 'zhipu' | 'aliyun' | 'mock';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  providerConfigs?: Record<AIProvider, AIProviderConfig>;
}

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GoalDecompositionResult {
  resultGoal: string;
  successCriteria: string[];
}

export interface PhasePlan {
  name: string;
  durationDays: number;
  tasks: {
    title: string;
    content: string;
    notes: string[];
  }[];
}

export interface PomodoroItemsResult {
  items: {
    title: string;
    successCriteria: string[];
  }[];
}
