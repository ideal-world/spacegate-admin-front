import { Gateway } from "types/service"

export interface GetGatewayParams {
  name?: string
  namespace?: string
  port?: number
  hostname?: string
}
export interface AddGateway extends Gateway {
}
export interface DeleteGatewayParams {
  name: string
  namespace?: string
}







