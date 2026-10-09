import { PrismaClient, Role, StockStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: Role.ADMIN },
    create: {
      username: "admin",
      email: "admin@yunmeng.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log("Admin user:", admin.username, "(password: admin123)");

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
  console.log("Demo user: demo / user123");

  const categoryData = [
    { name: "GPT", sort: 1 },
    { name: "Claude", sort: 2 },
    { name: "推特", sort: 3 },
    { name: "其它", sort: 99 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { sort: cat.sort, enabled: true },
      });
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name: cat.name, sort: cat.sort, enabled: true },
      });
      categoryMap[cat.name] = created.id;
    }
  }
  console.log("Categories:", Object.keys(categoryMap).join(", "));

  // Only wipe products when there are no orders (safe re-seed for demo)
  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    await prisma.product.deleteMany({});
  } else {
    console.log("Skip product reset: existing orders =", orderCount);
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const products = [
      {
        category: "GPT",
        name: "ChatGPT Plus 官方充值（1 个月）",
        description:
          "官方渠道代充 ChatGPT Plus。下单后请在备注中填写需要充值的账号邮箱，工作时间内通常 30 分钟内完成。",
        price: 148.0,
        stockStatus: StockStatus.PLENTY,
        tags: "官方充值,自动发货",
      },
      {
        category: "GPT",
        name: "ChatGPT 学生认证代开通",
        description:
          "代开通 OpenAI 学生优惠。一般 1 个工作日内完成，请提供有效学生邮箱。",
        price: 119.9,
        stockStatus: StockStatus.PREORDER,
        tags: "代开通,学生认证",
      },
      {
        category: "GPT",
        name: "ChatGPT 成品账号（质保 48 小时）",
        description:
          "成品账号，质保 2 天。封号不保，请勿修改密码或绑定手机。",
        price: 89.0,
        stockStatus: StockStatus.SUFFICIENT,
        tags: "成品账号,在线发货",
      },
      {
        category: "Claude",
        name: "Claude Pro 官方充值",
        description: "Anthropic Claude Pro 会员官方充值，需提供登录邮箱。",
        price: 199.0,
        stockStatus: StockStatus.SUFFICIENT,
        tags: "官方充值",
      },
      {
        category: "Claude",
        name: "Claude API 额度代充",
        description: "Claude API 余额代充，按美元面额计价，以实际到账为准。",
        price: 75.0,
        stockStatus: StockStatus.LOW,
        tags: "API,代充",
      },
      {
        category: "推特",
        name: "X（推特）蓝 V 认证代开",
        description: "X Premium 蓝标认证代开通服务，具体时效以客服确认为准。",
        price: 88.0,
        stockStatus: StockStatus.PLENTY,
        tags: "代开通,蓝V",
      },
      {
        category: "其它",
        name: "客服加急处理（单次）",
        description: "订单加急处理服务，下单后请联系右下角客服并提供订单号。",
        price: 15.0,
        stockStatus: StockStatus.PLENTY,
        tags: "增值服务",
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
    console.log("Created", products.length, "sample products");
  } else {
    console.log("Products already present:", productCount);
  }

  const configs: { key: string; value: string }[] = [
    { key: "site_name", value: "云梦AI代充" },
    { key: "announcement_title", value: "欢迎使用" },
    {
      key: "announcement_content",
      value:
        "本站为演示商城，支付为模拟流程。下单后请在订单备注或联系客服提供账号信息。售后请点击右下角客服。",
    },
    { key: "announcement_popup", value: "true" },
    { key: "payment_mode", value: "mock" },
    { key: "customer_service_qq", value: "10000" },
    { key: "customer_service_wechat", value: "yunmeng_cs" },
    { key: "customer_service_link", value: "" },
    { key: "force_login_to_order", value: "true" },
    { key: "order_timeout_minutes", value: "30" },
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
