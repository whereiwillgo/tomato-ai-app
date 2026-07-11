import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { ArrowLeft, Calendar, Clock, CheckCircle2, PlayCircle, ChevronDown, ChevronUp, Target, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { generatePlan, generatePomodoroTasks } from '../utils/aiMock';
import { Phase, PomodoroTask } from '../types';
import { generatePhasePlans } from '../services/aiService';

export function PlanPage() {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { getGoal, goals, addPhases, addTasks, phases, tasks, updateGoalStatus, setCurrentGoal, aiConfig } = useAppStore();
  
  const [dailyHours, setDailyHours] = useState(2);
  const [generatedPhases, setGeneratedPhases] = useState<Phase[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<PomodoroTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  
  const goal = goalId ? getGoal(goalId) || goals.find(g => g.id === goalId) : null;
  const goalPhases = phases.filter(p => p.goalId === goalId);
  const goalTasks = tasks.filter(t => t.goalId === goalId);

  useEffect(() => {
    if (goalPhases.length > 0 && generatedPhases.length === 0) {
      setGeneratedPhases(goalPhases);
    }
    if (goalTasks.length > 0 && generatedTasks.length === 0) {
      setGeneratedTasks(goalTasks);
    }
  }, [goalId, phases.length, tasks.length]);

  const handleGeneratePlan = async () => {
    if (!goal) return;
    
    setLoading(true);
    
    try {
      let planPhases: Phase[] = [];
      let allTasks: PomodoroTask[] = [];
      
      if (aiConfig.provider !== 'mock' && aiConfig.apiKey) {
        const phasePlans = await generatePhasePlans(aiConfig, goal, dailyHours);
        
        let currentDate = new Date();
        let taskOrder = 0;
        
        phasePlans.forEach((phasePlan, phaseIndex) => {
          const startDate = new Date(currentDate);
          const endDate = new Date(currentDate);
          endDate.setDate(endDate.getDate() + phasePlan.durationDays);
          
          const phase: Phase = {
            id: `phase-${Date.now()}-${phaseIndex}`,
            goalId: goal.id,
            name: phasePlan.name,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            progress: 0,
            tasks: [],
          };
          
          planPhases.push(phase);
          
          phasePlan.tasks.forEach((task, taskIndex) => {
            const pomodoroTask: PomodoroTask = {
              id: `task-${Date.now()}-${phaseIndex}-${taskIndex}`,
              goalId: goal.id,
              phaseId: phase.id,
              title: task.title,
              content: task.content,
              notes: task.notes || [],
              duration: 25,
              status: 'pending',
            };
            allTasks.push(pomodoroTask);
            taskOrder++;
          });
          
          currentDate = new Date(endDate);
          currentDate.setDate(currentDate.getDate() + 1);
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        planPhases = generatePlan(goal, dailyHours);
        planPhases.forEach(phase => {
          const phaseTasks = generatePomodoroTasks(phase, goal.name);
          allTasks.push(...phaseTasks);
        });
      }
      
      setGeneratedPhases(planPhases);
      addPhases(planPhases);
      setGeneratedTasks(allTasks);
      addTasks(allTasks);
    } catch (error) {
      console.error('生成计划失败:', error);
      const planPhases = generatePlan(goal, dailyHours);
      setGeneratedPhases(planPhases);
      addPhases(planPhases);
      
      const allTasks: PomodoroTask[] = [];
      planPhases.forEach(phase => {
        const phaseTasks = generatePomodoroTasks(phase, goal.name);
        allTasks.push(...phaseTasks);
      });
      
      setGeneratedTasks(allTasks);
      addTasks(allTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFocus = () => {
    if (!goal) return;
    updateGoalStatus(goal.id, 'in-progress');
    setCurrentGoal(goal);
    navigate(`/timer/${goal.id}`);
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const getPhaseTasks = (phaseId: string) => {
    return generatedTasks.filter(t => t.phaseId === phaseId);
  };

  const getTotalProgress = () => {
    if (generatedTasks.length === 0) return 0;
    const completed = generatedTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / generatedTasks.length) * 100);
  };

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
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">计划制定</h1>
              <p className="text-xs text-gray-500">{goal.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">结果目标</h3>
              <p className="text-gray-600">{goal.resultGoal}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">整体进度</div>
              <div className="text-2xl font-bold text-orange-500">{getTotalProgress()}%</div>
            </div>
          </div>
          <ProgressBar progress={getTotalProgress()} />
        </Card>

        <Card className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} />
            设置每日投入时间
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="8"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-xl font-bold text-orange-500 w-16 text-center">{dailyHours} 小时</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">根据每日投入时间，AI将为你生成合理的阶段规划</p>
          
          <Button 
            className="mt-4 flex items-center gap-2"
            onClick={handleGeneratePlan}
            disabled={loading || generatedPhases.length > 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                正在生成计划...
              </>
            ) : generatedPhases.length > 0 ? (
              <>
                <CheckCircle className="mr-2" size={20} />
                计划已生成
              </>
            ) : (
              <>
                <Sparkles className="mr-2" size={20} />
                生成阶段计划
              </>
            )}
          </Button>
        </Card>

        {generatedPhases.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="text-orange-500" size={20} />
              阶段规划
            </h3>
            
            {generatedPhases.map((phase, index) => {
              const phaseTasks = getPhaseTasks(phase.id);
              const completedCount = phaseTasks.filter(t => t.status === 'completed').length;
              const phaseProgress = phaseTasks.length > 0 ? Math.round((completedCount / phaseTasks.length) * 100) : 0;
              
              return (
                <Card key={phase.id}>
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => togglePhase(phase.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100 text-blue-600' :
                        index === 1 ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{phase.name}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(phase.startDate).toLocaleDateString('zh-CN')} - {new Date(phase.endDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">进度</div>
                        <div className="font-semibold text-orange-500">{phaseProgress}%</div>
                      </div>
                      {expandedPhase === phase.id ? (
                        <ChevronUp className="text-gray-400" />
                      ) : (
                        <ChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <ProgressBar progress={phaseProgress} className="mt-4 mb-4" />
                  
                  {expandedPhase === phase.id && phaseTasks.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      {phaseTasks.map(task => (
                        <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                          task.status === 'completed' ? 'bg-green-50' :
                          task.status === 'in-progress' ? 'bg-orange-50' :
                          'bg-gray-50'
                        }`}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{task.title}</h5>
                            <p className="text-sm text-gray-500 mt-1">{task.content}</p>
                            {task.notes && task.notes.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {task.notes.map((note, i) => (
                                  <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {task.duration}分钟
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
            
            <div className="flex justify-center pt-6">
              <Button 
                size="lg" 
                onClick={handleStartFocus}
                className="flex items-center gap-2"
              >
                <PlayCircle className="mr-2" size={24} />
                开始
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
