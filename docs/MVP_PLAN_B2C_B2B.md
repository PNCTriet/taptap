# TAPTAP — Kế hoạch MVP B2C & B2B

*Cập nhật: 09/11/2026 (Asia/Saigon, UTC+7). Tài liệu để HOWL duyệt trước khi DEVIN bắt đầu build. Không có product code hay migration trong tài liệu này.*

---

## 0. Mục tiêu và ràng buộc

### Mục tiêu
1. Chứng minh **hai luồng end-to-end** trên **một repo** (`PNCTriet/taptap`):
   - **B2C:** HOWL dùng Admin CMS để tạo / quản lý stations (trạm đồ), rồi điều hướng sang trải nghiệm B2C của người chơi.
   - **B2B:** HOWL tạo tài khoản tenant, gán role-based permissions, định nghĩa subscription packages + quotas; tenant tạo rooms (phòng) và stations trong hạn mức.
2. Giữ stack hiện tại: Next.js App Router + TypeScript + Tailwind + Supabase project `TAPTAP` (`dfvkhtheqcsjfbfihzrk`) + Vercel free.
3. Sau khi MVP demo đạt acceptance criteria, **tách** thành hai hệ thống riêng (B2C và B2B), mỗi hệ có Admin site riêng.

### Ràng buộc sản phẩm / kỹ thuật
| Hạng mục | Quyết định |
|---|---|
| Chi phí | Chỉ free tier (Supabase Free, Vercel Hobby, Google Auth free). Mọi chi phí trả phí cần HOWL duyệt trước. |
| UI | Apple HIG: rõ hierarchy, touch target lớn, spacing thoáng, motion nhẹ, mobile-first. |
| Ngôn ngữ | Bilingual EN / VI, **English là mặc định**, VI là locale thứ hai. |
| Branding | Không đề cập tên studio mẹ trên sản phẩm / docs public của TAPTAP. |
| Repo hiện tại | Build trên `PNCTriet/taptap`; brief thiết kế Đông (`dongnnh2112work/tap-tap`) chỉ đọc. |
| Database | Mở rộng trên **12 bảng public hiện có** (xem mục 3). Không apply migration cho đến khi HOWL duyệt plan này. |
| Bảo mật | RLS trên mọi bảng; authorization chỉ qua `app_metadata` + bảng membership server-managed; quota enforce ở **server / database**, không tin client. |

### Vai trò tổng quan (shared)
| Actor | Mô tả ngắn |
|---|---|
| **HOWL Platform Admin** | Quản trị toàn nền tảng (B2C CMS + B2B tenant / package). |
| **B2C Visitor / Player** | Người chơi chạm NFC / quét QR, sưu tập stamp, xem passport. |
| **B2B Tenant Owner** | Chủ tài khoản doanh nghiệp / đối tác; quản lý members, rooms, stations trong quota. |
| **B2B Tenant Admin / Editor / Viewer** | Thành viên tenant với quyền giảm dần. |
| **B2B End User** (phase sau) | Người chơi trong ngữ cảnh room / station của tenant; MVP demo có thể tái dùng visitor B2C. |

---

## 1. Luồng B2C — end-to-end

### 1.1 Actors
- **HOWL Platform Admin** — tạo và vận hành nội dung B2C (venues, collections, stations, NFC tags, stamps).
- **B2C Visitor** — chơi tại hiện trường (TCV pilot hoặc demo).

### 1.2 Các bước từ đầu đến cuối

