# MVP Product & API Specification

Статус: draft v1  
Продукт: мобільний планувальник прибирання  
Платформи: iOS та Android  
Клієнт: Expo + React Native + TypeScript  
Backend: Node.js + NestJS + Fastify  
Дані та auth: Supabase Auth + PostgreSQL  

## 1. Мета MVP

Застосунок допомагає людині або спільному домогосподарству:

- налаштувати кімнати та регулярні домашні справи;
- бачити, що потребує уваги сьогодні;
- сформувати реалістичний план на 10, 30 або 60 хвилин;
- виконувати, пропускати та відкладати справи без накопичення штучних дедлайнів;
- розподіляти справи між членами домогосподарства;
- запланувати блок прибирання в Apple або Google Calendar;
- отримувати локальні й серверні push-сповіщення.

Головна продуктова одиниця — не календарна подія, а `Task`. Календар містить один часовий блок для плану, а конкретні справи залишаються в застосунку.

## 2. Що не входить до MVP

- AI-чат і аналіз кімнати через камеру;
- Outlook Calendar;
- серверна синхронізація з Google Calendar API;
- smart-home та роботи-пилососи;
- інвентар побутової хімії;
- складна гейміфікація;
- рейтинги членів сім’ї;
- web-застосунок;
- оплата та підписки;
- повноцінний offline-first sync між кількома пристроями.

## 3. Ролі та доступ

### Owner

- редагує і видаляє домогосподарство;
- запрошує та видаляє учасників;
- змінює ролі;
- створює, редагує й архівує кімнати та справи;
- бачить історію домогосподарства.

### Member

- бачить домогосподарство, кімнати й активні справи;
- створює й редагує звичайні справи;
- формує власний денний план;
- виконує, пропускає та відкладає справи;
- може залишити домогосподарство.

У першій версії немає ролей для дітей або read-only guests.

## 4. Екрани MVP

### 4.1 Auth

- Sign in with Apple;
- Sign in with Google;
- прийняття Privacy Policy та Terms;
- обробка deep link із запрошенням.

Авторизація відбувається напряму через Supabase Auth. Власних API endpoint-ів `/login`, `/register` і `/refresh` немає.

### 4.2 Onboarding

1. Ім’я та timezone.
2. Створення першого домогосподарства.
3. Вибір кімнат із шаблонів.
4. Вибір рекомендованих справ.
5. Дозвіл на push-сповіщення.
6. Необов’язкове підключення календаря.

### 4.3 Today

- справи, що потребують уваги;
- поточний денний план;
- бюджет часу 10/30/60 хвилин;
- рівень енергії low/normal/high;
- кнопка генерації або оновлення плану;
- виконання, пропуск і відкладення;
- запланований календарний блок.

### 4.4 Home

- список кімнат;
- кількість актуальних справ у кожній кімнаті;
- учасники домогосподарства;
- створення та редагування кімнати;
- перехід до списку справ кімнати.

### 4.5 Room

- активні й архівовані справи;
- статус `not_due`, `upcoming`, `due` або `overdue`;
- дата останнього виконання;
- наступна рекомендована дата;
- додавання справи з шаблону або вручну.

### 4.6 Task details

- назва й опис;
- тривалість і складність;
- правило повторення;
- відповідальний або ротація;
- історія виконань;
- редагування й архівування.

### 4.7 Calendar

- план на вибраний день;
- рекомендовані вільні вікна, розраховані локально;
- створення, зміна й видалення календарного блоку;
- статус календарного дозволу.

### 4.8 Household members

- список учасників;
- створення invitation link;
- pending invitations;
- зміна ролі;
- видалення учасника або вихід із домогосподарства.

### 4.9 Profile & Settings

- ім’я, аватар, мова, timezone;
- notification preferences;
- calendar permissions;
- прив’язані Google/Apple identities;
- вихід і видалення акаунта.

## 5. Межі системи

### Mobile відповідає за

- Supabase OAuth UI;
- нативні календарні permissions;
- читання busy intervals із системного календаря;
- створення й оновлення календарних подій;
- локальні нагадування;
- кеш API;
- UI та optimistic updates.

### NestJS API відповідає за

- авторизацію кожного запиту;
- перевірку membership і ролей;
- бізнес-логіку домогосподарств, кімнат і справ;
- розрахунок due status;
- генерацію денного плану;
- immutable history виконань;
- invitations;
- реєстрацію пристроїв і remote push events.

