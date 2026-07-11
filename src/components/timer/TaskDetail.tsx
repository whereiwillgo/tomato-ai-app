import { PomodoroTask } from '../../types';
import { Card } from '../common/Card';
import { Target, AlertCircle } from 'lucide-react';

interface TaskDetailProps {
  task: PomodoroTask | null;
}

export function TaskDetail({ task }: TaskDetailProps) {
  if (!task) {
    return (
      <Card className="text-center py-8">
        <Target size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">暂无当前任务</p>
        <p className="text-sm text-gray-400 mt-1">请先创建目标并生成计划</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          task.status === 'completed' ? 'bg-green-100 text-green-600' :
          task.status === 'in-progress' ? 'bg-orange-100 text-orange-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {task.status === 'completed' ? '已完成' :
           task.status === 'in-progress' ? '进行中' :
           task.status === 'skipped' ? '已跳过' : '待开始'}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{task.content}</p>
      
      {task.notes && task.notes.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-600">注意事项</span>
          </div>
          <ul className="space-y-1">
            {task.notes.map((note, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-orange-400 mt-1">-</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
