export interface SgPlugin {
  id: string;
  code: string;
  name?: string | null;
  spec: any; // Use any type or define a specific structure for filter parameters
}

export function isSgPlugin(arg: any): arg is SgPlugin {
  return arg.code !== undefined && arg.id !== undefined && arg.spec !== undefined;
}

export interface SgPluginVO {
  id: string;
  code: string;
  name?: string | null;
  spec: string;
}

export function convertPluginToVO(plugin: SgPlugin): SgPluginVO {
  return {
    id: plugin.id,
    code: plugin.code,
    name: plugin.name,
    spec: JSON.stringify(plugin.spec),
  }
}

export function convertVOToPlugin(vo: SgPluginVO): SgPlugin {
  return {
    id: vo.id,
    code: vo.code,
    name: vo.name,
    spec: JSON.parse(vo.spec),
  }
}