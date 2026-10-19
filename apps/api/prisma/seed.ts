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

  // ── Seed Products ──
  const products = await Promise.all([
    prisma.products.create({
      data: {
        name: 'Cà phê sữa',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Americano',
        price: 40000,
        image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
        stock: 50,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cappuccino',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
        stock: 30,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Matcha Latte',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400',
        stock: 25,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Trà sữa trân châu',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400',
        stock: 40,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Caramel Macchiato',
        price: 55000,
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        stock: 20,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Cold Brew',
        price: 50000,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
        stock: 15,
      },
    }),
    prisma.products.create({
      data: {
        name: 'Bạc xỉu',
        price: 30000,
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        stock: 50,
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