```text
[HOWL Admin]
  1. Đăng nhập Admin CMS (Google / email, role platform_admin)
  2. Tạo hoặc chọn Venue (địa điểm)
  3. Tạo Collection (chiến dịch / bộ sưu tập) gắn Venue
  4. Tạo Station (trạm đồ) trong Venue: tên, mô tả, ảnh, GPS (tuỳ chọn), status
  5. Gắn Stamp của Station vào Collection (artwork, sort_order)
  6. Cấp phát NFC Tag (public_code) hoặc QR fallback → URL /s/<public_code>
  7. Publish (status active) và kiểm tra preview
  8. Từ CMS bấm "Open B2C experience" → điều hướng sang app người chơi
        │
        ▼
[B2C Visitor]
  9. Chạm NFC / quét QR → mở /s/<public_code>
 10. Hệ thống resolve tag → station → stamp → collection → venue
 11. Auto-collect stamp (idempotent) + animation mở thẻ
 12. (Tuỳ phase) Quiz / badge mốc / Wrapped
 13. Xem Passport / Collections / Map / Profile
```

### 1.3 Screens và Admin CMS (B2C)

| Khu vực | Route hiện có / đề xuất | Mục đích |
|---|---|---|
| Admin home | `/admin` | Dashboard: số venue, station, tag active, tap gần đây |
| Venues | `/admin/venues` | CRUD venue |
| Collections | `/admin/collections` | CRUD collection theo venue |
| Stations | `/admin/stations` | CRUD station (trạm đồ) |
| Stamps | `/admin/stamps` | Gắn artwork stamp ↔ station ↔ collection |
| Rewards (legacy) | `/admin/rewards` | Giữ hoặc ẩn trong MVP demo nếu chuyển sang badge-only |
| NFC tags | `/admin/stations/[id]/tags` *(mới hoặc mở rộng)* | Cấp / disable / replace `public_code` |
| Preview CTA | Nút trên mỗi station / collection | Mở `/s/<code>`, `/collections/[slug]`, `/map` ở tab mới |
| Player home | `/` | Landing B2C |
| Station tap | `/s/[code]` | Trải nghiệm chạm NFC |
| Passport | `/passport` | Bộ sưu tập cá nhân |
| Collections | `/collections`, `/collections/[slug]` | Danh sách / chi tiết bộ |
| Map | `/map` | Bản đồ GPS stations |
| Profile / Auth | `/profile`, `/auth/callback` | Locale, Google / anonymous |

UI Admin và Player cùng tuân Apple HIG; copy mặc định EN, có toggle VI.

### 1.4 Data dùng cho B2C (bảng hiện có)
Tái dùng trực tiếp 12 bảng public:
`venues`, `venue_admins`, `collections`, `stations`, `nfc_tags`, `stamps`, `participants`, `collected_stamps`, `badges`, `participant_badges`, `rewards`, `redemptions`.

Bổ sung nhẹ (chỉ sau khi duyệt plan — **chưa migrate**):
- Cột metadata song ngữ trên `stations` / `stamps` nếu cần (`name_en`, `name_vi` hoặc `i18n jsonb`).
- Flag `channel = 'b2c'` trên `venues` / `collections` để phân biệt với dữ liệu B2B trong giai đoạn one-repo.

### 1.5 Permissions (B2C)
| Hành động | Platform Admin | Venue Admin / Editor | Visitor |
|---|---|---|---|
| CRUD mọi venue / collection / station / tag / stamp | ✅ | Chỉ venue được gán | ❌ |
| Publish / archive | ✅ | Theo role `venue_admin` | ❌ |
| Xem analytics thô (số collect) | ✅ | Venue của mình | ❌ |
| Collect stamp qua `/s/[code]` | — | — | ✅ (server validate) |
| Đọc passport / badges của mình | — | — | ✅ |
| Ghi `collected_stamps` trực tiếp từ client | ❌ | ❌ | ❌ (chỉ server / service_role) |

Nguồn quyền: `app_metadata.role = 'platform_admin'` và bảng `venue_admins` (đã có trong schema).

### 1.6 Acceptance criteria — luồng B2C (MVP demo)
1. Platform Admin tạo được venue → collection → station → stamp → NFC tag trong CMS.
2. Tag `active` mở được `/s/<code>` và collect stamp đúng 1 lần / participant.
3. Từ CMS có CTA rõ ràng điều hướng sang trải nghiệm B2C (player routes).
4. Visitor xem được passport với stamp vừa collect.
5. RLS không cho visitor tạo / sửa station.
6. UI EN mặc định, chuyển VI được; không có tên studio mẹ.

