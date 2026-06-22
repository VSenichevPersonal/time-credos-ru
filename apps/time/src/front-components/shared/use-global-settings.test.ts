import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Мок settings-rest до импорта модуля (модульный кэш инициализируется при загрузке).
const mockFetch = vi.fn();
vi.mock('src/front-components/settings/settings-rest', () => ({
  fetchGlobalSettings: mockFetch,
}));

// Импорт ПОСЛЕ мока — важно для корректной инициализации.
const { getCachedGlobalSettings, __resetGlobalSettingsCache } = await import(
  'src/front-components/shared/use-global-settings'
);

beforeEach(() => {
  __resetGlobalSettingsCache();
  vi.clearAllMocks();
});

afterEach(() => {
  __resetGlobalSettingsCache();
});

// getCachedGlobalSettings — синхронный доступ к кэшу (null пока не загрузилось).
describe('getCachedGlobalSettings — синхронный кэш', () => {
  it('до загрузки → null', () => {
    expect(getCachedGlobalSettings()).toBeNull();
  });

  it('после reset → null', () => {
    __resetGlobalSettingsCache();
    expect(getCachedGlobalSettings()).toBeNull();
  });
});

describe('__resetGlobalSettingsCache — тест-хелпер', () => {
  it('сбрасывает кэш между тест-кейсами', () => {
    // Убедимся что после reset getCached возвращает null (кэш действительно сброшен)
    __resetGlobalSettingsCache();
    expect(getCachedGlobalSettings()).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled(); // reset не инициирует запрос
  });
});
