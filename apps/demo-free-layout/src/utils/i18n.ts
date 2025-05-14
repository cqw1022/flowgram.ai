import { languages } from '../locales';

type LanguageDefinition = {
  languageId: string;
  languageName?: string;
  localizedLanguageName?: string;
  contents: Record<string, string>;
};

class I18nImpl {
  private _languages = new Map<string, LanguageDefinition>();
  private _localLanguage = 'en-US';
  private _changeListeners: ((langId: string) => void)[] = [];

  constructor() {
    languages.forEach((lang) => this.addLanguage(lang));
  }

  t(key: string, options?: { disableReturnKey?: boolean }): string {
    const contents: Record<string, string> =
      this._languages.get(this._localLanguage)?.contents || {};
    if (contents[key]) {
      return contents[key];
    }
    if (options?.disableReturnKey) return '';
    return key;
  }

  getLocalLanguage() {
    return this._localLanguage;
  }

  setLocalLanguage(langId: string) {
    if (langId === this._localLanguage) return;
    this._localLanguage = langId;
    this._changeListeners.forEach(listener => listener(langId));
  }

  getLangauges() {
    return this._languages;
  }

  addLanguage(newLanguage: LanguageDefinition): void {
    let oldLanguage = this._languages.get(newLanguage.languageId);
    if (oldLanguage) {
      this._languages.set(newLanguage.languageId, {
        ...oldLanguage,
        ...newLanguage,
        contents: {
          ...oldLanguage.contents,
          ...newLanguage.contents,
        },
      });
    } else {
      this._languages.set(newLanguage.languageId, newLanguage);
    }
  }

  onLanguageChange(callback: (langId: string) => void) {
    this._changeListeners.push(callback);
    return {
      dispose: () => {
        this._changeListeners = this._changeListeners.filter(
          (listener) => listener !== callback
        );
      }
    };
  }
}

export const I18n = new I18nImpl();
