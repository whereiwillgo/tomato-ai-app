import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Plus, Check, Trash2, SkipForward, RotateCcw } from 'lucide-react';
import { ChatMessage, ChatAction } from '../../types';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onAction?: (action: ChatAction) => void;
  isLoading?: boolean;
  modelName?: string;
}

const QUICK_ACTIONS = [
  { label: '查看进度', text: '进度怎么样了' },
  { label: '添加事项', text: '我想加一个事项' },
  { label: '遇到困难', text: '卡住了，太难了' },
  { label: '有点累', text: '有点累了' },
];

const ACTION_ICONS: Record<string, any> = {
  add_item: Plus,
  remove_item: Trash2,
  complete_task: Check,
  skip_task: SkipForward,
  reset_timer: RotateCcw,
  custom: Sparkles,
};

export function AIChatPanel({ isOpen, onClose, messages, onSend, onAction, isLoading = false, modelName = 'AI' }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (text?: string) => {
    const message = (text || input).trim();
    if (!message || isLoading) return;
    onSend(message);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 聊天面板 */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* 头部 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <Bot className="text-white" size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              AI 专注助手
              <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                <Sparkles size={10} />
                {modelName}
              </span>
            </h3>
            <p className="text-xs text-gray-500">随时反馈状态，获取建议</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <X className="text-gray-500" size={20} />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50">
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <div
                key={message.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {isUser ? (
                    <span className="text-xs font-bold">我</span>
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-left ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  {message.actions && message.actions.length > 0 && !isUser && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.actions.map((action) => {
                        const ActionIcon = ACTION_ICONS[action.action] || Sparkles;
                        const buttonStyles = {
                          primary: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-md',
                          secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                          danger: 'bg-red-100 text-red-600 hover:bg-red-200',
                        };
                        return (
                          <button
                            key={action.id}
                            onClick={() => onAction?.(action)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${buttonStyles[action.type]}`}
                          >
                            <ActionIcon size={14} />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI 正在输入 */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-400">AI 正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快捷操作 */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-400 mb-2">快捷操作：</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.text)}
                className="px-3 py-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors border border-orange-200"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的状态、问题或想法..."
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 resize-none text-sm"
              style={{ maxHeight: '100px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
