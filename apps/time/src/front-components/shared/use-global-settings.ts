import { useEffect, useState } from 'react';

import {
  fetchGlobalSettings,
  type GlobalSettings,
} from 'src/front-components/settings/settings-rest';

// REQ-0019 follow-up: единая точка чтения глобального singleton credosTimeSettings
// для фронтовых ПОТРЕБИТЕЛЕЙ (сетка, доска), а не только страницы «Настройки».
// fetchGlobalSettings уже отдаёт значения с дефолтами; здесь добавлен МОДУЛЬНЫЙ КЭШ
// (1 запрос на сессию) — настройки меняются редко, гонять REST на каждый рендер
// сетки/доски не нужно. Потребители получают live-значения с тем же хардкод-
// fallback, что был раньше (back-compat: пока не загрузилось / запись не засижена /
// ошибка чтения — поведение прежнее).

// Промис-кэш на уровень модуля: первый вызывающий инициирует запрос, остальные
// переиспользуют тот же промис. Результат запоминаем синхронно для getCached*.
let settingsPromise: Promise<GlobalSettings | null> | null = null;
let cachedSettings: GlobalSettings | null = null;

const loadOnce = (): Promise<GlobalSettings | null> => {
  if (!settingsPromise) {
    settingsPromise = fetchGlobalSettings()
      .then((s) => {
        cachedSettings = s;
        return s;
      })
      .catch(() => {
        // Сбрасываем промис, чтобы следующий потребитель смог повторить попытку.
        settingsPromise = null;
        return null;
      });
  }
  return settingsPromise;
};

// Синхронный доступ к уже загруженным настройкам (null, пока не загрузилось/нет
// записи). Для чистых расчётов, которым нужно одно значение без хука.
export const getCachedGlobalSettings = (): GlobalSettings | null => cachedSettings;

// Только для тестов: сброс модульного кэша между кейсами.
export const __resetGlobalSettingsCache = (): void => {
  settingsPromise = null;
  cachedSettings = null;
};

// Хук: глобальные настройки singleton (кэш на сессию). Возвращает null, пока не
// загрузилось / запись не засижена — потребитель применяет свой fallback.
export const useGlobalSettings = (): GlobalSettings | null => {
  const [settings, setSettings] = useState<GlobalSettings | null>(cachedSettings);

  useEffect(() => {
    if (settings) return; // уже есть из кэша
    let alive = true;
    void loadOnce().then((s) => {
      if (alive && s) setSettings(s);
    });
    return () => {
      alive = false;
    };
  }, [settings]);

  return settings;
};
