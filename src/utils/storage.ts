import { Goal, Phase, PomodoroTask, PomodoroItem, ItemCompletion, FocusRecord, UserPreferences, AIConfig, AIProvider, AIProviderConfig } from '../types';

const STORAGE_KEYS = {
  GOALS: 'tomato_goals',
  PHASES: 'tomato_phases',
  TASKS: 'tomato_tasks',
  RECORDS: 'tomato_records',
  PREFERENCES: 'tomato_preferences',
  AI_CONFIG: 'tomato_ai_config',
  POMODORO_ITEMS: 'tomato_pomodoro_items',
  ITEM_COMPLETIONS: 'tomato_item_completions',
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function saveGoal(goal: Goal): void {
  const goals = getAllGoals();
  const index = goals.findIndex(g => g.id === goal.id);
  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  setStorage(STORAGE_KEYS.GOALS, goals);
}

export function getGoal(id: string): Goal | null {
  const goals = getAllGoals();
  return goals.find(g => g.id === id) || null;
}

export function getAllGoals(): Goal[] {
  return getStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
}

export function updateGoal(id: string, updates: Partial<Goal>): void {
  const goals = getAllGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index >= 0) {
    goals[index] = { ...goals[index], ...updates };
    setStorage(STORAGE_KEYS.GOALS, goals);
  }
}

export function deleteGoal(id: string): void {
  const goals = getAllGoals().filter(g => g.id !== id);
  setStorage(STORAGE_KEYS.GOALS, goals);
  
  const phases = getPhasesByGoal(id);
  phases.forEach(p => deletePhase(p.id));
}

export function savePhase(phase: Phase): void {
  const phases = getAllPhases();
  const index = phases.findIndex(p => p.id === phase.id);
  if (index >= 0) {
    phases[index] = phase;
  } else {
    phases.push(phase);
  }
  setStorage(STORAGE_KEYS.PHASES, phases);
}

export function savePhases(phases: Phase[]): void {
  const existingPhases = getAllPhases().filter(p => !phases.some(newP => newP.id === p.id));
  setStorage(STORAGE_KEYS.PHASES, [...existingPhases, ...phases]);
}

export function getPhase(id: string): Phase | null {
  const phases = getAllPhases();
  return phases.find(p => p.id === id) || null;
}

export function getAllPhases(): Phase[] {
  return getStorage<Phase[]>(STORAGE_KEYS.PHASES, []);
}

export function getPhasesByGoal(goalId: string): Phase[] {
  return getAllPhases().filter(p => p.goalId === goalId);
}

export function updatePhase(id: string, updates: Partial<Phase>): void {
  const phases = getAllPhases();
  const index = phases.findIndex(p => p.id === id);
  if (index >= 0) {
    phases[index] = { ...phases[index], ...updates };
    setStorage(STORAGE_KEYS.PHASES, phases);
  }
}

export function deletePhase(id: string): void {
  const phases = getAllPhases().filter(p => p.id !== id);
  setStorage(STORAGE_KEYS.PHASES, phases);
  
  const tasks = getTasksByPhase(id);
  tasks.forEach(t => deleteTask(t.id));
}

export function saveTasks(tasks: PomodoroTask[]): void {
  const existingTasks = getAllTasks().filter(t => !tasks.some(newT => newT.id === t.id));
  setStorage(STORAGE_KEYS.TASKS, [...existingTasks, ...tasks]);
}

export function getTask(id: string): PomodoroTask | null {
  const tasks = getAllTasks();
  return tasks.find(t => t.id === id) || null;
}

export function getAllTasks(): PomodoroTask[] {
  return getStorage<PomodoroTask[]>(STORAGE_KEYS.TASKS, []);
}

export function getTasksByGoal(goalId: string): PomodoroTask[] {
  return getAllTasks().filter(t => t.goalId === goalId);
}

export function getTasksByPhase(phaseId: string): PomodoroTask[] {
  return getAllTasks().filter(t => t.phaseId === phaseId);
}