### Worker відповідає за

- push delivery та retry;
- перевірку push receipts;
- очищення прострочених invitations;
- майбутні scheduled jobs;
- денормалізацію `nextDueOn`, якщо вона знадобиться для продуктивності.

## 6. Модель даних

Усі primary key — UUID. Усі timestamps зберігаються в UTC. Локальна дата плану зберігається окремо як `date`, а timezone — як IANA string, наприклад `Europe/Madrid`.

### profiles

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid | Дорівнює `auth.users.id` |
| display_name | text | Обов’язкове після onboarding |
| avatar_url | text nullable | Аватар провайдера або власний |
| locale | text | Наприклад `uk-UA` |
| timezone | text | IANA timezone |
| onboarding_completed_at | timestamptz nullable | Статус onboarding |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

### households

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| name | text | Наприклад `Наш дім` |
| timezone | text | Default timezone планів |
| created_by | uuid | Owner |
| version | integer | Optimistic concurrency |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |
| deleted_at | timestamptz nullable | Soft delete |

### household_members

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| household_id | uuid | FK households |
| user_id | uuid | FK profiles |
| role | enum | `owner`, `member` |
| joined_at | timestamptz |  |

Unique constraint: `(household_id, user_id)`.

### household_invitations

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| household_id | uuid |  |
| invited_by | uuid |  |
| token_hash | text | Raw token не зберігається |
| role | enum | У MVP тільки `member` |
| expires_at | timestamptz |  |
| accepted_at | timestamptz nullable |  |
| revoked_at | timestamptz nullable |  |

### rooms

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| household_id | uuid |  |
| name | text |  |
| type | enum | `kitchen`, `bathroom`, `bedroom`, `living_room`, `hallway`, `office`, `other` |
| position | integer | Порядок у списку |
| archived_at | timestamptz nullable |  |
| version | integer |  |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

### task_templates

Глобальний каталог локалізованих шаблонів.

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| room_type | enum | Тип кімнати |
| locale | text |  |
| title | text |  |
| estimated_minutes | integer |  |
| effort | enum | `low`, `normal`, `high` |
| recurrence | jsonb | Typed recurrence object |

### tasks

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| household_id | uuid | Денормалізовано для authorization queries |
| room_id | uuid |  |
| template_id | uuid nullable |  |
| title | text |  |
| notes | text nullable |  |
| estimated_minutes | integer | 1–480 |
| effort | enum | `low`, `normal`, `high` |
| priority | enum | `low`, `normal`, `high` |
| recurrence | jsonb | Discriminated union |
| assignment_mode | enum | `unassigned`, `fixed`, `rotation` |
| fixed_assignee_id | uuid nullable |  |
| rotation_member_ids | uuid[] | Порядок ротації |
| rotation_index | integer | Поточна позиція |
| last_completed_at | timestamptz nullable | Кешоване поле |
| next_due_on | date nullable | Календарна дата у timezone домогосподарства |
| archived_at | timestamptz nullable |  |
| version | integer |  |
| created_by | uuid |  |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

Recurrence object:

```json
{ "type": "interval", "every": 7, "unit": "day" }
```

```json
{ "type": "weekly", "daysOfWeek": [1, 4] }
```

```json
{ "type": "monthly", "dayOfMonth": 1 }
```

```json
{ "type": "manual" }
```

### task_completions

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| task_id | uuid |  |
| household_id | uuid |  |
| completed_by | uuid |  |
| completed_at | timestamptz | Може бути backdated у дозволеному діапазоні |
| actual_minutes | integer nullable |  |
| note | text nullable |  |
| idempotency_key | text | Захист від повторного tap/retry |
| undone_at | timestamptz nullable | History не видаляється фізично |
| undone_by | uuid nullable |  |
| created_at | timestamptz |  |

### daily_plans

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| household_id | uuid |  |
| user_id | uuid | Власник персонального плану |
| local_date | date | День у timezone користувача |
| timezone | text |  |
| time_budget_minutes | integer | 5–240 |
| energy_level | enum | `low`, `normal`, `high` |
| status | enum | `draft`, `active`, `completed`, `cancelled` |
| scheduled_start_at | timestamptz nullable | Calendar block |
| scheduled_end_at | timestamptz nullable |  |
| version | integer |  |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

Unique active-plan constraint: один нескасований план на `(household_id, user_id, local_date)`.

