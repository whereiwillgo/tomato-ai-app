import { create } from 'zustand';
import { Goal, Phase, PomodoroTask, PomodoroItem, ItemCompletion, FocusRecord, ChatMessage, AIAnswer, TimerStatus, UserPreferences, AIConfig, AIProvider } from '../types';
import { 
  getAllGoals, 
  saveGoal, 
  getGoal as getGoalFromStorage, 
  updateGoal, 
  deleteGoal,
  getAllPhases,
  savePhases,
  getPhasesByGoal,
  updatePhase,
  getAllTasks,
  saveTasks,
  getTasksByGoal,
  updateTaskStatus,
  getAllFocusRecords,
  saveFocusRecord,
  getFocusRecordsByGoal,
  getTotalFocusTime,
  getPreferences,
  savePreferences,
  getAIConfig,
  saveAIConfig,
  getAllPomodoroItems,
  savePomodoroItems,
  getPomodoroItemsByTask,
  updatePomodoroItem as updatePomodoroItemStorage,
  deletePomodoroItem as deletePomodoroItemStorage,
  getAllItemCompletions,
  saveItemCompletions,
  getItemCompletionsByTask,
} from '../utils/storage';

type PomodoroTaskStatus = PomodoroTask['status'];
type PomodoroItemStatus = PomodoroItem['status'];

interface AppStore {
  goals: Goal[];
  phases: Phase[];
  tasks: PomodoroTask[];
  pomodoroItems: PomodoroItem[];
  itemCompletions: ItemCompletion[];
  focusRecords: FocusRecord[];
  currentGoal: Goal | null;
  currentTask: PomodoroTask | null;
  chatMessages: ChatMessage[];
  aiAnswers: AIAnswer[];
  timerStatus: TimerStatus;
  timerSeconds: number;
  currentPomodoro: number;
  preferences: UserPreferences;
  aiConfig: AIConfig;

  loadData: () => void;

  addGoal: (goal: Goal) => void;
  getGoal: (id: string) => Goal | null;
  setCurrentGoal: (goal: Goal | null) => void;
  updateGoalStatus: (id: string, status: Goal['status']) => void;
  removeGoal: (id: string) => void;

  addPhases: (phases: Phase[]) => void;
  updatePhaseProgress: (id: string, progress: number) => void;

  addTasks: (tasks: PomodoroTask[]) => void;
  setCurrentTask: (task: PomodoroTask | null) => void;
  completeTask: (taskId: string) => void;
  skipTask: (taskId: string) => void;

  addPomodoroItems: (items: PomodoroItem[]) => void;
  updatePomodoroItemStatus: (itemId: string, status: PomodoroItemStatus) => void;
  deletePomodoroItem: (itemId: string) => void;
  updatePomodoroItem: (itemId: string, updates: Partial<PomodoroItem>) => void;
  getPomodoroItemsByTask: (taskId: string) => PomodoroItem[];

  addItemCompletion: (completion: ItemCompletion) => void;
  getItemCompletionsByTask: (taskId: string) => ItemCompletion[];

  addChatMessage: (message: ChatMessage) => void;
  addAIAnswer: (answer: AIAnswer) => void;
  clearChat: () => void;

  setTimerStatus: (status: TimerStatus) => void;
  setTimerSeconds: (seconds: number | ((prev: number) => number)) => void;
  incrementPomodoro: () => void;
  resetPomodoro: () => void;

  addFocusRecord: (record: FocusRecord) => void;

  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  setAIProvider: (provider: AIProvider) => void;

  getGoalProgress: (goalId: string) => number;
  getTotalPomodoroCount: () => number;
}

