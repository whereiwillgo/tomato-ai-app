import { AIConfig, AIProvider, ChatMessagePayload, GoalDecompositionResult, PhasePlan, PomodoroItemsResult } from '../types';
import { generateAIResponseWithActions as mockGenerateChat, generateResultGoal as mockGenerateResultGoal, generatePlan as mockGeneratePlan, generatePomodoroTasks as mockGeneratePomodoroTasks, generatePomodoroItems as mockGeneratePomodoroItems } from '../utils/aiMock';
import type { AIResponse, ChatContext } from '../utils/aiMock';
import type { Goal, Phase, PomodoroTask, PomodoroItem } from '../types';

const PROVIDER_CONFIGS: Record<AIProvider, { baseUrl: string; defaultModel: string; displayName: string; proxyPath: string }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-v4-flash',
    displayName: 'DeepSeek',
    proxyPath: '/api/ai/deepseek',
  },
  dashscope: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-seed-2-0-lite-260215',
    displayName: '火山引擎',
    proxyPath: '/api/ai/volcengine',
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.7-flash',
    displayName: '智谱AI',
    proxyPath: '/api/ai/zhipu',
  },
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    displayName: '阿里千问',
    proxyPath: '/api/ai/aliyun',
  },
  mock: {
    baseUrl: '',
    defaultModel: 'local-mock',
    displayName: '本地模拟（无需配置）',
    proxyPath: '',
  },
};

const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

function resolveBaseUrl(config: AIConfig): string {
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  if (config.baseUrl) {
    return config.baseUrl;
  }
  if (isDev && providerConfig.proxyPath) {
    return providerConfig.proxyPath;
  }
  return providerConfig.baseUrl;
}

export function getProviderConfig(provider: AIProvider) {
  return PROVIDER_CONFIGS[provider];
}

export function getAvailableModels(provider: AIProvider): { id: string; name: string }[] {
  const models: Record<AIProvider, { id: string; name: string }[]> = {
    deepseek: [
      { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash (推荐)' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro' },
    ],
    dashscope: [
      { id: 'doubao-seed-2-0-lite-260215', name: 'Doubao-Seed-2.0-Lite' },
      { id: 'doubao-seed-2-0-plus-260215', name: 'Doubao-Seed-2.0-Plus' },
      { id: 'doubao-seed-2-0-pro-260215', name: 'Doubao-Seed-2.0-Pro' },
    ],
    zhipu: [
      { id: 'glm-4.7-flash', name: 'GLM-4.7-Flash (免费)' },
      { id: 'glm-5.1', name: 'GLM-5.1' },
      { id: 'glm-5.2', name: 'GLM-5.2 (旗舰)' },
    ],
    aliyun: [
      { id: 'qwen-turbo', name: 'Qwen-Turbo (免费)' },
      { id: 'qwen-plus', name: 'Qwen-Plus' },
      { id: 'qwen2-72b-chat', name: 'Qwen2-72B-Chat' },
    ],
    mock: [
      { id: 'local-mock', name: '本地模拟引擎' },
    ],
  };
  return models[provider] || [];
}

