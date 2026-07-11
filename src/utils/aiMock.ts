import { Goal, Phase, PomodoroTask, PomodoroItem, AIAnswer, ChatMessage } from '../types';

const QUESTIONS = [
  '你希望在多长时间内完成这个目标？',
  '你目前的基础水平如何？（零基础/入门/进阶/熟练）',
  '你更喜欢哪种学习方式？（视频课程/书籍阅读/实践练习/在线交互）',
  '你认为完成这个目标的成功标准是什么？',
];

export function getNextQuestion(answers: AIAnswer[]): string | null {
  if (answers.length >= QUESTIONS.length) return null;
  return QUESTIONS[answers.length];
}

export function generateResultGoal(goalName: string, answers: AIAnswer[]): {
  resultGoal: string;
  successCriteria: string[];
} {
  const timeLimit = answers.find(a => a.question.includes('时间'))?.answer || '3个月';
  const level = answers.find(a => a.question.includes('水平'))?.answer || '零基础';
  const learningStyle = answers.find(a => a.question.includes('学习方式'))?.answer || '综合学习';
  const success = answers.find(a => a.question.includes('成功标准'))?.answer || '能够独立完成任务';

  return {
    resultGoal: `在${timeLimit}内，从${level}水平达到${success}，通过${learningStyle}方式学习${goalName}`,
    successCriteria: [
      `${success}`,
      `掌握${goalName}的核心知识和技能`,
      `能够独立应用${goalName}解决实际问题`,
      `在学习过程中保持每周至少3次专注学习`,
    ],
  };
}

export function generatePlan(goal: Goal, dailyHours: number): Phase[] {
  const totalHours = Math.max(dailyHours * 30, 20);
  const phases: Phase[] = [];
  
  const today = new Date();
  const phaseDurations = [0.3, 0.4, 0.3];
  
  let currentDate = new Date(today);
  
  phaseDurations.forEach((ratio, index) => {
    const phaseName = ['入门阶段', '进阶阶段', '精通阶段'][index];
    const hours = Math.round(totalHours * ratio);
    const days = Math.ceil(hours / dailyHours);
    
    const startDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    const endDate = new Date(currentDate);
    
    phases.push({
      id: `phase-${index + 1}-${goal.id}`,
      goalId: goal.id,
      name: phaseName,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      progress: 0,
      tasks: [],
    });
  });
  
  return phases;
}

export function generatePomodoroTasks(phase: Phase, goalName: string): PomodoroTask[] {
  const taskTemplates: Record<string, { title: string; content: string; notes: string[] }[]> = {
    '入门阶段': [
      {
        title: '了解基础概念',
        content: `学习${goalName}的基本概念和术语，建立整体认知框架`,
        notes: ['建议使用思维导图梳理知识点', '重点理解核心概念', '记录疑问点'],
      },
      {
        title: '环境搭建',
        content: `搭建${goalName}学习所需的开发环境或工具`,
        notes: ['参考官方文档', '确保环境配置正确', '测试基本功能'],
      },
      {
        title: '基础练习',
        content: `完成${goalName}的入门练习，熟悉基本操作`,
        notes: ['从简单示例开始', '注重练习质量', '及时复习巩固'],
      },
      {
        title: '知识点总结',
        content: `总结入门阶段所学知识点，形成笔记`,
        notes: ['使用自己的语言描述', '结合实际例子', '制作复习卡片'],
      },
    ],
    '进阶阶段': [
      {
        title: '深入核心知识',
        content: `深入学习${goalName}的核心原理和高级特性`,
        notes: ['阅读深度文章', '分析源码', '尝试举一反三'],
      },
      {
        title: '项目实践',
        content: `完成一个中等难度的${goalName}项目`,
        notes: ['规划项目结构', '分阶段实现', '注重代码质量'],
      },
      {
        title: '问题解决',
        content: `解决${goalName}学习中遇到的常见问题和难点`,
        notes: ['记录问题和解决方案', '寻求社区帮助', '总结经验'],
      },
      {
        title: '性能优化',
        content: `学习${goalName}的性能优化技巧`,
        notes: ['分析性能瓶颈', '应用优化策略', '验证优化效果'],
      },
    ],
    '精通阶段': [
      {
        title: '综合项目',
        content: `完成一个综合性的${goalName}项目，展示完整能力`,
        notes: ['规划完整项目', '实现核心功能', '优化用户体验'],
      },
      {
        title: '知识分享',
        content: `将${goalName}知识分享给他人，通过教中学`,
        notes: ['写技术博客', '制作教程', '参与社区讨论'],
      },
      {
        title: '持续学习',
        content: `关注${goalName}最新动态，保持学习状态`,
        notes: ['订阅技术资讯', '学习新技术', '保持好奇心'],
      },
      {
        title: '成果验收',
        content: `回顾整个学习过程，验收学习成果`,
        notes: ['评估目标达成度', '总结经验教训', '规划下一步'],
      },
    ],
  };

  const templates = taskTemplates[phase.name] || taskTemplates['入门阶段'];
  
  return templates.map((template, index) => ({
    id: `task-${index + 1}-${phase.id}`,
    goalId: phase.goalId,
    phaseId: phase.id,
    title: template.title,
    content: template.content,
    notes: template.notes,
    duration: 25,
    status: 'pending',
  }));
}

