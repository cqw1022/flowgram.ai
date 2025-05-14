import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from '../utils/i18n';
import { languages } from '../locales';

interface I18nContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  currentLanguage: 'en-US',
  setLanguage: () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(I18n.getLocalLanguage());

  useEffect(() => {
    // 初始化时添加所有语言
    languages.forEach((lang) => I18n.addLanguage(lang));

    // 监听语言变化
    const disposable = I18n.onLanguageChange((langId: string) => {
      setCurrentLanguage(langId);
    });

    return () => {
      disposable.dispose();
    };
  }, []);

  const setLanguage = (lang: string) => {
    I18n.setLocalLanguage(lang);
  };

  const t = (key: string) => {
    return I18n.t(key);
  };

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
