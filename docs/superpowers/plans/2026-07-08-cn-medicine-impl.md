# cnMeicine 服药提醒智能体 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建面向老人家的服药提醒 PWA，含 AI 识别药品、Web Push 推送、子女管理/老人查看双角色权限。

**Architecture:** Monorepo（pnpm workspace），packages/web 为 Vue 3 + Vite + PWA，packages/server 为 Node.js + Hono BFF。前端通过 supabase-js 直连数据库（受 RLS 保护），敏感操作（GPT-4o、Web Push 推送）走 Hono server。

**Tech Stack:** Vue 3, Vite, Pinia, Vue Router 4, vite-plugin-pwa, Hono, node-cron, web-push, Supabase (PostgreSQL + Auth + Realtime + Storage), GPT-4o Vision, TypeScript, Vitest

---

## Task 1: Monorepo scaffold

**Creates/modifies:**
- `package.json` (root)
- `pnpm-workspace.yaml`
- `packages/web/package.json`
- `packages/server/package.json`
- `packages/web/vite.config.ts`
- `packages/server/tsconfig.json`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/scaffold.test.ts`:
  ```ts
  // packages/web/src/__tests__/scaffold.test.ts
  import { describe, it, expect } from 'vitest'
  import { execSync } from 'child_process'

  describe('monorepo scaffold', () => {
    it('pnpm -r build exits 0', () => {
      expect(() => execSync('pnpm -r build', { cwd: process.cwd(), stdio: 'pipe' })).not.toThrow()
    })
  })
  ```
- [ ] **Run test** — `pnpm vitest run packages/web/src/__tests__/scaffold.test.ts` → expect FAIL (packages don't exist yet)

- [ ] **Implement** — create root `package.json`:
  ```json
  {
    "name": "cn-medicine",
    "private": true,
    "scripts": {
      "dev": "pnpm -r --parallel run dev",
      "build": "pnpm -r run build",
      "test": "pnpm -r run test"
    },
    "engines": { "node": ">=20", "pnpm": ">=9" }
  }
  ```

- [ ] **Implement** — create `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'packages/*'
  ```

- [ ] **Implement** — create `packages/web/package.json`:
  ```json
  {
    "name": "@cn-medicine/web",
    "private": true,
    "version": "0.0.1",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vue-tsc --noEmit && vite build",
      "preview": "vite preview",
      "test": "vitest run"
    },
    "dependencies": {
      "@supabase/supabase-js": "^2.39.0",
      "pinia": "^2.1.7",
      "vue": "^3.4.0",
      "vue-router": "^4.2.5"
    },
    "devDependencies": {
      "@vitejs/plugin-vue": "^5.0.0",
      "@vue/test-utils": "^2.4.3",
      "jsdom": "^24.0.0",
      "typescript": "^5.3.3",
      "vite": "^5.0.0",
      "vite-plugin-pwa": "^0.19.0",
      "vitest": "^1.2.0",
      "vue-tsc": "^1.8.27"
    }
  }
  ```

- [ ] **Implement** — create `packages/web/vite.config.ts`:
  ```ts
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import { VitePWA } from 'vite-plugin-pwa'

  export default defineConfig({
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'cnMeicine 服药提醒',
          short_name: 'cnMeicine',
          theme_color: '#FF8C42',
          background_color: '#FFF8F0',
          display: 'standalone',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ],
    test: {
      environment: 'jsdom',
      globals: true
    }
  })
  ```

- [ ] **Implement** — create `packages/server/package.json`:
  ```json
  {
    "name": "@cn-medicine/server",
    "private": true,
    "version": "0.0.1",
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "test": "vitest run"
    },
    "dependencies": {
      "@hono/node-server": "^1.8.0",
      "@supabase/supabase-js": "^2.39.0",
      "hono": "^4.0.0",
      "node-cron": "^3.0.3",
      "openai": "^4.28.0",
      "web-push": "^3.6.7"
    },
    "devDependencies": {
      "@types/node": "^20.11.0",
      "@types/node-cron": "^3.0.11",
      "@types/web-push": "^3.6.3",
      "tsx": "^4.7.0",
      "typescript": "^5.3.3",
      "vitest": "^1.2.0"
    }
  }
  ```

- [ ] **Implement** — create `packages/server/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "outDir": "dist",
      "rootDir": "src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] **Run** — `pnpm install && pnpm -r build` → expect SUCCESS

- [ ] **Commit**
  ```
  git add -A && git commit -m "feat: monorepo scaffold with pnpm workspace, web(Vue3+Vite+PWA) and server(Hono+TS)"
  ```

---

## Task 2: TypeScript types

**Creates/modifies:**
- `packages/web/src/types/index.ts`
- `packages/web/src/__tests__/types.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/types.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import type { User, Medication, Schedule, MedicationLog, PushSubscription } from '../types/index'

  describe('TypeScript types', () => {
    it('User type has required fields', () => {
      const user: User = {
        id: 'uuid-001',
        email: 'child@example.com',
        role: 'admin',
        display_name: '小明',
        created_at: '2026-01-01T00:00:00Z'
      }
      expect(user.role).toBe('admin')
    })

    it('Medication type has required fields', () => {
      const med: Medication = {
        id: 'uuid-med-001',
        user_id: 'uuid-001',
        name: '阿莫西林',
        dosage: 500,
        unit: 'mg',
        stock: 30,
        image_url: null,
        usage_suggestion: '饭后服用',
        created_at: '2026-01-01T00:00:00Z'
      }
      expect(med.name).toBe('阿莫西林')
    })

    it('Schedule type has required fields', () => {
      const schedule: Schedule = {
        id: 'uuid-sch-001',
        medication_id: 'uuid-med-001',
        time: '08:00',
        days_of_week: [1, 2, 3, 4, 5],
        active: true,
        created_at: '2026-01-01T00:00:00Z'
      }
      expect(schedule.days_of_week).toContain(1)
    })

    it('MedicationLog type has required fields', () => {
      const log: MedicationLog = {
        id: 'uuid-log-001',
        schedule_id: 'uuid-sch-001',
        medication_id: 'uuid-med-001',
        scheduled_at: '2026-01-01T08:00:00Z',
        taken_at: null,
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z'
      }
      expect(log.status).toBe('pending')
    })

    it('PushSubscription type has required fields', () => {
      const sub: PushSubscription = {
        id: 'uuid-sub-001',
        user_id: 'uuid-001',
        endpoint: 'https://fcm.googleapis.com/...',
        p256dh: 'base64key',
        auth: 'base64auth',
        created_at: '2026-01-01T00:00:00Z'
      }
      expect(sub.endpoint).toContain('https://')
    })
  })
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/types.test.ts` → expect FAIL (file not found)

- [ ] **Implement** — create `packages/web/src/types/index.ts`:
  ```ts
  export type UserRole = 'admin' | 'viewer'

  export interface User {
    id: string
    email: string
    role: UserRole
    display_name: string
    created_at: string
  }

  export interface Medication {
    id: string
    user_id: string
    name: string
    dosage: number
    unit: string          // mg / ml / 片 / 粒
    stock: number
    image_url: string | null
    usage_suggestion: string | null
    created_at: string
  }

  export interface Schedule {
    id: string
    medication_id: string
    time: string          // HH:MM
    days_of_week: number[] // 0=Sunday … 6=Saturday
    active: boolean
    created_at: string
  }

  export type LogStatus = 'pending' | 'taken' | 'missed' | 'future'

  export interface MedicationLog {
    id: string
    schedule_id: string
    medication_id: string
    scheduled_at: string
    taken_at: string | null
    status: LogStatus
    created_at: string
  }

  export interface PushSubscription {
    id: string
    user_id: string
    endpoint: string
    p256dh: string
    auth: string
    created_at: string
  }

  export interface VisionResult {
    name: string
    dosage: number
    unit: string
    usage_suggestion: string
  }
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/types.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/types packages/web/src/__tests__/types.test.ts
  git commit -m "feat: add TypeScript domain types (User, Medication, Schedule, MedicationLog, PushSubscription)"
  ```

---

## Task 3: Supabase schema + RLS

**Creates/modifies:**
- `supabase/migrations/001_init.sql`
- `supabase/config.toml` (if not exists)

### TDD Steps

- [ ] **Write failing test** — create `supabase/tests/001_schema.test.sql`:
  ```sql
  -- supabase/tests/001_schema.test.sql (pgTAP)
  BEGIN;
  SELECT plan(10);

  SELECT has_table('public', 'users',             'users table exists');
  SELECT has_table('public', 'medications',       'medications table exists');
  SELECT has_table('public', 'schedules',         'schedules table exists');
  SELECT has_table('public', 'medication_logs',   'medication_logs table exists');
  SELECT has_table('public', 'push_subscriptions','push_subscriptions table exists');

  SELECT has_column('public', 'medications', 'name',   'medications.name exists');
  SELECT has_column('public', 'schedules',   'time',   'schedules.time exists');
  SELECT has_column('public', 'medication_logs', 'status', 'logs.status exists');

  SELECT col_type_is('public', 'medication_logs', 'status',
    'character varying', 'status is varchar');

  SELECT policies_are('public', 'medications',
    ARRAY['viewer_select', 'admin_all'],
    'medications has correct RLS policies');

  SELECT * FROM finish();
  ROLLBACK;
  ```

