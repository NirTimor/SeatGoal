import { PrismaClient, EventStatus, SeatStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketInventory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.stadium.deleteMany();

  // Create Stadiums
  console.log('🏟️  Creating stadiums...');

  const bloomfieldStadium = await prisma.stadium.create({
    data: {
      name: 'Bloomfield Stadium',
      nameHe: 'אצטדיון בלומפילד',
      city: 'Tel Aviv',
      cityHe: 'תל אביב',
      capacity: 29400,
      svgMap: null, // SVG map can be added later
    },
  });

  const teddyStadium = await prisma.stadium.create({
    data: {
      name: 'Teddy Stadium',
      nameHe: 'אצטדיון טדי',
      city: 'Jerusalem',
      cityHe: 'ירושלים',
      capacity: 31733,
      svgMap: null,
    },
  });

  const sammy = await prisma.stadium.create({
    data: {
      name: 'Sammy Ofer Stadium',
      nameHe: 'אצטדיון סמי עופר',
      city: 'Haifa',
      cityHe: 'חיפה',
      capacity: 30780,
      svgMap: null,
    },
  });

  console.log('✅ Created 3 stadiums');

  // Create Seats for Bloomfield Stadium (simplified - 4 sections)
  console.log('💺 Creating seats for Bloomfield Stadium...');

  const sections = ['A', 'B', 'C', 'D'];
  const rows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const seatsPerRow = 20;

  const bloomfieldSeats = [];

  for (const section of sections) {
    for (const row of rows) {
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        bloomfieldSeats.push({
          stadiumId: bloomfieldStadium.id,
          section,
          row,
          number: seatNum.toString(),
          x: null, // SVG coordinates can be added later
          y: null,
        });
      }
    }
  }

  await prisma.seat.createMany({
    data: bloomfieldSeats,
  });

  console.log(`✅ Created ${bloomfieldSeats.length} seats for Bloomfield Stadium`);

  // Create Seats for Teddy Stadium (simplified - 3 sections)
  console.log('💺 Creating seats for Teddy Stadium...');

  const teddySections = ['North', 'South', 'East'];
  const teddySeats = [];

  for (const section of teddySections) {
    for (const row of rows) {
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        teddySeats.push({
          stadiumId: teddyStadium.id,
          section,
          row,
          number: seatNum.toString(),
          x: null,
          y: null,
        });
      }
    }
  }

  await prisma.seat.createMany({
    data: teddySeats,
  });

  console.log(`✅ Created ${teddySeats.length} seats for Teddy Stadium`);

  // Create Events
  console.log('⚽ Creating events...');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      stadiumId: bloomfieldStadium.id,
      homeTeam: 'Maccabi Tel Aviv',
      homeTeamHe: 'מכבי תל אביב',
      awayTeam: 'Hapoel Beer Sheva',
      awayTeamHe: 'הפועל באר שבע',
      eventDate: nextWeek,
      saleStartDate: now,
      saleEndDate: nextWeek,
      status: EventStatus.ON_SALE,
      description: 'Israeli Premier League - An exciting match between two top teams!',
      descriptionHe: 'ליגת העל הישראלית - משחק מרגש בין שתי קבוצות מובילות!',
      imageUrl: 'https://placehold.co/800x400/0066cc/ffffff?text=Maccabi+vs+Hapoel',
    },
  });

  const event2 = await prisma.event.create({
    data: {
      stadiumId: teddyStadium.id,
      homeTeam: 'Beitar Jerusalem',
      homeTeamHe: 'בית"ר ירושלים',
      awayTeam: 'Maccabi Haifa',
      awayTeamHe: 'מכבי חיפה',
      eventDate: twoWeeks,
      saleStartDate: now,
      saleEndDate: twoWeeks,
      status: EventStatus.ON_SALE,
      description: 'Top of the table clash - Don\'t miss this crucial match!',
      descriptionHe: 'עימות בפסגה - אל תפספסו את המשחק החשוב הזה!',
      imageUrl: 'https://placehold.co/800x400/ffcc00/000000?text=Beitar+vs+Maccabi',
    },
  });

  const event3 = await prisma.event.create({
    data: {
      stadiumId: sammy.id,
      homeTeam: 'Maccabi Haifa',
      homeTeamHe: 'מכבי חיפה',
      awayTeam: 'Hapoel Tel Aviv',
      awayTeamHe: 'הפועל תל אביב',
      eventDate: threeWeeks,
      saleStartDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      saleEndDate: threeWeeks,
      status: EventStatus.UPCOMING,
      description: 'Derby match at Sammy Ofer Stadium',
      descriptionHe: 'דרבי באצטדיון סמי עופר',
      imageUrl: 'https://placehold.co/800x400/009933/ffffff?text=Haifa+Derby',
    },
  });

  console.log('✅ Created 3 events');

  // Create Ticket Inventory for Event 1
  console.log('🎫 Creating ticket inventory for events...');

  const allBloomfieldSeats = await prisma.seat.findMany({
    where: { stadiumId: bloomfieldStadium.id },
  });

  const ticketInventory1 = allBloomfieldSeats.map((seat) => {
    // Vary prices by section
    let price = 80; // Base price in ILS
    if (seat.section === 'A') price = 120; // VIP section
    if (seat.section === 'D') price = 60; // Budget section

    return {
      eventId: event1.id,
      seatId: seat.id,
      price,
      status: SeatStatus.AVAILABLE,
      holdExpiresAt: null,
    };
  });

  await prisma.ticketInventory.createMany({
    data: ticketInventory1,
  });

  console.log(`✅ Created ${ticketInventory1.length} tickets for Event 1`);

  // Create Ticket Inventory for Event 2
  const allTeddySeats = await prisma.seat.findMany({
    where: { stadiumId: teddyStadium.id },
  });

  const ticketInventory2 = allTeddySeats.map((seat) => {
    let price = 90;
    if (seat.section === 'North') price = 130;
    if (seat.section === 'East') price = 70;

    return {
      eventId: event2.id,
      seatId: seat.id,
      price,
      status: SeatStatus.AVAILABLE,
      holdExpiresAt: null,
    };
  });

  await prisma.ticketInventory.createMany({
    data: ticketInventory2,
  });

  console.log(`✅ Created ${ticketInventory2.length} tickets for Event 2`);

  // Mark some seats as SOLD or HELD for testing
  console.log('🔒 Marking some seats as sold/held for testing...');

  const someInventory = await prisma.ticketInventory.findMany({
    take: 50,
    where: { eventId: event1.id },
  });

  // Mark 20 as sold
  await prisma.ticketInventory.updateMany({
    where: {
      id: {
        in: someInventory.slice(0, 20).map((t) => t.id),
      },
    },
    data: {
      status: SeatStatus.SOLD,
    },
  });

  // Mark 10 as held (with expiration in 10 minutes)
  const holdExpiry = new Date(now.getTime() + 10 * 60 * 1000);
  await prisma.ticketInventory.updateMany({
    where: {
      id: {
        in: someInventory.slice(20, 30).map((t) => t.id),
      },
    },
    data: {
      status: SeatStatus.HELD,
      holdExpiresAt: holdExpiry,
    },
  });

  console.log('✅ Marked 20 seats as SOLD and 10 as HELD');

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log('================');

  const stadiumCount = await prisma.stadium.count();
  const seatCount = await prisma.seat.count();
  const eventCount = await prisma.event.count();
  const inventoryCount = await prisma.ticketInventory.count();

  console.log(`Stadiums: ${stadiumCount}`);
  console.log(`Seats: ${seatCount}`);
  console.log(`Events: ${eventCount}`);
  console.log(`Ticket Inventory: ${inventoryCount}`);
  console.log('\n✨ Database seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
