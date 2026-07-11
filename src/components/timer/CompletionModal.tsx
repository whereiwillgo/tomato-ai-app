import { useState } from 'react';
import { PomodoroItem } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CheckCircle, Circle, XCircle, AlertCircle, Clock, Target } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (completions: { itemId: string; completed: boolean; completionRate: number; notes: string }[]) => void;
  items: PomodoroItem[];
  taskTitle: string;
  duration: number;
}

export function CompletionModal({ isOpen, onClose, onSubmit, items, taskTitle, duration }: CompletionModalProps) {
  const [completions, setCompletions] = useState<{ itemId: string; completed: boolean; completionRate: number; notes: string }[]>(
    items.map(item => ({
      itemId: item.id,
      completed: false,
      completionRate: 0,
      notes: '',
    }))
  );

  const handleCompletionChange = (itemId: string, completed: boolean) => {
    setCompletions(prev => 
      prev.map(c => 
        c.itemId === itemId 
          ? { ...c, completed, completionRate: completed ? 100 : 0 }
          : c
      )
    );
  };

  const handleRateChange = (itemId: string, rate: number) => {
    setCompletions(prev => 
      prev.map(c => 
        c.itemId === itemId 
          ? { ...c, completionRate: rate, completed: rate >= 100 }
          : c
      )
    );
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setCompletions(prev => 
      prev.map(c => 
        c.itemId === itemId 
          ? { ...c, notes }
          : c
      )
    );
  };

  const handleSubmit = () => {
    onSubmit(completions);
    onClose();
  };

  const handleReset = () => {
    setCompletions(items.map(item => ({
      itemId: item.id,
      completed: false,
      completionRate: 0,
      notes: '',
    })));
  };

  const completedCount = completions.filter(c => c.completed).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Target className="text-green-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">番茄钟完成！</h2>
          <p className="text-gray-500">请记录本次专注的完成情况</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-orange-500" size={18} />
              <span className="text-gray-700">任务：{taskTitle}</span>
            </div>
            <div className="text-sm text-gray-600">
              专注时长：{Math.floor(duration / 60)} 分钟 {duration % 60} 秒
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((item, index) => {
            const completion = completions.find(c => c.itemId === item.id);
            return (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border ${
                  completion?.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleCompletionChange(item.id, !completion?.completed)}
                    className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: completion?.completed ? '#22c55e' : '#d1d5db',
                      backgroundColor: completion?.completed ? '#22c55e' : 'transparent',
                    }}
                  >
                    {completion?.completed ? (
                      <CheckCircle className="text-white" size={18} />
                    ) : null}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-400">事项 {index + 1}</span>
                      <h4 className={`font-medium ${completion?.completed ? 'text-green-700' : 'text-gray-800'}`}>
                        {item.title}
                      </h4>
                    </div>

                    {item.successCriteria.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={12} className="text-orange-500" />
                          <span className="text-xs font-medium text-orange-600">达标标准</span>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {item.successCriteria.map((criteria, idx) => (
                            <li key={idx}>- {criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 mb-1 block">完成度</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="25"
                            value={completion?.completionRate || 0}
                            onChange={(e) => handleRateChange(item.id, parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {completion?.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <textarea
                        placeholder="备注（可选）：遇到的问题、收获、下一步计划..."
                        value={completion?.notes || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">完成情况</span>
            <div className="flex items-center gap-2">
              {completedCount === items.length ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : completedCount > 0 ? (
                <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="text-xs text-white">~</span>
                </div>
              ) : (
                <XCircle className="text-gray-400" size={20} />
              )}
              <span className="font-medium text-gray-800">
                {completedCount}/{items.length} 事项完成
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            重置
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            跳过
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            提交记录
          </Button>
        </div>
      </Card>
    </div>
  );
}