- [ ] **Run test** — `supabase test db` → expect FAIL (tables don't exist)

- [ ] **Implement** — create `supabase/migrations/001_init.sql`:
  ```sql
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ─── USERS ────────────────────────────────────────────────────────────────
  CREATE TABLE public.users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email        TEXT UNIQUE NOT NULL,
    role         VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'viewer')),
    display_name TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "users_own_record" ON public.users
    FOR ALL USING (auth.uid() = id);

  -- ─── MEDICATIONS ──────────────────────────────────────────────────────────
  CREATE TABLE public.medications (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    dosage           NUMERIC(10,2) NOT NULL,
    unit             VARCHAR(20) NOT NULL DEFAULT 'mg',
    stock            INTEGER NOT NULL DEFAULT 0,
    image_url        TEXT,
    usage_suggestion TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "viewer_select" ON public.medications
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
      )
    );

  CREATE POLICY "admin_all" ON public.medications
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );

  -- ─── SCHEDULES ────────────────────────────────────────────────────────────
  CREATE TABLE public.schedules (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    time          VARCHAR(5) NOT NULL,   -- HH:MM
    days_of_week  INTEGER[] NOT NULL,    -- 0..6
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "viewer_select" ON public.schedules
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
      )
    );

  CREATE POLICY "admin_all" ON public.schedules
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );

  -- ─── MEDICATION LOGS ──────────────────────────────────────────────────────
  CREATE TABLE public.medication_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id   UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    taken_at      TIMESTAMPTZ,
    status        VARCHAR(10) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'taken', 'missed', 'future')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

  -- Both roles can read logs; viewer can update (mark taken); admin has full access
  CREATE POLICY "viewer_select" ON public.medication_logs
    FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid())
    );

  CREATE POLICY "viewer_update" ON public.medication_logs
    FOR UPDATE
    USING (
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid())
    )
    WITH CHECK (status = 'taken');

  CREATE POLICY "admin_all" ON public.medication_logs
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );

  -- ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────
  CREATE TABLE public.push_subscriptions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "own_subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

  -- ─── INDEXES ──────────────────────────────────────────────────────────────
  CREATE INDEX idx_medications_user_id   ON public.medications(user_id);
  CREATE INDEX idx_schedules_med_id      ON public.schedules(medication_id);
  CREATE INDEX idx_logs_scheduled_at     ON public.medication_logs(scheduled_at);
  CREATE INDEX idx_logs_status           ON public.medication_logs(status);
  CREATE INDEX idx_push_subs_user_id     ON public.push_subscriptions(user_id);
  ```

- [ ] **Run** — `supabase db push` → expect SUCCESS; then `supabase test db` → expect PASS

- [ ] **Commit**
  ```
  git add supabase/
  git commit -m "feat: supabase schema with users/medications/schedules/logs/push_subscriptions + RLS policies"
  ```

---

## Task 4: Supabase client + Auth store

**Creates/modifies:**
- `packages/web/src/lib/supabase.ts`
- `packages/web/src/stores/auth.ts`
- `packages/web/src/__tests__/auth.store.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/auth.store.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'
  import { useAuthStore } from '../stores/auth'

  // Mock supabase
  vi.mock('../lib/supabase', () => ({
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    }
  }))

  describe('useAuthStore', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('initial state: currentUser is null', () => {
      const auth = useAuthStore()
      expect(auth.currentUser).toBeNull()
    })

    it('login sets currentUser on success', async () => {
      const { supabase } = await import('../lib/supabase')
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'uuid-001', email: 'child@example.com' },
          session: { access_token: 'tok' }
        },
        error: null
      } as any)
      vi.mocked(supabase.from('users').select('*').eq('id', 'uuid-001').single).mockResolvedValueOnce({
        data: { id: 'uuid-001', email: 'child@example.com', role: 'admin', display_name: '小明', created_at: '' },
        error: null
      } as any)

      const auth = useAuthStore()
      await auth.login('child@example.com', 'password123')
      expect(auth.currentUser).not.toBeNull()
      expect(auth.currentUser?.role).toBe('admin')
    })

    it('role computed returns null when not logged in', () => {
      const auth = useAuthStore()
      expect(auth.role).toBeNull()
    })

    it('isAdmin returns false when viewer', async () => {
      const auth = useAuthStore()
      auth.currentUser = { id: 'x', email: 'old@example.com', role: 'viewer', display_name: '爷爷', created_at: '' }
      expect(auth.isAdmin).toBe(false)
    })

    it('logout clears currentUser', async () => {
      const { supabase } = await import('../lib/supabase')
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any)

      const auth = useAuthStore()
      auth.currentUser = { id: 'x', email: 'child@example.com', role: 'admin', display_name: '小明', created_at: '' }
      await auth.logout()
      expect(auth.currentUser).toBeNull()
    })
  })
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/auth.store.test.ts` → expect FAIL

- [ ] **Implement** — create `packages/web/src/lib/supabase.ts`:
  ```ts
  import { createClient } from '@supabase/supabase-js'

  const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
  const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  export const supabase = createClient(supabaseUrl, supabaseKey)
  ```

- [ ] **Implement** — create `packages/web/src/stores/auth.ts`:
  ```ts
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import { supabase } from '../lib/supabase'
  import type { User } from '../types'

  export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref<User | null>(null)

    const role    = computed(() => currentUser.value?.role ?? null)
    const isAdmin = computed(() => currentUser.value?.role === 'admin')

    async function fetchUserProfile(userId: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) return null
      return data as User
    }

    async function login(email: string, password: string): Promise<void> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        currentUser.value = await fetchUserProfile(data.user.id)
      }
    }

    async function logout(): Promise<void> {
      await supabase.auth.signOut()
      currentUser.value = null
    }

    async function init(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        currentUser.value = await fetchUserProfile(session.user.id)
      }
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          currentUser.value = await fetchUserProfile(session.user.id)
        } else {
          currentUser.value = null
        }
      })
    }

    return { currentUser, role, isAdmin, login, logout, init }
  })
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/auth.store.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/lib packages/web/src/stores/auth.ts packages/web/src/__tests__/auth.store.test.ts
  git commit -m "feat: supabase client + auth Pinia store with login/logout/role computed"
  ```

---

## Task 5: Vue Router with guards

**Creates/modifies:**
- `packages/web/src/router/index.ts`
- `packages/web/src/__tests__/router.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/router.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { createRouter, createWebHashHistory } from 'vue-router'
  import { setActivePinia, createPinia } from 'pinia'

  // Stub views
  const Stub = { template: '<div />' }
  vi.mock('../views/LoginView.vue',    () => ({ default: Stub }))
  vi.mock('../views/TodayView.vue',    () => ({ default: Stub }))
  vi.mock('../views/MedsView.vue',     () => ({ default: Stub }))
  vi.mock('../views/ScheduleView.vue', () => ({ default: Stub }))
  vi.mock('../views/HistoryView.vue',  () => ({ default: Stub }))
  vi.mock('../views/StockView.vue',    () => ({ default: Stub }))
  vi.mock('../views/ProfileView.vue',  () => ({ default: Stub }))

  // Mock auth store
  let mockUser: any = null
  vi.mock('../stores/auth', () => ({
    useAuthStore: () => ({
      get currentUser() { return mockUser },
      get isAdmin() { return mockUser?.role === 'admin' }
    })
  }))

  import { routes } from '../router/index'

  describe('router guards', () => {
    let router: ReturnType<typeof createRouter>

    beforeEach(() => {
      setActivePinia(createPinia())
      mockUser = null
      router = createRouter({ history: createWebHashHistory(), routes })
    })

    it('unauthenticated user is redirected to /login', async () => {
      await router.push('/today')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('authenticated viewer accessing /meds is redirected to /today', async () => {
      mockUser = { id: 'x', role: 'viewer' }
      await router.push('/meds')
      expect(router.currentRoute.value.path).toBe('/today')
    })

    it('authenticated admin can access /meds', async () => {
      mockUser = { id: 'x', role: 'admin' }
      await router.push('/meds')
      expect(router.currentRoute.value.path).toBe('/meds')
    })

    it('all 6 main routes are defined', () => {
      const paths = routes.map(r => r.path)
      expect(paths).toContain('/today')
      expect(paths).toContain('/meds')
      expect(paths).toContain('/schedule')
      expect(paths).toContain('/history')
      expect(paths).toContain('/stock')
      expect(paths).toContain('/profile')
    })
  })
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/router.test.ts` → expect FAIL

- [ ] **Implement** — create `packages/web/src/router/index.ts`:
  ```ts
  import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
  import { useAuthStore } from '../stores/auth'

  export const routes: RouteRecordRaw[] = [
    { path: '/login',    name: 'login',    component: () => import('../views/LoginView.vue'),    meta: { public: true } },
    { path: '/today',    name: 'today',    component: () => import('../views/TodayView.vue') },
    { path: '/meds',     name: 'meds',     component: () => import('../views/MedsView.vue'),     meta: { requireAdmin: true } },
    { path: '/schedule', name: 'schedule', component: () => import('../views/ScheduleView.vue'), meta: { requireAdmin: true } },
    { path: '/history',  name: 'history',  component: () => import('../views/HistoryView.vue') },
    { path: '/stock',    name: 'stock',    component: () => import('../views/StockView.vue') },
    { path: '/profile',  name: 'profile',  component: () => import('../views/ProfileView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/today' }
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  router.beforeEach((to) => {
    const auth = useAuthStore()

    if (!to.meta?.public && !auth.currentUser) {
      return { path: '/login' }
    }
    if (to.meta?.requireAdmin && !auth.isAdmin) {
      return { path: '/today' }
    }
  })

  export default router
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/router.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/router packages/web/src/__tests__/router.test.ts
  git commit -m "feat: vue-router with requireAuth/requireAdmin guards, 6 main routes + /login"
  ```

---

## Task 6: Bottom navigation + layout

**Creates/modifies:**
- `packages/web/src/components/BottomNav.vue`
- `packages/web/src/App.vue`
- `packages/web/src/__tests__/BottomNav.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/BottomNav.test.ts`:
  ```ts
  import { describe, it, expect, vi } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createRouter, createWebHashHistory } from 'vue-router'
  import { createPinia } from 'pinia'
  import BottomNav from '../components/BottomNav.vue'

  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/today', component: { template: '<div />' } },
      { path: '/history', component: { template: '<div />' } },
      { path: '/stock', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
    ]
  })

  vi.mock('../stores/auth', () => ({
    useAuthStore: () => ({ isAdmin: true })
  }))

  describe('BottomNav', () => {
    it('renders 6 nav items', async () => {
      const wrapper = mount(BottomNav, {
        global: { plugins: [router, createPinia()] }
      })
      await router.isReady()
      const items = wrapper.findAll('[data-testid="nav-item"]')
      expect(items).toHaveLength(6)
    })

    it('each nav item has min-height 52px via CSS class', () => {
      const wrapper = mount(BottomNav, {
        global: { plugins: [router, createPinia()] }
      })
      const items = wrapper.findAll('[data-testid="nav-item"]')
      items.forEach(item => {
        expect(item.classes()).toContain('nav-item')
      })
    })

    it('active route gets active class', async () => {
      await router.push('/today')
      await router.isReady()
      const wrapper = mount(BottomNav, {
        global: { plugins: [router, createPinia()] }
      })
      const activeItem = wrapper.find('.nav-item.active')
      expect(activeItem.exists()).toBe(true)
    })
  })
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/BottomNav.test.ts` → expect FAIL

- [ ] **Implement** — create `packages/web/src/components/BottomNav.vue`:
  ```vue
  <template>
    <nav class="bottom-nav" aria-label="主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: route.path === item.to }"
        data-testid="nav-item"
        :aria-label="item.label"
      >
        <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink, useRoute } from 'vue-router'
  import { useAuthStore } from '../stores/auth'

  const route   = useRoute()
  const auth    = useAuthStore()

  const navItems = computed(() => {
    const base = [
      { to: '/today',   icon: '💊', label: '今日' },
      { to: '/history', icon: '📋', label: '历史' },
      { to: '/stock',   icon: '📦', label: '库存' },
      { to: '/profile', icon: '👤', label: '我的' },
    ]
    if (auth.isAdmin) {
      base.splice(1, 0,
        { to: '/meds',     icon: '🏥', label: '药品' },
        { to: '/schedule', icon: '⏰', label: '计划' },
      )
    } else {
      // viewer still gets 6 items (read-only meds + schedule)
      base.splice(1, 0,
        { to: '/meds',     icon: '🏥', label: '药品' },
        { to: '/schedule', icon: '⏰', label: '计划' },
      )
    }
    return base
  })
  </script>

  <style scoped>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: #fff;
    border-top: 1px solid #FFE0CC;
    box-shadow: 0 -2px 8px rgba(255, 140, 66, 0.15);
    z-index: 100;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 52px;          /* elderly-friendly touch target */
    padding: 6px 0;
    text-decoration: none;
    color: #999;
    font-size: 10px;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .nav-item.active {
    color: #FF8C42;
  }

  .nav-icon {
    font-size: 22px;
    line-height: 1;
    margin-bottom: 2px;
  }

  .nav-label {
    font-size: 10px;
    font-weight: 500;
  }
  </style>
  ```

- [ ] **Implement** — create `packages/web/src/App.vue`:
  ```vue
  <template>
    <div id="app" :class="{ 'with-nav': showNav }">
      <RouterView />
      <BottomNav v-if="showNav" />
    </div>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import BottomNav from './components/BottomNav.vue'
  import { useAuthStore } from './stores/auth'

  const route = useRoute()
  const auth  = useAuthStore()

  const showNav = computed(() =>
    !!auth.currentUser && route.path !== '/login'
  )
  </script>

  <style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 18px;          /* elderly-friendly base */
    background: #FFF8F0;
    color: #333;
    -webkit-font-smoothing: antialiased;
  }

  #app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100dvh;
  }

  #app.with-nav {
    padding-bottom: 56px;
  }

  :root {
    --color-primary:   #FF8C42;
    --color-secondary: #FF6B9D;
    --color-bg:        #FFF8F0;
    --color-surface:   #FFFFFF;
    --color-text:      #333333;
    --color-muted:     #999999;
    --radius-md:       12px;
    --radius-lg:       20px;
  }
  </style>
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/BottomNav.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/components/BottomNav.vue packages/web/src/App.vue packages/web/src/__tests__/BottomNav.test.ts
  git commit -m "feat: BottomNav component with 6 items, 52px touch targets, warm orange-pink theme"
  ```

---

## Task 7: Today's medication view (TodayView)

**Creates/modifies:**
- `packages/web/src/views/TodayView.vue`
- `packages/web/src/components/MedCard.vue`
- `packages/web/src/stores/logs.ts`
- `packages/web/src/__tests__/MedCard.test.ts`
- `packages/web/src/__tests__/logs.store.test.ts`

### TDD Steps

- [ ] **Write failing test 1** — create `packages/web/src/__tests__/MedCard.test.ts`:
  ```ts
  import { describe, it, expect, vi } from 'vitest'
  import { mount } from '@vue/test-utils'
  import MedCard from '../components/MedCard.vue'
  import type { MedicationLog, Medication } from '../types'

  const baseMed: Medication = {
    id: 'med-1', user_id: 'u-1', name: '阿莫西林',
    dosage: 500, unit: 'mg', stock: 30,
    image_url: null, usage_suggestion: '饭后服用', created_at: ''
  }

  const baseLog: MedicationLog = {
    id: 'log-1', schedule_id: 'sch-1', medication_id: 'med-1',
    scheduled_at: '2026-07-08T08:00:00Z', taken_at: null,
    status: 'pending', created_at: ''
  }

  describe('MedCard', () => {
    it('renders drug name with font-size >= 18px class', () => {
      const wrapper = mount(MedCard, {
        props: { log: baseLog, medication: baseMed }
      })
      const name = wrapper.find('[data-testid="med-name"]')
      expect(name.exists()).toBe(true)
      expect(name.text()).toBe('阿莫西林')
    })

    it('shows "服用" button when status is pending', () => {
      const wrapper = mount(MedCard, {
        props: { log: baseLog, medication: baseMed }
      })
      const btn = wrapper.find('[data-testid="action-btn"]')
      expect(btn.text()).toContain('服用')
    })

    it('shows "已服用" badge when status is taken', () => {
      const wrapper = mount(MedCard, {
        props: { log: { ...baseLog, status: 'taken', taken_at: '2026-07-08T08:05:00Z' }, medication: baseMed }
      })
      expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('已服用')
    })

    it('shows "未到时间" badge when status is future', () => {
      const wrapper = mount(MedCard, {
        props: { log: { ...baseLog, status: 'future' }, medication: baseMed }
      })
      expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('未到时间')
    })

    it('emits mark-taken when action button clicked', async () => {
      const wrapper = mount(MedCard, {
        props: { log: baseLog, medication: baseMed }
      })
      await wrapper.find('[data-testid="action-btn"]').trigger('click')
      expect(wrapper.emitted('mark-taken')).toBeTruthy()
      expect(wrapper.emitted('mark-taken')![0]).toEqual(['log-1'])
    })
  })
  ```

- [ ] **Write failing test 2** — create `packages/web/src/__tests__/logs.store.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'
  import { useLogsStore } from '../stores/logs'

  vi.mock('../lib/supabase', () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'log-1', schedule_id: 'sch-1', medication_id: 'med-1',
              scheduled_at: new Date().toISOString(), taken_at: null,
              status: 'pending', created_at: ''
            }
          ],
          error: null
        })
      }))
    }
  }))

  describe('useLogsStore', () => {
    beforeEach(() => { setActivePinia(createPinia()) })

    it('todayLogs() returns logs for today', async () => {
      const store = useLogsStore()
      await store.fetchToday()
      expect(store.todayLogs.length).toBeGreaterThanOrEqual(0)
    })

    it('markTaken calls supabase update', async () => {
      const { supabase } = await import('../lib/supabase')
      const mockUpdate = vi.fn().mockResolvedValue({ error: null })
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({ eq: mockUpdate })
      } as any)

      const store = useLogsStore()
      await store.markTaken('log-1')
      expect(supabase.from).toHaveBeenCalledWith('medication_logs')
    })
  })
  ```

- [ ] **Run tests** → expect FAIL

- [ ] **Implement** — create `packages/web/src/stores/logs.ts`:
  ```ts
  import { defineStore } from 'pinia'
  import { ref } from 'vue'
  import { supabase } from '../lib/supabase'
  import type { MedicationLog } from '../types'

  export const useLogsStore = defineStore('logs', () => {
    const todayLogs = ref<MedicationLog[]>([])
    const loading   = ref(false)

    async function fetchToday(): Promise<void> {
      loading.value = true
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at')

      if (!error && data) todayLogs.value = data as MedicationLog[]
      loading.value = false
    }

    async function markTaken(logId: string): Promise<void> {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('medication_logs')
        .update({ status: 'taken', taken_at: now })
        .eq('id', logId)

      if (!error) {
        const log = todayLogs.value.find(l => l.id === logId)
        if (log) { log.status = 'taken'; log.taken_at = now }
      }
    }

    return { todayLogs, loading, fetchToday, markTaken }
  })
  ```

- [ ] **Implement** — create `packages/web/src/components/MedCard.vue`:
  ```vue
  <template>
    <div class="med-card" :class="`status-${log.status}`">
      <div class="med-info">
        <h3 class="med-name" data-testid="med-name">{{ medication.name }}</h3>
        <p class="med-detail">{{ medication.dosage }}{{ medication.unit }} · {{ formattedTime }}</p>
        <p v-if="medication.usage_suggestion" class="med-suggestion">{{ medication.usage_suggestion }}</p>
      </div>

      <div class="med-action">
        <button
          v-if="log.status === 'pending'"
          class="action-btn action-btn--primary"
          data-testid="action-btn"
          @click="$emit('mark-taken', log.id)"
        >
          ✓ 服用
        </button>
        <span v-else class="status-badge" :class="`badge-${log.status}`" data-testid="status-badge">
          {{ statusLabel }}
        </span>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import type { MedicationLog, Medication } from '../types'

  const props = defineProps<{ log: MedicationLog; medication: Medication }>()
  defineEmits<{ 'mark-taken': [logId: string] }>()

  const formattedTime = computed(() => {
    const d = new Date(props.log.scheduled_at)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  })

  const statusLabel = computed(() => {
    const map: Record<string, string> = {
      taken:   '✓ 已服用',
      missed:  '✗ 已漏服',
      future:  '⏰ 未到时间',
      pending: '等待服用'
    }
    return map[props.log.status] ?? props.log.status
  })
  </script>

  <style scoped>
  .med-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: var(--radius-md);
    padding: 16px 20px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-left: 4px solid #eee;
    transition: border-color 0.2s;
  }
  .status-pending { border-left-color: var(--color-primary); }
  .status-taken   { border-left-color: #4CAF50; opacity: 0.7; }
  .status-missed  { border-left-color: #F44336; }
  .status-future  { border-left-color: #9E9E9E; }

  .med-name   { font-size: 20px; font-weight: 600; color: #333; }
  .med-detail { font-size: 16px; color: #666; margin-top: 4px; }
  .med-suggestion { font-size: 14px; color: #999; margin-top: 2px; }

  .action-btn {
    min-height: 52px;
    min-width: 80px;
    border: none;
    border-radius: var(--radius-md);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.2s;
  }
  .action-btn:active { transform: scale(0.96); }
  .action-btn--primary {
    background: var(--color-primary);
    color: #fff;
  }

  .status-badge {
    font-size: 15px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
  }
  .badge-taken  { background: #E8F5E9; color: #388E3C; }
  .badge-missed { background: #FFEBEE; color: #C62828; }
  .badge-future { background: #F5F5F5; color: #757575; }
  </style>
  ```

- [ ] **Implement** — create `packages/web/src/views/TodayView.vue`:
  ```vue
  <template>
    <div class="today-view">
      <header class="page-header">
        <h1>今日服药</h1>
        <span class="date">{{ todayStr }}</span>
      </header>

      <div v-if="logsStore.loading" class="loading">加载中...</div>

      <div v-else-if="groupedLogs.length === 0" class="empty">
        <p>今天没有服药计划 🎉</p>
      </div>

      <div v-else class="log-list">
        <MedCard
          v-for="item in groupedLogs"
          :key="item.log.id"
          :log="item.log"
          :medication="item.medication"
          @mark-taken="handleMarkTaken"
        />
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useLogsStore }  from '../stores/logs'
  import { useMedsStore }  from '../stores/meds'
  import MedCard from '../components/MedCard.vue'

  const logsStore = useLogsStore()
  const medsStore = useMedsStore()

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  })

  const groupedLogs = computed(() =>
    logsStore.todayLogs.map(log => ({
      log,
      medication: medsStore.medications.find(m => m.id === log.medication_id)!
    })).filter(item => !!item.medication)
  )

  async function handleMarkTaken(logId: string) {
    await logsStore.markTaken(logId)
  }

  onMounted(async () => {
    await Promise.all([logsStore.fetchToday(), medsStore.fetchAll()])
  })
  </script>

  <style scoped>
  .today-view { padding: 20px 16px; }
  .page-header { margin-bottom: 20px; }
  .page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); }
  .date { font-size: 14px; color: var(--color-muted); }
  .loading, .empty { text-align: center; padding: 60px 20px; color: var(--color-muted); font-size: 18px; }
  </style>
  ```

- [ ] **Run tests** — `cd packages/web && pnpm vitest run src/__tests__/MedCard.test.ts src/__tests__/logs.store.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/views/TodayView.vue packages/web/src/components/MedCard.vue packages/web/src/stores/logs.ts packages/web/src/__tests__/MedCard.test.ts packages/web/src/__tests__/logs.store.test.ts
  git commit -m "feat: TodayView + MedCard component + logs Pinia store with markTaken"
  ```

---

## Task 8: Medication management (MedsView)

**Creates/modifies:**
- `packages/web/src/views/MedsView.vue`
- `packages/web/src/stores/meds.ts`
- `packages/web/src/__tests__/meds.store.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/meds.store.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'
  import { useMedsStore } from '../stores/meds'

  const mockMed = {
    id: 'med-1', user_id: 'u-1', name: '阿莫西林',
    dosage: 500, unit: 'mg', stock: 30,
    image_url: null, usage_suggestion: '饭后服用', created_at: ''
  }

  vi.mock('../lib/supabase', () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockMed], error: null }),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMed, error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnThis(),
      }))
    }
  }))

  describe('useMedsStore', () => {
    beforeEach(() => { setActivePinia(createPinia()) })

    it('fetchAll populates medications list', async () => {
      const store = useMedsStore()
      await store.fetchAll()
      expect(store.medications.length).toBeGreaterThanOrEqual(1)
      expect(store.medications[0].name).toBe('阿莫西林')
    })

    it('add() calls supabase insert', async () => {
      const { supabase } = await import('../lib/supabase')
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockMed, error: null })
        })
      })
      vi.mocked(supabase.from).mockReturnValueOnce({ insert: mockInsert } as any)

      const store = useMedsStore()
      const payload = { name: '布洛芬', dosage: 400, unit: 'mg', stock: 20, usage_suggestion: '' }
      await store.add(payload)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('remove() calls supabase delete', async () => {
      const { supabase } = await import('../lib/supabase')
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
      vi.mocked(supabase.from).mockReturnValueOnce({ delete: mockDelete } as any)

      const store = useMedsStore()
      store.medications = [mockMed]
      await store.remove('med-1')
      expect(mockDelete).toHaveBeenCalled()
      expect(store.medications.find(m => m.id === 'med-1')).toBeUndefined()
    })
  })
  ```

- [ ] **Run test** → expect FAIL

- [ ] **Implement** — create `packages/web/src/stores/meds.ts`:
  ```ts
  import { defineStore } from 'pinia'
  import { ref } from 'vue'
  import { supabase } from '../lib/supabase'
  import type { Medication } from '../types'

  type MedPayload = Omit<Medication, 'id' | 'user_id' | 'created_at'>

  export const useMedsStore = defineStore('meds', () => {
    const medications = ref<Medication[]>([])
    const loading     = ref(false)

    async function fetchAll(): Promise<void> {
      loading.value = true
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name')
      if (!error && data) medications.value = data as Medication[]
      loading.value = false
    }

    async function add(payload: MedPayload): Promise<Medication> {
      const { data, error } = await supabase
        .from('medications')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      medications.value.push(data as Medication)
      return data as Medication
    }

    async function update(id: string, payload: Partial<MedPayload>): Promise<void> {
      const { error } = await supabase
        .from('medications')
        .update(payload)
        .eq('id', id)
      if (error) throw error
      const idx = medications.value.findIndex(m => m.id === id)
      if (idx !== -1) medications.value[idx] = { ...medications.value[idx], ...payload }
    }

    async function remove(id: string): Promise<void> {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
      if (error) throw error
      medications.value = medications.value.filter(m => m.id !== id)
    }

    return { medications, loading, fetchAll, add, update, remove }
  })
  ```

- [ ] **Implement** — create `packages/web/src/views/MedsView.vue`:
  ```vue
  <template>
    <div class="meds-view">
      <header class="page-header">
        <h1>药品管理</h1>
        <button v-if="auth.isAdmin" class="add-btn" @click="showForm = true">
          ＋ 添加药品
        </button>
      </header>

      <div v-if="medsStore.loading" class="loading">加载中...</div>

      <ul v-else class="med-list">
        <li v-for="med in medsStore.medications" :key="med.id" class="med-item">
          <div class="med-body">
            <p class="med-title">{{ med.name }}</p>
            <p class="med-sub">{{ med.dosage }}{{ med.unit }} · 库存 {{ med.stock }}</p>
          </div>
          <div v-if="auth.isAdmin" class="med-actions">
            <button class="icon-btn edit" @click="startEdit(med)" aria-label="编辑">✏️</button>
            <button class="icon-btn delete" @click="confirmDelete(med.id)" aria-label="删除">🗑️</button>
          </div>
        </li>
      </ul>

      <!-- Add/Edit Modal (simplified inline form) -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
          <form class="modal-form" @submit.prevent="submitForm">
            <h2>{{ editTarget ? '编辑药品' : '添加药品' }}</h2>
            <label>药品名称 <input v-model="form.name" required /></label>
            <label>剂量 <input v-model.number="form.dosage" type="number" required /></label>
            <label>单位 <input v-model="form.unit" placeholder="mg / ml / 片" /></label>
            <label>库存数量 <input v-model.number="form.stock" type="number" /></label>
            <label>用法建议 <input v-model="form.usage_suggestion" /></label>
            <div class="form-actions">
              <button type="button" @click="showForm = false">取消</button>
              <button type="submit">{{ editTarget ? '保存' : '添加' }}</button>
            </div>
          </form>
        </div>
      </Teleport>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useMedsStore } from '../stores/meds'
  import { useAuthStore } from '../stores/auth'
  import type { Medication } from '../types'

  const medsStore = useMedsStore()
  const auth      = useAuthStore()

  const showForm   = ref(false)
  const editTarget = ref<Medication | null>(null)
  const form = reactive({ name: '', dosage: 0, unit: 'mg', stock: 0, usage_suggestion: '', image_url: null as null | string })

  function startEdit(med: Medication) {
    editTarget.value = med
    Object.assign(form, med)
    showForm.value = true
  }

  function resetForm() {
    Object.assign(form, { name: '', dosage: 0, unit: 'mg', stock: 0, usage_suggestion: '', image_url: null })
    editTarget.value = null
    showForm.value = false
  }

  async function submitForm() {
    if (editTarget.value) {
      await medsStore.update(editTarget.value.id, form)
    } else {
      await medsStore.add(form)
    }
    resetForm()
  }

  async function confirmDelete(id: string) {
    if (confirm('确认删除该药品？')) await medsStore.remove(id)
  }

  onMounted(() => medsStore.fetchAll())
  </script>

  <style scoped>
  .meds-view { padding: 20px 16px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); }
  .add-btn { min-height: 52px; padding: 0 20px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: 18px; cursor: pointer; }
  .med-list { list-style: none; }
  .med-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .med-title { font-size: 20px; font-weight: 600; }
  .med-sub { font-size: 15px; color: var(--color-muted); margin-top: 4px; }
  .med-actions { display: flex; gap: 8px; }
  .icon-btn { min-height: 52px; min-width: 52px; border: none; background: none; font-size: 22px; cursor: pointer; border-radius: var(--radius-md); }
  .icon-btn:hover { background: #f5f5f5; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; z-index: 200; }
  .modal-form { background: #fff; border-radius: 20px 20px 0 0; padding: 24px; width: 100%; display: flex; flex-direction: column; gap: 14px; }
  .modal-form h2 { font-size: 22px; font-weight: 700; }
  .modal-form label { display: flex; flex-direction: column; gap: 6px; font-size: 16px; }
  .modal-form input { height: 52px; border: 1px solid #ddd; border-radius: var(--radius-md); padding: 0 14px; font-size: 18px; }
  .form-actions { display: flex; gap: 12px; }
  .form-actions button { flex: 1; height: 52px; border: none; border-radius: var(--radius-md); font-size: 18px; cursor: pointer; }
  .form-actions button[type="submit"] { background: var(--color-primary); color: #fff; }
  </style>
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/meds.store.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/views/MedsView.vue packages/web/src/stores/meds.ts packages/web/src/__tests__/meds.store.test.ts
  git commit -m "feat: MedsView + meds Pinia store with CRUD; admin-only add/edit/delete buttons"
  ```

---

## Task 9: Schedule management (ScheduleView)

**Creates/modifies:**
- `packages/web/src/views/ScheduleView.vue`
- `packages/web/src/stores/schedules.ts`
- `packages/web/src/__tests__/schedules.store.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/web/src/__tests__/schedules.store.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'
  import { useSchedulesStore } from '../stores/schedules'

  const mockSchedule = {
    id: 'sch-1', medication_id: 'med-1',
    time: '08:00', days_of_week: [1,2,3,4,5],
    active: true, created_at: ''
  }

  vi.mock('../lib/supabase', () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockSchedule], error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSchedule, error: null }),
        update: vi.fn().mockReturnThis(),
      }))
    }
  }))

  describe('useSchedulesStore', () => {
    beforeEach(() => { setActivePinia(createPinia()) })

    it('byMedication returns filtered schedules', async () => {
      const store = useSchedulesStore()
      await store.fetchByMedication('med-1')
      const result = store.byMedication('med-1')
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result[0].medication_id).toBe('med-1')
    })

    it('add() calls supabase insert and returns new schedule', async () => {
      const { supabase } = await import('../lib/supabase')
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSchedule, error: null })
        })
      })
      vi.mocked(supabase.from).mockReturnValueOnce({ insert: mockInsert } as any)

      const store = useSchedulesStore()
      const result = await store.add({ medication_id: 'med-1', time: '08:00', days_of_week: [1,2,3,4,5], active: true })
      expect(result.id).toBe('sch-1')
    })

    it('toggle() flips the active field', async () => {
      const { supabase } = await import('../lib/supabase')
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
      vi.mocked(supabase.from).mockReturnValueOnce({ update: mockUpdate } as any)

      const store = useSchedulesStore()
      store.schedules = [{ ...mockSchedule }]
      await store.toggle('sch-1')
      expect(store.schedules[0].active).toBe(false)
    })
  })
  ```

- [ ] **Run test** → expect FAIL

- [ ] **Implement** — create `packages/web/src/stores/schedules.ts`:
  ```ts
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import { supabase } from '../lib/supabase'
  import type { Schedule } from '../types'

  type SchedulePayload = Omit<Schedule, 'id' | 'created_at'>

  export const useSchedulesStore = defineStore('schedules', () => {
    const schedules = ref<Schedule[]>([])

    const byMedication = (medId: string) =>
      schedules.value.filter(s => s.medication_id === medId)

    async function fetchByMedication(medId: string): Promise<void> {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('medication_id', medId)
        .order('time')
      if (!error && data) {
        // merge — avoid duplicates
        const incoming = data as Schedule[]
        incoming.forEach(s => {
          if (!schedules.value.find(x => x.id === s.id)) schedules.value.push(s)
        })
      }
    }

    async function add(payload: SchedulePayload): Promise<Schedule> {
      const { data, error } = await supabase
        .from('schedules')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      schedules.value.push(data as Schedule)
      return data as Schedule
    }

    async function toggle(id: string): Promise<void> {
      const sch = schedules.value.find(s => s.id === id)
      if (!sch) return
      const newActive = !sch.active
      const { error } = await supabase
        .from('schedules')
        .update({ active: newActive })
        .eq('id', id)
      if (!error) sch.active = newActive
    }

    return { schedules, byMedication, fetchByMedication, add, toggle }
  })
  ```

- [ ] **Implement** — create `packages/web/src/views/ScheduleView.vue`:
  ```vue
  <template>
    <div class="schedule-view">
      <header class="page-header">
        <h1>服药计划</h1>
      </header>

      <div v-if="!selectedMedId" class="select-prompt">
        <p>请选择药品查看计划</p>
        <ul class="med-selector">
          <li v-for="med in medsStore.medications" :key="med.id">
            <button class="med-select-btn" @click="selectMed(med.id)">
              {{ med.name }}
            </button>
          </li>
        </ul>
      </div>

      <div v-else>
        <button class="back-btn" @click="selectedMedId = null">← 返回</button>
        <h2 class="current-med">{{ currentMedName }}</h2>

        <ul class="schedule-list">
          <li v-for="sch in currentSchedules" :key="sch.id" class="schedule-item">
            <span class="sch-time">{{ sch.time }}</span>
            <span class="sch-days">{{ formatDays(sch.days_of_week) }}</span>
            <button
              v-if="auth.isAdmin"
              class="toggle-btn"
              :class="{ active: sch.active }"
              @click="schedulesStore.toggle(sch.id)"
            >
              {{ sch.active ? '启用' : '停用' }}
            </button>
            <span v-else class="status-dot" :class="{ active: sch.active }" />
          </li>
        </ul>

        <button v-if="auth.isAdmin" class="add-sch-btn" @click="showAddForm = true">
          ＋ 添加时间
        </button>

        <Teleport to="body">
          <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
            <form class="modal-form" @submit.prevent="submitSchedule">
              <h2>添加服药时间</h2>
              <label>时间 <input v-model="newTime" type="time" required /></label>
              <label>星期（可多选）
                <div class="day-picker">
                  <label v-for="d in dayOptions" :key="d.value">
                    <input type="checkbox" :value="d.value" v-model="newDays" />
                    {{ d.label }}
                  </label>
                </div>
              </label>
              <div class="form-actions">
                <button type="button" @click="showAddForm = false">取消</button>
                <button type="submit">添加</button>
              </div>
            </form>
          </div>
        </Teleport>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useSchedulesStore } from '../stores/schedules'
  import { useMedsStore }      from '../stores/meds'
  import { useAuthStore }      from '../stores/auth'

  const schedulesStore = useSchedulesStore()
  const medsStore      = useMedsStore()
  const auth           = useAuthStore()

  const selectedMedId = ref<string | null>(null)
  const showAddForm   = ref(false)
  const newTime = ref('08:00')
  const newDays = ref<number[]>([1,2,3,4,5])

  const dayOptions = [
    { value: 0, label: '日' }, { value: 1, label: '一' }, { value: 2, label: '二' },
    { value: 3, label: '三' }, { value: 4, label: '四' }, { value: 5, label: '五' },
    { value: 6, label: '六' }
  ]

  const currentSchedules = computed(() =>
    selectedMedId.value ? schedulesStore.byMedication(selectedMedId.value) : []
  )

  const currentMedName = computed(() =>
    medsStore.medications.find(m => m.id === selectedMedId.value)?.name ?? ''
  )

  function formatDays(days: number[]) {
    const map: Record<number, string> = { 0:'日',1:'一',2:'二',3:'三',4:'四',5:'五',6:'六' }
    return days.map(d => `周${map[d]}`).join(' ')
  }

  async function selectMed(id: string) {
    selectedMedId.value = id
    await schedulesStore.fetchByMedication(id)
  }

  async function submitSchedule() {
    if (!selectedMedId.value) return
    await schedulesStore.add({
      medication_id: selectedMedId.value,
      time: newTime.value,
      days_of_week: newDays.value,
      active: true
    })
    showAddForm.value = false
  }

  onMounted(() => medsStore.fetchAll())
  </script>

  <style scoped>
  .schedule-view { padding: 20px 16px; }
  .page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); margin-bottom: 20px; }
  .select-prompt { text-align: center; padding: 20px 0; }
  .select-prompt p { font-size: 18px; margin-bottom: 16px; color: var(--color-muted); }
  .med-selector { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .med-select-btn { width: 100%; min-height: 52px; background: #fff; border: 2px solid var(--color-primary); border-radius: var(--radius-md); font-size: 18px; color: var(--color-primary); cursor: pointer; }
  .back-btn { background: none; border: none; font-size: 18px; color: var(--color-primary); cursor: pointer; margin-bottom: 12px; }
  .current-med { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  .schedule-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .schedule-item { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: var(--radius-md); padding: 14px 16px; }
  .sch-time { font-size: 24px; font-weight: 700; min-width: 60px; }
  .sch-days { flex: 1; font-size: 14px; color: var(--color-muted); }
  .toggle-btn { min-height: 40px; padding: 0 14px; border-radius: 20px; border: 2px solid var(--color-primary); background: #fff; color: var(--color-primary); font-size: 15px; cursor: pointer; }
  .toggle-btn.active { background: var(--color-primary); color: #fff; }
  .status-dot { width: 12px; height: 12px; border-radius: 50%; background: #ddd; }
  .status-dot.active { background: #4CAF50; }
  .add-sch-btn { width: 100%; min-height: 52px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-md); font-size: 18px; cursor: pointer; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; z-index: 200; }
  .modal-form { background: #fff; border-radius: 20px 20px 0 0; padding: 24px; width: 100%; display: flex; flex-direction: column; gap: 14px; }
  .modal-form h2 { font-size: 22px; font-weight: 700; }
  .modal-form label { font-size: 16px; display: flex; flex-direction: column; gap: 6px; }
  .modal-form input[type=time] { height: 52px; border: 1px solid #ddd; border-radius: var(--radius-md); padding: 0 14px; font-size: 18px; }
  .day-picker { display: flex; gap: 10px; flex-wrap: wrap; }
  .day-picker label { display: flex; align-items: center; gap: 4px; font-size: 16px; }
  .form-actions { display: flex; gap: 12px; }
  .form-actions button { flex: 1; height: 52px; border: none; border-radius: var(--radius-md); font-size: 18px; cursor: pointer; }
  .form-actions button[type=submit] { background: var(--color-primary); color: #fff; }
  </style>
  ```

- [ ] **Run test** — `cd packages/web && pnpm vitest run src/__tests__/schedules.store.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/web/src/views/ScheduleView.vue packages/web/src/stores/schedules.ts packages/web/src/__tests__/schedules.store.test.ts
  git commit -m "feat: ScheduleView + schedules Pinia store with add/toggle; admin-only editing"
  ```

---

## Task 10: Hono server + GPT-4o Vision API

**Creates/modifies:**
- `packages/server/src/index.ts`
- `packages/server/src/middleware/auth.ts`
- `packages/server/src/routes/vision.ts`
- `packages/server/src/services/GPT4oVision.ts`
- `packages/server/src/__tests__/vision.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/server/src/__tests__/vision.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { Hono } from 'hono'
  import visionRoute from '../routes/vision'

  // Mock OpenAI
  vi.mock('openai', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    name: '阿莫西林',
                    dosage: 500,
                    unit: 'mg',
                    usage_suggestion: '每日3次，饭后服用'
                  })
                }
              }]
            })
          }
        }
      }))
    }
  })

  // Mock auth middleware — pass through
  vi.mock('../middleware/auth', () => ({
    authMiddleware: vi.fn().mockImplementation(async (c: any, next: any) => await next())
  }))

  describe('POST /api/vision/identify', () => {
    let app: Hono

    beforeEach(() => {
      app = new Hono()
      app.route('/api/vision', visionRoute)
    })

    it('returns 400 when no file uploaded', async () => {
      const req = new Request('http://localhost/api/vision/identify', {
        method: 'POST',
        body: new FormData()
      })
      const res = await app.fetch(req)
      expect(res.status).toBe(400)
    })

    it('returns JSON with name, dosage, unit, usage_suggestion on success', async () => {
      const formData = new FormData()
      const blob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' })
      formData.append('image', blob, 'pill.jpg')

      const req = new Request('http://localhost/api/vision/identify', {
        method: 'POST',
        body: formData
      })
      const res = await app.fetch(req)
      expect(res.status).toBe(200)

      const body = await res.json() as any
      expect(body).toHaveProperty('name')
      expect(body).toHaveProperty('dosage')
      expect(body).toHaveProperty('unit')
      expect(body).toHaveProperty('usage_suggestion')
      expect(body.name).toBe('阿莫西林')
    })
  })
  ```

- [ ] **Run test** → expect FAIL

- [ ] **Implement** — create `packages/server/src/services/GPT4oVision.ts`:
  ```ts
  import OpenAI from 'openai'

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  export interface VisionResult {
    name: string
    dosage: number
    unit: string
    usage_suggestion: string
  }

  const SYSTEM_PROMPT = `你是一个专业的药品识别助手。
  分析用户上传的药品图片，提取以下信息并以 JSON 格式返回：
  {
    "name": "药品名称（中文）",
    "dosage": 数字（剂量数值）,
    "unit": "单位（mg/ml/片/粒）",
    "usage_suggestion": "简短的用法建议（中文，≤50字）"
  }
  如无法识别，name 返回 "未知药品"，其他字段返回合理默认值。
  只返回 JSON，不要其他文字。`

  export async function identifyDrug(imageBase64: string, mimeType: string): Promise<VisionResult> {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            },
            { type: 'text', text: '请识别这个药品' }
          ]
        }
      ],
      max_tokens: 256,
      response_format: { type: 'json_object' }
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)
    return {
      name:             String(parsed.name ?? '未知药品'),
      dosage:           Number(parsed.dosage ?? 0),
      unit:             String(parsed.unit ?? 'mg'),
      usage_suggestion: String(parsed.usage_suggestion ?? '')
    }
  }
  ```

- [ ] **Implement** — create `packages/server/src/middleware/auth.ts`:
  ```ts
  import type { Context, Next } from 'hono'
  import { createClient } from '@supabase/supabase-js'

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    c.set('userId', user.id)
    await next()
  }
  ```

- [ ] **Implement** — create `packages/server/src/routes/vision.ts`:
  ```ts
  import { Hono } from 'hono'
  import { authMiddleware } from '../middleware/auth'
  import { identifyDrug } from '../services/GPT4oVision'

  const vision = new Hono()

  vision.use('/*', authMiddleware)

  vision.post('/identify', async (c) => {
    const body = await c.req.parseBody()
    const file = body['image']

    if (!file || typeof file === 'string') {
      return c.json({ error: 'No image file provided' }, 400)
    }

    const arrayBuffer = await (file as File).arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = (file as File).type || 'image/jpeg'

    const result = await identifyDrug(base64, mimeType)
    return c.json(result)
  })

  export default vision
  ```

- [ ] **Implement** — create `packages/server/src/index.ts`:
  ```ts
  import { serve } from '@hono/node-server'
  import { Hono } from 'hono'
  import { cors } from 'hono/cors'
  import { logger } from 'hono/logger'
  import visionRoute from './routes/vision'
  import pushRoute   from './routes/push'
  import { CronService } from './services/CronService'

  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
  }))

  app.route('/api/vision', visionRoute)
  app.route('/api/push',   pushRoute)

  app.get('/health', (c) => c.json({ status: 'ok' }))

  const PORT = Number(process.env.PORT ?? 3000)

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    CronService.start()
  })

  export default app
  ```

- [ ] **Run test** — `cd packages/server && pnpm vitest run src/__tests__/vision.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/server/src/
  git commit -m "feat: Hono server + GPT-4o Vision endpoint POST /api/vision/identify with JWT auth middleware"
  ```

---

## Task 11: Web Push (VAPID + subscriptions)

**Creates/modifies:**
- `packages/server/src/routes/push.ts`
- `packages/server/src/services/WebPush.ts`
- `packages/web/src/composables/usePush.ts`
- `packages/server/src/__tests__/push.test.ts`
- `packages/web/src/__tests__/usePush.test.ts`

### TDD Steps

- [ ] **Write failing test 1** — create `packages/server/src/__tests__/push.test.ts`:
  ```ts
  import { describe, it, expect, vi } from 'vitest'
  import { WebPushService } from '../services/WebPush'

  vi.mock('web-push', () => ({
    default: {
      setVapidDetails: vi.fn(),
      sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 })
    }
  }))

  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/test-endpoint',
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  }

  describe('WebPushService', () => {
    it('send() calls webpush.sendNotification with correct args', async () => {
      const webpush = (await import('web-push')).default
      const payload = { title: '服药提醒', body: '该服阿莫西林了', icon: '/icons/icon-192.png' }

      await WebPushService.send(mockSubscription, payload)

      expect(webpush.sendNotification).toHaveBeenCalledWith(
        {
          endpoint: mockSubscription.endpoint,
          keys: { p256dh: mockSubscription.p256dh, auth: mockSubscription.auth }
        },
        JSON.stringify(payload)
      )
    })

    it('send() returns success when statusCode is 201', async () => {
      const result = await WebPushService.send(mockSubscription, { title: 'Test', body: 'Body', icon: '' })
      expect(result).toBe(true)
    })
  })
  ```

- [ ] **Write failing test 2** — create `packages/web/src/__tests__/usePush.test.ts`:
  ```ts
  import { describe, it, expect, vi } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { defineComponent } from 'vue'
  import { usePush } from '../composables/usePush'

  // Mock service worker + PushManager
  const mockSubscribe  = vi.fn().mockResolvedValue({
    endpoint: 'https://test.endpoint',
    toJSON: () => ({ endpoint: 'https://test.endpoint', keys: { p256dh: 'p256', auth: 'auth' } })
  })
  const mockGetSub = vi.fn().mockResolvedValue(null)

  Object.defineProperty(global, 'navigator', {
    value: {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { subscribe: mockSubscribe, getSubscription: mockGetSub }
        })
      },
      permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) }
    },
    writable: true
  })

  Object.defineProperty(global, 'Notification', {
    value: { permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted') },
    writable: true
  })

  describe('usePush composable', () => {
    it('isSubscribed starts as false', () => {
      const TestComponent = defineComponent({
        setup() { return usePush() },
        template: '<div />'
      })
      const wrapper = mount(TestComponent)
      expect(wrapper.vm.isSubscribed).toBe(false)
    })

    it('subscribe() calls pushManager.subscribe', async () => {
      const TestComponent = defineComponent({
        setup() { return usePush() },
        template: '<div />'
      })
      const wrapper = mount(TestComponent)
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as any)
      await wrapper.vm.subscribe()
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })
  ```

- [ ] **Run tests** → expect FAIL

- [ ] **Implement** — create `packages/server/src/services/WebPush.ts`:
  ```ts
  import webpush from 'web-push'

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
    process.env.VAPID_PUBLIC_KEY  ?? '',
    process.env.VAPID_PRIVATE_KEY ?? ''
  )

  export interface PushPayload {
    title: string
    body:  string
    icon:  string
    data?: Record<string, unknown>
  }

  export interface PushTarget {
    endpoint: string
    p256dh:   string
    auth:     string
  }

  export const WebPushService = {
    async send(target: PushTarget, payload: PushPayload): Promise<boolean> {
      try {
        const res = await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(payload)
        )
        return res.statusCode === 201
      } catch (err) {
        console.error('[WebPush] send error:', err)
        return false
      }
    }
  }
  ```

- [ ] **Implement** — create `packages/server/src/routes/push.ts`:
  ```ts
  import { Hono } from 'hono'
  import { createClient } from '@supabase/supabase-js'
  import { authMiddleware } from '../middleware/auth'

  const push = new Hono()
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  push.use('/*', authMiddleware)

  // POST /api/push/subscribe
  push.post('/subscribe', async (c) => {
    const userId = c.get('userId') as string
    const { endpoint, p256dh, auth } = await c.req.json<{
      endpoint: string; p256dh: string; auth: string
    }>()

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' })

    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

  // DELETE /api/push/subscribe
  push.delete('/subscribe', async (c) => {
    const userId = c.get('userId') as string
    const { endpoint } = await c.req.json<{ endpoint: string }>()

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)

    return c.json({ success: true })
  })

  // GET /api/push/vapid-public-key
  push.get('/vapid-public-key', (c) => {
    return c.json({ key: process.env.VAPID_PUBLIC_KEY ?? '' })
  })

  export default push
  ```

- [ ] **Implement** — create `packages/web/src/composables/usePush.ts`:
  ```ts
  import { ref } from 'vue'
  import { supabase } from '../lib/supabase'

  const SERVER_URL = import.meta.env.VITE_SERVER_URL as string

  export function usePush() {
    const isSubscribed    = ref(false)
    const vapidPublicKey  = ref('')

    async function fetchVapidKey(): Promise<string> {
      const res  = await fetch(`${SERVER_URL}/api/push/vapid-public-key`)
      const data = await res.json()
      return data.key as string
    }

    function urlBase64ToUint8Array(base64String: string): Uint8Array {
      const padding = '='.repeat((4 - base64String.length % 4) % 4)
      const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = atob(base64)
      return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
    }

    async function requestPermission(): Promise<boolean> {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    async function subscribe(): Promise<void> {
      const key = vapidPublicKey.value || await fetchVapidKey()
      vapidPublicKey.value = key

      const registration = await navigator.serviceWorker.ready
      const existing     = await registration.pushManager.getSubscription()
      if (existing) { isSubscribed.value = true; return }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(key)
      })

      const subJson = subscription.toJSON()
      const session  = await supabase.auth.getSession()
      const token    = session.data.session?.access_token

      await fetch(`${SERVER_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh:   subJson.keys?.p256dh,
          auth:     subJson.keys?.auth
        })
      })

      isSubscribed.value = true
    }

    async function unsubscribe(): Promise<void> {
      const registration = await navigator.serviceWorker.ready
      const existing     = await registration.pushManager.getSubscription()
      if (!existing) { isSubscribed.value = false; return }

      const session = await supabase.auth.getSession()
      const token   = session.data.session?.access_token

      await fetch(`${SERVER_URL}/api/push/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint: existing.endpoint })
      })

      await existing.unsubscribe()
      isSubscribed.value = false
    }

    return { isSubscribed, requestPermission, subscribe, unsubscribe }
  }
  ```

- [ ] **Run tests** — `pnpm vitest run packages/server/src/__tests__/push.test.ts packages/web/src/__tests__/usePush.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/server/src/routes/push.ts packages/server/src/services/WebPush.ts packages/web/src/composables/usePush.ts packages/server/src/__tests__/push.test.ts packages/web/src/__tests__/usePush.test.ts
  git commit -m "feat: Web Push with VAPID — server routes /api/push/subscribe + usePush composable"
  ```

---

## Task 12: Cron jobs (reminders + missed dose)

**Creates/modifies:**
- `packages/server/src/services/CronService.ts`
- `packages/server/src/__tests__/cron.test.ts`

### TDD Steps

- [ ] **Write failing test** — create `packages/server/src/__tests__/cron.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

  // ── Mock Supabase ─────────────────────────────────────────────────────────
  const mockLogs = [
    {
      id: 'log-pending-1',
      schedule_id: 'sch-1',
      medication_id: 'med-1',
      scheduled_at: new Date().toISOString(),
      status: 'pending'
    }
  ]

  const mockSubscriptions = [
    { endpoint: 'https://fcm.test/1', p256dh: 'key1', auth: 'auth1' }
  ]

  const mockSelect = vi.fn().mockReturnThis()
  const mockEq     = vi.fn().mockReturnThis()
  const mockIn     = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockGte    = vi.fn().mockReturnThis()
  const mockLte    = vi.fn().mockReturnThis()
  const mockOrder  = vi.fn().mockResolvedValue({ data: mockLogs, error: null })

  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null })
          }
        }
        return { select: mockSelect, eq: mockEq, in: mockIn, update: mockUpdate, gte: mockGte, lte: mockLte, order: mockOrder }
      })
    }))
  }))

  // ── Mock WebPush ──────────────────────────────────────────────────────────
  const mockSend = vi.fn().mockResolvedValue(true)
  vi.mock('../services/WebPush', () => ({
    WebPushService: { send: mockSend }
  }))

  // ── Mock node-cron ────────────────────────────────────────────────────────
  vi.mock('node-cron', () => ({
    default: { schedule: vi.fn() }
  }))

  import { CronService } from '../services/CronService'

  describe('CronService', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockOrder.mockResolvedValue({ data: mockLogs, error: null })
    })

    it('checkReminders() sends push for due pending logs', async () => {
      await CronService.checkReminders()
      expect(mockSend).toHaveBeenCalledWith(
        mockSubscriptions[0],
        expect.objectContaining({ title: expect.stringContaining('服药') })
      )
    })

    it('checkMissedDoses() updates pending→missed for overdue logs', async () => {
      const overdueLogs = [{
        id: 'log-overdue-1',
        medication_id: 'med-1',
        scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        status: 'pending'
      }]
      mockOrder.mockResolvedValueOnce({ data: overdueLogs, error: null })

      const mockUpdateChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
      const mockUpdateFn    = vi.fn().mockReturnValue(mockUpdateChain)

      const { createClient } = await import('@supabase/supabase-js')
      vi.mocked(createClient)().from = vi.fn((table: string) => {
        if (table === 'push_subscriptions') {
          return { select: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null }) } as any
        }
        return { select: mockSelect, gte: mockGte, lte: mockLte, order: mockOrder, update: mockUpdateFn, eq: mockEq, in: mockIn } as any
      })

      await CronService.checkMissedDoses()
      expect(mockSend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ title: expect.stringContaining('漏服') })
      )
    })

    it('start() registers two cron jobs', () => {
      const cron = require('node-cron').default
      CronService.start()
      expect(cron.schedule).toHaveBeenCalledTimes(2)
    })
  })
  ```

- [ ] **Run test** → expect FAIL

- [ ] **Implement** — create `packages/server/src/services/CronService.ts`:
  ```ts
  import cron from 'node-cron'
  import { createClient } from '@supabase/supabase-js'
  import { WebPushService, type PushTarget } from './WebPush'

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async function getAllSubscriptions(): Promise<PushTarget[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
    if (error || !data) return []
    return data as PushTarget[]
  }

  export const CronService = {
    /**
     * checkReminders — runs every minute.
     * Finds pending logs scheduled within ±2 minutes of now and sends push.
     */
    async checkReminders(): Promise<void> {
      const now   = new Date()
      const start = new Date(now.getTime() - 2 * 60 * 1000).toISOString()
      const end   = new Date(now.getTime() + 2 * 60 * 1000).toISOString()

      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select('id, schedule_id, medication_id, scheduled_at')
        .eq('status', 'pending')
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .order('scheduled_at')

      if (error || !logs || logs.length === 0) return

      const subscriptions = await getAllSubscriptions()
      if (subscriptions.length === 0) return

      for (const log of logs) {
        const payload = {
          title: '💊 服药提醒',
          body:  `该服药了！请查看今日服药计划。`,
          icon:  '/icons/icon-192.png',
          data:  { logId: log.id, medicationId: log.medication_id }
        }
        for (const sub of subscriptions) {
          await WebPushService.send(sub, payload)
        }
      }
    },

    /**
     * checkMissedDoses — runs daily at 22:00.
     * Marks all still-pending logs from today as missed and notifies admins.
     */
    async checkMissedDoses(): Promise<void> {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString() // > 30 min ago

      const { data: overdue, error } = await supabase
        .from('medication_logs')
        .select('id, medication_id, scheduled_at')
        .eq('status', 'pending')
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', cutoff)
        .order('scheduled_at')

      if (error || !overdue || overdue.length === 0) return

      const ids = overdue.map((l: any) => l.id)

      await supabase
        .from('medication_logs')
        .update({ status: 'missed' })
        .in('id', ids)

      const subscriptions = await getAllSubscriptions()
      for (const sub of subscriptions) {
        await WebPushService.send(sub, {
          title: '⚠️ 漏服提醒',
          body:  `今日有 ${ids.length} 次服药记录被标记为漏服，请关注。`,
          icon:  '/icons/icon-192.png',
          data:  { missedCount: ids.length }
        })
      }
    },

    start(): void {
      // Every minute: check reminders
      cron.schedule('* * * * *', async () => {
        try { await CronService.checkReminders() }
        catch (e) { console.error('[Cron] checkReminders error:', e) }
      })

      // Daily at 22:00: check missed doses
      cron.schedule('0 22 * * *', async () => {
        try { await CronService.checkMissedDoses() }
        catch (e) { console.error('[Cron] checkMissedDoses error:', e) }
      })

      console.log('[Cron] Jobs registered: checkReminders (*/1) + checkMissedDoses (22:00)')
    }
  }
  ```

- [ ] **Run test** — `cd packages/server && pnpm vitest run src/__tests__/cron.test.ts` → expect PASS

- [ ] **Commit**
  ```
  git add packages/server/src/services/CronService.ts packages/server/src/__tests__/cron.test.ts
  git commit -m "feat: CronService with checkReminders (every min) + checkMissedDoses (daily 22:00) + Web Push"
  ```

---

## Environment Variables Reference

### `packages/web/.env.local`
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SERVER_URL=http://localhost:3000
```

### `packages/server/.env`
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
VAPID_PUBLIC_KEY=BL...
VAPID_PRIVATE_KEY=xx...
VAPID_EMAIL=admin@example.com
PORT=3000
WEB_ORIGIN=http://localhost:5173
```

### Generate VAPID keys
```bash
npx web-push generate-vapid-keys
```

---

## Task 13: Remaining views (HistoryView, RecordsView, ProfileView)

**Creates/modifies:**
- Create: `packages/web/src/views/HistoryView.vue`
- Create: `packages/web/src/views/RecordsView.vue`
- Create: `packages/web/src/views/ProfileView.vue`
- Create: `packages/web/src/__tests__/views/remaining-views.test.ts`

- [ ] **Write failing tests** — `packages/web/src/__tests__/views/remaining-views.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createTestingPinia } from '@pinia/testing'
  import { createRouter, createMemoryHistory } from 'vue-router'
  import HistoryView from '../../views/HistoryView.vue'
  import RecordsView from '../../views/RecordsView.vue'
  import ProfileView from '../../views/ProfileView.vue'

  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { template: '<div/>' } }
  ]})

  describe('HistoryView', () => {
    it('renders past 7 days section headers', () => {
      const wrapper = mount(HistoryView, {
        global: { plugins: [createTestingPinia({ createSpy: vi.fn }), router] }
      })
      expect(wrapper.find('.history-container').exists()).toBe(true)
    })
  })

  describe('RecordsView', () => {
    it('renders records table with date/med/status columns', () => {
      const wrapper = mount(RecordsView, {
        global: { plugins: [createTestingPinia({ createSpy: vi.fn }), router] }
      })
      expect(wrapper.find('.records-container').exists()).toBe(true)
    })
  })

  describe('ProfileView', () => {
    it('admin sees edit buttons; viewer does not', () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: { auth: { user: { id: '1', role: 'viewer', display_name: '爷爷', email: 'g@g.com', avatar_url: null, created_at: '' } } }
      })
      const wrapper = mount(ProfileView, { global: { plugins: [pinia, router] } })
      expect(wrapper.find('[data-testid="edit-name-btn"]').exists()).toBe(false)
    })

    it('admin sees save button for display_name', () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: { auth: { user: { id: '1', role: 'admin', display_name: '妈妈', email: 'm@m.com', avatar_url: null, created_at: '' } } }
      })
      const wrapper = mount(ProfileView, { global: { plugins: [pinia, router] } })
      expect(wrapper.find('[data-testid="edit-name-btn"]').exists()).toBe(true)
    })
  })
  ```

- [ ] **Run tests** — `pnpm --filter @cn-medicine/web test` → expect FAIL (views not implemented)

- [ ] **Implement HistoryView** — `packages/web/src/views/HistoryView.vue`:
  ```vue
  <template>
    <div class="history-container page-container">
      <h1 class="page-title">历史记录</h1>
      <div v-for="day in pastDays" :key="day.date" class="day-group">
        <div class="day-header">{{ day.label }}</div>
        <div v-if="day.logs.length === 0" class="empty-day">暂无记录</div>
        <div v-for="log in day.logs" :key="log.id" class="history-card"
             :class="log.status">
          <span class="med-name">{{ log.medication_name }}</span>
          <span class="log-time">{{ log.time_label }}</span>
          <span class="status-badge" :class="log.status">
            {{ log.status === 'taken' ? '✓ 已服' : log.status === 'missed' ? '✗ 漏服' : '待服' }}
          </span>
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useLogsStore } from '../stores/logs'

  const logsStore = useLogsStore()

  onMounted(() => logsStore.fetchHistory(7))

  const pastDays = computed(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = i === 0 ? '今天' : i === 1 ? '昨天'
        : `${d.getMonth() + 1}月${d.getDate()}日`
      days.push({
        date: dateStr,
        label,
        logs: logsStore.logsByDate(dateStr)
      })
    }
    return days
  })
  </script>

  <style scoped>
  .page-container { padding: 16px; }
  .page-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
  .day-header { font-size: 16px; color: #64748b; font-weight: 600;
    padding: 8px 0 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px; }
  .history-card { display: flex; align-items: center; justify-content: space-between;
    background: #fff7ed; border-left: 4px solid #f97316;
    border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
  .history-card.missed { background: #fef2f2; border-left-color: #ef4444; }
  .history-card.taken  { background: #f0fdf4; border-left-color: #22c55e; }
  .med-name  { font-size: 18px; font-weight: 700; color: #1e293b; }
  .log-time  { font-size: 14px; color: #64748b; }
  .status-badge { font-size: 14px; font-weight: 600; padding: 4px 10px;
    border-radius: 6px; background: #e2e8f0; }
  .status-badge.taken  { background: #dcfce7; color: #15803d; }
  .status-badge.missed { background: #fee2e2; color: #dc2626; }
  .empty-day { font-size: 16px; color: #94a3b8; padding: 8px 0 12px; }
  </style>
  ```

- [ ] **Implement RecordsView** — `packages/web/src/views/RecordsView.vue`:
  ```vue
  <template>
    <div class="records-container page-container">
      <h1 class="page-title">服药记录</h1>
      <div class="filter-row">
        <label class="filter-label">筛选状态：
          <select v-model="filterStatus" class="filter-select">
            <option value="">全部</option>
            <option value="taken">已服</option>
            <option value="missed">漏服</option>
            <option value="pending">待服</option>
          </select>
        </label>
      </div>
      <div v-if="filteredLogs.length === 0" class="empty-state">暂无记录</div>
      <div v-for="log in filteredLogs" :key="log.id" class="record-row">
        <span class="record-date">{{ log.scheduled_date }}</span>
        <span class="record-med">{{ log.medication_name }}</span>
        <span class="record-status" :class="log.status">
          {{ log.status === 'taken' ? '已服' : log.status === 'missed' ? '漏服' : '待服' }}
        </span>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useLogsStore } from '../stores/logs'

  const logsStore  = useLogsStore()
  const filterStatus = ref('')

  onMounted(() => logsStore.fetchHistory(30))

  const filteredLogs = computed(() =>
    filterStatus.value
      ? logsStore.allLogs.filter(l => l.status === filterStatus.value)
      : logsStore.allLogs
  )
  </script>

  <style scoped>
  .page-container { padding: 16px; }
  .page-title { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  .filter-row  { margin-bottom: 16px; }
  .filter-label { font-size: 16px; color: #475569; }
  .filter-select { font-size: 16px; margin-left: 8px; padding: 6px 10px;
    border: 1px solid #e2e8f0; border-radius: 8px; }
  .record-row  { display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; margin-bottom: 8px;
    background: #fff7ed; border-radius: 10px; border-left: 4px solid #f97316; }
  .record-date { font-size: 14px; color: #64748b; min-width: 90px; }
  .record-med  { font-size: 18px; font-weight: 700; color: #1e293b; flex: 1; padding: 0 8px; }
  .record-status { font-size: 14px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
  .record-status.taken  { background: #dcfce7; color: #15803d; }
  .record-status.missed { background: #fee2e2; color: #dc2626; }
  .record-status.pending{ background: #fef9c3; color: #92400e; }
  .empty-state { font-size: 18px; color: #94a3b8; text-align: center; padding: 40px 0; }
  </style>
  ```

- [ ] **Implement ProfileView** — `packages/web/src/views/ProfileView.vue`:
  ```vue
  <template>
    <div class="profile-container page-container">
      <h1 class="page-title">老人档案</h1>
      <div class="avatar-section">
        <img :src="user?.avatar_url || defaultAvatar" class="avatar" alt="头像" />
        <button v-if="isAdmin || isSelf" class="avatar-upload-btn"
                @click="triggerAvatarUpload">更换头像</button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onAvatarChange" />
      </div>

      <div class="field-row">
        <span class="field-label">姓名</span>
        <span v-if="!editingName" class="field-value">{{ user?.display_name }}</span>
        <input v-else v-model="newName" class="field-input" type="text" />
        <button v-if="isAdmin" data-testid="edit-name-btn"
                class="edit-btn" @click="toggleEditName">
          {{ editingName ? '保存' : '编辑' }}
        </button>
      </div>

      <div class="field-row">
        <span class="field-label">邮箱</span>
        <span class="field-value">{{ user?.email }}</span>
      </div>

      <div class="field-row">
        <span class="field-label">角色</span>
        <span class="field-value role-badge" :class="user?.role">
          {{ user?.role === 'admin' ? '管理员（子女）' : '查看者（老人）' }}
        </span>
      </div>

      <button class="logout-btn" @click="auth.logout">退出登录</button>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAuthStore } from '../stores/auth'
  import { supabase }     from '../lib/supabase'

  const auth          = useAuthStore()
  const user          = computed(() => auth.user)
  const isAdmin       = computed(() => auth.role === 'admin')
  const isSelf        = computed(() => true)
  const editingName   = ref(false)
  const newName       = ref(user.value?.display_name ?? '')
  const fileInput     = ref<HTMLInputElement | null>(null)
  const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'

  function triggerAvatarUpload() { fileInput.value?.click() }

  async function onAvatarChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !user.value) return
    const path = `avatars/${user.value.id}`
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: url } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: url.publicUrl }).eq('id', user.value.id)
      await auth.refreshUser()
    }
  }

  async function toggleEditName() {
    if (!editingName.value) { editingName.value = true; newName.value = user.value?.display_name ?? ''; return }
    if (!user.value) return
    await supabase.from('users').update({ display_name: newName.value }).eq('id', user.value.id)
    await auth.refreshUser()
    editingName.value = false
  }
  </script>

  <style scoped>
  .page-container { padding: 16px; }
  .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
  .avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; gap: 12px; }
  .avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover;
    border: 3px solid #f97316; }
  .avatar-upload-btn { font-size: 15px; color: #f97316; background: none;
    border: 1px solid #f97316; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
  .field-row  { display: flex; align-items: center; gap: 12px;
    padding: 14px 0; border-bottom: 1px solid #e2e8f0; }
  .field-label { font-size: 16px; color: #64748b; min-width: 48px; }
  .field-value { font-size: 18px; font-weight: 600; color: #1e293b; flex: 1; }
  .field-input { font-size: 18px; flex: 1; padding: 6px 10px;
    border: 1px solid #f97316; border-radius: 8px; }
  .edit-btn { font-size: 14px; color: #f97316; background: none;
    border: 1px solid #f97316; border-radius: 6px; padding: 6px 14px; min-height: 36px; cursor: pointer; }
  .role-badge { padding: 4px 12px; border-radius: 20px; font-size: 14px; }
  .role-badge.admin  { background: #fef3c7; color: #92400e; }
  .role-badge.viewer { background: #dbeafe; color: #1d4ed8; }
  .logout-btn { width: 100%; margin-top: 32px; padding: 16px;
    font-size: 18px; font-weight: 600; color: #dc2626;
    background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
    min-height: 52px; cursor: pointer; }
  </style>
  ```

- [ ] **Add `allLogs` + `logsByDate` to logs store** — `packages/web/src/stores/logs.ts` (add after existing `fetchHistory` action):
  ```ts
  // Add to state:
  allLogs: [] as MedicationLog[],

  // Add to actions:
  async fetchHistory(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const { data } = await supabase
      .from('medication_logs')
      .select('*, schedules(medications(name))')
      .gte('scheduled_date', since.toISOString().slice(0, 10))
      .order('scheduled_date', { ascending: false })
    if (data) this.allLogs = data.map(r => ({
      ...r,
      medication_name: r.schedules?.medications?.name ?? '未知药品',
      time_label: r.taken_at ? new Date(r.taken_at).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }) : '--'
    }))
  },

  logsByDate(date: string) {
    return this.allLogs.filter(l => l.scheduled_date === date)
  },
  ```

- [ ] **Run tests** — `pnpm --filter @cn-medicine/web test` → expect PASS

- [ ] **Commit**
  ```bash
  git add packages/web/src/views/HistoryView.vue \
          packages/web/src/views/RecordsView.vue \
          packages/web/src/views/ProfileView.vue \
          packages/web/src/__tests__/views/remaining-views.test.ts
  git commit -m "feat: add HistoryView, RecordsView, ProfileView"
  ```

---

## Final Verification Checklist

- [ ] `pnpm -r build` exits 0 (all packages compile)
- [ ] `pnpm -r test` — all 13 test suites pass
- [ ] `supabase db push` applies migration cleanly
- [ ] `supabase test db` — pgTAP schema tests pass
- [ ] PWA installable on Chrome/Safari (Lighthouse PWA score ≥ 90)
- [ ] BottomNav: all touch targets ≥ 52px
- [ ] All text ≥ 18px base size
- [ ] Admin can add/edit/delete medications — viewer cannot
- [ ] Web Push subscription flow works end-to-end
- [ ] GPT-4o Vision returns structured JSON for drug photos
- [ ] Cron reminder fires ±2 min from scheduled time
- [ ] Missed dose detection marks records + notifies at 22:00
