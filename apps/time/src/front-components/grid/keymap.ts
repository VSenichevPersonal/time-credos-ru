// SSOT горячих клавиш сетки (E4.14). Один источник для cheatsheet (показ) И
// для keyAction (обработка) — раньше cheatsheet и use-keyboard дрейфовали (E4.5:
// «Shift+Enter» был в подсказке, но действия не было). Паттерн category-meta/tag-meta.
//
// Каждая запись несёт id (стабильный для обработчика), keys (показ), desc (показ).
// keyAction маппит сырое событие → действие по этому же списку (см. use-keyboard).

export type ShortcutId =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'row-edge' // W3A.8: Home/End — первая/последняя редактируемая ячейка строки
  | 'grid-edge' // W3A.8: Ctrl+Home/End — края всей сетки
  | 'edit'
  | 'commit-down'
  | 'commit-up' // W3A.5: Shift+Enter — подтвердить и вверх (освободили от bulk-fill)
  | 'commit-right'
  | 'commit-left'
  | 'cancel'
  | 'delete'
  | 'bulk-fill-row'
  | 'fill-down'
  | 'copy'
  | 'paste'
  | 'help';

export type Shortcut = { id: ShortcutId; keys: string; desc: string };

// Порядок = порядок показа в cheatsheet. Сгруппировано: навигация → ввод → массовые.
export const SHORTCUTS: Shortcut[] = [
  { id: 'move-up', keys: '↑ ↓ ← →', desc: 'перемещение по ячейкам' },
  { id: 'row-edge', keys: 'Home / End', desc: 'к первой / последней ячейке строки' },
  { id: 'grid-edge', keys: 'Ctrl+Home/End', desc: 'к началу / концу сетки' },
  { id: 'edit', keys: '0–9', desc: 'начать ввод часов (заменяет значение)' },
  { id: 'commit-down', keys: 'Enter', desc: 'подтвердить и вниз' },
  { id: 'commit-up', keys: 'Shift+Enter', desc: 'подтвердить и вверх' },
  { id: 'commit-right', keys: 'Tab', desc: 'подтвердить и вправо' },
  { id: 'commit-left', keys: 'Shift+Tab', desc: 'влево' },
  { id: 'cancel', keys: 'Esc', desc: 'отмена ввода' },
  { id: 'delete', keys: '0 / Del', desc: 'удалить запись' },
  { id: 'bulk-fill-row', keys: 'Alt+→', desc: 'часы ячейки на все будни строки' },
  { id: 'fill-down', keys: 'Ctrl+D', desc: 'заполнить вниз по столбцу' },
  { id: 'copy', keys: 'Ctrl+C', desc: 'скопировать значение ячейки' },
  { id: 'paste', keys: 'Ctrl+V', desc: 'вставить в активную ячейку' },
  { id: 'help', keys: '?', desc: 'эта подсказка' },
];
