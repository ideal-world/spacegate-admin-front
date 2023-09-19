import { ComposerTranslation, createI18n, I18n, I18nOptions } from 'vue-i18n';

let i18nInstance: I18n;

/// only can set once
export async function setupI18n(options?: I18nOptions): Promise<I18n> {
  if (i18nInstance) {
    return i18nInstance;
  }

  if (options) {
    i18nInstance = createI18n(options);
  } else {
    const locale={lang:'zh-CN'}
    const defaultLocal = await import(`../locales/${locale.lang}.ts`)
    const message = defaultLocal.default ?? {}
    // 如果没有传入选项，初始化一个默认的 i18n 实例
    i18nInstance = createI18n({
      locale: locale.lang,
      messages: {
        [locale.lang]: message,
      },
    });
  }

  return i18nInstance;
}

export const useI18n=async ():Promise<ComposerTranslation> => {
  if (i18nInstance) {
    return i18nInstance.global.t;
  }
  return (await setupI18n()).global.t;
}

export const changelang=async (lang:string)=>{
  if (i18nInstance) {
    i18nInstance.global.locale=lang
  }
  (await setupI18n()).global.locale=lang;
}