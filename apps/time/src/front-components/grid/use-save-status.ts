import { useCallback, useEffect, useRef, useState } from 'react';

// Статус автосохранения сетки: idle → saving → saved (→ idle через 2с) | error.
// Считаем незавершённые операции (pending), чтобы параллельные правки ячеек
// давали один общий статус, а не мигание. Оборачивает любую async-мутацию.

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVED_LINGER_MS = 2000;

export const useSaveStatus = () => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const track = useCallback(async <T,>(op: () => Promise<T>): Promise<T> => {
    pending.current += 1;
    clearTimer();
    setStatus('saving');
    try {
      const result = await op();
      pending.current -= 1;
      if (pending.current === 0) {
        setStatus('saved');
        timer.current = setTimeout(() => setStatus('idle'), SAVED_LINGER_MS);
      }
      return result;
    } catch (e) {
      pending.current = Math.max(0, pending.current - 1);
      setStatus('error');
      throw e;
    }
  }, []);

  useEffect(() => clearTimer, []);

  return { status, track };
};
