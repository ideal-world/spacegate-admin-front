export const MAGIC_NUM = 100


export const PORT_MAX = 65535
export const PORT_MIN = 0


export const PORT_INPUT_ATTR = {
  min: PORT_MIN,
  max: PORT_MAX,
  type: 'number',
  step: 1,
  "step-strictly": true,
  controls: false,

} as const