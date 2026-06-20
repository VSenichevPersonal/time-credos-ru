import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './error-boundary';
import { ErrorState } from './error-state';

// Smoke-тесты error-boundary без host-DOM (vitest env=node): проверяем контракт
// class-компонента напрямую — getDerivedStateFromError, render-ветки, авто-сброс
// по resetKeys. Полный mount в jsdom не нужен: логика boundary самодостаточна.

const make = (props: Partial<React.ComponentProps<typeof ErrorBoundary>> = {}) => {
  const instance = new ErrorBoundary({ children: 'дети', ...props });
  // setState в тестовой среде без реконсилятора просто мутирует локальное состояние.
  instance.setState = ((upd: unknown) => {
    const patch = typeof upd === 'function' ? (upd as (s: unknown) => object)(instance.state) : upd;
    instance.state = { ...instance.state, ...(patch as object) };
  }) as typeof instance.setState;
  return instance;
};

describe('ErrorBoundary.getDerivedStateFromError', () => {
  it('переводит boundary в состояние ошибки', () => {
    const err = new Error('бум');
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err });
  });
});

describe('ErrorBoundary.render', () => {
  it('без ошибки — рендерит детей as-is', () => {
    const inst = make({ children: 'контент' });
    expect(inst.render()).toBe('контент');
  });

  it('при ошибке — рендерит ErrorState (дружелюбный фолбэк)', () => {
    const inst = make();
    inst.state = { error: new Error('сырой текст') };
    const out = inst.render();
    expect(isValidElement(out)).toBe(true);
    expect((out as React.ReactElement).type).toBe(ErrorState);
  });

  it('фолбэк получает заголовок по умолчанию «Что-то пошло не так»', () => {
    const inst = make();
    inst.state = { error: new Error('x') };
    const out = inst.render() as React.ReactElement<React.ComponentProps<typeof ErrorState>>;
    expect(out.props.title).toBe('Что-то пошло не так');
    expect(out.props.detail).toBe('x');
    expect(typeof out.props.onRetry).toBe('function');
  });

  it('кастомный title пробрасывается в фолбэк', () => {
    const inst = make({ title: 'Не удалось показать таблицу' });
    inst.state = { error: new Error('x') };
    const out = inst.render() as React.ReactElement<React.ComponentProps<typeof ErrorState>>;
    expect(out.props.title).toBe('Не удалось показать таблицу');
  });
});

describe('ErrorBoundary — сброс', () => {
  it('onRetry в фолбэке очищает ошибку (повторная попытка рендера)', () => {
    const inst = make();
    inst.state = { error: new Error('x') };
    const out = inst.render() as React.ReactElement<React.ComponentProps<typeof ErrorState>>;
    out.props.onRetry?.();
    expect(inst.state.error).toBeNull();
    // после сброса снова рендерит детей
    expect(inst.render()).toBe('дети');
  });

  it('смена resetKeys при наличии ошибки — авто-сброс через componentDidUpdate', () => {
    const inst = make({ resetKeys: ['week', '2026-06-01'] });
    inst.state = { error: new Error('x') };
    inst.componentDidUpdate({ children: 'дети', resetKeys: ['week', '2026-05-25'] });
    expect(inst.state.error).toBeNull();
  });

  it('те же resetKeys — ошибка сохраняется (нет лишнего сброса)', () => {
    const inst = make({ resetKeys: ['week', '2026-06-01'] });
    inst.state = { error: new Error('x') };
    inst.componentDidUpdate({ children: 'дети', resetKeys: ['week', '2026-06-01'] });
    expect(inst.state.error).not.toBeNull();
  });

  it('без ошибки componentDidUpdate ничего не делает', () => {
    const inst = make({ resetKeys: ['a'] });
    inst.state = { error: null };
    inst.componentDidUpdate({ children: 'дети', resetKeys: ['b'] });
    expect(inst.state.error).toBeNull();
  });
});

describe('ErrorBoundary.componentDidCatch', () => {
  it('логирует краш в console.error, не бросает дальше', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const inst = make();
    expect(() =>
      inst.componentDidCatch(new Error('краш'), { componentStack: '\n  at Widget' }),
    ).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
