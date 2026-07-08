# 服药提醒智能体 · 设计文档

**日期：** 2026-07-08  
**项目：** cnMeicine  
**工作目录：** D:/cncode/cnMeicine

---

## 1. 项目概述

面向老人家的服药提醒 Web App，子女负责管理药品和提醒时间，老人和子女都能收到推送通知、查看和标记服药记录。AI（GPT-4o Vision）辅助识别药盒照片，自动填写药品信息。

**核心目标：**
- 老人只需大字界面，一键标记"已服用"
- 子女拍照识别药品，设置提醒时间
- 双方手机同时收到提醒推送
- 子女能实时看到老人是否已服药

---

## 2. 用户角色与权限

| 功能 | 子女（admin）| 老人（viewer）|
|------|------------|--------------|
| 今日用药 — 查看 | ✅ | ✅ |
| 今日用药 — 标记已服 | ✅ | ✅ |
| 历史记录 — 查看 | ✅ | ✅ |
| 药品管理 — 增删改查 | ✅ | ❌ 只读 |
| 提醒时间 — 增删改查 | ✅ | ❌ 只读 |
| 服药记录 — 查看 | ✅ | ✅ |
| 老人档案 — 增删改查 | ✅ | ❌ 只能改自己头像/昵称 |

---

## 3. 技术栈

### 架构：Monorepo（前后端分离）

```
cnMeicine/
├── packages/
│   ├── web/          # Vue 3 + Vite + PWA
│   └── server/       # Node.js + Hono（BFF）
├── docs/
└── package.json      # pnpm workspace
```

### 前端：`packages/web`
- **框架：** Vue 3 + Vite
- **PWA：** vite-plugin-pwa（Service Worker + Web Push 接收）
- **路由：** Vue Router 4
- **状态：** Pinia
- **UI：** 暖色系（橙粉渐变）+ 适老化设计（正文 ≥ 18px，按钮高度 ≥ 52px）
- **HTTP：** @supabase/supabase-js（直连 DB）+ axios（调用 Hono server）

### 后端：`packages/server`
- **框架：** Hono（Node.js）
- **职责：** 保护 GPT-4o API key、处理图片上传与识别、Web Push 推送调度、定时任务
- **定时：** node-cron（每分钟检查提醒、每天 22:00 检查漏服）
- **推送：** web-push 库
- **图片存储：** Supabase Storage

### 数据库：Supabase
- PostgreSQL + Supabase Auth + Supabase Realtime + Supabase Storage
- 前端通过 supabase-js 直接操作 DB（受 RLS 保护）
- 敏感操作（GPT-4o 调用）走 Hono server

### 部署（建议）
- `packages/server` → Railway 或 Render
- `packages/web` → Vercel 或 Netlify

---

## 4. 页面结构

所有用户（admin 和 viewer）可见相同的 6 个页面，admin 有编辑权限，viewer 只读。

```
/               今日用药（主页）
/history        历史记录
/meds           药品管理
/schedule       提醒时间设置
/records        服药记录查看
/profile        老人档案
/login          登录
```

---

## 5. 数据模型

### `users`（Supabase Auth 扩展）
```sql
id          uuid PRIMARY KEY  -- Supabase Auth user id
email       text UNIQUE
role        text              -- 'admin' | 'viewer'
display_name text
avatar_url  text
created_at  timestamptz
```

### `medications`（药品）
```sql
id          uuid PRIMARY KEY
name        text NOT NULL     -- 药品名称
dosage      text              -- 剂量（如 "0.5g"）
unit        text              -- 单位（片/粒/ml）
image_url   text              -- 药盒照片
notes       text              -- 备注
created_by  uuid REFERENCES users(id)
created_at  timestamptz
```

### `schedules`（提醒时间）
```sql
id              uuid PRIMARY KEY
medication_id   uuid REFERENCES medications(id)
time_of_day     text   -- 'morning' | 'noon' | 'evening' | 'bedtime'
time            time   -- 08:00
dose_amount     int    -- 几粒/几片
active          boolean DEFAULT true
```

### `medication_logs`（服药记录）
```sql
id              uuid PRIMARY KEY
schedule_id     uuid REFERENCES schedules(id)
user_id         uuid REFERENCES users(id)  -- 谁标记的
scheduled_date  date
taken_at        timestamptz   -- 实际服药时间（NULL = 未服）
status          text  -- 'pending' | 'taken' | 'missed'
```

### `push_subscriptions`（Web Push 订阅）
```sql
id          uuid PRIMARY KEY
user_id     uuid REFERENCES users(id)
endpoint    text UNIQUE
p256dh      text    -- Web Push 加密密钥
auth        text    -- Web Push 认证密钥
created_at  timestamptz
```