---

## 2. Luồng B2B — end-to-end

### 2.1 Actors
- **HOWL Platform Admin** — tạo tenant, gán package, quản lý billing/quota ở mức nền tảng.
- **Tenant Owner** — chủ tenant, mời members, tạo rooms & stations trong quota.
- **Tenant Admin / Editor / Viewer** — thành viên với quyền phân cấp.
- **B2B End User** — người chơi trong room (MVP có thể stub bằng visitor hiện có).

### 2.2 Các bước từ đầu đến cuối

```text
[HOWL Platform Admin — B2B Admin site / khu vực B2B]
  1. Đăng nhập với role platform_admin
  2. Định nghĩa Subscription Package (ví dụ Starter / Growth / Pro):
       - max_rooms, max_stations, max_members, max_active_nfc_tags (và hạn khác nếu cần)
  3. Tạo B2B Account (Tenant): tên, slug, status
  4. Gán Package cho Tenant (tenant_subscription: starts_at, ends_at, status)
  5. Tạo user Owner đầu tiên (email mời / Google) → membership role = owner
  6. (Tuỳ chọn) Điều chỉnh quota override tạm thời
        │
        ▼
[Tenant Owner / Admin]
  7. Đăng nhập B2B Admin (cùng app one-repo, route prefix /b2b hoặc /tenant)
  8. Mời members, gán role (owner | admin | editor | viewer)
  9. Tạo Room (phòng) — bị chặn nếu đã chạm max_rooms
 10. Trong Room, tạo Station (trạm đồ / toys …) — bị chặn nếu chạm max_stations
 11. Cấp NFC / QR cho station — bị chặn nếu chạm max_active_nfc_tags
 12. Publish room / station; xem usage vs quota trên dashboard
        │
        ▼
[B2B End User — demo]
 13. Mở link room hoặc chạm tag → trải nghiệm collect tương tự B2C
 14. Dữ liệu collect gắn tenant_id / room_id để tách analytics
```

### 2.3 Screens và Admin (B2B)

**A. HOWL — B2B Platform Admin**
| Screen | Route đề xuất (one-repo) | Mục đích |
|---|---|---|
| Packages | `/admin/b2b/packages` | CRUD subscription packages + quota fields |
| Tenants | `/admin/b2b/tenants` | Tạo / suspend tenant, gán package |
| Tenant detail | `/admin/b2b/tenants/[id]` | Members, usage, override quota, audit |
| Usage overview | `/admin/b2b/usage` | Tổng hợp rooms / stations / taps theo tenant |

**B. Tenant — B2B Admin site**
| Screen | Route đề xuất | Mục đích |
|---|---|---|
| Tenant home | `/b2b` hoặc `/tenant` | Usage vs quota, shortcuts |
| Members | `/b2b/members` | Invite / change role / revoke |
| Rooms | `/b2b/rooms` | CRUD rooms trong quota |
| Room detail | `/b2b/rooms/[id]` | Stations trong room |
| Stations | `/b2b/stations` | CRUD stations (toys / trạm đồ) |
| Tags | `/b2b/stations/[id]/tags` | NFC / QR |
| Billing (read-only MVP) | `/b2b/plan` | Package hiện tại + hạn mức |

Trong giai đoạn one-repo: B2C Admin (`/admin/...`) và B2B Admin (`/admin/b2b/...` + `/b2b/...`) **cùng app**, tách bằng route + permission. Sau split, mỗi bên một Admin site riêng (mục 5).

### 2.4 Data cho B2B (sketch — chưa migrate)

**Giữ nguyên 12 bảng hiện có.** Thêm entity mới (đề xuất):