### daily_plan_items

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid |  |
| plan_id | uuid |  |
| task_id | uuid |  |
| assigned_to | uuid nullable | Snapshot призначення |
| estimated_minutes | integer | Snapshot тривалості |
| selection_reason | enum | `overdue`, `due`, `priority`, `manual` |
| position | integer |  |
| status | enum | `planned`, `completed`, `skipped`, `deferred` |
| completion_id | uuid nullable |  |

### devices

| Поле | Тип | Коментар |
|---|---|---|
| id | uuid | Server-generated installation ID |
| user_id | uuid |  |
| platform | enum | `ios`, `android` |
| expo_push_token | text nullable |  |
| locale | text |  |
| timezone | text |  |
| app_version | text |  |
| last_seen_at | timestamptz |  |
| notifications_enabled | boolean |  |

### notification_preferences

| Поле | Тип | Коментар |
|---|---|---|
| user_id | uuid | PK |
| daily_plan_enabled | boolean |  |
| assignment_enabled | boolean |  |
| invitation_enabled | boolean |  |
| quiet_hours_start | time nullable | Локальний час |
| quiet_hours_end | time nullable | Локальний час |

## 7. Доменні правила

1. Кожне домогосподарство завжди має хоча б одного owner.
2. Останній owner не може вийти або понизити власну роль без передачі ownership.
3. Архівована кімната не може отримувати нові активні справи.
4. Архівована справа не додається до нових планів.
5. `task_completions` не видаляються; undo позначає запис як скасований.
6. Одне натискання «Виконано» створює максимум один completion завдяки `Idempotency-Key`.
7. `lastCompletedAt` і `nextDueOn` перераховуються в одній DB transaction із completion/undo.
8. План не може містити однаковий task більше одного разу.
9. Завдання іншого учасника не включаються до персонального плану без явного `includeAssignedToOthers=true`.
10. API ніколи не довіряє `userId`, переданому клієнтом для поточного користувача; identity береться з JWT `sub`.

### Recurrence semantics

- `interval` означає календарні дні або тижні у timezone домогосподарства, а не фіксовані відрізки по 24 години;
- після completion новий interval рахується від фактичної локальної дати виконання;
- для `weekly` береться найближчий наступний дозволений weekday;
- для `monthly` день 29–31 у коротшому місяці переноситься на останній день цього місяця;
- `manual` не має автоматичного `nextDueOn`, але таку справу можна вручну додати до плану;
- rotation переходить до наступного учасника тільки після completion, а не після skip/defer;
- `due` означає, що `nextDueOn` дорівнює поточній локальній даті;
- `overdue` починається з наступної локальної дати після `nextDueOn`;
- `upcoming` починається за `min(7, max(1, round(intervalDays × 0.15)))` днів до due date;
- інші активні справи мають статус `not_due`.

## 8. Алгоритм планування v1

AI не використовується. Для кожної доступної справи API рахує score:

```text
score = dueUrgency
      + overdueWeight
      + priorityWeight
      + assignmentWeight
      + energyFit
      + durationFit
```

Правила:

- overdue вище за due, due вище за upcoming;
- fixed assignment іншому учаснику виключається за замовчуванням;
- low energy уникає high-effort справ, якщо є альтернатива;
- алгоритм намагається максимально заповнити time budget, але не перевищувати його більш ніж на 10%;
- при однаковому score перевага старішому `lastCompletedAt`;
- ручно доданий plan item ніколи не видаляється автоматично під час regeneration.

Алгоритм повертає `selectionReason`, щоб UI міг пояснити вибір.

## 9. API conventions

### Base URL

```text
/v1
```

### Authentication

```http
Authorization: Bearer <supabase-jwt>
```

NestJS перевіряє підпис JWT через Supabase JWKS, issuer, audience, expiration і `sub`.

### Content type

```http
Content-Type: application/json
```

### Dates

- timestamps: RFC 3339 у UTC;
- local date: `YYYY-MM-DD`;
- timezone: IANA identifier.

### Pagination

Cursor pagination:

```json
{
  "items": [],
  "nextCursor": null
}
```

### Idempotency

Для completion, invitation acceptance і потенційно інших retry-safe команд:

```http
Idempotency-Key: <uuid>
```

### Optimistic concurrency