export function generatePomodoroItems(task: PomodoroTask, completedItemsCount: number = 0): PomodoroItem[] {
  const itemTemplates: Record<string, { title: string; successCriteria: string[] }[]> = {
    '了解基础概念': [
      {
        title: '阅读基础概念介绍',
        successCriteria: ['阅读至少3篇相关文章', '理解核心术语定义', '能够用自己的语言解释'],
      },
      {
        title: '整理知识框架',
        successCriteria: ['列出主要知识点', '建立概念间的关联', '制作思维导图草稿'],
      },
      {
        title: '记录疑问点',
        successCriteria: ['记录至少2个不理解的问题', '标注需要深入学习的部分'],
      },
    ],
    '环境搭建': [
      {
        title: '查阅官方文档',
        successCriteria: ['找到环境安装指南', '理解安装步骤', '记录关键配置'],
      },
      {
        title: '安装必要软件',
        successCriteria: ['完成主程序安装', '配置环境变量', '验证安装成功'],
      },
      {
        title: '测试基本功能',
        successCriteria: ['运行Hello World示例', '确保基础命令可用', '记录测试结果'],
      },
    ],
    '基础练习': [
      {
        title: '完成简单示例',
        successCriteria: ['完成至少2个基础练习', '代码能够正常运行', '理解每一行代码'],
      },
      {
        title: '练习核心操作',
        successCriteria: ['掌握最常用的API', '能够独立完成基本操作', '速度有明显提升'],
      },
      {
        title: '巩固练习成果',
        successCriteria: ['复习当天所学内容', '总结练习中的问题', '准备明天的学习计划'],
      },
    ],
    '知识点总结': [
      {
        title: '整理学习笔记',
        successCriteria: ['记录当天所学知识点', '使用结构化格式', '包含示例和注释'],
      },
      {
        title: '制作复习卡片',
        successCriteria: ['制作至少5张卡片', '包含问题和答案', '便于日后复习'],
      },
      {
        title: '自我测试',
        successCriteria: ['完成10道自测题', '正确率达到80%以上', '标记薄弱环节'],
      },
    ],
    '深入核心知识': [
      {
        title: '阅读深度文章',
        successCriteria: ['阅读至少2篇深度文章', '理解核心原理', '记录关键要点'],
      },
      {
        title: '分析源码或案例',
        successCriteria: ['找到核心代码', '理解实现思路', '能够解释关键逻辑'],
      },
      {
        title: '尝试举一反三',
        successCriteria: ['尝试修改或扩展示例', '应用到不同场景', '记录学习心得'],
      },
    ],
    '项目实践': [
      {
        title: '规划项目结构',
        successCriteria: ['设计项目架构', '列出功能模块', '制定开发计划'],
      },
      {
        title: '实现核心功能',
        successCriteria: ['完成主要功能开发', '代码能够正常运行', '通过基础测试'],
      },
      {
        title: '优化代码质量',
        successCriteria: ['代码格式规范', '添加必要注释', '优化性能瓶颈'],
      },
    ],
    '问题解决': [
      {
        title: '整理问题清单',
        successCriteria: ['列出当前遇到的问题', '分类优先级', '制定解决计划'],
      },
      {
        title: '寻求解决方案',
        successCriteria: ['查阅文档或资料', '搜索类似问题', '尝试不同的解决方法'],
      },
      {
        title: '记录解决方案',
        successCriteria: ['记录最终解决方案', '总结问题原因', '分享给他人'],
      },
    ],
    '性能优化': [
      {
        title: '分析性能瓶颈',
        successCriteria: ['定位性能问题', '使用性能分析工具', '量化性能指标'],
      },
      {
        title: '应用优化策略',
        successCriteria: ['实施至少2种优化方案', '理解优化原理', '记录优化过程'],
      },
      {
        title: '验证优化效果',
        successCriteria: ['对比优化前后数据', '达到预期优化目标', '总结优化经验'],
      },
    ],
    '综合项目': [
      {
        title: '规划完整项目',
        successCriteria: ['明确项目目标', '设计完整架构', '制定详细计划'],
      },
      {
        title: '实现核心功能',
        successCriteria: ['完成主要功能', '确保稳定性', '通过全面测试'],
      },
      {
        title: '优化用户体验',
        successCriteria: ['改进界面设计', '优化交互流程', '收集反馈意见'],
      },
    ],
    '知识分享': [
      {
        title: '撰写技术文章',
        successCriteria: ['完成文章大纲', '撰写完整内容', '发布到平台'],
      },
      {
        title: '制作教程或演示',
        successCriteria: ['录制视频教程', '制作演示文稿', '准备讲解材料'],
      },
      {
        title: '参与社区讨论',
        successCriteria: ['回答至少5个问题', '分享学习心得', '帮助他人解决问题'],
      },
    ],
    '持续学习': [
      {
        title: '关注技术动态',
        successCriteria: ['订阅至少3个资讯源', '每周阅读最新文章', '记录重要更新'],
      },
      {
        title: '学习新技术',
        successCriteria: ['掌握至少1项新技术', '完成相关练习', '应用到实际项目'],
      },
      {
        title: '保持学习状态',
        successCriteria: ['每天至少学习30分钟', '定期复习旧知识', '保持好奇心'],
      },
    ],
    '成果验收': [
      {
        title: '评估目标达成度',
        successCriteria: ['对照初始目标', '评估完成情况', '计算达成率'],
      },
      {
        title: '总结经验教训',
        successCriteria: ['列出成功经验', '总结失败教训', '提出改进建议'],
      },
      {
        title: '规划下一步',
        successCriteria: ['设定新的目标', '制定学习计划', '准备开始新征程'],
      },
    ],
  };

  const templates = itemTemplates[task.title] || [
    {
      title: '专注学习',
      successCriteria: ['保持专注25分钟', '完成当前任务的核心部分', '记录学习成果'],
    },
  ];

  return templates.map((template, index) => ({
    id: `item-${completedItemsCount + index + 1}-${task.id}`,
    taskId: task.id,
    order: completedItemsCount + index + 1,
    title: template.title,
    successCriteria: template.successCriteria,
    status: 'pending',
  }));
}

