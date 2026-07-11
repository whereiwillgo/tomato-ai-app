import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { ArrowLeft, Flame, Clock, Target, CheckCircle, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function StatsPage() {
  const { focusRecords, goals, tasks, getGoalProgress } = useAppStore();

  const totalFocusSeconds = focusRecords.reduce((acc, r) => acc + r.duration, 0);
  const totalHours = Math.floor(totalFocusSeconds / 3600);
  const totalMinutes = Math.floor((totalFocusSeconds % 3600) / 60);
  const totalPomodoros = focusRecords.filter(r => r.completed).length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'in-progress').length;

  const weeklyData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = focusRecords.filter(r => r.date.startsWith(dateStr));
      const dayMinutes = Math.floor(dayRecords.reduce((acc, r) => acc + r.duration, 0) / 60);
      
      data.push({
        name: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        minutes: dayMinutes,
        pomodoros: dayRecords.filter(r => r.completed).length,
      });
    }
    
    return data;
  }, [focusRecords]);

  const goalStats = useMemo(() => {
    return goals.slice(0, 5).map(goal => {
      const goalRecords = focusRecords.filter(r => r.goalId === goal.id);
      const goalMinutes = Math.floor(goalRecords.reduce((acc, r) => acc + r.duration, 0) / 60);
      const goalPomodoros = goalRecords.filter(r => r.completed).length;
      
      return {
        ...goal,
        progress: getGoalProgress(goal.id),
        minutes: goalMinutes,
        pomodoros: goalPomodoros,
      };
    });
  }, [goals, focusRecords, getGoalProgress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">统计概览</h1>
              <p className="text-xs text-gray-500">追踪你的专注数据和目标进度</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Flame size={24} />}
              label="累计番茄"
              value={totalPomodoros}
            />
            <StatCard
              icon={<Clock size={24} />}
              label="累计专注"
              value={`${totalHours}h ${totalMinutes}m`}
            />
            <StatCard
              icon={<Target size={24} />}
              label="进行中目标"
              value={activeGoals}
            />
            <StatCard
              icon={<CheckCircle size={24} />}
              label="已完成目标"
              value={completedGoals}
            />
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-orange-500" size={20} />
            本周专注统计
          </h3>
          <Card className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value}分钟`, '专注时长']}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="url(#colorGradient)" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-orange-500" size={20} />
            番茄趋势
          </h3>
          <Card className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value}个`, '完成番茄']}
                />
                <Line 
                  type="monotone" 
                  dataKey="pomodoros" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-orange-500" size={20} />
            目标专注统计
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalStats.length > 0 ? (
              goalStats.map(goal => (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{goal.name}</h4>
                      <p className="text-sm text-gray-500">
                        {goal.minutes}分钟 / {goal.pomodoros}个番茄
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'completed' ? 'bg-green-100 text-green-600' :
                      goal.status === 'in-progress' ? 'bg-orange-100 text-orange-600' :
                      goal.status === 'planning' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {goal.status === 'completed' ? '已完成' :
                       goal.status === 'in-progress' ? '进行中' :
                       goal.status === 'planning' ? '规划中' : '草稿'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="text-right mt-2">
                    <span className="text-sm font-semibold text-orange-500">{goal.progress}%</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Target size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">还没有目标统计数据</p>
                <Link to="/create" className="inline-block mt-4 text-orange-500 hover:text-orange-600">
                  创建第一个目标 →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
