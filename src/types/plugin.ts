export interface SgPlugin {
  id: string;
  code: string;
  name?: string | null;
  spec: any; // Use any type or define a specific structure for filter parameters
}

export function isSgPlugin(arg: any): arg is SgPlugin {
  return arg.code !== undefined&&arg.id !== undefined&&arg.spec !== undefined;
}