export interface ChatContext {
  task: PomodoroTask | null;
  goal: Goal | null;
  pomodoroItems: PomodoroItem[];
  completedPomodoros: number;
  timerStatus: string;
}

export function generateAIResponse(userMessage: string, context: ChatContext): string {
  const msg = userMessage.toLowerCase();
  const { task, goal, pomodoroItems, completedPomodoros, timerStatus } = context;

  // 状态汇报类
  if (msg.includes('完成了') || msg.includes('做完了') || msg.includes('搞定了')) {
    const completedItems = pomodoroItems.filter(i => i.status === 'completed');
    const pendingItems = pomodoroItems.filter(i => i.status === 'pending');
    return `收到！你已经完成了 ${completedItems.length}/${pomodoroItems.length} 个事项${
      pendingItems.length > 0 ? `，还剩 ${pendingItems.length} 个待完成：${pendingItems.map(i => i.title).join('、')}` : '，全部完成了！'
    }。${pendingItems.length > 0 ? '建议继续专注完成剩余事项，保持节奏！' : '可以适当休息，准备下一个番茄钟了。'}`;
  }

  // 进度反馈类
  if (msg.includes('进度') || msg.includes('怎么样了') || msg.includes('进展')) {
    const completed = pomodoroItems.filter(i => i.status === 'completed').length;
    const total = pomodoroItems.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return `当前番茄钟进度：${rate}%（${completed}/${total}）。\n已完成 ${completedPomodoros} 个番茄钟。\n${
      task ? `正在执行任务：${task.title}` : ''
    }\n${rate >= 75 ? '快完成了，再加把劲！' : rate >= 50 ? '进度过半，继续保持！' : '刚开始，专注当下！'}`;
  }

  // 困难/卡住类
  if (msg.includes('卡住') || msg.includes('太难') || msg.includes('不会') || msg.includes('不懂') || msg.includes('困难')) {
    return `遇到困难很正常！建议你：\n1. 先把遇到的问题具体写下来\n2. 尝试拆解问题，找出卡住的关键点\n3. 搜索相关资料或寻求社区帮助\n4. 如果实在无法解决，可以先跳过，标记为"部分完成"\n\n记住，番茄钟的精神是专注当下，而不是一定要解决所有问题。先记录下来，后续再深入。`;
  }

  // 任务调整建议类
  if (msg.includes('调整') || msg.includes('修改') || msg.includes('换') || msg.includes('跳过')) {
    return `好的，关于任务调整：\n${
      task ? `- 当前任务：${task.title}\n- 任务内容：${task.content}\n` : ''
    }你可以选择：\n1. **跳过当前任务** — 如果觉得现在不适合做，可以点击"跳过"按钮\n2. **调整事项** — 在番茄钟结束后标记完成度，系统会记录实际情况\n3. **反馈给我** — 告诉我你想怎么调整，我会帮你记录\n\n你的反馈会帮助我更好地规划后续任务。`;
  }

  // 状态/感受类
  if (msg.includes('累') || msg.includes('疲惫') || msg.includes('困') || msg.includes('分心') || msg.includes('注意力')) {
    return `感受到了你的状态。${timerStatus === 'running' ? '当前正在专注中，' : ''}建议：\n1. 深呼吸3次，放松肩膀\n2. 如果真的很累，可以暂停番茄钟，休息5分钟\n3. 喝点水，活动一下身体\n4. 回来后重新聚焦当前事项\n\n专注力是有限的资源，休息也是高效的一部分。`;
  }

  // 休息相关
  if (msg.includes('休息') || msg.includes('放松') || msg.includes('暂停')) {
    return `休息很重要！番茄工作法的核心就是劳逸结合。\n${
      completedPomodoros > 0 && completedPomodoros % 4 === 0 ? '你已完成4个番茄钟，建议进行15-30分钟的长休息。' : '建议进行5分钟的短休息。'
    }\n休息时可以：\n- 站起来走动\n- 看看远处放松眼睛\n- 喝水补充水分\n- 不要看手机或处理其他工作`;
  }

  // 目标相关
  if (msg.includes('目标') || msg.includes('为什么') || msg.includes('意义')) {
    return goal ? `你的目标是：${goal.name}\n\n结果目标：${goal.resultGoal}\n\n成功标准：\n${goal.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n每个番茄钟都是通向目标的一小步。专注当下，就是在靠近你的梦想！` : '请先设置一个目标，我会帮你规划路径。';
  }

  // 建议/帮助类
  if (msg.includes('建议') || msg.includes('帮助') || msg.includes('怎么办') || msg.includes('怎么做')) {
    const pendingItems = pomodoroItems.filter(i => i.status === 'pending');
    return `基于你当前的情况，我的建议：\n${
      pendingItems.length > 0
        ? `1. 聚焦下一个事项：${pendingItems[0]?.title}\n2. 达标标准：${pendingItems[0]?.successCriteria.join('；')}\n3. 一次只做一件事，避免多任务切换\n4. 完成后及时在番茄钟结束时打标`
        : '1. 当前没有待办事项，可以开始新的番茄钟\n2. 系统会自动生成下一组工作事项\n3. 保持节奏，持续前进'
    }`;
  }

  // 打招呼
  if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello') || msg.includes('在吗')) {
    return `你好！我是你的AI专注助手 🤖\n\n${
      task ? `当前任务：${task.title}\n` : ''
    }你可以告诉我：\n- 当前进度或完成情况\n- 遇到的困难或问题\n- 想要调整任务\n- 你的状态感受\n\n我会根据你的情况给出建议！`;
  }

  // 默认回复
  return `我理解你说的是："${userMessage}"\n\n${
    task ? `当前任务：${task.title}\n当前事项：${pomodoroItems.filter(i => i.status === 'pending').map(i => i.title).join('、') || '全部完成'}\n\n` : ''
  }你可以告诉我：\n- 完成情况（如"完成了XX"）\n- 遇到困难（如"卡住了"）\n- 需要调整（如"想跳过这个"）\n- 当前状态（如"有点累"）\n- 查看进度（如"进度怎么样"）`;
}

