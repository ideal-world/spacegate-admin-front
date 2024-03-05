import { ElMessage } from 'element-plus';
import basic from './basic'
import { AxiosError, AxiosResponse } from 'axios';
import { Api } from 'spacegate-admin-client'
export {
  basic,
}


export class ResponseError extends Error {
  data: unknown;
  constructor(public response: AxiosResponse) {
    super(response.statusText);
    this.data = response.data;
  }
}

export class ValidError extends Error {
  constructor() {
    super('User cancelled');
  }
}

export const catchAdminServerError = (e: AxiosError) => {
  if (e.response !== undefined) {
    if (e.response.status == 409) {
      ElMessage({
        message: 'Version conflict, please refresh the page and try again.',
        type: 'error',
      })
    } else {
      ElMessage({
        message: `(${e.response.status}): ${e.response.data}`,
        type: 'error',
      })
    }
  }
  console.error(e);
}

export const unwrapResponse = <T extends unknown>(response: AxiosResponse<T>): T => {
  if (response.status >= 400 || response.status < 200) {
    ElMessage({
      message: 'Request failed',
      type: 'error',
    })
    throw new ResponseError(response);
  } else if (response.headers['content-type']?.includes('application/json') === false) {
    ElMessage({
      message: 'Response is not json data.',
      type: 'error',
    })
    throw new ResponseError(response);
  }
  else {
    return response.data;
  }
}

export const downloadConfigItem = async (name: string) => {
  const response = await Api.get_config_item(name);
  const gateway = unwrapResponse(response);
  const a = document.createElement('a');
  const file = new Blob([JSON.stringify(gateway, null, 2)], { type: 'application/json' });
  const filename = `${name}.json`;
  const fileURL = URL.createObjectURL(file);
  a.href = fileURL;
  a.download = filename;
  a.click();
}

export const uploadConfigItem = async (name: string) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const json = JSON.parse(content);
          await Api.put_config_item(name, json);
          ElMessage({
            message: 'Gateway updated',
            type: 'success'
          })
        } catch (e) {
          catchAdminServerError(e);
        }
      }
      reader.readAsText(file);
    }
  }
  input.click();
}

export const saveJson = <T extends unknown>(value: T, name: string, target: 'file' | 'clipboard') => {
  const jsonString = JSON.stringify(value, null, 2);
  if (target === 'file') {
    const a = document.createElement('a');
    const file = new Blob([jsonString], { type: 'application/json' });
    const filename = `${name}.json`;
    const fileURL = URL.createObjectURL(file);
    a.href = fileURL;
    a.download = filename;
    a.click();
  } else if (target === 'clipboard') {
    navigator.clipboard.writeText(jsonString);
    ElMessage({
      message: 'Copied to clipboard',
      type: 'success',
    })
  }
}

export const fetchJson = <T extends unknown>(source: 'file' | 'clipboard'): Promise<T> => {
  const ok = (json: T): T => {

    ElMessage({
      message: 'Json Imported Successfully',
      type: 'success',
    })
    return json
  }
  const err = (e: unknown) => {
    console.warn(e);
    ElMessage({
      message: 'Fail to import json, please check the format of the file.',
      type: 'warning',
    })
  }
  const onFulfilled = (content: string): T => {
    try {
      const json = JSON.parse(content);
      return ok(json)
    } catch (e) {
      err(e)
      throw e;
    }
  }
  return new Promise((resolve, reject) => {
    if (source === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(onFulfilled(content));
          }
          reader.readAsText(file);
        }
      }
      input.click();
    } else if (source === 'clipboard') {
      navigator.clipboard.readText().then((content) => resolve(onFulfilled(content))).catch(reject);
    }
  })
}

export function hashColor(str: string, mode?: 'light' | 'dark' | 'full'): string {
  const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const cHex = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  const color = '#' + '00000'.substring(0, 6 - cHex.length) + cHex
  if (mode === 'light') {
    return mapLightness(color, [0.7, 1])
  } else if (mode === 'dark') {
    return mapLightness(color, [0, 0.3])
  } else if (mode === undefined || mode === 'full') {
    return color;
  } else {
    throw new Error('Invalid mode');
  }
}

function truncate(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}


function mapLightness(color: string, range: [number, number]): string {
  let from = truncate(range[0], 0, 1);
  let to = truncate(range[1], from, 1);
  let d = to - from;
  if (d === 0) {
    throw new Error('Invalid range');
  }
  const mapPhase = (p: number) => {
    return Math.floor(255 * from + p * d);
  }
  const r = mapPhase(parseInt(color.substring(1, 3), 16));
  const g = mapPhase(parseInt(color.substring(3, 5), 16));
  const b = mapPhase(parseInt(color.substring(5, 7), 16));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}