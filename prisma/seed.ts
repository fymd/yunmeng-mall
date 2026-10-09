import { PrismaClient, Role, StockStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@yunmeng.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log("Admin user created:", admin.username, "(password: admin123)");

  const userHash = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      email: "demo@yunmeng.local",
      passwordHash: userHash,
      role: Role.USER,
    },
  });
  console.log("Demo user created: demo / user123");

  const categoryData = [
    { name: "GPT", sort: 1 },
    { name: "Claude", sort: 2 },
    { name: "推特", sort: 3 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: cat.name, sort: cat.sort, enabled: true },
      });
      categoryMap[cat.name] = created.id;
    }
  }
  console.log("Categories ready:", Object.keys(categoryMap).join(", "));

  await prisma.product.deleteMany({});

  const products = [
    {
      category: "GPT",
      name: "最新ChatGPT 25X 500 美刀官方充值",
      description: "官方充值渠道，自动发货。",
      price: 3324.5,
      stockStatus: StockStatus.LOW,
      tags: "官方充值,自动发货",
    },
    {
      category: "GPT",
      name: "gpt 学生认证代认证（1天左右开通好）",
      description: "代开通学生认证，约1天完成。",
      price: 119.9,
      stockStatus: StockStatus.PREORDER,
      tags: "代开通,自动发货",
    },
    {
      category: "GPT",
      name: "gpt 5x/50x成品 非官方充值（质保2天）",
      description: "成品账号，质保2天，封号不保。",
      price: 515.57,
      stockStatus: StockStatus.PLENTY,
      tags: "成品账号,在线发货",
    },
    {
      category: "Claude",
      name: "Claude Pro 官方充值",
      description: "Claude Pro 会员官方充值。",
      price: 199.0,
      stockStatus: StockStatus.SUFFICIENT,
      tags: "官方充值",
    },
    {
      category: "推特",
      name: "推特蓝V认证代开",
      description: "推特（X）蓝V认证服务。",
      price: 88.0,
      stockStatus: StockStatus.PLENTY,
      tags: "代开通",
    },
  ];

  for (const p of products) {
    const categoryId = categoryMap[p.category];
    if (!categoryId) continue;
    await prisma.product.create({
      data: {
        categoryId,
        name: p.name,
        description: p.description,
        price: p.price,
        stockStatus: p.stockStatus,
        tags: p.tags,
        enabled: true,
      },
    });
  }
  console.log("Created " + products.length + " sample products");

  const configs = [
    { key: "site_name", value: "云梦AI代充" },
    { key: "announcement_title", value: "公告" },
    {
      key: "announcement_content",
      value: "今日通知：支付时请保持下单IP和付款IP一致。售后请点击右下角客服。",
    },
    { key: "announcement_popup", value: "true" },
    { key: "payment_mode", value: "mock" },
    { key: "customer_service_qq", value: "" },
    { key: "force_login_to_order", value: "true" },
  ];

  for (const c of configs) {
    await prisma.config.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    });
  }
  console.log("Default config seeded");
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