export function updateTaskStatus(taskId: string, status: PomodoroTask['status']): void {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index >= 0) {
    tasks[index] = { 
      ...tasks[index], 
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
    setStorage(STORAGE_KEYS.TASKS, tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = getAllTasks().filter(t => t.id !== id);
  setStorage(STORAGE_KEYS.TASKS, tasks);
}

export function saveFocusRecord(record: FocusRecord): void {
  const records = getAllFocusRecords();
  records.push(record);
  setStorage(STORAGE_KEYS.RECORDS, records);
}

export function getAllFocusRecords(): FocusRecord[] {
  return getStorage<FocusRecord[]>(STORAGE_KEYS.RECORDS, []);
}

export function getFocusRecordsByGoal(goalId: string): FocusRecord[] {
  return getAllFocusRecords().filter(r => r.goalId === goalId);
}

export function getTotalFocusTime(): number {
  const records = getAllFocusRecords();
  return records.reduce((total, r) => total + r.duration, 0);
}

export function savePreferences(preferences: UserPreferences): void {
  setStorage(STORAGE_KEYS.PREFERENCES, preferences);
}

export function getPreferences(): UserPreferences {
  return getStorage<UserPreferences>(STORAGE_KEYS.PREFERENCES, {
    dailyFocusHours: 2,
    preferredStartTime: '09:00',
    preferredEndTime: '21:00',
    soundEnabled: true,
    notificationEnabled: true,
  });
}

export function saveAIConfig(config: AIConfig): void {
  setStorage(STORAGE_KEYS.AI_CONFIG, config);
}

export function getAIConfig(): AIConfig {
  return getStorage<AIConfig>(STORAGE_KEYS.AI_CONFIG, {
    provider: 'mock',
    apiKey: '',
    model: 'local-mock',
    providerConfigs: {
      deepseek: { apiKey: '', model: 'deepseek-v4-flash' },
      dashscope: { apiKey: '', model: 'doubao-seed-2-0-lite-260215' },
      zhipu: { apiKey: '', model: 'glm-4.7-flash' },
      aliyun: { apiKey: '', model: 'qwen-turbo' },
      mock: { apiKey: '', model: 'local-mock' },
    },
  });
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  const config = getAIConfig();
  if (config.providerConfigs && config.providerConfigs[provider]) {
    return config.providerConfigs[provider];
  }
  return { apiKey: '', model: '' };
}

export function saveProviderConfig(provider: AIProvider, providerConfig: AIProviderConfig): void {
  const config = getAIConfig();
  const updated = {
    ...config,
    providerConfigs: {
      ...config.providerConfigs,
      [provider]: providerConfig,
    },
  };
  setStorage(STORAGE_KEYS.AI_CONFIG, updated);
}

export function savePomodoroItems(items: PomodoroItem[]): void {
  setStorage(STORAGE_KEYS.POMODORO_ITEMS, items);
}

export function getAllPomodoroItems(): PomodoroItem[] {
  return getStorage<PomodoroItem[]>(STORAGE_KEYS.POMODORO_ITEMS, []);
}

export function getPomodoroItemsByTask(taskId: string): PomodoroItem[] {
  return getAllPomodoroItems().filter(item => item.taskId === taskId);
}

export function updatePomodoroItem(itemId: string, updates: Partial<PomodoroItem>): void {
  const items = getAllPomodoroItems();
  const index = items.findIndex(item => item.id === itemId);
  if (index >= 0) {
    items[index] = { ...items[index], ...updates };
    setStorage(STORAGE_KEYS.POMODORO_ITEMS, items);
  }
}

export function deletePomodoroItem(itemId: string): void {
  const items = getAllPomodoroItems().filter(item => item.id !== itemId);
  setStorage(STORAGE_KEYS.POMODORO_ITEMS, items);
}

export function saveItemCompletions(completions: ItemCompletion[]): void {
  setStorage(STORAGE_KEYS.ITEM_COMPLETIONS, completions);
}

export function getAllItemCompletions(): ItemCompletion[] {
  return getStorage<ItemCompletion[]>(STORAGE_KEYS.ITEM_COMPLETIONS, []);
}

export function getItemCompletionsByTask(taskId: string): ItemCompletion[] {
  return getAllItemCompletions().filter(c => c.taskId === taskId);
}
