/** AI Wasm 插件目录 */
export type AiWasmCatalogItem = {
  id: string
  title: string
  description: string
  kind?: 'managed' | 'generic'
}

export const AI_WASM_CATALOG: AiWasmCatalogItem[] = [
  {
    id: 'ai-gateway-queue',
    title: 'AI 网关排队限流',
    kind: 'managed',
    description:
      '入口处对 AI 请求做租户级令牌桶限流，超额时按 abandon / queue / wait 策略分流；支持 Redis 多优先级队列、异步回调与 wait 同步等待，大 body 可卸载至对象存储。',
  },
  {
    id: 'third-party-wasm',
    title: '自定义 Wasm 插件',
    kind: 'generic',
    description:
      '按 Higress WasmPlugin 标准添加外部 proxy-wasm 插件，支持 imageUrl、phase、priority、imagePullPolicy、defaultConfig、matchRules 与私有 OCI 仓库认证。',
  },
]