---

## 6. 核心功能流程

### 6.1 AI 识别药品（GPT-4o Vision）
```
1. 子女在「药品管理」页点击「拍照识别」
2. 上传图片到 Hono server（multipart/form-data）
3. Hono 将图片转 base64，调用 GPT-4o Vision API
   Prompt：识别药品名称、规格、用法用量
4. 返回结构化 JSON：{ name, dosage, unit, usage_suggestion }
5. 前端预填表单，子女确认/修改后保存到 Supabase
```

### 6.2 每日提醒推送
```
1. Hono node-cron 每分钟执行
2. 查询 schedules 表：time = 当前时间 AND active = true
3. 检查今日 medication_logs 是否已有记录（避免重复推送）
4. 查询 push_subscriptions 表（所有已订阅用户）
5. web-push 库批量发送 Web Push 通知
6. 通知内容：「💊 该吃[药品名]了！[剂量]」
7. 用户点通知 → 打开 App 今日用药页
```

### 6.3 标记已服用
```
1. 用户点击药品卡片上「待服用」按钮
2. 前端直接调用 supabase-js：
   UPDATE medication_logs SET status='taken', taken_at=now()
3. Supabase Realtime 广播变更
4. 所有在线的 admin/viewer 实时看到卡片变绿
```

### 6.4 漏服检测
```
1. Hono node-cron 每天 22:00 执行
2. 查询当天所有 status='pending' 的 medication_logs
3. 批量更新为 status='missed'
4. 向所有 admin 用户发送漏服 Web Push 通知
   内容：「⚠️ [老人名]今天有[N]次用药未记录」
```

### 6.5 登录与权限
```
1. Supabase Auth（邮箱 + 密码）
2. 登录后读取 users.role
3. Vue Router 路由守卫：未登录跳转 /login
4. Supabase RLS（行级安全）在数据库层强制权限
   - viewer：medications/schedules 只能 SELECT
   - admin：全部权限
5. Hono API：验证 Supabase JWT，检查 role
```

### 6.6 PWA 安装与推送订阅
```
1. 用户首次访问网站
2. Service Worker 注册（vite-plugin-pwa 自动生成）
3. 浏览器提示「添加到主屏幕」
4. 用户授权通知权限
5. 前端获取 Push Subscription（endpoint + keys）
6. 保存到 push_subscriptions 表
7. 后续：Hono server 使用 VAPID keys + web-push 推送
```

---

## 7. UI/UX 设计规范

### 适老化要求
- 正文字体 ≥ 18px，标题 ≥ 22px
- 可点击按钮高度 ≥ 52px，宽度充足
- 高对比度配色，避免浅灰文字
- 操作确认弹窗（防止误触）

### 视觉风格
- **主色调：** 橙粉渐变（`#f97316` → `#ec4899`）
- **背景：** 白色 `#ffffff`
- **卡片：** 暖橙浅色 `#fff7ed`，左边框强调色
- **成功状态：** 绿色 `#22c55e`
- **字体：** 系统默认（PingFang SC / Noto Sans SC）

### 今日用药页面（卡片式列表）
- 顶部渐变头部：日期 + 今日标题 + 未服数量
- 每颗药独立卡片，左侧橙色边框
- 卡片内：药品名（大字）+ 时间/剂量（小字）+ 状态按钮（右侧）
- 状态：`已服`（绿色）/ `待服用`（橙色可点击）/ `未到时间`（灰色）

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|---------|
| GPT-4o 识别失败 | 返回错误提示，允许手动填写 |
| Web Push 推送失败 | 记录失败日志，不中断其他用户推送 |
| 网络断线 | Service Worker 缓存关键页面，离线可查看 |
| 重复推送 | 推送前检查当日是否已推送同一 schedule |
| 并发标记 | Supabase 乐观锁 + RLS 保证数据一致 |

---

## 9. 测试策略

- **单元测试：** Hono API 路由（Vitest）
- **集成测试：** Supabase 数据库操作（本地 Supabase CLI）
- **端到端：** 关键流程（登录、标记已服、AI 识别）手动测试
- **PWA 推送：** Chrome DevTools Application 面板模拟推送

---

## 10. 实现顺序建议

1. Monorepo 脚手架 + Supabase 项目初始化
2. 数据库 Schema + RLS 策略
3. Supabase Auth 登录页
4. 今日用药页面（静态数据先跑通）
5. 药品管理 CRUD
6. 提醒时间设置
7. Hono server + GPT-4o Vision 接口
8. Web Push 推送（VAPID 配置 + 订阅流程）
9. 定时任务（提醒推送 + 漏服检测）
10. PWA 安装配置
11. 权限控制（RLS + 前端路由守卫）
12. 适老化 UI 细化
