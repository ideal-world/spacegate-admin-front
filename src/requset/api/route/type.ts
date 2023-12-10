import { formatK8sObjUnique } from "../../../types/common";
import { useSelectedInstanceStore } from "../../../stores/select_instance";

export interface GetHttpRouteParamsVO {
  names?: string
  namespace?: string
}

export interface GetHttpRouteParams {
  names?: string
}

export function converVOToGetHttpRouteParams(params?: GetHttpRouteParamsVO): GetHttpRouteParams {
  if (!params) {
    return {}
  }
  const selectedStore = useSelectedInstanceStore()
  let names = undefined;
  if (params.names) {
    if (params.namespace) {
      names = selectedStore.is_k8s() ? formatK8sObjUnique(params.namespace, params.names) : params.names
    }
    else {
      names = selectedStore.is_k8s() ? formatK8sObjUnique('*', params.names) : params.names
    }
  }
  else {
    if (params.namespace) {
      names = selectedStore.is_k8s() ? formatK8sObjUnique(params.namespace, '*') : undefined
    }
    else {
      names = undefined
    }
  }
  return {
    names
  }
}