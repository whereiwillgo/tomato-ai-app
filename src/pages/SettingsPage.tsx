import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ArrowLeft, Settings, Key, Cpu, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { AIProvider } from '../types';
import { getProviderConfig, getAvailableModels, testConnection } from '../services/aiService';

const PROVIDERS: { id: AIProvider; name: string; description: string; free: boolean }[] = [
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek 官方 API', free: false },
  { id: 'dashscope', name: '火山引擎', description: '字节火山方舟大模型平台', free: true },
  { id: 'zhipu', name: '智谱 AI', description: '智谱 GLM 系列模型', free: true },
  { id: 'aliyun', name: '阿里千问', description: '阿里云通义千问系列模型', free: true },
  { id: 'mock', name: '本地模拟', description: '无需配置，本地运行', free: false },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { aiConfig, updateAIConfig, setAIProvider } = useAppStore();
  
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(aiConfig.provider);
  const [apiKey, setApiKey] = useState(aiConfig.apiKey);
  const [selectedModel, setSelectedModel] = useState(aiConfig.model);
  const [customBaseUrl, setCustomBaseUrl] = useState(aiConfig.baseUrl || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    
    const providerConfig = aiConfig.providerConfigs?.[provider];
    if (providerConfig) {
      setApiKey(providerConfig.apiKey);
      setSelectedModel(providerConfig.model);
      setCustomBaseUrl(providerConfig.baseUrl || '');
    } else {
      const models = getAvailableModels(provider);
      setApiKey('');
      setSelectedModel(models.length > 0 ? models[0].id : '');
      setCustomBaseUrl('');
    }
    setTestResult(null);
  };

  const handleSave = () => {
    updateAIConfig({
      provider: selectedProvider,
      apiKey: apiKey,
      model: selectedModel,
      baseUrl: customBaseUrl || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    const config = {
      provider: selectedProvider,
      apiKey: apiKey,
      model: selectedModel,
      baseUrl: customBaseUrl || undefined,
    };
    
    const result = await testConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  const providerConfig = getProviderConfig(selectedProvider);
  const availableModels = getAvailableModels(selectedProvider);
  const needsApiKey = selectedProvider !== 'mock';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Settings className="text-orange-500" size={20} />
              <h1 className="text-xl font-bold text-gray-800">设置</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Cpu className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">AI 模型配置</h2>
              <p className="text-sm text-gray-500">选择 AI 服务提供商和模型</p>
            </div>
          </div>

          {/* 当前生效配置显示 */}
          {aiConfig.apiKey && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">✓ 当前已保存配置</p>
              <p className="text-xs text-blue-700">
                提供商：<span className="font-semibold">{getProviderConfig(aiConfig.provider).displayName}</span> ｜ 
                模型：<span className="font-semibold">{aiConfig.model}</span> ｜ 
                Key：<span className="font-mono">{aiConfig.apiKey.substring(0, 4)}...{aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择提供商
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedProvider === provider.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">{provider.name}</span>
                      {provider.free && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          有免费额度
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {needsApiKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`请输入 ${providerConfig.displayName} 的 API Key`}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  API Key 仅保存在本地浏览器中，不会上传到任何服务器
                </p>
              </div>
            )}

            {availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择模型
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 bg-white"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsApiKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义 API 地址（可选）
                </label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder={`默认: ${providerConfig.baseUrl}`}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 text-sm"
                />
              </div>
            )}

            {testResult && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <p className={`font-medium text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.success ? '连接成功' : '连接失败'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="flex-1">
                <Key size={18} className="mr-2" />
                保存配置
              </Button>
              {needsApiKey && (
                <Button 
                  variant="outline" 
                  onClick={handleTest}
                  disabled={testing || !apiKey}
                >
                  {testing ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle size={18} className="mr-2" />
                  )}
                  {testing ? '测试中...' : '测试连接'}
                </Button>
              )}
            </div>

            {saved && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>配置已保存</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">获取 API Key</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-medium text-blue-700 mb-2">🆓 推荐免费方案</p>
              <p className="text-blue-600">
                火山引擎 Doubao-Seed-2.0-Lite 模型每日提供免费额度（约 200 万 Tokens），适合日常使用。
              </p>
              <p className="text-blue-600 mt-1">
                <strong>使用步骤：</strong>
                <br />1. 访问 <a href="https://console.volcengine.com/ark/" target="_blank" rel="noopener noreferrer" className="underline">console.volcengine.com/ark</a> 注册
                <br />2. 在「在线推理」页面创建推理接入点（Endpoint），选择免费模型
                <br />3. 复制接入点 ID（格式: ep-xxxxxx）填入模型选择框
                <br />4. 复制 API Key 填入设置页面
              </p>
            </div>
            <div className="space-y-2">
              <p>• <strong>DeepSeek:</strong> <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">platform.deepseek.com</a></p>
              <p>• <strong>火山引擎:</strong> <a href="https://console.volcengine.com/ark/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">console.volcengine.com/ark</a></p>
              <p>• <strong>智谱 AI:</strong> <a href="https://open.bigmodel.cn/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">open.bigmodel.cn</a></p>
              <p>• <strong>阿里千问:</strong> <a href="https://dashscope.aliyuncs.com/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">dashscope.aliyuncs.com</a></p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
