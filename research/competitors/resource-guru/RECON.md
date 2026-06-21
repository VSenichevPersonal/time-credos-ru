# Resource Guru — конкурентная разведка (RECON)

> SaaS ресурсного планирования. Источник: публичный Help Center (help.resourceguruapp.com).
> Дата: 2026-06-21. Зафиксировано ТОЛЬКО проверяемое из доков; где не нашёл — отмечено явно.

---

## 1. Модель данных

Сущности, видимые публично:

- **Resource / People** — человек или нечеловеческий ресурс (оборудование, помещение). У ресурса есть нормальная доступность (availability) и исключения.
- **Booking (бронь)** — единица занятости ресурса на дату/период. Может быть time-specific (с конкретным временем) либо без времени. Статусы броней: подтверждённая, **Waiting List**, **Placeholder**, **Approvals** (на утверждении), **Tentative** (предварительная).
- **Project** — проект, к которому относится бронь. Имеет даты начала/окончания, бюджетный статус (Budget status), вехи (**Milestones**), Activity Types.
- **Client** — клиент, к которому относится проект.
- **Custom fields** — пользовательские поля на людях/ресурсах (department, location, skills, job title и т.д.).

Ключевые публично видимые поля:
- доступность ресурса (часы), исключения доступности (work on a weekend и т.п.);
- у брони: проект, клиент, тип активности (Activity Type), статус, время/часы;
- у проекта: client, даты start/end, budget status, milestones.

Связь «бронь → проект → клиент» и «бронь → ресурс». Точная схема FK / API-поля в публичных доках **не нашёл**.

---

## 2. Source of truth

- **Single source of truth — человек/ресурс** (per-resource availability). Доступность задаётся на уровне ресурса (нормальный график + исключения).
- Бронирования вешаются на конкретный ресурс; конфликт считается по доступности этого ресурса.
- **Направление агрегации — снизу вверх**: командная мощность (Capacity) и тепловая карта собираются из per-resource данных. В Capacity Planning «высота бара = team's **effective capacity**» — агрегат по людям с учётом отпусков/больничных.
- Heatmap агрегирует «по сотрудникам (ресурсам) с разбивкой по дням».

---

## 3. UX планирования

Главный экран — **Schedule** (расписание, строки = ресурсы, колонки = даты).

- **Zoom levels** — три уровня масштаба (детализации). Точные названия уровней в доке **не нашёл**.
- **Group by** (иконка Group на Schedule): группировка по **Project**, **Client**, **custom fields** (department, location), либо **None**. В разных статьях упоминается также группировка по Job Title / location / custom fields людей и ресурсов (формулировки расходятся между статьями — фиксирую как заявлено: project / client / custom fields — основной набор).
- **Filter by** — универсальный поиск по любым атрибутам (включая custom fields), фильтр по проектам/клиентам; логика **Any / All**.
- **Sort** — по имени, должности, single-select полям.
- **Ввод брони**: процесс создания в открытых статьях детально **не нашёл**. Известно: бронь создаётся на ресурс, можно выбрать **«Currently filtered»** в поле «People or Resources» для массовой брони на всю отфильтрованную группу. Редактирование/массовые операции — через **Action Drawer**.
- **Единицы**: время в **часах** (h / min). Отчёты Capacity поддерживают **дни ИЛИ часы** (выбор в Options). **Проценты** — только как производная (утилизация). **FTE как единица ввода — не нашёл**; есть % утилизации, но не FTE-планирование.

---

## 4. Визуал занятости

Два инструмента.

### Availability Bar
- Показывает: **free time / booked time / Overtime / Waiting List** для каждого ресурса.
- Назначение: «кто свободен, кто полностью забронирован, кто переработан» одним взглядом.
- Hover → tooltip со сводкой (свободно/занято/овертайм/очередь).
- Клик по дате → детальная разбивка доступности (free / booked / overtime) + правка / создание исключений.
- **Overtime** маркируется красным баром + красным фоном даты.
- Переключатель скрыть/показать; предпочтение **persist** между сессиями.
- Точные числовые пороги цветов для Availability Bar в доке **не нашёл** (бинарно: есть овертайм → красный).

### Schedule Heatmap (планы Blackbelt и Master)
- Цвета/пороги (вербально, точных % порогов нет):
  - нейтральный — полностью свободно;
  - **Lighter Green** — доступная ёмкость, низкая нагрузка;
  - **Darker Green** — растущая утилизация;
  - **Orange** — высокая нагрузка.
- Три режима: **Total Utilization**, **Billable Utilization**, **Hours Available**.
- В расчёт: брони «на утверждении» (Approvals) **влияют**; Waiting List и предварительные (Tentative) — **не влияют**.
- Единицы — часы.

---

## 5. Овербукинг

- Есть **clash management engine**, который предотвращает овербукинг — детектит нехватку доступности при time-specific брони.
- Это **warning, не hard block**: пользователь сам выбирает из трёх опций при **Booking Clash**:
  1. **Add to Waiting List** — неподтверждённая бронь (маркер: диагональные линии + красный фон).
  2. **Add With Overtime** — авто-расширить доступность, лишние часы = overtime (красный бар + красный фон даты).
  3. **Add Without Overtime (Extend Availability)** — расширить доступность без флага овертайма.
