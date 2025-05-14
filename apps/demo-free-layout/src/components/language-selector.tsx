import React from 'react';
import { Select } from '@douyinfe/semi-ui';
import { useI18n } from '../context/i18n-context';
import { languages } from '../locales';

const { Option } = Select;

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useI18n();

  const handleChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    if (typeof value === 'string') {
      setLanguage(value);
    }
  };

  return (
    <div className="language-selector">
      <Select
        value={currentLanguage}
        onChange={handleChange}
        style={{ width: 160 }}
        placeholder={t('ChangeLanguage')}
      >
        {languages.map((lang) => (
          <Option key={lang.languageId} value={lang.languageId}>
            {lang.localizedLanguageName}
          </Option>
        ))}
      </Select>
    </div>
  );
};