| Bảng mới | Vai trò |
|---|---|
| `tenants` | Tài khoản B2B: `id`, `name`, `slug`, `status` (`pending` \| `active` \| `suspended`), timestamps |
| `tenant_members` | `tenant_id`, `user_id`, `role` (`owner` \| `admin` \| `editor` \| `viewer`), UNIQUE(tenant_id, user_id) |
| `subscription_packages` | `code`, `name`, `max_rooms`, `max_stations`, `max_members`, `max_active_nfc_tags`, `status` |
| `tenant_subscriptions` | `tenant_id`, `package_id`, `status`, `starts_at`, `ends_at`, optional `quota_overrides jsonb` |
| `rooms` | `tenant_id`, `name`, `slug`, `description`, `status`, UNIQUE(tenant_id, slug) |

**Gắn vào bảng hiện có (cột nullable để không phá B2C):**
- `stations.tenant_id` (nullable), `stations.room_id` (nullable) — station B2C thì cả hai NULL, thuộc `venue_id` như cũ.
- `nfc_tags` giữ FK `station_id`; quota đếm tag `active` theo tenant qua station.
- `collections` / `stamps` / collect ledger: thêm `tenant_id` nullable nếu cần tách analytics; MVP demo có thể tái dùng collect path hiện tại trong phạm vi room.

**Enforce quota (bắt buộc server / DB):**
1. RPC hoặc trigger `BEFORE INSERT` trên `rooms` / `stations` / `tenant_members` / `nfc_tags` so sánh `count(*)` với package (+ override).
2. API Admin (`src/server/*`) gọi cùng rule; client chỉ hiển thị lỗi thân thiện.
3. Không bao giờ tin số `remaining` từ client.

### 2.5 Permissions (B2B)

| Hành động | Platform Admin | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|---|
| CRUD packages / tạo tenant / gán subscription | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suspend tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mời / đổi role members | ✅ (support) | ✅ | ✅ (không phong owner) | ❌ | ❌ |
| CRUD rooms / stations / tags trong quota | ✅ | ✅ | ✅ | ✅ (stations/tags; rooms tuỳ quyết định HOWL) | ❌ |
| Xem usage / plan | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xoá tenant / chuyển owner | ✅ | ✅ (chuyển owner) | ❌ | ❌ | ❌ |

RLS đề xuất: mọi query tenant-scoped kiểm tra `tenant_members.user_id = auth.uid()` + role; platform admin qua `app_metadata`.

### 2.6 Acceptance criteria — luồng B2B (MVP demo)
1. Platform Admin tạo được package với quota số học rõ ràng.
2. Platform Admin tạo tenant, gán package, mời owner thành công.
3. Owner tạo room và station trong hạn mức; request vượt quota bị **server/DB từ chối** (HTTP 4xx + message).
4. Editor không mời được member; Viewer chỉ đọc.
5. Station / tag của tenant không lộ sang B2C public listing trừ khi HOWL chọn share (mặc định tách).
6. Dashboard tenant hiện đúng `used / max` cho rooms, stations, members, tags.

---

## 3. Data model tổng — gắn trên 12 bảng hiện có

### 3.1 Hiện trạng (đã có trên `dfvkhtheqcsjfbfihzrk`)
1. `venues`  
2. `venue_admins`  
3. `collections`  
4. `stations`  
5. `nfc_tags`  
6. `stamps`  
7. `participants`  
8. `collected_stamps`  
9. `badges`  
10. `participant_badges`  
11. `rewards`  
12. `redemptions`  

Tất cả đã bật RLS. Seed pilot cũ: Saigon Zoo / Zoo Explorer (4 stations).

### 3.2 Sơ đồ mục tiêu (one-repo)

```text
                    ┌──────────────────────────┐
                    │ subscription_packages    │
                    └────────────▲─────────────┘
                                 │
tenants (1) ──< tenant_subscriptions
   │
   ├──< tenant_members >── auth.users
   │
   └──< rooms (1) ──< stations (N) ──< nfc_tags
                         │
venues (1) ──< stations (N)   ← B2C path hiện có (tenant_id/room_id NULL)
   │
   └──< collections ──< stamps ──< collected_stamps >── participants
                         └──< badges / rewards / redemptions
```

