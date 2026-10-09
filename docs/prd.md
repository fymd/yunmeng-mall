# 云梦AI代充商城 — Product Requirements Document

> Reference site: https://yunmeng.fit/  
> Project repo: https://github.com/fymd/yunmeng-mall  
> Status: Draft (awaiting approval)

## Problem / Opportunity

Users need a convenient, trustworthy platform to purchase digital AI-related goods and services (ChatGPT / Claude account recharges, official top-ups, student certifications, Twitter/X related products, etc.). Existing sites like yunmeng.fit demonstrate demand for category browsing, clear stock status, fast order query, and basic customer support. We will build a clean, modern, open-source alternative focused on core shopping experience and reliable order flow.

## Goals

- Provide a fast, mobile-friendly catalog of digital AI goods with category filter and search
- Support user registration / login and basic order placement
- Show real-time-ish stock status and price
- Allow order query by order number or logged-in user
- Deliver a production-ready MVP that can be self-hosted or extended

## Non-goals (Out of Scope for MVP)

- Real payment gateway integration (Alipay / WeChat Pay) — will use mock / manual confirmation for MVP
- Automatic fulfillment / card delivery system
- Admin backend with full inventory management UI (basic seed data + simple admin API is enough)
- Multi-language support beyond Chinese
- Complex recommendation / coupon / membership system
- Live chat system (placeholder link is enough)

## Users & Personas

**Primary**  
- AI power users / students who need ChatGPT / Claude / related digital accounts or top-ups. Care about price, stock availability, delivery speed, and order status transparency.

**Secondary**  
- Site operator who needs to add/edit products and view orders.

## User Stories

1. As a visitor, I want to browse products by category (GPT / Claude / Twitter etc.) so that I can quickly find what I need.
   - Acceptance:
     - Given I open the homepage, When I click a category, Then only products of that category are shown.
     - Stock status and price are clearly visible.

2. As a visitor, I want to search products by keyword so that I can find specific items.
   - Acceptance:
     - Given I type a keyword and click search, Then matching products appear.

3. As a user, I want to register / login so that I can place and track orders.
   - Acceptance:
     - Given valid credentials, When I login, Then I am authenticated and can access order history.

4. As a logged-in user, I want to place an order for a product so that I can purchase it.
   - Acceptance:
     - Given a product with available stock, When I click buy and confirm, Then an order is created with unique order number and status "pending".

5. As a user (logged-in or with order number), I want to query my order status so that I know the progress.
   - Acceptance:
     - Given a valid order number, When I query, Then order details (status, product, time) are shown.

6. As a site operator, I want basic product and order data so that the shop can run.
   - Acceptance:
     - Seed data for categories and sample products exists.
     - Simple way to list orders (API or minimal admin page).

## Functional Requirements

1. Homepage with left category sidebar + product list (name, price, stock badge, buy button).
2. Category filter and keyword search.
3. Product detail modal or page showing description, price, stock, buy action.
4. User registration and login (email/username + password, JWT or session).
5. Create order (requires login for MVP).
6. Order query page (by order number + optional login view).
7. Simple announcement / notice banner or modal (static for MVP).
8. Responsive design (desktop + mobile).
9. Basic admin capability: list products, list orders (can be API-only for MVP).

## Non-functional Requirements

- Performance: Homepage and catalog load < 2s on normal connection.
- Security: Passwords hashed, JWT/session protected routes, no secrets in frontend.
- Accessibility: Basic semantic HTML, readable contrast.
- Scalability: Design allows later addition of real payment and auto-fulfillment.
- Tech preference (suggested, open to discussion): Next.js / React + Node/Express or Nest + SQLite/Postgres + Tailwind.

## Constraints & Assumptions

- MVP will use mock payment (order stays "pending" until manually marked).
- Stock is simple integer or status enum (plenty / low / sold-out / pre-order).
- Chinese UI as primary language.
- Single operator for now.

## Success Metrics

- User can complete the flow: browse → login → place order → query order.
- All core acceptance criteria pass automated or manual tests.
- Code is clean, tested, and ready for further extension.

## Open Questions

1. Preferred tech stack? (I suggest Next.js full-stack or React + Express + SQLite for simplicity)
2. Do you want a real (even test) payment integration in MVP, or pure mock is OK?
3. Should the admin be a separate simple page or just API + seed scripts?
4. Any specific product categories or sample data you want seeded?
5. Domain / deployment target preference (Vercel, self-hosted, Docker)?

---

**Next step after approval**: Proceed to sdlc-plan (task breakdown + architecture).
