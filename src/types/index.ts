import { useSelectedInstanceStore } from '../stores/select_instance';
import { formatK8sObjUnique } from './common';

export * from './backend';
export * from './certificate';
export * from './service';
export * from './common';
export * from './route';
export * from './instance';
export * from './plugin';

export interface ApiObject {
  serialize(this: this): Object
  deserialize(this: Object): this
}

interface VO {
  name: string
  namespace: string
}
export function getVOId(v: VO) {
  const selectedStore = useSelectedInstanceStore()
  return selectedStore.is_k8s() ? formatK8sObjUnique(v.namespace, v.name) : v.name
}