Nguyên tắc: **B2C không bị phá**; cột B2B thêm dạng nullable / bảng mới. Migration chỉ chạy sau khi HOWL duyệt plan và DEVIN được giao build.

---

## 4. Phases

### Phase 0 — Plan & freeze (đang làm)
- Viết và duyệt tài liệu này (`docs/MVP_PLAN_B2C_B2B.md`).
- **Không** viết product code, **không** apply migration.
- DEVIN build **on hold** đến khi HOWL approve.

**Done when:** HOWL trả lời các open questions (mục 6) và duyệt scope Phase 1.

### Phase 1 — One-repo MVP demo (cả hai luồng end-to-end)
**Scope**
- Một app Next.js trên `PNCTriet/taptap`.
- B2C Admin CMS hoàn thiện CRUD station + NFC + CTA sang player experience (mục 1).
- B2B: packages, tenants, members, rooms, stations, quota enforce (mục 2).
- Auth Google / anonymous giữ nguyên; thêm membership B2B.
- UI Apple HIG, EN mặc định + VI.
- Free tier only; seed dữ liệu demo (1 venue B2C + 1–2 tenants B2B).
- Test: Vitest unit cho quota rules + Playwright happy path B2C collect và B2B create-within-quota / reject-over-quota.

**Out of scope Phase 1**
- Thanh toán thật / Stripe.
- Tách repo / tách Supabase project.
- Quiz / Wrapped / art pipeline đầy đủ (có thể stub).
- App native.

**Done when:** Checklist acceptance 1.6 và 2.6 đều xanh trên preview Vercel; HOWL walkthrough được cả hai luồng.

### Phase 2 — Harden & productize trên one-repo
- Audit RLS advisors; sửa lỗ hổng.
- i18n hoàn chỉnh; empty / error states theo HIG.
- Observability nhẹ (Vercel Analytics free, Supabase logs).
- Quyết định giữ / ẩn module rewards vs badge 5/10/15.
- Chuẩn bị biên giới module code rõ (`features/b2c`, `features/b2b`, `server/quota`) để split dễ.

**Done when:** Không có advisor security critical; hai luồng ổn định 1 tuần demo nội bộ.

### Phase 3 — Split thành hai hệ thống
Xem mục 5. Chỉ bắt đầu khi HOWL chốt trigger split.

---

## 5. Split plan — khi nào, tách gì, rủi ro

### 5.1 Khi nào tách
Tách khi **một** trong các điều kiện sau đúng (HOWL chọn):
1. Có khách B2B trả phí / cần isolated data & uptime riêng, hoặc
2. Team / release cadence B2C và B2B lệch nhau rõ, hoặc
3. One-repo vượt giới hạn free tier / độ phức tạp RLS không còn manage được an toàn.

Không tách chỉ vì “cho có”. MVP demo cố ý one-repo để học flow thật.

### 5.2 Tách code
| Sau split | Repo / app | Admin site | Player |
|---|---|---|---|
| **TAPTAP B2C** | Giữ `PNCTriet/taptap` hoặc rename rõ B2C | Admin CMS B2C (`/admin`) | `/`, `/s/[code]`, passport, map |
| **TAPTAP B2B** | Repo mới (ví dụ `PNCTriet/taptap-b2b`) | Admin HOWL B2B + Tenant Admin | Experience theo room (có thể embed / subdomain) |

Cách làm:
1. Module boundary Phase 2 đã tách `features/b2c` vs `features/b2b`.
2. Copy lịch sử git cần thiết sang repo B2B (hoặc extract subtree).
3. Shared types / quota math → package nội bộ mỏng **hoặc** duplicate có chủ đích (ưu tiên đơn giản trên free tier).
4. Hai project Vercel riêng; env tách; không share `SERVICE_ROLE` key.

### 5.3 Tách database
Hai hướng (HOWL chọn trong open questions):

