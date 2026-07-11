import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ChatContainer } from '../components/ai/ChatContainer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { ArrowLeft, Target, Sparkles, CheckCircle } from 'lucide-react';
import { getNextQuestion, generateResultGoal } from '../utils/aiMock';
import { ChatMessage, AIAnswer, Goal } from '../types';
import { decomposeGoal, generateNextQuestion, getProviderConfig } from '../services/aiService';

export function CreateGoalPage() {
  const navigate = useNavigate();
  const { addGoal, addChatMessage, addAIAnswer, aiAnswers, chatMessages, clearChat, aiConfig } = useAppStore();
  
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [isGoalSet, setIsGoalSet] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [resultGoal, setResultGoal] = useState<string>('');
  const [successCriteria, setSuccessCriteria] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEngine, setAiEngine] = useState<'ai' | 'local'>('local');
  const [aiError, setAiError] = useState<string>('');

  useEffect(() => {
    return () => clearChat();
  }, [clearChat]);

  const isUsingRealAI = aiConfig.provider !== 'mock' && !!aiConfig.apiKey;

  const handleStartGoal = async () => {
    if (!goalName.trim()) return;
    
    setIsGoalSet(true);
    setAiError('');
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: `我想实现的目标是：${goalName}`,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    
    setLoading(true);
    let firstQuestion = '';
    
    if (isUsingRealAI) {
      try {
        const result = await generateNextQuestion(aiConfig, goalName, []);
        firstQuestion = result.question;
        setAiEngine('ai');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI 调用失败';
        setAiError(msg);
        setAiEngine('local');
        firstQuestion = getNextQuestion([]) || '';
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      firstQuestion = getNextQuestion([]) || '';
      setAiEngine('local');
    }
    
    if (firstQuestion) {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: firstQuestion,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMsg);
    }
    setLoading(false);
  };

  const handleSendMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);

    const currentMessages = useAppStore.getState().chatMessages;
    const lastAIMessage = currentMessages.filter(m => m.sender === 'ai').pop();
    if (lastAIMessage) {
      const answer: AIAnswer = {
        question: lastAIMessage.content,
        answer: message,
      };
      addAIAnswer(answer);
    }

    setLoading(true);
    const currentAnswers = useAppStore.getState().aiAnswers;
    const allAnswers = [...currentAnswers, { question: lastAIMessage?.content || '', answer: message }];
    
    if (isUsingRealAI) {
      try {
        const result = await generateNextQuestion(aiConfig, goalName, allAnswers);
        if (result.isComplete) {
          await generateFinalResult(allAnswers);
        } else {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            content: result.question,
            timestamp: new Date().toISOString(),
          };
          addChatMessage(aiMsg);
          setAiEngine('ai');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI 调用失败';
        setAiError(msg);
        setAiEngine('local');
        const nextQuestion = getNextQuestion(allAnswers);
        if (nextQuestion) {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            content: nextQuestion,
            timestamp: new Date().toISOString(),
          };
          addChatMessage(aiMsg);
        } else {
          await generateFinalResult(allAnswers);
        }
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      setAiEngine('local');
      const nextQuestion = getNextQuestion(allAnswers);
      if (nextQuestion) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: nextQuestion,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(aiMsg);
      } else {
        await generateFinalResult(allAnswers);
      }
    }
    setLoading(false);
  };

  const generateFinalResult = async (allAnswers: AIAnswer[]) => {
    setLoading(true);
    let result;
    let engine: 'ai' | 'local' = 'local';
    
    if (isUsingRealAI) {
      try {
        result = await decomposeGoal(aiConfig, goalName, allAnswers);
        engine = 'ai';
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI 调用失败';
        setAiError(msg);
        result = generateResultGoal(goalName, allAnswers);
        engine = 'local';
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      result = generateResultGoal(goalName, allAnswers);
    }
    
    setResultGoal(result.resultGoal);
    setSuccessCriteria(result.successCriteria);
    setIsComplete(true);
    setAiEngine(engine);
    setLoading(false);
    
    const engineTag = engine === 'ai' ? '🤖 AI 生成' : '⚙️ 本地模板生成（AI 调用失败）';
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      content: `${engineTag}\n\n根据你的回答，我已经为你生成了具体的结果目标：\n\n**${result.resultGoal}**\n\n成功标准：\n${result.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(aiMsg);
  };

  const handleConfirmGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      description: goalDescription || '通过AI拆解的目标',
      status: 'planning',
      createdAt: new Date().toISOString(),
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      resultGoal,
      successCriteria,
    };
    
    addGoal(goal);
    navigate(`/plan/${goal.id}`);
  };

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
              <h1 className="text-xl font-bold text-gray-800">创建目标</h1>
              <p className="text-xs text-gray-500">让AI帮你拆解模糊目标</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!isGoalSet ? (
          <Card className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mx-auto mb-6">
              <Target className="text-orange-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">你的梦想是什么？</h2>
            <p className="text-gray-500 mb-8">输入你想实现的目标，AI会帮你拆解成具体可执行的番茄任务</p>
            
            <div className="space-y-4 text-left">
              <Input
                label="目标名称"
                placeholder="例如：学习英语、学习炒股、做AI漫剧..."
                value={goalName}
                onChange={setGoalName}
                icon={<Target className="w-5 h-5" />}
              />
              <Input
                type="textarea"
                label="目标描述（可选）"
                placeholder="描述一下你想实现这个目标的原因..."
                value={goalDescription}
                onChange={setGoalDescription}
              />
            </div>
            
            <Button 
              size="lg" 
              className="mt-8 w-full" 
              disabled={!goalName.trim()}
              onClick={handleStartGoal}
            >
              <Sparkles className="mr-2" size={20} />
              开始AI拆解
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Target className="text-orange-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{goalName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {isUsingRealAI ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      aiEngine === 'ai' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        aiEngine === 'ai' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      {aiEngine === 'ai' ? 'AI 模型驱动中' : '本地模板兜底中'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      本地模拟（未配置 AI）
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {getProviderConfig(aiConfig.provider).displayName} · {aiConfig.model}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                ⚙ 设置
              </button>
              <button
                onClick={() => {
                  setIsGoalSet(false);
                  setIsComplete(false);
                  clearChat();
                  setAiError('');
                  setAiEngine('local');
                  setGoalName('');
                  setGoalDescription('');
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                重新开始
              </button>
            </Card>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-500 text-sm">⚠</span>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">AI 调用失败，已切换到本地模板</p>
                  <p className="text-xs text-red-600 mt-1 font-mono">{aiError}</p>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-xs text-red-600 hover:text-red-700 underline"
                >
                  检查配置
                </button>
              </div>
            )}

            <div className="h-[500px]">
              <ChatContainer 
                messages={chatMessages} 
                onSend={handleSendMessage}
                disabled={loading || isComplete}
                isLoading={loading}
              />
            </div>

            {isComplete && (
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="text-green-500" size={24} />
                  <h3 className="font-semibold text-gray-800">目标拆解完成</h3>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">结果目标</h4>
                  <p className="text-gray-800 font-medium">{resultGoal}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">成功标准</h4>
                  <ul className="space-y-2">
                    {successCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                    setIsComplete(false);
                    clearChat();
                    setIsGoalSet(false);
                    setGoalName('');
                  }}>
                    重新拆解
                  </Button>
                  <Button onClick={handleConfirmGoal}>
                    确认目标并生成计划
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
