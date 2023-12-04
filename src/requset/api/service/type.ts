import { Service } from "types/service"

export interface GetGatewayParams {
  names?: string
  namespace?: string
  port?: number
  hostname?: string
}
export interface AddGateway extends Service {
}
export interface DeleteGatewayParams {
  name: string
}