**A. Two Supabase projects (khuyến nghị khi có khách thật)**  
- Project B2C: giữ `dfvkhtheqcsjfbfihzrk` (hoặc clone).  
- Project B2B: project mới, chỉ schema tenant/rooms + stations/tags/collect scoped.  
- Migrate dữ liệu tenant bằng script one-shot; cắt `tenant_id` khỏi B2C.

**B. One project, two schemas** (`b2c`, `b2b`)  
- Rẻ hơn trên free tier, nhưng blast radius chung; phù hợp nếu chưa có khách trả phí.

Quota, RLS, backups phải review lại sau mỗi hướng.

### 5.4 Rủi ro khi split
| Rủi ro | Giảm thiểu |
|---|---|
| Dual-write / dữ liệu lệch trong thời gian chuyển | Feature flag `SPLIT_MODE`; cutover cửa sổ ngắn; read-only tạm trên một phía |
| Auth user trùng hai project | Supabase Auth không share sẵn → dùng cùng Google client + mapping bảng `identity_links`, hoặc chấp nhận mời lại members B2B |
| Vượt free tier (2 project, 2 Vercel) | Theo dõi limits; xin HOWL duyệt upgrade chỉ khi cần |
| Regress B2C pilot khi đụng schema chung | Test Playwright B2C chạy bắt buộc trước merge split PR |
| Nhầm branding / env | Checklist launch; không dùng tên studio mẹ; review env trên Vercel |

### 5.5 Acceptance criteria — Phase 3
1. B2C Admin site và B2B Admin site deploy URL riêng, auth/permission đúng.
2. Không còn dependency runtime bắt buộc giữa hai repo.
3. Backup / restore thử thành công từng phía.
4. HOWL sign-off sau demo tách.

---

## 6. Open questions — cần HOWL quyết

1. **Trigger split:** Chọn điều kiện nào ở mục 5.1 là đủ để tách (hay chốt ngày / milestone cụ thể)?
2. **Database split:** Ưu tiên Two Supabase projects (A) hay one project / two schemas (B) cho Phase 3?
3. **B2B End User experience:** MVP có cần player flow riêng trong room, hay tạm deep-link tái dùng `/s/[code]` là đủ?
4. **Package catalogue v1:** Ba mức Starter / Growth / Pro với số quota bao nhiêu cho `max_rooms`, `max_stations`, `max_members`, `max_active_nfc_tags`?
5. **Rewards vs badges:** Giữ module rewards hiện có cho B2C pilot, chuyển hết sang badge 5/10/15, hay ẩn tới sau launch?
6. **Editor được tạo Room không**, hay chỉ Owner/Admin tạo Room còn Editor chỉ sửa Station/Tag?
7. **Đặt trạm vật lý TCV:** Phương án pháp lý / quan hệ với Thảo Cầm Viên đã chốt chưa (ảnh hưởng seed B2C thật vs demo-only)?
8. **Tên thương mại B2B** (tenant-facing product name) — khác hay trùng “TAPTAP”? (Nhắc: không dùng tên studio mẹ trên product.)

---

## 7. Việc không làm cho đến khi duyệt

- DEVIN **không** bắt đầu build product code cho B2C Admin mở rộng hay B2B multi-tenant.
- **Không** `apply_migration` / không đổi schema trên `dfvkhtheqcsjfbfihzrk`.
- **Không** tạo repo mới, không đổi visibility, không chi trả phí ngoài free tier.

Sau khi HOWL duyệt tài liệu này (và trả lời open questions cần thiết cho Phase 1), Ivan giao DEVIN build theo Phase 1 trên nhánh feature; **mọi merge vào `main` vẫn cần HOWL approve tường minh**.

---

## 8. Tham chiếu

- `docs/PROJECT_CONTEXT.md` — ngữ cảnh tổng, hai repo, timeline.
- `docs/data-model.md` — chi tiết 12 bảng hiện có.
- `docs/architecture.md` — NFC / station resolution.
- `docs/security-and-rls.md` — roles và RLS matrix hiện tại.
- Live pilot: https://taptap-five.vercel.app  
- Repo: https://github.com/PNCTriet/taptap  
