import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { StatCard } from '../components/common/StatCard';
import { Plus, Target, Clock, Flame, TrendingUp, CheckCircle, PlayCircle, Trash2, Settings, BarChart3 } from 'lucide-react';

export function HomePage() {
  const { goals, removeGoal, getGoalProgress, getTotalPomodoroCount, focusRecords, loadData } = useAppStore();
  
  const totalFocusTime = focusRecords.reduce((acc, r) => acc + r.duration, 0);
  const hours = Math.floor(totalFocusTime / 3600);
  const minutes = Math.floor((totalFocusTime % 3600) / 60);
  
  const activeGoals = goals.filter(g => g.status === 'in-progress');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">番茄AI</h1>
                <p className="text-xs text-gray-500">目标拆解与时间管理助手</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/stats">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="统计概览">
                  <BarChart3 className="text-gray-600" size={20} />
                </button>
              </Link>
              <Link to="/settings">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="设置">
                  <Settings className="text-gray-600" size={20} />
                </button>
              </Link>
              <Link to="/create">
                <Button className="flex items-center gap-2">
                  <Plus size={20} />
                  创建目标
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Flame size={24} />}
              label="今日专注"
              value={`${getTotalPomodoroCount()} 个番茄`}
            />
            <StatCard
              icon={<Clock size={24} />}
              label="累计专注"
              value={`${hours}h ${minutes}m`}
            />
            <StatCard
              icon={<Target size={24} />}
              label="进行中目标"
              value={activeGoals.length}
            />
            <StatCard
              icon={<CheckCircle size={24} />}
              label="已完成目标"
              value={completedGoals.length}
            />
          </div>
          <div className="flex justify-end mt-3">
            <Link to="/stats" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
              <TrendingUp size={14} />
              查看详细统计
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">进行中的目标</h2>
            {activeGoals.length === 0 && (
              <Link to="/create" className="text-sm text-orange-500 hover:text-orange-600">
                创建第一个目标 →
              </Link>
            )}
          </div>
          
          {activeGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map(goal => {
                const progress = getGoalProgress(goal.id);
                return (
                  <Card key={goal.id} hoverable className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <ProgressBar progress={progress} className="mb-4" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        截止日期: {new Date(goal.targetDate).toLocaleDateString('zh-CN')}
                      </span>
                      <Link to={`/timer/${goal.id}`} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600">
                        <PlayCircle size={16} />
                        开始
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Target size={64} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">还没有进行中的目标</h3>
              <p className="text-gray-400 mb-6">创建一个目标，让AI帮你拆解成可执行的番茄任务</p>
              <Link to="/create">
                <Button size="lg">
                  <Plus className="mr-2" size={20} />
                  创建目标
                </Button>
              </Link>
            </div>
          )}
        </section>

        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">已完成的目标</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map(goal => (
                <Card key={goal.id} className="opacity-75">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-700">{goal.name}</h3>
                      <p className="text-sm text-gray-500">已完成于 {new Date(goal.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
