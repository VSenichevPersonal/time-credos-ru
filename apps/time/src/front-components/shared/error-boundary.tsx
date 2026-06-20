import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from 'src/front-components/shared/error-state';

// React error-boundary: ловит крах в дереве дочерних виджетов (как был P1 —
// OLAP-форма /s/reports без 3-срезовых массивов → BreakdownTable.map(undefined)),
// показывает дружелюбный фолбэк «Что-то пошло не так · Обновить» вместо белого
// экрана. Виджет НЕ роняется целиком, краш изолирован поддеревом.
//
// Class-компонент обязателен: componentDidCatch / getDerivedStateFromError —
// только в классах (хуков-эквивалента в React нет). Песочница-safe: без host-DOM
// и window-слушателей. Кнопка «Обновить» сбрасывает boundary (resetKeys тоже:
// смена ключа — напр. периода/среза — авто-сброс при следующем рендере).

type Props = {
  children: ReactNode;
  // Заголовок фолбэка. По умолчанию — общий «Что-то пошло не так».
  title?: string;
  // При смене любого значения boundary сбрасывается (повторная попытка рендера).
  resetKeys?: ReadonlyArray<unknown>;
};

type State = { error: Error | null };

const sameKeys = (a?: ReadonlyArray<unknown>, b?: ReadonlyArray<unknown>): boolean => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((v, i) => Object.is(v, b[i]));
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // Внешнее изменение (период/срез/фильтр) — даём поддереву ещё попытку.
    if (this.state.error && !sameKeys(prev.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Логируем для диагностики; UI остаётся дружелюбным.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] перехвачен краш виджета:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title={this.props.title ?? 'Что-то пошло не так'}
          detail={this.state.error.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