Editable resources мають integer `version`. `PATCH` передає очікувану версію. Якщо вона застаріла, API повертає `409 RESOURCE_VERSION_CONFLICT` з актуальним resource.

### Error format

Використовуємо Problem Details-подібний формат:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "One or more fields are invalid",
  "traceId": "01J...",
  "errors": [
    { "field": "estimatedMinutes", "message": "Must be between 1 and 480" }
  ]
}
```

### Основні status codes

- `200` — успішне читання або update;
- `201` — resource створено;
- `204` — успішна команда без body;
- `400` — некоректний формат запиту;
- `401` — відсутній або невалідний JWT;
- `403` — немає доступу або потрібна роль owner;
- `404` — resource не існує або прихований authorization boundary;
- `409` — version conflict або domain conflict;
- `410` — invitation expired/revoked;
- `422` — validation error;
- `429` — rate limit.

## 10. Endpoint catalog

Повний машинозчитуваний контракт знаходиться у `openapi.yaml`.

### Profile

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/me` | Поточний профіль і onboarding status |
| PATCH | `/v1/me` | Ім’я, locale, timezone |
| DELETE | `/v1/me` | Запуск видалення акаунта |
| GET | `/v1/me/notification-preferences` | Налаштування повідомлень |
| PATCH | `/v1/me/notification-preferences` | Оновити налаштування |

### Devices

| Method | Path | Опис |
|---|---|---|
| POST | `/v1/devices` | Upsert installation і push token |
| DELETE | `/v1/devices/{deviceId}` | Видалити device registration |

### Templates

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/task-templates` | Локалізовані шаблони за room type |

### Households

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/households` | Домогосподарства користувача |
| POST | `/v1/households` | Створити домогосподарство |
| GET | `/v1/households/{householdId}` | Деталі й summary |
| PATCH | `/v1/households/{householdId}` | Оновити, owner only |
| DELETE | `/v1/households/{householdId}` | Soft delete, owner only |

### Members and invitations

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/households/{householdId}/members` | Учасники |
| PATCH | `/v1/households/{householdId}/members/{memberId}` | Змінити роль |
| DELETE | `/v1/households/{householdId}/members/{memberId}` | Видалити або залишити дім |
| GET | `/v1/households/{householdId}/invitations` | Pending invitations |
| POST | `/v1/households/{householdId}/invitations` | Створити invitation link |
| DELETE | `/v1/households/{householdId}/invitations/{invitationId}` | Відкликати |
| GET | `/v1/invitations/{token}` | Безпечний preview invitation |
| POST | `/v1/invitations/{token}/accept` | Прийняти invitation |

### Rooms

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/households/{householdId}/rooms` | Кімнати з summary |
| POST | `/v1/households/{householdId}/rooms` | Створити кімнату |
| GET | `/v1/rooms/{roomId}` | Деталі кімнати |
| PATCH | `/v1/rooms/{roomId}` | Редагувати/reorder/archive |
| DELETE | `/v1/rooms/{roomId}` | Остаточно видалити кімнату та пов’язані задачі |

