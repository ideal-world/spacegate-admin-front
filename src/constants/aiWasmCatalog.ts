/** AI Wasm 插件目录（仅保留已实现的 ai-gateway-queue） */
export type AiWasmCatalogItem = {
  id: string
  title: string
  description: string
}

export const AI_WASM_CATALOG: AiWasmCatalogItem[] = [
  {
    id: 'ai-gateway-queue',
    title: 'AI 网关排队限流',
    description:
      '入口处对 AI 请求做租户级令牌桶限流，超额时按 abandon / queue / wait 策略分流；支持 Redis 多优先级队列、异步回调与 wait 同步等待，大 body 可卸载至对象存储。',
  },
]