export interface AIResponse {
  content: string;
  actions?: {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    action: 'add_item' | 'remove_item' | 'update_item' | 'complete_task' | 'skip_task' | 'reset_timer' | 'custom';
    payload?: any;
  }[];
}

export function generateAIResponseWithActions(userMessage: string, context: ChatContext): AIResponse {
  const msg = userMessage.toLowerCase();
  const { task, goal, pomodoroItems, completedPomodoros, timerStatus } = context;

  // 添加事项类
  if (msg.includes('加一个') || msg.includes('增加') || msg.includes('添加') || msg.includes('新增') || msg.includes('再加') || msg.includes('多一个') || msg.includes('加个') || msg.includes('加个事项')) {
    const patterns = [
      /(?:加一个|增加|添加|新增|再加|多一个|加个)(?:一个)?(?:事项)?[「""''"]?(.+?)[「""''"]?(?:的事项)?(?:事项)?$/,
      /(.+?)(?:的事项)?(?:事项)?(?:加一个|增加|添加|新增|再加|多一个|加个)$/,
    ];
    
    let itemTitle = '';
    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        itemTitle = match[1].trim();
        if (itemTitle && itemTitle !== '事项' && itemTitle !== '的事项' && itemTitle !== '一个事项') {
          break;
        }
        itemTitle = '';
      }
    }
    
    if (!itemTitle || msg.includes('想加') || msg.includes('要加')) {
      return {
        content: '好的！请告诉我你想添加什么事项？\n\n比如：\n• "加一个整理笔记"\n• "添加复习英语单词"\n• "再加一个写周报"',
      };
    }
    
    const newItem = {
      title: itemTitle,
      successCriteria: ['完成该事项的核心内容', '记录完成情况和成果', '确保质量达到预期'],
    };
    
    return {
      content: `我来帮你添加一个新事项：\n\n📌 **${itemTitle}**\n\n达标标准：\n1. 完成该事项的核心内容\n2. 记录完成情况和成果\n3. 确保质量达到预期\n\n确认添加到当前番茄钟吗？`,
      actions: [
        {
          id: `confirm-add-${Date.now()}`,
          label: '确认添加',
          type: 'primary',
          action: 'add_item',
          payload: newItem,
        },
        {
          id: `cancel-add-${Date.now()}`,
          label: '取消',
          type: 'secondary',
          action: 'custom',
          payload: { type: 'cancel' },
        },
      ],
    };
  }

  // 删除事项类
  if (msg.includes('删除') || msg.includes('移除') || msg.includes('去掉') || msg.includes('删掉') || msg.includes('不要')) {
    const allItems = [...pomodoroItems];
    
    if (allItems.length === 0) {
      return {
        content: '当前没有可删除的事项。',
      };
    }
    
    const patterns = [
      /(?:删除|移除|去掉|删掉|不要)(?:事项)?[「""''"]?(.+?)[「""''"]?$/,
      /(.+?)(?:的事项)?(?:事项)?(?:删除|移除|去掉|删掉|不要)$/,
    ];
    
    let itemTitle = '';
    let matchedItem: typeof allItems[0] | null = null;
    
    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        itemTitle = match[1].trim();
        if (itemTitle && itemTitle !== '事项') {
          matchedItem = allItems.find(i => i.title.includes(itemTitle) || itemTitle.includes(i.title));
          break;
        }
        itemTitle = '';
      }
    }
    
    if (matchedItem) {
      return {
        content: `确认删除事项「${matchedItem.title}」吗？`,
        actions: [
          {
            id: `confirm-remove-${Date.now()}`,
            label: '确认删除',
            type: 'danger',
            action: 'remove_item',
            payload: { itemId: matchedItem.id },
          },
          {
            id: `cancel-remove-${Date.now()}`,
            label: '取消',
            type: 'secondary',
            action: 'custom',
            payload: { type: 'cancel' },
          },
        ],
      };
    } else if (allItems.length === 1) {
      return {
        content: `确认删除事项「${allItems[0].title}」吗？`,
        actions: [
          {
            id: `confirm-remove-${Date.now()}`,
            label: '确认删除',
            type: 'danger',
            action: 'remove_item',
            payload: { itemId: allItems[0].id },
          },
          {
            id: `cancel-remove-${Date.now()}`,
            label: '取消',
            type: 'secondary',
            action: 'custom',
            payload: { type: 'cancel' },
          },
        ],
      };
    } else {
      return {
        content: `当前有 ${allItems.length} 个事项，请问你想删除哪一个？\n\n${allItems.map((item, i) => `${i + 1}. ${item.title}`).join('\n')}\n\n可以说："删除整理笔记"`,
      };
    }
  }

  // 修改事项类
  if (msg.includes('修改') || msg.includes('改成') || msg.includes('变更') || msg.includes('调整')) {
    const allItems = [...pomodoroItems];
    
    if (allItems.length === 0) {
      return {
        content: '当前没有可修改的事项。',
      };
    }
    
    const patterns = [
      /(?:修改|改成|变更|调整)(?:事项)?[「""''"]?(.+?)[「""''"]?(?:(?:为|成|改为))[「""''"]?(.+?)[「""''"]?$/,
      /(.+?)(?:的事项)?(?:修改|改成|变更|调整)(?:为|成|改为)(.+?)$/,
    ];
    
    let originalTitle = '';
    let newTitle = '';
    let matchedItem: typeof allItems[0] | null = null;
    
    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match && match[1] && match[2]) {
        originalTitle = match[1].trim();
        newTitle = match[2].trim();
        if (originalTitle && originalTitle !== '事项') {
          matchedItem = allItems.find(i => i.title.includes(originalTitle) || originalTitle.includes(i.title));
          break;
        }
        originalTitle = '';
        newTitle = '';
      }
    }
    
    if (matchedItem && newTitle) {
      return {
        content: `确认将「${matchedItem.title}」修改为「${newTitle}」吗？`,
        actions: [
          {
            id: `confirm-update-${Date.now()}`,
            label: '确认修改',
            type: 'primary',
            action: 'update_item',
            payload: { itemId: matchedItem.id, updates: { title: newTitle } },
          },
          {
            id: `cancel-update-${Date.now()}`,
            label: '取消',
            type: 'secondary',
            action: 'custom',
            payload: { type: 'cancel' },
          },
        ],
      };
    } else if (allItems.length === 1) {
      return {
        content: `当前只有一个事项：${allItems[0].title}\n\n请告诉我想改成什么？\n\n比如："改成整理学习笔记"`,
      };
    } else {
      return {
        content: `当前有 ${allItems.length} 个事项，请问你想修改哪一个？\n\n${allItems.map((item, i) => `${i + 1}. ${item.title}`).join('\n')}\n\n可以说："修改整理笔记为复习英语"`,
      };
    }
  }

  // 状态汇报类
  if (msg.includes('完成了') || msg.includes('做完了') || msg.includes('搞定了')) {
    const completedItems = pomodoroItems.filter(i => i.status === 'completed');
    const pendingItems = pomodoroItems.filter(i => i.status === 'pending');
    return {
      content: `收到！你已经完成了 ${completedItems.length}/${pomodoroItems.length} 个事项${
        pendingItems.length > 0 ? `，还剩 ${pendingItems.length} 个待完成：${pendingItems.map(i => i.title).join('、')}` : '，全部完成了！'
      }。${pendingItems.length > 0 ? '建议继续专注完成剩余事项，保持节奏！' : '可以适当休息，准备下一个番茄钟了。'}`,
    };
  }

  // 进度反馈类
  if (msg.includes('进度') || msg.includes('怎么样了') || msg.includes('进展')) {
    const completed = pomodoroItems.filter(i => i.status === 'completed').length;
    const total = pomodoroItems.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      content: `当前番茄钟进度：${rate}%（${completed}/${total}）。\n已完成 ${completedPomodoros} 个番茄钟。\n${
        task ? `正在执行任务：${task.title}` : ''
      }\n${rate >= 75 ? '快完成了，再加把劲！' : rate >= 50 ? '进度过半，继续保持！' : '刚开始，专注当下！'}`,
    };
  }

  // 困难/卡住类
  if (msg.includes('卡住') || msg.includes('太难') || msg.includes('不会') || msg.includes('不懂') || msg.includes('困难')) {
    return {
      content: `遇到困难很正常！建议你：\n1. 先把遇到的问题具体写下来\n2. 尝试拆解问题，找出卡住的关键点\n3. 搜索相关资料或寻求社区帮助\n4. 如果实在无法解决，可以先跳过，标记为"部分完成"\n\n记住，番茄钟的精神是专注当下，而不是一定要解决所有问题。先记录下来，后续再深入。`,
    };
  }

  // 任务调整建议类
  if (msg.includes('调整') || msg.includes('修改') || msg.includes('换') || msg.includes('跳过')) {
    return {
      content: `好的，关于任务调整：\n${
        task ? `- 当前任务：${task.title}\n- 任务内容：${task.content}\n` : ''
      }你可以选择：\n1. **跳过当前任务** — 如果觉得现在不适合做，可以点击"跳过"按钮\n2. **调整事项** — 在番茄钟结束后标记完成度，系统会记录实际情况\n3. **添加新事项** — 告诉我"加一个XXX的事项"\n4. **反馈给我** — 告诉我你想怎么调整，我会帮你记录\n\n你的反馈会帮助我更好地规划后续任务。`,
    };
  }

  // 状态/感受类
  if (msg.includes('累') || msg.includes('疲惫') || msg.includes('困') || msg.includes('分心') || msg.includes('注意力')) {
    return {
      content: `感受到了你的状态。${timerStatus === 'running' ? '当前正在专注中，' : ''}建议：\n1. 深呼吸3次，放松肩膀\n2. 如果真的很累，可以暂停番茄钟，休息5分钟\n3. 喝点水，活动一下身体\n4. 回来后重新聚焦当前事项\n\n专注力是有限的资源，休息也是高效的一部分。`,
    };
  }

  // 休息相关
  if (msg.includes('休息') || msg.includes('放松') || msg.includes('暂停')) {
    return {
      content: `休息很重要！番茄工作法的核心就是劳逸结合。\n${
        completedPomodoros > 0 && completedPomodoros % 4 === 0 ? '你已完成4个番茄钟，建议进行15-30分钟的长休息。' : '建议进行5分钟的短休息。'
      }\n休息时可以：\n- 站起来走动\n- 看看远处放松眼睛\n- 喝水补充水分\n- 不要看手机或处理其他工作`,
    };
  }

  // 目标相关
  if (msg.includes('目标') || msg.includes('为什么') || msg.includes('意义')) {
    return {
      content: goal ? `你的目标是：${goal.name}\n\n结果目标：${goal.resultGoal}\n\n成功标准：\n${goal.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n每个番茄钟都是通向目标的一小步。专注当下，就是在靠近你的梦想！` : '请先设置一个目标，我会帮你规划路径。',
    };
  }

  // 建议/帮助类
  if (msg.includes('建议') || msg.includes('帮助') || msg.includes('怎么办') || msg.includes('怎么做')) {
    const pendingItems = pomodoroItems.filter(i => i.status === 'pending');
    return {
      content: `基于你当前的情况，我的建议：\n${
        pendingItems.length > 0
          ? `1. 聚焦下一个事项：${pendingItems[0]?.title}\n2. 达标标准：${pendingItems[0]?.successCriteria.join('；')}\n3. 一次只做一件事，避免多任务切换\n4. 完成后及时在番茄钟结束时打标`
          : '1. 当前没有待办事项，可以开始新的番茄钟\n2. 系统会自动生成下一组工作事项\n3. 保持节奏，持续前进'
      }`,
    };
  }

  // 打招呼
  if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello') || msg.includes('在吗')) {
    return {
      content: `你好！我是你的AI专注助手 🤖\n\n${
        task ? `当前任务：${task.title}\n` : ''
      }你可以告诉我：\n- 当前进度或完成情况\n- 遇到的困难或问题\n- 想要调整任务（如"加一个XXX事项"）\n- 你的状态感受\n\n我会根据你的情况给出建议！`,
    };
  }

  // 默认回复
  return {
    content: `我理解你说的是："${userMessage}"\n\n${
      task ? `当前任务：${task.title}\n当前事项：${pomodoroItems.filter(i => i.status === 'pending').map(i => i.title).join('、') || '全部完成'}\n\n` : ''
    }你可以告诉我：\n• 完成情况（如"完成了XX"）\n• 遇到困难（如"卡住了"）\n• 添加事项（如"加一个整理笔记"）\n• 需要调整（如"想跳过这个"）\n• 当前状态（如"有点累"）\n• 查看进度（如"进度怎么样"）`,
  };
}

export function getInitialChatMessage(context: ChatContext): string {
  const { task, pomodoroItems } = context;
  if (!task) {
    return '你好！我是你的AI专注助手 🤖\n\n请先选择一个任务，我会帮你规划番茄钟内的工作事项。\n\n你可以随时向我反馈：\n• 完成情况\n• 遇到的困难\n• 想要添加/调整事项\n• 当前状态感受';
  }
  const pendingItems = pomodoroItems.filter(i => i.status === 'pending');
  return `你好！当前任务：${task.title}\n\n本番茄钟事项：\n${pomodoroItems.map((item, i) => `${i + 1}. ${item.title}`).join('\n')}\n\n${
    pendingItems.length > 0 ? `建议从「${pendingItems[0].title}」开始，保持专注！` : '所有事项已完成，可以开始新的番茄钟。'
  }\n\n💡 小贴士：说"加一个XXX"可以快速添加新事项`;
}