- **Elastic Overtime**: овертайм «эластичный» — авто-удаляется при удалении/перемещении брони, переезжает на новую дату.
- Весь overtime попадает в **Reports** для контроля перегруза.

---

## 6. Память контекста / Views

- **Saved Views**: сохраняют применённые **фильтры** Schedule (напр. «Creatives London»). Появляются в списке **Views** в верхнем левом control bar. Используются для bulk-брони через «Currently filtered».
- Persist Saved Views между сессиями в доке явно **не нашёл** (сказано лишь, что вид «listed under Views» после сохранения).
- **Availability Bar** toggle — **persist** между сессиями (явно подтверждено).
- Persist группировки/фильтра при возврате на экран — в статье про Group by явно **не нашёл** (не описано).

---

## 7. Что ПРИМЕНИМО нам

Наш стек: **Twenty CRM + Remote DOM**, БЕЗ drag-and-drop, без прямого доступа к host-DOM.

**Переносимо (концепции, не реализация):**
- **Source of truth = человек, агрегация снизу вверх** — совпадает с нашей моделью (см. MEMORY: OLAP-связь-с-людьми). Безопасно копировать.
- **Availability Bar как сводка free/booked/overtime по дню** — рендерится как обычные блоки/полосы внутри Remote DOM, drag не нужен. Перенести можно.
- **Heatmap утилизации цветами (зелёный → оранжевый)** — чисто цвет фоновой ячейки, реализуемо без DnD и без host-DOM.
- **Овербукинг как warning + опции (очередь / овертайм / расширить)** вместо hard-block — хорошая UX-модель, реализуется на стороне нашей логики, UI = модалка/чипы.
- **Group by (project/client/custom field) + Any/All фильтры + Saved Views** — состояние хранится в нашем сторе, не в DOM. Полностью переносимо.
- **Elastic overtime** (овертайм мигрирует за бронью) — серверная/логическая фича, от DOM не зависит. Применимо.

**НЕ переносимо / с оговорками:**
- **Drag-and-drop брони по сетке** — наш стек его исключает (по условию). Resource Guru сильно завязан на DnD-перемещение броней; нам нужен ввод через формы/Action Drawer-аналог, не перетаскивание.
- **Billable Utilization режим heatmap** — у нас по решению проекта **нет понятия billable** (MEMORY: no-billable-concept). Берём только Total Utilization / Hours Available; Billable исключаем.
- **Hover-tooltip с детализацией** — Remote DOM ограничивает прямой контроль над host-DOM/позиционированием; точные пороги цветов RG не публикует, поэтому свои пороги задаём сами (доков для копирования нет).
- **Zoom levels (3 уровня)** — концептуально ок, но конкретика RG не раскрыта; проектируем сами.

---

## 8. Ссылки-источники (реально открытые)

- https://help.resourceguruapp.com/en/articles/2942098-using-the-availability-bar — Availability Bar
- https://help.resourceguruapp.com/en/articles/3381954 — Schedule Heatmap
- https://help.resourceguruapp.com/en/articles/2942080-booking-clashes-the-waiting-list-overtime-and-capacity-planning — Booking Clashes / Waiting List / Overtime
- https://help.resourceguruapp.com/en/articles/1957954 — Group the Schedule by Project, Client, Custom Field
- https://help.resourceguruapp.com/en/articles/1957826 — Navigate and Filter the Schedule
- https://help.resourceguruapp.com/en/articles/1956226 — Use Saved Views to Book Multiple People at Once
- https://help.resourceguruapp.com/en/articles/1957058 — Capacity Planning
- https://help.resourceguruapp.com/en/articles/5373171-group-by-project-or-client — Group by Project or Client

---

## Вердикт: полезен ли как референс и чем

**Да, полезен — как концептуальный (не визуальный) референс.**

Сильные стороны для нас:
1. **Овербукинг как мягкое предупреждение с тремя путями** (waiting list / overtime / extend) — зрелая UX-модель, прямо переносится в нашу логику без DnD.
2. **Elastic overtime** — изящная идея «овертайм едет за бронью».
3. **Source of truth = человек + агрегация снизу вверх** — подтверждает наш выбранный курс.
4. **Group by + Any/All фильтры + Saved Views** — состояние в сторе, идеально ложится на Twenty + Remote DOM.

Ограничения референса:
- Resource Guru архитектурно опирается на **drag-and-drop**, который у нас запрещён — копировать interaction-слой нельзя, только модель данных и состояния.
- **Billable** режимы исключаем (нет billable у нас).
- Публичные доки **не дают** точных числовых порогов цветов и схемы данных/API — пороги и схему проектируем сами.

Итог: брать **смысловую модель** (статусы броней, clash-warning, elastic overtime, heatmap-семантику, group/filter/views), отбрасывать **interaction-механику** (DnD) и billable.