export const useAppStore = create<AppStore>((set, get) => ({
  goals: [],
  phases: [],
  tasks: [],
  pomodoroItems: [],
  itemCompletions: [],
  focusRecords: [],
  currentGoal: null,
  currentTask: null,
  chatMessages: [],
  aiAnswers: [],
  timerStatus: 'idle',
  timerSeconds: 25 * 60,
  currentPomodoro: 0,
  preferences: getPreferences(),
  aiConfig: getAIConfig(),

  loadData: () => {
    const goals = getAllGoals();
    const tasks = getAllTasks();
    const phases = getAllPhases();
    const focusRecords = getAllFocusRecords();
    const preferences = getPreferences();
    const aiConfig = getAIConfig();
    const pomodoroItems = getAllPomodoroItems();
    const itemCompletions = getAllItemCompletions();

    const activeGoal = goals.find(g => g.status === 'in-progress') || goals.find(g => g.status === 'planning') || goals.find(g => g.status === 'draft') || goals[0] || null;
    let currentTask = null;
    if (activeGoal) {
      const goalTasks = tasks.filter(t => t.goalId === activeGoal.id);
      currentTask = goalTasks.find(t => t.status === 'in-progress') || goalTasks.find(t => t.status === 'pending') || goalTasks[0] || null;
    }

    set({
      goals,
      phases,
      tasks,
      focusRecords,
      preferences,
      aiConfig,
      pomodoroItems,
      itemCompletions,
      currentGoal: activeGoal,
      currentTask,
    });
  },

  addGoal: (goal) => {
    saveGoal(goal);
    set(state => ({ goals: [...state.goals, goal] }));
  },

  getGoal: (id) => {
    return get().goals.find(g => g.id === id) || getGoalFromStorage(id);
  },

  setCurrentGoal: (goal) => {
    set({ currentGoal: goal });
    if (goal) {
      const tasks = getTasksByGoal(goal.id);
      const activeTask = tasks.find(t => t.status === 'pending' || t.status === 'in-progress');
      set({ currentTask: activeTask || tasks[0] || null });
    } else {
      set({ currentTask: null });
    }
  },

  updateGoalStatus: (id, status) => {
    updateGoal(id, { status });
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, status } : g),
      currentGoal: state.currentGoal?.id === id ? { ...state.currentGoal, status } : state.currentGoal,
    }));
  },

  removeGoal: (id) => {
    deleteGoal(id);
    set(state => ({
      goals: state.goals.filter(g => g.id !== id),
      phases: state.phases.filter(p => p.goalId !== id),
      tasks: state.tasks.filter(t => t.goalId !== id),
      focusRecords: state.focusRecords.filter(r => r.goalId !== id),
      currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
      currentTask: null,
    }));
  },

  addPhases: (phases) => {
    savePhases(phases);
    set(state => ({ phases: [...state.phases, ...phases] }));
  },

  updatePhaseProgress: (id, progress) => {
    updatePhase(id, { progress });
    set(state => ({
      phases: state.phases.map(p => p.id === id ? { ...p, progress } : p),
    }));
  },

  addTasks: (tasks) => {
    saveTasks(tasks);
    set(state => ({ tasks: [...state.tasks, ...tasks] }));
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
    if (task) {
      updateTaskStatus(task.id, 'in-progress');
      set(state => ({
        tasks: state.tasks.map(t => t.id === task.id ? { ...t, status: 'in-progress' as PomodoroTaskStatus } : t),
      }));
    }
  },

  completeTask: (taskId) => {
    updateTaskStatus(taskId, 'completed');
    set(state => {
      const updatedTasks: PomodoroTask[] = state.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'completed' as PomodoroTaskStatus, completedAt: new Date().toISOString() } : t
      );
      const goalId = updatedTasks.find(t => t.id === taskId)?.goalId;
      const goalTasks = updatedTasks.filter(t => t.goalId === goalId);
      const completedCount = goalTasks.filter(t => t.status === 'completed').length;
      const progress = goalTasks.length > 0 ? Math.round((completedCount / goalTasks.length) * 100) : 0;
      
      return {
        tasks: updatedTasks,
        currentTask: goalTasks.find(t => t.status === 'pending' || t.status === 'in-progress') || null,
        goals: state.goals.map(g => 
          g.id === goalId && progress === 100 ? { ...g, status: 'completed' as const } : g
        ),
        currentGoal: state.currentGoal?.id === goalId && progress === 100 
          ? { ...state.currentGoal, status: 'completed' as const } 
          : state.currentGoal,
      };
    });
  },

  skipTask: (taskId) => {
    updateTaskStatus(taskId, 'skipped');
    set(state => {
      const updatedTasks: PomodoroTask[] = state.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'skipped' as PomodoroTaskStatus } : t
      );
      const goalId = updatedTasks.find(t => t.id === taskId)?.goalId;
      const goalTasks = updatedTasks.filter(t => t.goalId === goalId);
      
      return {
        tasks: updatedTasks,
        currentTask: goalTasks.find(t => t.status === 'pending' || t.status === 'in-progress') || null,
      };
    });
  },

  addChatMessage: (message) => {
    set(state => ({ chatMessages: [...state.chatMessages, message] }));
  },

  addAIAnswer: (answer) => {
    set(state => ({ aiAnswers: [...state.aiAnswers, answer] }));
  },

  clearChat: () => {
    set({ chatMessages: [], aiAnswers: [] });
  },

  setTimerStatus: (status) => {
    set({ timerStatus: status });
  },

  setTimerSeconds: (seconds) => {
    set(state => ({ timerSeconds: typeof seconds === 'function' ? seconds(state.timerSeconds) : seconds }));
  },

  incrementPomodoro: () => {
    set(state => ({ currentPomodoro: state.currentPomodoro + 1 }));
  },

  resetPomodoro: () => {
    set({ currentPomodoro: 0 });
  },

  addFocusRecord: (record) => {
    saveFocusRecord(record);
    set(state => ({ focusRecords: [...state.focusRecords, record] }));
  },

  addPomodoroItems: (items) => {
    const allItems = [...get().pomodoroItems, ...items];
    savePomodoroItems(allItems);
    set({ pomodoroItems: allItems });
  },

  updatePomodoroItemStatus: (itemId, status) => {
    const updatedItems = get().pomodoroItems.map(item => 
      item.id === itemId ? { ...item, status } : item
    );
    savePomodoroItems(updatedItems);
    set({ pomodoroItems: updatedItems });
  },

  deletePomodoroItem: (itemId) => {
    const updatedItems = get().pomodoroItems.filter(item => item.id !== itemId);
    savePomodoroItems(updatedItems);
    set({ pomodoroItems: updatedItems });
  },

  updatePomodoroItem: (itemId, updates) => {
    const updatedItems = get().pomodoroItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    savePomodoroItems(updatedItems);
    set({ pomodoroItems: updatedItems });
  },

  getPomodoroItemsByTask: (taskId) => {
    return get().pomodoroItems.filter(item => item.taskId === taskId);
  },

  addItemCompletion: (completion) => {
    const allCompletions = [...get().itemCompletions, completion];
    saveItemCompletions(allCompletions);
    set({ itemCompletions: allCompletions });
  },

  getItemCompletionsByTask: (taskId) => {
    return get().itemCompletions.filter(c => c.taskId === taskId);
  },

  updatePreferences: (preferences) => {
    const newPreferences = { ...get().preferences, ...preferences };
    savePreferences(newPreferences);
    set({ preferences: newPreferences });
  },

  updateAIConfig: (config) => {
    const currentConfig = get().aiConfig;
    const newConfig = { ...currentConfig, ...config };
    
    const provider = newConfig.provider;
    const currentProviderConfig = newConfig.providerConfigs?.[provider] || { apiKey: '', model: '' };
    const updatedProviderConfig = {
      ...currentProviderConfig,
      apiKey: newConfig.apiKey !== undefined ? newConfig.apiKey : currentProviderConfig.apiKey,
      model: newConfig.model !== undefined ? newConfig.model : currentProviderConfig.model,
      baseUrl: newConfig.baseUrl !== undefined ? newConfig.baseUrl : currentProviderConfig.baseUrl,
    };
    
    const finalConfig = {
      ...newConfig,
      providerConfigs: {
        ...newConfig.providerConfigs,
        [provider]: updatedProviderConfig,
      },
    };
    
    saveAIConfig(finalConfig);
    set({ aiConfig: finalConfig });
  },

  setAIProvider: (provider) => {
    const currentConfig = get().aiConfig;
    const providerConfig = currentConfig.providerConfigs?.[provider];
    
    if (providerConfig) {
      const newConfig = {
        ...currentConfig,
        provider,
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        baseUrl: providerConfig.baseUrl,
      };
      saveAIConfig(newConfig);
      set({ aiConfig: newConfig });
    } else {
      const newConfig = {
        ...currentConfig,
        provider,
        apiKey: '',
        model: '',
      };
      saveAIConfig(newConfig);
      set({ aiConfig: newConfig });
    }
  },

  getGoalProgress: (goalId) => {
    const goalTasks = get().tasks.filter(t => t.goalId === goalId);
    if (goalTasks.length === 0) return 0;
    const completedCount = goalTasks.filter(t => t.status === 'completed').length;
    return Math.round((completedCount / goalTasks.length) * 100);
  },

  getTotalPomodoroCount: () => {
    return get().focusRecords.filter(r => r.completed).length;
  },
}));
