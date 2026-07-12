import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { PomodoroItems } from '../components/timer/PomodoroItems';
import { CompletionModal } from '../components/timer/CompletionModal';
import { AIChatPanel } from '../components/timer/AIChatPanel';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ArrowLeft, Target, Coffee, Flame, CheckCircle, MessageCircle, Bot, Clock, AlertTriangle } from 'lucide-react';
import { FocusRecord, ItemCompletion, ChatMessage, ChatAction, PomodoroItem, AIConfig } from '../types';
import { generatePomodoroItems, generateAIResponseWithActions, getInitialChatMessage, ChatContext } from '../utils/aiMock';
import { generateChatResponse, getInitialAIMessage, generatePomodoroItemsForTask, getProviderConfig } from '../services/aiService';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

export function TimerPage() {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { 
    getGoal, 
    goals, 
    tasks, 
    phases,
    currentTask, 
    setCurrentTask,
    completeTask, 
    skipTask,
    addFocusRecord,
    addPomodoroItems,
    updatePomodoroItemStatus,
    deletePomodoroItem,
    updatePomodoroItem,
    pomodoroItems,
    addItemCompletion,
    timerStatus,
    setTimerStatus,
    timerSeconds,
    setTimerSeconds,
    currentPomodoro,
    incrementPomodoro,
    resetPomodoro,
    setCurrentGoal,
    aiConfig,
  } = useAppStore();

  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);
  const [currentPomodoroDuration, setCurrentPomodoroDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);
  const timerCompleteRef = useRef<() => void>(() => {});

  const goal = goalId ? getGoal(goalId) || goals.find(g => g.id === goalId) : null;
  const goalTasks = tasks.filter(t => t.goalId === goalId);
  
  const pendingTasks = goalTasks.filter(t => t.status === 'pending');
  const inProgressTasks = goalTasks.filter(t => t.status === 'in-progress');
  const completedTasks = goalTasks.filter(t => t.status === 'completed');
  const activeTasks = [...pendingTasks, ...inProgressTasks];

  const currentTaskItems = currentTask 
    ? pomodoroItems.filter(item => item.taskId === currentTask.id)
    : [];

  useEffect(() => {
    if (goal && !currentTask && activeTasks.length > 0) {
      setCurrentTask(activeTasks[0]);
      setCurrentGoal(goal);
    }
  }, [goal, currentTask, activeTasks, setCurrentTask, setCurrentGoal]);

  useEffect(() => {
    if (currentTask && currentTaskItems.length === 0) {
      const completedCount = pomodoroItems.filter(i => i.taskId === currentTask.id && i.status === 'completed').length;
      
      const generateItems = async () => {
        setIsGeneratingItems(true);
        try {
          let newItems: PomodoroItem[] = [];
          
          if (aiConfig.provider !== 'mock' && aiConfig.apiKey) {
            try {
              const result = await generatePomodoroItemsForTask(aiConfig, currentTask, completedCount);
              newItems = result.items.map((item, index) => ({
                id: `item-${Date.now()}-${currentTask.id}-${index}`,
                taskId: currentTask.id,
                order: index + 1,
                title: item.title,
                successCriteria: item.successCriteria,
                status: 'pending' as const,
              }));
            } catch {
              newItems = generatePomodoroItems(currentTask, completedCount);
            }
          } else {
            newItems = generatePomodoroItems(currentTask, completedCount);
          }
          
          addPomodoroItems(newItems);
        } finally {
          setIsGeneratingItems(false);
        }
      };
      
      generateItems();
    }
  }, [currentTask, currentTaskItems.length, pomodoroItems, aiConfig, addPomodoroItems]);

  // 初始化AI对话消息
  useEffect(() => {
    if (showChatPanel && chatMessages.length === 0) {
      const context: ChatContext = {
        task: currentTask,
        goal: goal,
        pomodoroItems: currentTaskItems,
        completedPomodoros: currentPomodoro,
        timerStatus,
      };
      
      const initMessage = async () => {
        let content: string;
        if (aiConfig.provider !== 'mock' && aiConfig.apiKey) {
          try {
            const response = await getInitialAIMessage(aiConfig, context);
            content = response.content;
          } catch {
            content = getInitialChatMessage(context);
          }
        } else {
          content = getInitialChatMessage(context);
        }
        
        const initialMessage: ChatMessage = {
          id: `ai-init-${Date.now()}`,
          sender: 'ai',
          content,
          timestamp: new Date().toISOString(),
        };
        setChatMessages([initialMessage]);
      };
      
      initMessage();
    }
  }, [showChatPanel, chatMessages.length, currentTask, goal, currentTaskItems, currentPomodoro, timerStatus, aiConfig]);

  const handleSendChatMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAILoading(true);

    const context: ChatContext = {
      task: currentTask,
      goal: goal,
      pomodoroItems: currentTaskItems,
      completedPomodoros: currentPomodoro,
      timerStatus,
    };

    try {
      let aiResponse;
      if (aiConfig.provider !== 'mock' && aiConfig.apiKey) {
        aiResponse = await generateChatResponse(aiConfig, message, context);
      } else {
        await new Promise(resolve => setTimeout(resolve, 600));
        aiResponse = generateAIResponseWithActions(message, context);
      }
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        actions: aiResponse.actions,
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI对话出错:', error);
      const aiResponse = generateAIResponseWithActions(message, context);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        actions: aiResponse.actions,
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleChatAction = (action: ChatAction) => {
    if (action.action === 'add_item' && currentTask) {
      const newItem: PomodoroItem = {
        id: `item-${Date.now()}-${currentTask.id}`,
        taskId: currentTask.id,
        order: currentTaskItems.length + 1,
        title: action.payload.title,
        successCriteria: action.payload.successCriteria,
        status: 'pending',
      };
      addPomodoroItems([newItem]);

      const confirmationMessage: ChatMessage = {
        id: `ai-confirm-${Date.now()}`,
        sender: 'ai',
        content: `✅ 已成功添加事项：「${action.payload.title}」\n\n现在你的番茄钟事项有 ${currentTaskItems.length + 1} 个。继续加油！`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, confirmationMessage]);
    } else if (action.action === 'remove_item') {
      const itemId = action.payload.itemId;
      const item = currentTaskItems.find(i => i.id === itemId);
      if (item) {
        deletePomodoroItem(itemId);
        const confirmationMessage: ChatMessage = {
          id: `ai-remove-${Date.now()}`,
          sender: 'ai',
          content: `🗑️ 已删除事项：「${item.title}」`,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, confirmationMessage]);
      }
    } else if (action.action === 'update_item') {
      const itemId = action.payload.itemId;
      const updates = action.payload.updates;
      updatePomodoroItem(itemId, updates);
      const confirmationMessage: ChatMessage = {
        id: `ai-update-${Date.now()}`,
        sender: 'ai',
        content: `🔄 已更新事项信息`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, confirmationMessage]);
    } else if (action.action === 'custom' && action.payload?.type === 'cancel') {
      const cancelMessage: ChatMessage = {
        id: `ai-cancel-${Date.now()}`,
        sender: 'ai',
        content: '好的，已取消操作。有需要随时告诉我！',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, cancelMessage]);
    }
  };

  const handleTimerComplete = () => {
    if (timerStatus === 'running') {
      const duration = focusStartTime ? Math.floor((Date.now() - focusStartTime) / 1000) : WORK_TIME;
      setCurrentPomodoroDuration(duration);
      
      if (currentTask) {
        const record: FocusRecord = {
          id: Date.now().toString(),
          goalId: currentTask.goalId,
          taskId: currentTask.id,
          date: new Date().toISOString(),
          duration,
          completed: true,
        };
        addFocusRecord(record);
      }
      
      setShowCompletionModal(true);
      setFocusStartTime(null);
    } else if (timerStatus === 'break') {
      setTimerStatus('idle');
      setTimerSeconds(WORK_TIME);
      setShowBreakModal(false);
    }
  };

  const handleSubmitCompletions = (completions: { itemId: string; completed: boolean; completionRate: number; notes: string }[]) => {
    const focusRecordId = Date.now().toString();
    
    completions.forEach(c => {
      const completion: ItemCompletion = {
        id: Date.now().toString() + Math.random(),
        pomodoroItemId: c.itemId,
        taskId: currentTask?.id || '',
        focusRecordId,
        completed: c.completed,
        completionRate: c.completionRate,
        notes: c.notes,
        timestamp: new Date().toISOString(),
      };
      addItemCompletion(completion);
      updatePomodoroItemStatus(c.itemId, c.completed ? 'completed' : c.completionRate > 0 ? 'partial' : 'pending');
    });

    const nextPomodoro = currentPomodoro + 1;
    incrementPomodoro();

    const allItemsCompleted = currentTaskItems.length > 0 && 
      completions.filter(c => currentTaskItems.some(item => item.id === c.itemId)).every(c => c.completed);
    
    if (allItemsCompleted && currentTask) {
      completeTask(currentTask.id);
    }

    const isLongBreak = nextPomodoro % 4 === 0;
    setTimerSeconds(isLongBreak ? LONG_BREAK_TIME : BREAK_TIME);
    setTimerStatus('break');
    setShowBreakModal(true);
  };

  timerCompleteRef.current = handleTimerComplete;

  useEffect(() => {
    let interval: number | undefined;
    
    if (timerStatus === 'running' || timerStatus === 'break') {
      interval = window.setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus, setTimerSeconds]);

  useEffect(() => {
    if (timerSeconds === 0 && (timerStatus === 'running' || timerStatus === 'break')) {
      timerCompleteRef.current();
    }
  }, [timerSeconds, timerStatus]);

  const handleStart = () => {
    if (timerStatus === 'break') {
      setShowBreakModal(false);
      setTimerStatus('idle');
      setTimerSeconds(WORK_TIME);
      return;
    }
    if (timerStatus === 'idle' || timerStatus === 'completed' || timerStatus === 'paused') {
      if (timerStatus === 'idle' || timerStatus === 'completed') {
        setFocusStartTime(Date.now());
      }
      setTimerStatus('running');
    }
  };

  const handlePause = () => {
    setTimerStatus('paused');
  };

  const handleSkip = () => {
    if (timerStatus === 'running' || timerStatus === 'paused') {
      if (currentTask) {
        skipTask(currentTask.id);
      }
      setTimerStatus('idle');
      setTimerSeconds(WORK_TIME);
      setFocusStartTime(null);
    } else if (timerStatus === 'break') {
      setShowBreakModal(false);
      setTimerStatus('idle');
      setTimerSeconds(WORK_TIME);
    }
  };

  const handleReset = () => {
    setTimerStatus('idle');
    setTimerSeconds(WORK_TIME);
    resetPomodoro();
    setFocusStartTime(null);
    setShowBreakModal(false);
    setShowCompletionModal(false);
  };

  const handleContinue = () => {
    setShowBreakModal(false);
    setTimerStatus('idle');
    setTimerSeconds(WORK_TIME);
  };

  const handleToggleItem = (itemId: string) => {
    const item = pomodoroItems.find(i => i.id === itemId);
    if (!item) return;
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    updatePomodoroItemStatus(itemId, newStatus);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const isGoalComplete = completedTasks.length === goalTasks.length && goalTasks.length > 0;

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">目标不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoHome}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">番茄钟</h1>
              <p className="text-xs text-gray-500">{goal.name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Flame className="text-orange-500" size={16} />
              <span>连续 {currentPomodoro} 个</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isGoalComplete ? (
          <Card className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜完成目标！</h2>
            <p className="text-gray-500 mb-8">你已经完成了所有任务，达成了「{goal.name}」的目标</p>
            <Button onClick={handleGoHome}>
              返回首页
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-2 flex flex-col items-center">
              <TimerDisplay 
                seconds={timerSeconds} 
                status={timerStatus}
                currentPomodoro={currentPomodoro}
              />
              
              <div className="mt-8 flex items-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full ${
                      i <= currentPomodoro % 4 || (currentPomodoro >= 4 && i <= 4)
                        ? 'bg-orange-500' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {currentPomodoro % 4 === 0 && currentPomodoro > 0 ? '长休息' : '短休息'}
                </span>
              </div>
              
              <div className="mt-8">
                <TimerControls 
                  status={timerStatus}
                  onStart={handleStart}
                  onPause={handlePause}
                  onSkip={handleSkip}
                  onReset={handleReset}
                />
              </div>

              <div className="w-full mt-8">
                <PomodoroItems items={currentTaskItems} onToggleItem={handleToggleItem} isLoading={isGeneratingItems} />
              </div>
            </div>
            
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="text-orange-500" size={20} />
                  整体任务进度
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
                  {goal ? (
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">目标：</span>
                        {goal.name}
                      </div>
                      <div className="text-gray-600">{goal.resultGoal}</div>
                      <div>
                        <span className="font-medium text-gray-700">成功标准：</span>
                        {goal.successCriteria.join('；')}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">暂无目标信息</p>
                  )}
                </div>
                <div className="space-y-3">
                  {goalTasks.map(task => {
                    const taskPhase = phases.find(p => p.id === task.phaseId);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = taskPhase ? new Date(taskPhase.endDate) : null;
                    const isOverdue = endDate && endDate < today && task.status !== 'completed' && task.status !== 'skipped';
                    const dateStr = taskPhase
                      ? `${taskPhase.startDate} ~ ${taskPhase.endDate}`
                      : '';

                    return (
                      <div key={task.id} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle className="text-green-500" size={18} />
                          ) : task.id === currentTask?.id ? (
                            <div className="w-4 h-4 rounded-full bg-orange-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm block ${
                            task.status === 'completed' ? 'text-gray-400 line-through' :
                            task.id === currentTask?.id ? 'text-orange-500 font-medium' :
                            isOverdue ? 'text-red-600 font-medium' :
                            'text-gray-600'
                          }`}>
                            {task.title}
                          </span>
                          {dateStr && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={12} className={isOverdue ? 'text-red-400' : 'text-gray-400'} />
                              <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                {dateStr}
                              </span>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium ml-1">
                                  <AlertTriangle size={12} />
                                  已超期
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {showBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <Coffee className="text-blue-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentPomodoro % 4 === 0 ? '长休息时间！' : '休息时间到！'}
            </h2>
            <p className="text-gray-500 mb-6">
              {currentPomodoro % 4 === 0 
                ? '你已经完成了4个番茄，好好休息一下吧！' 
                : '休息一下，喝点水，放松眼睛'}
            </p>
            <div className="text-4xl font-bold text-blue-600 mb-6">
              {timerStatus === 'break' ? (
                `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`
              ) : '00:00'}
            </div>
            <Button onClick={handleContinue} className="w-full">
              继续
            </Button>
          </Card>
        </div>
      )}

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onSubmit={handleSubmitCompletions}
        items={currentTaskItems}
        taskTitle={currentTask?.title || ''}
        duration={currentPomodoroDuration}
      />

      {/* AI对话浮动按钮 */}
      {!showChatPanel && (
        <button
          onClick={() => setShowChatPanel(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/40 hover:scale-110 transition-all duration-200 flex items-center justify-center z-30 group"
          title="AI 专注助手"
        >
          <MessageCircle size={26} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* AI对话面板 */}
      <AIChatPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        messages={chatMessages}
        onSend={handleSendChatMessage}
        onAction={handleChatAction}
        isLoading={isAILoading}
        modelName={getProviderConfig(aiConfig.provider).displayName}
      />
    </div>
  );
}