async function callChatAPI(config: AIConfig, messages: ChatMessagePayload[]): Promise<string> {
  if (config.provider === 'mock') {
    throw new Error('Mock provider should use mock functions directly');
  }

  const providerConfig = PROVIDER_CONFIGS[config.provider];
  const baseUrl = resolveBaseUrl(config);
  const model = config.model || providerConfig.defaultModel;

  if (!config.apiKey) {
    throw new Error('API Key 未配置，请在设置中配置');
  }

  const isUsingProxy = baseUrl.startsWith('/api/');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
    throw new Error(`API调用失败: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('API返回格式异常');
  }

  return content;
}

function extractJsonFromText(text: string): any {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
    }
  }
  
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch {
    }
  }
  
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    } catch {
    }
  }

  throw new Error('无法解析AI返回的JSON格式');
}

export async function generateChatResponse(
  config: AIConfig,
  userMessage: string,
  context: ChatContext
): Promise<AIResponse> {
  if (config.provider === 'mock') {
    return mockGenerateChat(userMessage, context);
  }

  const itemsList = context.pomodoroItems.length > 0
    ? context.pomodoroItems.map((i, idx) => `${idx + 1}. [ID:${i.id}] ${i.title} (状态:${i.status})`).join('\n')
    : '（暂无事项）';

  const systemPrompt = `你是一个专业的AI专注助手，帮助用户管理番茄工作法的任务和进度。你的性格温暖、鼓励人心、专业。

当前上下文：
- 当前任务：${context.task?.title || '无'}
- 任务内容：${context.task?.content || '无'}
- 番茄钟事项列表：
${itemsList}
- 已完成番茄数：${context.completedPomodoros}
- 计时器状态：${context.timerStatus}

你需要理解用户消息的意图，并以JSON格式回复。JSON格式如下：
\`\`\`json
{
  "content": "回复给用户的文字内容",
  "actions": []
}
\`\`\`

actions数组中每个元素的格式：
- 添加事项：{"label":"确认添加","type":"primary","action":"add_item","payload":{"title":"事项标题","successCriteria":["标准1","标准2","标准3"]}}
- 删除事项：{"label":"确认删除","type":"danger","action":"remove_item","payload":{"itemId":"事项ID"}}
- 修改事项：{"label":"确认修改","type":"primary","action":"update_item","payload":{"itemId":"事项ID","updates":{"title":"新标题"}}}
- 取消操作：{"label":"取消","type":"secondary","action":"custom","payload":{"type":"cancel"}}

规则：
1. 当用户想添加事项时，从用户消息中提取事项标题，生成达标标准，在actions中返回"确认添加"和"取消"两个按钮
2. 当用户想删除事项时，根据事项标题匹配上方列表中的事项ID，在actions中返回"确认删除"和"取消"两个按钮。如果无法确定删除哪个，在content中列出可选事项让用户选择，actions为空数组
3. 当用户想修改事项时，根据事项标题匹配ID，提取新标题，在actions中返回"确认修改"和"取消"两个按钮。如果无法确定修改哪个或改成什么，在content中追问，actions为空数组
4. 其他情况（进度查询、状态反馈、困难求助等），直接在content中回复，actions为空数组
5. content用简洁温暖的语气，不需要JSON格式的说明文字
6. 必须返回合法JSON`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    try {
      const parsed = extractJsonFromText(content);
      const actions = (parsed.actions || []).map((a: any) => ({
        id: `ai-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: a.label,
        type: a.type,
        action: a.action,
        payload: a.payload,
      }));
      return { content: parsed.content || content, actions };
    } catch {
      return { content };
    }
  } catch (error) {
    console.error('AI API调用失败，使用本地模拟:', error);
    return mockGenerateChat(userMessage, context);
  }
}

export async function decomposeGoal(
  config: AIConfig,
  goalName: string,
  answers: { question: string; answer: string }[]
): Promise<GoalDecompositionResult> {
  if (config.provider === 'mock') {
    const mockResult = mockGenerateResultGoal(goalName, answers.map(a => ({ question: a.question, answer: a.answer })));
    return mockResult;
  }

  const systemPrompt = `你是一个专业的目标规划师。请根据用户的目标和回答，生成具体的结果目标和成功标准。

请以JSON格式返回，格式如下：
\`\`\`json
{
  "resultGoal": "具体的结果目标描述",
  "successCriteria": ["标准1", "标准2", "标准3", "标准4"]
}
\`\`\`

要求：
- resultGoal要具体、可衡量、有时限
- successCriteria要有3-5条，每条都要清晰可验证
- 语言要简洁专业`;

  const userPrompt = `我的目标是：${goalName}

我的回答：
${answers.map((a, i) => `${i + 1}. ${a.question}：${a.answer}`).join('\n')}

请帮我生成结果目标和成功标准。`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return extractJsonFromText(content);
  } catch (error) {
    console.error('AI API调用失败，使用本地模拟:', error);
    return mockGenerateResultGoal(goalName, answers.map(a => ({ question: a.question, answer: a.answer })));
  }
}

export async function generatePhasePlans(
  config: AIConfig,
  goal: Goal,
  dailyHours: number
): Promise<PhasePlan[]> {
  if (config.provider === 'mock') {
    const mockPhases = mockGeneratePlan(goal, dailyHours);
    return mockPhases.map(phase => {
      const phaseTasks = mockGeneratePomodoroTasks(phase, goal.name);
      return {
        name: phase.name,
        durationDays: Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        tasks: phaseTasks.map(t => ({
          title: t.title,
          content: t.content,
          notes: t.notes,
        })),
      };
    });
  }

  const systemPrompt = `你是一个专业的学习规划师。请根据用户的目标和每日可投入时间，生成3个阶段的学习计划。

请以JSON格式返回，格式如下：
\`\`\`json
[
  {
    "name": "入门阶段",
    "durationDays": 10,
    "tasks": [
      {
        "title": "任务标题",
        "content": "任务详细描述",
        "notes": ["注意事项1", "注意事项2", "注意事项3"]
      }
    ]
  }
]
\`\`\`

要求：
- 共3个阶段：入门、进阶、精通
- 每个阶段有3-4个任务
- 每个任务有2-3条注意事项
- 根据总时长合理分配每个阶段的天数
- 任务要循序渐进，符合学习规律
- 语言要简洁专业`;

  const userPrompt = `目标名称：${goal.name}
目标描述：${goal.description}
结果目标：${goal.resultGoal}
成功标准：${goal.successCriteria.join('、')}
每日可投入时间：${dailyHours}小时

请帮我生成3个阶段的学习计划。`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return extractJsonFromText(content);
  } catch (error) {
    console.error('AI API调用失败，使用本地模拟:', error);
    const mockPhases = mockGeneratePlan(goal, dailyHours);
    return mockPhases.map(phase => {
      const phaseTasks = mockGeneratePomodoroTasks(phase, goal.name);
      return {
        name: phase.name,
        durationDays: Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        tasks: phaseTasks.map(t => ({
          title: t.title,
          content: t.content,
          notes: t.notes,
        })),
      };
    });
  }
}

export async function generatePomodoroItemsForTask(
  config: AIConfig,
  task: PomodoroTask,
  completedItemsCount: number
): Promise<PomodoroItemsResult> {
  if (config.provider === 'mock') {
    const items = mockGeneratePomodoroItems(task, completedItemsCount);
    return {
      items: items.map(i => ({
        title: i.title,
        successCriteria: i.successCriteria,
      })),
    };
  }

  const systemPrompt = `你是一个专业的番茄工作法规划师。请为一个任务生成25分钟番茄钟内的工作事项。

请以JSON格式返回，格式如下：
\`\`\`json
{
  "items": [
    {
      "title": "事项标题",
      "successCriteria": ["达标标准1", "达标标准2", "达标标准3"]
    }
  ]
}
\`\`\`

要求：
- 生成3个事项，刚好可以在25分钟内完成
- 每个事项有2-3条清晰可验证的达标标准
- 事项要具体、可执行
- 语言要简洁专业`;

  const userPrompt = `任务标题：${task.title}
任务内容：${task.content}
任务备注：${task.notes.join('、')}
已完成的事项数：${completedItemsCount}

请为这个任务生成番茄钟工作事项。`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return extractJsonFromText(content);
  } catch (error) {
    console.error('AI API调用失败，使用本地模拟:', error);
    const items = mockGeneratePomodoroItems(task, completedItemsCount);
    return {
      items: items.map(i => ({
        title: i.title,
        successCriteria: i.successCriteria,
      })),
    };
  }
}

export async function getInitialAIMessage(
  config: AIConfig,
  context: ChatContext
): Promise<{ content: string }> {
  if (config.provider === 'mock') {
    const { getInitialChatMessage } = await import('../utils/aiMock');
    return { content: getInitialChatMessage(context) };
  }

  const systemPrompt = `你是一个温暖、专业的AI专注助手，帮助用户管理番茄工作法的任务和进度。
用户正在进行番茄钟专注，请给出一个简短、鼓励性的问候，并询问是否需要帮助。
回复要简洁、温暖，不超过3句话。`;

  const userPrompt = `当前任务：${context.task?.title || '无'}
当前是第 ${context.completedPomodoros + 1} 个番茄钟
计时器状态：${context.timerStatus}

请给出初始问候。`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return { content };
  } catch (error) {
    console.error('AI API调用失败，使用本地模拟:', error);
    const { getInitialChatMessage } = await import('../utils/aiMock');
    return { content: getInitialChatMessage(context) };
  }
}

export async function generateNextQuestion(
  config: AIConfig,
  goalName: string,
  answers: { question: string; answer: string }[]
): Promise<{ question: string; isComplete: boolean }> {
  if (config.provider === 'mock') {
    const { getNextQuestion } = await import('../utils/aiMock');
    const next = getNextQuestion(answers);
    return { question: next || '', isComplete: !next };
  }

  const systemPrompt = `你是一个专业的目标规划师。用户有一个目标，你通过提问来澄清目标细节。
每次只问一个最关键的问题，问题要简洁（不超过30字）、自然、对话化，不要分点列举。
如果已经收集到足够信息（一般3-4轮问答后），回复 "DONE" 表示结束。

请直接给出问题内容，不要加任何前缀（如"问题："）。`;

  const conversationLog = answers.length > 0
    ? answers.map((a, i) => `问${i + 1}：${a.question}\n答${i + 1}：${a.answer}`).join('\n\n')
    : '（还没有问答）';

  const userPrompt = `用户的目标：${goalName}

已完成的对话：
${conversationLog}

当前是第 ${answers.length + 1} 轮对话。
${answers.length >= 4 ? '已收集足够信息，请回复 DONE' : '请提出下一个最关键的问题'}`;

  try {
    const content = await callChatAPI(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    
    const trimmed = content.trim();
    if (trimmed === 'DONE' || trimmed.includes('DONE') || answers.length >= 6) {
      return { question: '', isComplete: true };
    }
    
    return { question: trimmed.replace(/^问题[：:]\s*/, ''), isComplete: false };
  } catch (error) {
    console.error('AI 生成问题失败:', error);
    throw error;
  }
}

export async function testConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === 'mock') {
    return { success: true, message: '本地模拟引擎正常工作' };
  }

  try {
    const content = await callChatAPI(config, [
      { role: 'user', content: '请回复"连接成功"三个字。' },
    ]);
    return { success: true, message: `连接成功！AI回复：${content.substring(0, 50)}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '未知错误' };
  }
}
