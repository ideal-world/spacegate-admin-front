/** AI Wasm 插件市场目录（展示用；已部署实例会与配置合并） */
export type AiWasmCatalogItem = {
  id: string
  title: string
  description: string
}

export const AI_WASM_CATALOG: AiWasmCatalogItem[] = [
  {
    id: 'ai-gateway-queue',
    title: 'AI 请求队列网关',
    description:
      '把超额 AI 请求按租户 / 模型 / 路径分流到 Redis 多优先级队列，支持入队异步处理（queue）和入队同步等待（wait）两种交付模式，配合回调与重试实现无损交付。',
  },
  {
    id: 'ai-agent',
    title: 'AI 智能体',
    description:
      '通过零代码实现智能体应用的快速构建，支持大模型与外部服务 API 的交互和调用。',
  },
  {
    id: 'ai-cache',
    title: 'AI 缓存',
    description:
      '缓存大语言模型的响应结果，显著降低相似问题的响应时延并节省成本。',
  },
  {
    id: 'ai-data-masking',
    title: 'AI 数据脱敏',
    description: '对请求/响应中的敏感信息进行拦截、替换、还原。',
  },
  {
    id: 'ai-history',
    title: 'AI 历史对话',
    description:
      '自动缓存对应用户的历史对话，在后续对话中自动填充到上下文。',
  },
  {
    id: 'ai-intent',
    title: 'AI 意图识别',
    description:
      '智能判断用户请求与某个领域或 agent 的功能契合度，从而提升不同模型的应用效果和用户体验。',
  },
  {
    id: 'ai-json-format',
    title: 'AI JSON 格式化',
    description:
      'LLM 响应结构化插件，用于根据默认或用户配置的 Json Schema 对 AI 的响应进行结构化，以便后续插件处理。',
  },
  {
    id: 'ai-load-balance',
    title: 'AI 负载均衡',
    description:
      '对 LLM 服务提供热插拔的负载均衡策略；关闭插件后，负载均衡策略会退化为服务本身的负载均衡策略。',
  },
  {
    id: 'ai-prompt',
    title: 'AI 提示词',
    description:
      '在用户输入的提示词前后添加额外的修饰，简化用户与大语言模型的交互。',
  },
  {
    id: 'ai-prompt-template',
    title: 'AI 提示词模板',
    description: '预置提示词模板，快速复用常见对话场景与系统指令。',
  },
  {
    id: 'ai-proxy',
    title: 'AI 代理',
    description: '代理并转发 AI 相关请求，统一鉴权、路由与观测。',
  },
  {
    id: 'ai-quota',
    title: 'AI 配额管理',
    description: '按租户或 API Key 限制调用额度与并发，防止滥用。',
  },
  {
    id: 'ai-rag',
    title: 'AI 检索增强生成',
    description: '结合向量检索与知识库，为 LLM 回答提供可追溯的上下文增强。',
  },
]
