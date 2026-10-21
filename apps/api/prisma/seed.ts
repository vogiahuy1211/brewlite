import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // ── Xóa dữ liệu cũ để seed lại sạch ──
  await prisma.orderItemToppings.deleteMany();
  await prisma.orderItems.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.toppings.deleteMany();
  await prisma.products.deleteMany();
  await prisma.promotions.deleteMany();
  await prisma.users.deleteMany();

  // ── Seed Toppings ──
  const toppings = await Promise.all([
    prisma.toppings.create({ data: { name: 'Trân châu đen', price: 5000 } }),
    prisma.toppings.create({ data: { name: 'Trân châu trắng', price: 5000 } }),
    prisma.toppings.create({ data: { name: 'Kem phô mai', price: 8000 } }),
    prisma.toppings.create({ data: { name: 'Thạch cà phê', price: 6000 } }),
    prisma.toppings.create({ data: { name: 'Pudding trứng', price: 7000 } }),
  ]);
  console.log(`  ✅ ${toppings.length} toppings đã được tạo`);

  // ── Seed Products (15 sản phẩm) ──
  const products = await Promise.all([
    prisma.products.create({
      data: {
        name: 'Cà phê sữa',
        price: 35000,
        image_url: '/img/ca-phe-sua.jpg',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Americano',
        price: 40000,
        image_url: '/img/americano.jpg',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cappuccino',
        price: 45000,
        image_url: '/img/cappuccino.jpg',
        stock: 30,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Matcha Latte',
        price: 50000,
        image_url: '/img/matcha-latte.jpg',
        stock: 25,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Trà sữa trân châu',
        price: 45000,
        image_url: '/img/tra-sua-tran-chau.jpg',
        stock: 40,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Caramel Macchiato',
        price: 55000,
        image_url: '/img/caramel-macchiato.jpg',
        stock: 20,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cold Brew',
        price: 50000,
        image_url: '/img/cold-brew.jpg',
        stock: 15,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Bạc xỉu',
        price: 30000,
        image_url: '/img/bac-xiu.jpg',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cà phê đen đá',
        price: 30000,
        image_url: '/img/ca-phe-den-da.jpg',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cà phê muối',
        price: 40000,
        image_url: '/img/ca-phe-muoi.jpg',
        stock: 45,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cà phê trứng',
        price: 45000,
        image_url: '/img/ca-phe-trung.jpg',
        stock: 30,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Trà đào cam sả',
        price: 45000,
        image_url: '/img/tra-dao-cam-sa.jpg',
        stock: 40,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Trà vải hoa hồng',
        price: 48000,
        image_url: '/img/tra-vai-hoa-hong.jpg',
        stock: 35,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Chocolate Đá Xay',
        price: 55000,
        image_url: '/img/chocolate-da-xay.jpg',
        stock: 25,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Matcha Đá Xay',
        price: 55000,
        image_url: '/img/matcha-da-xay.jpg',
        stock: 25,
      },
    }),
  ]);
  console.log(`  ✅ ${products.length} sản phẩm đã được tạo`);

  // ── Seed Promotions ──
  await prisma.promotions.create({
    data: {
      code: 'WELCOME10',
      discount_amount: 10000,
      is_active: true,
      start_at: new Date('2026-01-01'),
      end_at: new Date('2026-12-31'),
    },
  });
  await prisma.promotions.create({
    data: {
      code: 'SUMMER20',
      discount_amount: 20000,
      is_active: true,
      start_at: new Date('2026-06-01'),
      end_at: new Date('2026-08-31'),
    },
  });
  console.log('  ✅ 2 mã khuyến mãi đã được tạo');

  console.log('\n🎉 Seed dữ liệu hoàn tất!');
  console.log(`   - ${toppings.length} toppings`);
  console.log(`   - ${products.length} sản phẩm`);
  console.log('   - 2 mã khuyến mãi');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
