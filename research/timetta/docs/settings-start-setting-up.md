# Типовой порядок настройки системы

*Обновлено: 06.08.2025*

> **Права доступа**
> Доступ ко всем настройкам системы имеет пользователь, которому назначен набор прав для роли **Администратор** с соответствующими гранулами.

## Базовая настройка

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Подразделения](https://app.timetta.com/settings/departments) | [Подразделения](https://timetta.com/ru/docs/settings/users/departments) | Заполните справочник **Подразделения**, указав организационную структуру компании. |
| 2 | [Наборы прав](https://app.timetta.com/settings/permission-sets) | [Права доступа](https://timetta.com/ru/docs/settings/permissions/permission-sets) | Timetta использует ролевую модель для разграничения прав. Настройте все необходимые **Наборы прав**, которые будут назначаться пользователям. |
| 3 | [Группы пользователей](https://app.timetta.com/settings/groups) | [Группы пользователей](https://timetta.com/ru/docs/settings/users/users-groups) | Создайте и заполните справочник **Группы пользователей**. Назначайте права группам, а не отдельным пользователям — это упрощает администрирование. |
| 4 | [Расписания](https://app.timetta.com/settings/schedules) | [Расписания](https://timetta.com/ru/docs/settings/time-accounting/work-schedule) | Добавьте в справочник **Расписания** данные о рабочих графиках сотрудников. Если все работают по стандартному графику (40 часов в неделю), этот шаг можно пропустить. |
| 5 | [Исключения расписаний](https://app.timetta.com/settings/schedule-exceptions) | [Исключения расписаний](https://timetta.com/ru/docs/settings/time-accounting/schedule-exceptions) | Укажите в справочнике **Исключения расписаний** нерабочие дни, такие как праздники или отключения. |
| 6 | [Пользователи](https://app.timetta.com/settings/users) | [Пользователи](https://timetta.com/ru/docs/settings/users/user-settings) | Создайте и заполните карточки всех пользователей, которые будут работать в системе Timetta. |

## Учёт рабочего времени

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Периоды таймшитов](https://app.timetta.com/settings/timesheet-periods) | [Периоды таймшитов](https://timetta.com/ru/docs/settings/time-accounting/timesheet-periods) | По умолчанию установлен недельный период. При необходимости настройте другой период. |
| 2 | [Виды работ](https://app.timetta.com/settings/activities) | [Виды работ](https://timetta.com/ru/docs/settings/time-accounting/work-types) | Заполните справочник **Виды работ**, если требуется классифицировать деятельность сотрудников. Если аналитика не нужна, шаг можно пропустить. |
| 3 | [Типы отсутствий](https://app.timetta.com/settings/time-off-types) | [Типы отсутствий](https://timetta.com/ru/docs/settings/time-accounting/time-off-types) | Укажите типы отсутствий, используемые в вашей организации (например, отпуск, больничный). |
| 4 | [Правила валидации](https://app.timetta.com/settings/validation-rules) | [Правила валидации](https://timetta.com/ru/docs/settings/time-accounting/timesheet-validation-rules) | По умолчанию действуют два правила:<br>• В день нельзя списать более 24 часов<br>• Отклонение от графика не должно превышать ±2 часа<br><br>При необходимости настройте или добавьте новые правила. |
| 5 | [Шаблоны таймшитов](https://app.timetta.com/settings/timesheet-templates) | [Шаблоны таймшитов](https://timetta.com/ru/docs/settings/time-accounting/timesheet-templates) | Настройте один или несколько шаблонов. Определите правила создания, интерфейс, проверки данных и другие параметры. |
| 6 | [Коды оплаты](https://app.timetta.com/settings/bill-codes) | [Коды оплаты](https://timetta.com/ru/docs/settings/time-accounting/bill-codes) | Укажите в справочнике **Коды оплаты** виды оплат, отличные от стандартных. Если используется обычная оплата, шаг можно пропустить. |

## Управление ресурсами

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Ресурсные пулы](https://app.timetta.com/settings/resource-pools) | [Ресурсные пулы](https://timetta.com/ru/docs/settings/resources/resource-pools) | Создайте пулы и распределите по ним пользователей. Если пулы не используются, шаг можно пропустить. |
| 2 | [Уровни](https://app.timetta.com/settings/levels) | [Уровни](https://timetta.com/ru/docs/settings/resources/levels) | Заполните справочник **Уровни**, если в компании выделяются должностные уровни. В противном случае шаг можно пропустить. |
| 3 | [Грейды](https://app.timetta.com/settings/grades) | [Грейды](https://timetta.com/ru/docs/settings/resources/grades) | Укажите в справочнике **Грейды** должностные грейды. Если грейды не используются, шаг можно пропустить. |
| 4 | [Локации](https://app.timetta.com/settings/locations) | [Локации](https://timetta.com/ru/docs/settings/resources/location) | Добавьте в справочник **Локации** места работы сотрудников. Если локации не важны, шаг можно пропустить. |
| 5 | [Роли](https://app.timetta.com/settings/roles) | [Роли](https://timetta.com/ru/docs/settings/resources/users-roles) | Заполните справочник **Роли**, указав проектные роли сотрудников. |
| 6 | [Компетенции](https://app.timetta.com/settings/competences) | [Компетенции](https://timetta.com/ru/docs/settings/resources/competences) | Укажите компетенции сотрудников. Они привязываются к ролям. Если компетенции не используются, шаг можно пропустить. |
| 7 | [Навыки](https://app.timetta.com/settings/skills) | [Навыки](https://timetta.com/ru/docs/settings/resources/skills) | Заполните справочник **Навыки**, если в компании ведётся учёт навыков. В противном случае шаг можно пропустить. |

## Управление досками и задачами

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Типы задач](https://app.timetta.com/settings/issue-types) | Типы задач | Заполните справочник **Типы задач** (например, задача, баг, улучшение). |
| 2 | [Доски](https://app.timetta.com/settings/boards) | [Доски](https://timetta.com/ru/docs/settings/config/settings/config/boards) | Создайте и настройте доски. Если доски не используются, шаг можно пропустить. |

## Счета и оплаты

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Шаблоны счетов](https://app.timetta.com/settings/invoice-templates) | [Шаблоны счетов](https://timetta.com/ru/docs/settings/finances/bill-templates) | Настройте один или несколько шаблонов счетов для выставления клиентам. |
| 2 | [Валюты](https://app.timetta.com/settings/currencies) | [Валюты](https://timetta.com/ru/docs/settings/finances/currencies) | Заполните справочник **Валюты**, если используются несколько валют. При одной валюте шаг можно пропустить. |
| 3 | [Матрицы ставок](https://app.timetta.com/settings/rate-matrices/default?navigation=settings.rateMatrices) | [Матрицы ставок](https://timetta.com/ru/docs/settings/finances/rate-matrices) | Установите ставки себестоимости для универсальных ресурсов на основе их роли, компетенций, уровня и других характеристик. |
| 4 | [Учетные статьи](https://app.timetta.com/settings/financial-accounts) | [Учетные статьи](https://timetta.com/ru/docs/settings/finances/expenses-types) | Добавьте дополнительные статьи в справочник **Учетные статьи** для классификации затрат или выручки. Если стандартных статей достаточно, шаг можно пропустить. |
| 5 | [Юридические лица](https://app.timetta.com/settings/legal-entities) | [Юридические лица](https://timetta.com/ru/docs/settings/finances/legal-entities) | Заполните справочник **Юридические лица**. Если используется одно лицо, шаг можно пропустить. |
| 6 | [Нормализация себестоимости](https://app.timetta.com/settings/cost-normalization-rules) | [Нормализация себестоимости](https://timetta.com/ru/docs/settings/finances/cost-normalization) | Настройте правила нормализации себестоимости, если требуется пересчёт фактических часов в нормализованные для распределения затрат. В противном случае шаг можно пропустить. |

## Управление коммуникацией с клиентами

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Шаблоны электронной почты](https://app.timetta.com/settings/email-templates) | [Шаблоны электронной почты](https://timetta.com/ru/docs/settings/clients/email-templates) | Создайте шаблоны писем. Шаг можно пропустить, если не используется раздел *Взаимодействия*. |
| 2 | [Сценарии](https://app.timetta.com/settings/interaction-scenarios) | [Сценарии](https://timetta.com/ru/docs/settings/clients/interaction-scenarios) | Настройте автоматизированные цепочки коммуникаций с клиентами. Шаг можно пропустить, если раздел *Взаимодействия* не используется. |

## Управление проектами

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Типы артефактов](https://app.timetta.com/settings/project-artifact-types) | [Типы артефактов](https://timetta.com/ru/docs/settings/projects/artifact-types) | Заполните справочник **Типы артефактов**, если используется учёт артефактов. В противном случае шаг можно пропустить. |
| 2 | [Типы рисков](https://app.timetta.com/settings/project-risk-types) | [Типы рисков](https://timetta.com/ru/docs/settings/projects/risks-types) | Укажите типы рисков в справочнике **Типы рисков**. Если риски не учитываются, шаг можно пропустить. |
| 3 | [Модели проектов](https://app.timetta.com/settings/project-models?navigation=settings.projectModels) | [Модели проектов](https://timetta.com/ru/docs/settings/projects/project-models) | Заполните справочник **Модели проектов** и настройте их. Шаг можно пропустить, если модели не используются. |

## Настройка конфигурации

| № | Компонента | Справка | Комментарий |
|---|---|---|---|
| 1 | [Воркфлоу](https://app.timetta.com/settings/workflows) | [Воркфлоу](https://timetta.com/ru/docs/settings/config/workflow) | По умолчанию ключевые процессы уже настроены. При необходимости измените стандартные воркфлоу или создайте новые. |
| 2 | [Жизненные циклы](https://app.timetta.com/settings/lifecycles) | [Жизненные циклы](https://timetta.com/ru/docs/settings/config/life-cycle) | Настройте наборы состояний и правила переходов для сущностей. Редактирование не рекомендуется без глубокого понимания системы. |
| 3 | [Справочники](https://app.timetta.com/settings/directories) | [Справочники](https://timetta.com/ru/docs/settings/config/directories) | Создайте и заполните дополнительные справочники. Если стандартных справочников достаточно, шаг можно пропустить. |
| 4 | [Дополнительные поля](https://app.timetta.com/settings/custom-fields) | [Дополнительные поля](https://timetta.com/ru/docs/settings/config/custom-fields) | Настройте дополнительные поля при необходимости. Если стандартных полей достаточно, шаг можно пропустить. |
| 5 | [Задания по расписанию](https://app.timetta.com/settings/scheduled-jobs) | [Задания по расписанию](https://timetta.com/ru/docs/settings/config/scheduled-jobs) | Создайте автоматические задания. Настройка требует знания C#. Шаг можно пропустить. |
| 6 | [Роли жизненного цикла](https://app.timetta.com/settings/lifecycle-roles) | [Роли жизненного цикла](https://timetta.com/ru/docs/settings/config/custom-role) | Создайте дополнительные роли жизненного цикла. Требует знания C#. Шаг можно пропустить. |
| 7 | [Экспорт и импорт](https://app.timetta.com/settings/export-import) | Экспорт и импорт | Используйте для переноса настроек и конфигурации. Импорт рекомендуется выполнять только после консультации с технической поддержкой. Шаг можно пропустить. |
