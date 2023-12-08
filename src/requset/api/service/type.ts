import { useSelectedInstanceStore } from "../../../stores/select_instance"
import { formatK8sObjUnique } from "../../../types/common"
import { Service } from "types/service"

export interface GetGatewayParamsVO {
  names?: string
  namespace?: string
  port?: number
  hostname?: string
}

export interface GetGatewayParams {
  names?: string
  port?: number
  hostname?: string
}

export function converVOToGetGatewayParams(params:GetGatewayParamsVO):GetGatewayParams{
  const selectedStore = useSelectedInstanceStore()
  let hostname = params.hostname || undefined;
  let port = params.port || undefined;
  let names=undefined;
  if (params.names) {
    if(params.namespace){
      names = selectedStore.is_k8s()? formatK8sObjUnique(params.namespace,params.names): params.names
    }
    else{
      names = selectedStore.is_k8s()? formatK8sObjUnique('*',params.names): params.names
    }
  }
  else{
    if(params.namespace){
      names = selectedStore.is_k8s()? formatK8sObjUnique(params.namespace,'*'): undefined
    }
    else{
      names = undefined
    }
  }
  return{
    names,
    port,
    hostname
  }
}
export interface AddGateway extends Service {
}
export interface DeleteGatewayParams {
  name: string
}







