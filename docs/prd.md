# 云梦AI代充商城 / Yunmeng AI Top-up Mall — Product Requirements Document

> Reference site: https://yunmeng.fit/  
> Project repo: https://github.com/fymd/yunmeng-mall  
> Status: **Updated Draft** (awaiting final approval)  
> Language: 中文 + English

---

## 1. Problem / Opportunity 问题与机会

**中文**  
用户需要一个方便、可信的平台购买 AI 相关数字商品与服务（ChatGPT / Claude 账号充值、官方充值、学生认证、推特相关产品等）。参考站点 yunmeng.fit 展示了分类浏览、库存状态、订单查询和基础客服的需求。我们将构建一个干净、现代、可自托管的开源替代方案，聚焦核心购物体验与可靠订单流程。

**English**  
Users need a convenient and trustworthy platform to purchase AI-related digital goods and services (ChatGPT/Claude account recharges, official top-ups, student certifications, Twitter/X related products, etc.). The reference site yunmeng.fit demonstrates demand for category browsing, clear stock status, order querying, and basic support. We will build a clean, modern, self-hostable open-source alternative focused on core shopping experience and reliable order flow.

---

## 2. Goals 目标

**中文**
- 提供快速、移动友好的数字商品目录（分类筛选 + 搜索）
- 支持用户注册/登录与基础下单
- 清晰展示价格与库存状态
- 支持订单号或登录后查询订单
- 提供可配置的管理中心，方便运营与后续切换真实支付
- 交付可自托管、可扩展的生产级 MVP

**English**
- Fast, mobile-friendly digital goods catalog with category filter and search
- User registration/login and basic order placement
- Clear price and stock status display
- Order query by order number or logged-in user
- Configurable admin/config center for operations and future real-payment switch
- Production-ready, self-hostable, extensible MVP

---

## 3. Non-goals (Out of Scope for MVP) 非目标

**中文**
- 真实支付网关完整上线（MVP 使用模拟支付，预留切换能力）
- 自动发卡 / 自动发货系统
- 复杂优惠券、会员、推荐系统
- 多语言完整支持（界面以中文为主，文档与关键文案支持中英）
- 完整即时聊天系统（仅预留客服链接）

**English**
- Full real payment gateway go-live (MVP uses mock payment with easy switch capability)
- Automatic card/key delivery system
- Complex coupons, membership, or recommendation systems
- Full multi-language support (UI primarily Chinese; docs and key texts bilingual)
- Full live-chat system (only placeholder customer-service link)

---

## 4. Users & Personas 用户与画像

**Primary / 主要用户**  
AI 重度用户 / 学生，需要购买 ChatGPT、Claude 等相关数字账号或充值。关注价格、库存、发货速度与订单透明度。

**Secondary / 次要用户**  
站点运营者，需要管理商品、订单、公告与支付配置。

---

## 5. User Stories 用户故事

1. **浏览与筛选**  
   As a visitor, I want to browse products by category and search by keyword so that I can quickly find what I need.  
   作为访客，我希望按分类浏览并用关键词搜索商品，以便快速找到所需。

2. **注册 / 登录**  
   As a user, I want to register and login so that I can place and track orders.  
   作为用户，我希望注册并登录，以便下单和跟踪订单。

3. **下单**  
   As a logged-in user, I want to place an order so that I can purchase a digital product.  
   作为已登录用户，我希望能下单购买数字商品。

4. **订单查询**  
   As a user, I want to query order status by order number or from my account so that I know the progress.  
   作为用户，我希望通过订单号或账号查询订单状态，了解进度。

5. **运营管理**  
   As an operator, I want a config center to manage products, orders, announcements, and payment settings so that I can operate the shop without code changes.  
   作为运营者，我希望有配置中心管理商品、订单、公告和支付设置，无需改代码即可运营。

---

## 6. Functional Requirements 功能需求

### 前台
1. 首页：左侧分类 + 商品列表（名称、价格、库存徽章、购买按钮）
2. 分类筛选 + 关键词搜索
3. 商品详情（弹窗或页面）：描述、价格、库存、购买
4. 用户注册 / 登录（用户名或邮箱 + 密码）
5. 下单（登录后）→ 生成唯一订单号，状态初始为“待支付/模拟已支付”
6. 订单查询页（订单号查询 + 登录后我的订单）
7. 公告 / 通知展示
8. 响应式设计（桌面 + 手机）

### 配置中心 / Admin（登录后可见，需管理员权限）

**可修改的元素：**

| 分类 | 可配置项 | 说明 |
|------|----------|------|
| **网站基础** | 网站名称、Logo、客服联系方式（QQ/微信/链接） | 顶部展示与售后入口 |
| **公告** | 公告标题与内容、是否弹窗显示 | 支持首页通知 |
| **分类管理** | 新增/编辑/排序/启用禁用分类 | 如 GPT、Claude、推特 |
| **商品管理** | 新增/编辑/上下架、价格、库存状态、描述、标签 | 库存状态：非常多 / 充足 / 即将售罄 / 可预订 |
| **订单管理** | 订单列表、修改状态（待支付→已支付→已发货→已完成）、备注 | 支持手动标记发货/退款 |
| **支付配置** | 支付模式（模拟 / 支付宝 / 微信）、各支付渠道的 AppID、密钥、证书路径、回调地址 | MVP 默认模拟；后续可切换真实支付且无需改代码 |
| **系统设置** | 是否强制登录下单、订单超时时间 | 可选 |

敏感支付密钥建议支持环境变量覆盖，配置中心仅做可视化管理。

---

## 7. Non-functional Requirements 非功能需求

- **Performance**：首页与目录加载 < 2 秒
- **Security**：密码哈希、JWT/Session 保护、支付密钥不暴露前端、管理员权限控制
- **Accessibility**：基础语义化 HTML + 足够对比度
- **Extensibility**：支付抽象层，方便后续无缝切换真实支付
- **Tech Stack Suggestion**：Next.js（全栈）或 React + Express/Nest + SQLite/Postgres + Tailwind（最终可讨论）

---

## 8. Constraints & Assumptions 约束与假设

- MVP 使用**模拟支付**（下单后可直接标记已支付，或保持待支付由管理员手动确认）
- 真实支付通过配置中心或环境变量切换，代码层已预留 Provider 接口
- 库存使用简单状态枚举 + 可选数量
- 界面以中文为主
- 单管理员运营即可

---

## 9. Success Metrics 成功指标

- 用户可完整走通：浏览 → 登录 → 下单 → 查询订单
- 管理员可在配置中心完成商品、订单、公告、支付模式的管理
- 所有核心验收标准通过测试
- 代码结构清晰，真实支付切换成本低

---

## 10. Open Questions 待确认问题

1. 技术栈最终确认？（建议 Next.js 全栈 或 React + Express + SQLite）
2. 管理后台是否需要独立登录入口与角色权限？（建议：简单管理员账号即可）
3. 是否需要预设具体商品分类与示例数据？
4. 部署偏好？（Vercel / Docker 自托管 / 其他）

---

**Next step after final approval**：进入 `sdlc-plan` 阶段（任务拆分 + 架构设计）。

请审核本 PRD，确认或提出修改意见。
