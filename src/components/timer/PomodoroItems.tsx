import { PomodoroItem } from '../../types';
import { Card } from '../common/Card';
import { AlertCircle, ListChecks, Check, Loader2 } from 'lucide-react';

interface PomodoroItemsProps {
  items: PomodoroItem[];
  showSuccessCriteria?: boolean;
  onToggleItem?: (itemId: string) => void;
  isLoading?: boolean;
}

export function PomodoroItems({ items, showSuccessCriteria = true, onToggleItem, isLoading = false }: PomodoroItemsProps) {
  if (isLoading) {
    return (
      <Card className="text-center py-8">
        <Loader2 size={48} className="mx-auto text-orange-400 mb-4 animate-spin" />
        <p className="text-gray-500">正在生成番茄钟事项...</p>
        <p className="text-sm text-gray-400 mt-1">AI正在为你规划本番茄钟的工作内容</p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="text-center py-8">
        <ListChecks size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">暂无当前番茄钟事项</p>
        <p className="text-sm text-gray-400 mt-1">请稍候，正在准备工作事项</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={20} className="text-orange-500" />
        <h3 className="font-semibold text-gray-800">当前番茄钟工作事项</h3>
        <span className="ml-auto text-xs text-gray-400">
          {items.filter(i => i.status === 'completed').length}/{items.length} 完成
        </span>
      </div>
      
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4 border border-orange-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          {items.length === 1 
            ? `本番茄钟专注于「${items[0].title}」，达成标准：${items[0].successCriteria.join('；')}`
            : `本番茄钟包含 ${items.length} 个工作事项：${items.map(i => i.title).join(' → ')}。依次完成，循序渐进，确保每个事项达到达标标准。`
          }
        </p>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              item.status === 'completed' 
                ? 'bg-green-50 border-green-200' 
                : item.status === 'partial'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleItem?.(item.id)}
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  item.status === 'completed'
                    ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600'
                    : 'bg-white border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                } ${onToggleItem ? 'cursor-pointer' : 'cursor-default'}`}
                title={item.status === 'completed' ? '点击取消完成' : '点击标记完成'}
              >
                {item.status === 'completed' && (
                  <Check size={14} className="text-white" strokeWidth={3} />
                )}
                {item.status === 'partial' && (
                  <span className="text-xs text-yellow-600 font-bold">~</span>
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">事项 {index + 1}</span>
                  <h4 className={`font-medium ${
                    item.status === 'completed' ? 'text-green-700 line-through' : 'text-gray-800'
                  }`}>
                    {item.title}
                  </h4>
                </div>
                
                {showSuccessCriteria && item.successCriteria.length > 0 && (
                  <div className="mt-3 bg-orange-50/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-orange-500" />
                      <span className="text-xs font-medium text-orange-600">达标标准</span>
                    </div>
                    <ul className="space-y-1">
                      {item.successCriteria.map((criteria, idx) => (
                        <li key={idx} className={`text-sm flex items-start gap-2 ${
                          item.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          <span className="text-orange-400 mt-1">-</span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}