import { createI18n } from 'vue-i18n'
import type { I18n, I18nOptions} from 'vue-i18n'


let globalI18n: ReturnType<typeof createI18n>;

export const setupI18n=(options:I18nOptions)=> {
  globalI18n = createI18n(options);
}

// export const useI18n=()=> {
//   if (!globalI18n) {
//     throw new Error('Global i18n is not set. Please use setGlobalI18n to set it.');
//   }
//   return globalI18n;
// }

type I18nGlobalTranslation = {
  (key: string): string
  (key: string, locale: string): string
  (key: string, locale: string, list: unknown[]): string
  (key: string, locale: string, named: Record<string, unknown>): string
  (key: string, list: unknown[]): string
  (key: string, named: Record<string, unknown>): string
}

type I18nTranslationRestParameters = [string, any]

const getKey = (namespace: string | undefined, key: string) => {
  if (!namespace) {
    return key
  }
  if (key.startsWith(namespace)) {
    return key
  }
  return `${namespace}.${key}`
}

export const useI18n = (
  namespace?: string
): {
  t: I18nGlobalTranslation
} => {
  const normalFn = {
    t: (key: string) => {
      return getKey(namespace, key)
    }
  }

  if (!globalI18n) {
    return normalFn
  }

  const { t, ...methods } = globalI18n.global

  const tFn: I18nGlobalTranslation = (key: string, ...arg: any[]) => {
    if (!key) return ''
    if (!key.includes('.') && !namespace) return key
    return (t as any)(getKey(namespace, key), ...(arg as I18nTranslationRestParameters))
  }
  return {
    ...methods,
    t: tFn
  }
}

export const t = (key: string) => key