import { Settings, Sparkles, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onGoToSettings: () => void;
}

export function OnboardingModal({ onClose, onGoToSettings }: OnboardingModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">欢迎使用番茄AI</h2>
          <p className="text-white/80 mt-2">让AI帮你拆解目标，高效达成心愿</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">配置AI模型</h3>
                <p className="text-sm text-gray-500">选择一个AI服务商并配置API Key，享受智能目标拆解</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">创建目标</h3>
                <p className="text-sm text-gray-500">通过AI问答，将模糊目标转化为具体执行计划</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">专注执行</h3>
                <p className="text-sm text-gray-500">按照番茄钟节奏，一步步完成你的目标</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              <Settings className="text-orange-500" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">立即配置API Key</p>
                <p className="text-xs text-gray-500">支持DeepSeek、火山引擎、智谱AI等免费模型</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              稍后配置
            </button>
            <button
              onClick={onGoToSettings}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
            >
              <Settings size={18} />
              去配置
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}