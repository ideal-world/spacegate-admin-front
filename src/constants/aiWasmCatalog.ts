/** AI Wasm 插件目录 */
export type AiWasmCatalogItem = {
  id: string
  title: string
  description: string
  kind?: 'managed' | 'generic'
}

export const AI_WASM_CATALOG: AiWasmCatalogItem[] = [
  {
    id: 'third-party-wasm',
    title: '自定义 Wasm 插件',
    kind: 'generic',
    description:
      '按 Higress WasmPlugin 标准添加外部 proxy-wasm 插件，支持 imageUrl、phase、priority、imagePullPolicy、defaultConfig、matchRules 与私有 OCI 仓库认证。',
  },
]
