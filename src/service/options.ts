import { getBackendApi } from "../requset/api/backend";
import { useSpacegateService } from ".";

export type ApiType = 'plugin' | 'backend';
export type OptionItem = { label: string; value: string; tag?: string | undefined; };
export async function getOptions(apiType: ApiType): Promise<OptionItem[]> {
  const service = useSpacegateService();
  if (apiType === 'plugin') {
    let plugins = await service.plugin.getPlugin();
    if (plugins.data !== undefined || plugins.data !== null) {
      return plugins.data.map((obj) => ({
        label: obj.name ? obj.name : '', value: obj.id, tag: obj.code
      }))
    }
  } else if (apiType === 'backend') {
    let backends = await getBackendApi();
    if (backends.data !== undefined || backends.data !== null) {
      return backends.data.map((obj) => (
        { label: obj.id, value: obj.id, tag: obj.namespace ?? undefined }
      ))
    }
  }
  throw new Error('获取插件列表失败');
}