### Tasks

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/rooms/{roomId}/tasks` | Справи кімнати |
| POST | `/v1/rooms/{roomId}/tasks` | Створити вручну або з templateId |
| GET | `/v1/tasks/{taskId}` | Деталі та коротка історія |
| PATCH | `/v1/tasks/{taskId}` | Оновити справу |
| DELETE | `/v1/tasks/{taskId}` | Архівувати справу |
| GET | `/v1/tasks/{taskId}/completions` | Cursor-paginated history |
| POST | `/v1/tasks/{taskId}/complete` | Виконати справу |
| POST | `/v1/task-completions/{completionId}/undo` | Скасувати completion |
| GET | `/v1/households/{householdId}/due-tasks` | Due/upcoming/overdue tasks |

### Plans

| Method | Path | Опис |
|---|---|---|
| GET | `/v1/households/{householdId}/daily-plans/{localDate}` | План поточного користувача на локальну дату |
| POST | `/v1/households/{householdId}/plans/generate` | Створити або regenerate план |
| GET | `/v1/plans/{planId}` | План із items |
| PATCH | `/v1/plans/{planId}` | Status, budget, energy, calendar block |
| POST | `/v1/plans/{planId}/items` | Додати task вручну |
| PATCH | `/v1/plans/{planId}/items/{itemId}` | Skip/defer/reorder |
| DELETE | `/v1/plans/{planId}/items/{itemId}` | Прибрати item із плану |

## 11. Ключові сценарії

### Створення першого дому

1. Mobile виконує Supabase OAuth.
2. `GET /v1/me` створює profile on first access або повертає incomplete profile.
3. `PATCH /v1/me` зберігає ім’я, locale і timezone.
4. `POST /v1/households` створює дім і owner membership у transaction.
5. `GET /v1/task-templates` завантажує рекомендовані справи.
6. Mobile створює кімнати й вибрані tasks.

### Виконання справи

1. Mobile генерує UUID як `Idempotency-Key`.
2. `POST /v1/tasks/{taskId}/complete`.
3. API у transaction створює completion, оновлює task due state, rotation і plan item.
4. API повертає completion та оновлений task summary.
5. Повторний запит із тим самим key повертає той самий результат.

### Генерація плану

1. Mobile надсилає date, timezone, budget і energy level.
2. API завантажує доступні tasks у межах membership.
3. Алгоритм оцінює tasks і збирає plan items.
4. API upsert-ить план на цей день.
5. Mobile локально читає календар і пропонує вільний слот.
6. Після підтвердження mobile створює системну календарну подію.
7. `PATCH /v1/plans/{planId}` зберігає `scheduledStartAt` і `scheduledEndAt`.

### Invitation

1. Owner викликає `POST /households/{id}/invitations`.
2. API повертає raw token один раз і deep link.
3. У базі зберігається тільки hash token.
4. Запрошений відкриває preview, входить і викликає accept.
5. Accept атомарно створює membership і закриває invitation.

## 12. Calendar integration

У MVP календар не є серверною інтеграцією:

- Apple Calendar і Google Calendar читаються через `expo-calendar` на пристрої;
- mobile не надсилає backend назви особистих подій;
- external calendar event ID зберігається локально на пристрої;
- backend зберігає тільки час запланованого plan block;
- якщо користувач змінює plan time в застосунку, mobile оновлює системну подію;
- якщо подію змінено поза застосунком, mobile звіряє її під час наступного відкриття.

Google Calendar API можна додати пізніше як окремий `calendar_connections` bounded context.

## 13. Push notifications

### Local notifications

- нагадування про calendar block;
- персональне нагадування про денний план;
- створюються й скасовуються mobile-клієнтом.

### Remote notifications

- invitation accepted;
- нове призначення;
- зміна спільної справи;
- важливі household updates.

Backend зберігає Expo push token у `devices`. Worker перевіряє receipts і деактивує `DeviceNotRegistered` tokens.

## 14. Security і privacy

- mobile не має прямого доступу до domain tables;
- service-role Supabase key існує тільки на backend;
- усі household queries мають membership predicate;
- invitation raw tokens не логуються й не зберігаються;
- notes і names очищаються від control characters;
- rate limits застосовуються до invitations, completion та plan generation;
- Sentry не отримує JWT, push token, invitation token або calendar content;
- audit log для membership/ownership змін додається до production release;
- account deletion запускає background job із grace period і видаляє/анонімізує персональні дані.

## 15. Observability

Кожен API response має `x-request-id`. Structured logs містять:

- request ID;
- route template;
- status code;
- latency;
- internal user ID після authentication;
- household ID, якщо застосовно;
- error code без sensitive payload.

Мінімальні product events:

- `onboarding_completed`;
- `household_created`;
- `room_created`;
- `task_created`;
- `plan_generated`;
- `task_completed`;
- `calendar_block_created`;
- `invitation_sent`;
- `invitation_accepted`.

## 16. Порядок реалізації

1. Monorepo, CI, environment validation.
2. Supabase Auth і `GET/PATCH /me`.
3. Households та memberships.
4. Rooms і task templates.
5. Tasks, recurrence і completion history.
6. Due calculation та Today screen.
7. Plan generation.
8. Device calendar integration.
9. Devices, Expo push і invitations.
10. Observability, rate limits, account deletion.

## 17. Definition of done для API MVP

- OpenAPI contract проходить validation;
- усі mutating endpoints перевіряють membership/role;
- migrations відтворюються на чистій PostgreSQL;
- critical commands мають idempotency tests;
- recurrence tests покривають DST і timezone changes;
- plan generation є детермінованим для однакового input;
- calendar content не потрапляє в backend logs або database;
- API integration tests покривають owner/member boundaries;
- generated TypeScript client використовується mobile-застосунком.
