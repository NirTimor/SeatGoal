import { PrismaClient, EventStatus, SeatStatus, PriceZone } from '@prisma/client';

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
      seatViewImages: {
        'Gate 2': 'https://placehold.co/800x600/0066cc/ffffff?text=West+VIP+View',
        'Gate 6': 'https://placehold.co/800x600/0066cc/ffffff?text=East+Lower+View',
        'Gate 7': 'https://placehold.co/800x600/0066cc/ffffff?text=East+Lower+View',
        'Gate 4': 'https://placehold.co/800x600/0066cc/ffffff?text=North+Stand+View',
        'Gate 10': 'https://placehold.co/800x600/0066cc/ffffff?text=South+Stand+View',
      },
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
      seatViewImages: {
        'North': 'https://placehold.co/800x600/ffcc00/000000?text=Teddy+North+View',
        'South': 'https://placehold.co/800x600/ffcc00/000000?text=Teddy+South+View',
        'East': 'https://placehold.co/800x600/ffcc00/000000?text=Teddy+East+View',
        'West': 'https://placehold.co/800x600/ffcc00/000000?text=Teddy+West+View',
      },
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
      seatViewImages: {
        'North': 'https://placehold.co/800x600/009933/ffffff?text=Sammy+North+View',
        'South': 'https://placehold.co/800x600/009933/ffffff?text=Sammy+South+View',
        'East': 'https://placehold.co/800x600/009933/ffffff?text=Sammy+East+View',
        'West': 'https://placehold.co/800x600/009933/ffffff?text=Sammy+West+View',
      },
    },
  });

  console.log('✅ Created 3 stadiums');

  // Create Seats for Bloomfield Stadium (realistic layout with 13 gates)
  console.log('💺 Creating seats for Bloomfield Stadium...');

  // Bloomfield Stadium has 13 gates organized in 4 stands:
  // West Stand: Gates 1, 2, 3, 12, 13
  // North Stand: Gates 4, 5
  // East Stand: Gates 6, 7, 8, 9 (two-tier)
  // South Stand: Gates 10, 11

  const bloomfieldGates = [
    // West Stand (left side of field)
    { gate: '1', stand: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 150, price: 100, priceZone: PriceZone.STANDARD, label: 'שער 1', viewRating: 4 },
    { gate: '2', stand: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 250, price: 120, priceZone: PriceZone.PREMIUM, label: 'שער 2', viewRating: 5 }, // VIP/Silver section
    { gate: '3', stand: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 350, price: 100, priceZone: PriceZone.STANDARD, label: 'שער 3', viewRating: 4 },
    { gate: '12', stand: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 450, price: 90, priceZone: PriceZone.ECONOMY, label: 'שער 12', viewRating: 3 },
    { gate: '13', stand: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 550, price: 90, priceZone: PriceZone.ECONOMY, label: 'שער 13', viewRating: 3 },

    // North Stand (top - away fans)
    { gate: '4', stand: 'North', rows: 12, seatsPerRow: 30, baseX: 200, baseY: 50, price: 80, priceZone: PriceZone.ECONOMY, label: 'שער 4', viewRating: 3 },
    { gate: '5', stand: 'North', rows: 12, seatsPerRow: 30, baseX: 400, baseY: 50, price: 80, priceZone: PriceZone.ECONOMY, label: 'שער 5', viewRating: 3 },

    // East Stand (right side - two-tier)
    { gate: '6', stand: 'East Lower', rows: 20, seatsPerRow: 28, baseX: 750, baseY: 150, price: 110, priceZone: PriceZone.PREMIUM, label: 'שער 6', viewRating: 5 },
    { gate: '7', stand: 'East Lower', rows: 20, seatsPerRow: 28, baseX: 750, baseY: 350, price: 110, priceZone: PriceZone.PREMIUM, label: 'שער 7', viewRating: 5 },
    { gate: '8', stand: 'East Upper', rows: 15, seatsPerRow: 25, baseX: 800, baseY: 200, price: 90, priceZone: PriceZone.STANDARD, label: 'שער 8', viewRating: 4 },
    { gate: '9', stand: 'East Upper', rows: 15, seatsPerRow: 25, baseX: 800, baseY: 400, price: 90, priceZone: PriceZone.STANDARD, label: 'שער 9', viewRating: 4 },

    // South Stand (bottom)
    { gate: '10', stand: 'South', rows: 12, seatsPerRow: 30, baseX: 200, baseY: 700, price: 85, priceZone: PriceZone.ECONOMY, label: 'שער 10', viewRating: 3 },
    { gate: '11', stand: 'South', rows: 12, seatsPerRow: 30, baseX: 400, baseY: 700, price: 85, priceZone: PriceZone.ECONOMY, label: 'שער 11', viewRating: 3 },
  ];

  const bloomfieldSeats = [];

  for (const gateConfig of bloomfieldGates) {
    for (let rowNum = 1; rowNum <= gateConfig.rows; rowNum++) {
      for (let seatNum = 1; seatNum <= gateConfig.seatsPerRow; seatNum++) {
        // Calculate SVG coordinates for visual positioning
        // Arrange seats in a curved/angled pattern around the field
        let x = gateConfig.baseX;
        let y = gateConfig.baseY;

        // Offset based on row (depth from field)
        const rowOffset = (rowNum - 1) * 3;

        // Offset based on seat number (horizontal spread)
        const seatOffset = (seatNum - 1) * 3;

        // Apply offsets based on stand position
        if (gateConfig.stand.includes('West')) {
          x += rowOffset; // Move away from field
          y += seatOffset; // Spread vertically
        } else if (gateConfig.stand.includes('East')) {
          x -= rowOffset; // Move away from field (opposite direction)
          y += seatOffset; // Spread vertically
        } else if (gateConfig.stand.includes('North')) {
          x += seatOffset; // Spread horizontally
          y += rowOffset; // Move away from field
        } else if (gateConfig.stand.includes('South')) {
          x += seatOffset; // Spread horizontally
          y -= rowOffset; // Move away from field (opposite direction)
        }

        // Determine if seat is accessible (first row and aisle seats)
        const isAisleSeat = seatNum === 1 || seatNum === gateConfig.seatsPerRow;
        const isAccessible = rowNum === 1 && isAisleSeat;

        // Add amenities for accessible seats and specific sections
        const amenities = isAccessible ? {
          wheelchair: true,
          elevator: gateConfig.gate === '2' || gateConfig.gate === '6',
          bathroom: ['2', '6', '10'].includes(gateConfig.gate),
          food: ['2', '6', '7'].includes(gateConfig.gate),
        } : null;

        bloomfieldSeats.push({
          stadiumId: bloomfieldStadium.id,
          section: `Gate ${gateConfig.gate}`,
          row: rowNum.toString(),
          number: seatNum.toString(),
          x: x,
          y: y,
          priceZone: gateConfig.priceZone,
          isAccessible: isAccessible,
          amenities: amenities,
          viewRating: gateConfig.viewRating,
        });
      }
    }
  }

  await prisma.seat.createMany({
    data: bloomfieldSeats,
  });

  console.log(`✅ Created ${bloomfieldSeats.length} seats for Bloomfield Stadium (${bloomfieldGates.length} gates)`);

  // Create Seats for Teddy Stadium with realistic layout
  console.log('💺 Creating seats for Teddy Stadium...');

  // Teddy Stadium has 4 main stands with different characteristics
  const teddyStands = [
    // North Stand - Premium with VIP boxes
    { section: 'North', rows: 18, seatsPerRow: 30, baseX: 200, baseY: 50, priceZone: PriceZone.PREMIUM, viewRating: 5 },
    // South Stand - Standard
    { section: 'South', rows: 20, seatsPerRow: 32, baseX: 200, baseY: 700, priceZone: PriceZone.STANDARD, viewRating: 4 },
    // East Stand - Economy (family section)
    { section: 'East', rows: 25, seatsPerRow: 28, baseX: 750, baseY: 200, priceZone: PriceZone.ECONOMY, viewRating: 3 },
    // West Stand - VIP (covered seating)
    { section: 'West', rows: 15, seatsPerRow: 25, baseX: 50, baseY: 250, priceZone: PriceZone.VIP, viewRating: 5 },
  ];

  const teddySeats = [];

  for (const stand of teddyStands) {
    for (let rowNum = 1; rowNum <= stand.rows; rowNum++) {
      for (let seatNum = 1; seatNum <= stand.seatsPerRow; seatNum++) {
        // Calculate SVG coordinates
        let x = stand.baseX;
        let y = stand.baseY;

        const rowOffset = (rowNum - 1) * 3;
        const seatOffset = (seatNum - 1) * 3;

        if (stand.section === 'West') {
          x += rowOffset;
          y += seatOffset;
        } else if (stand.section === 'East') {
          x -= rowOffset;
          y += seatOffset;
        } else if (stand.section === 'North') {
          x += seatOffset;
          y += rowOffset;
        } else if (stand.section === 'South') {
          x += seatOffset;
          y -= rowOffset;
        }

        // Determine accessibility (first and last row, aisle seats)
        const isAisleSeat = seatNum === 1 || seatNum === stand.seatsPerRow;
        const isAccessible = (rowNum === 1 || rowNum === stand.rows) && isAisleSeat;

        const amenities = isAccessible ? {
          wheelchair: true,
          elevator: stand.section === 'North' || stand.section === 'West',
          bathroom: true,
          food: stand.section === 'North' || stand.section === 'West',
        } : null;

        teddySeats.push({
          stadiumId: teddyStadium.id,
          section: stand.section,
          row: rowNum.toString(),
          number: seatNum.toString(),
          x: x,
          y: y,
          priceZone: stand.priceZone,
          isAccessible: isAccessible,
          amenities: amenities,
          viewRating: stand.viewRating,
        });
      }
    }
  }

  await prisma.seat.createMany({
    data: teddySeats,
  });

  console.log(`✅ Created ${teddySeats.length} seats for Teddy Stadium`);

  // Create Seats for Sammy Ofer Stadium with realistic layout
  console.log('💺 Creating seats for Sammy Ofer Stadium...');

  // Sammy Ofer is a modern stadium with well-distributed sections
  const sammyStands = [
    // North Stand - Home fans premium
    { section: 'North', rows: 22, seatsPerRow: 35, baseX: 150, baseY: 50, priceZone: PriceZone.PREMIUM, viewRating: 5 },
    // South Stand - Away fans
    { section: 'South', rows: 18, seatsPerRow: 30, baseX: 200, baseY: 700, priceZone: PriceZone.ECONOMY, viewRating: 3 },
    // East Stand - VIP and corporate boxes
    { section: 'East', rows: 20, seatsPerRow: 32, baseX: 750, baseY: 180, priceZone: PriceZone.VIP, viewRating: 5 },
    // West Stand - Standard seating
    { section: 'West', rows: 24, seatsPerRow: 30, baseX: 50, baseY: 200, priceZone: PriceZone.STANDARD, viewRating: 4 },
  ];

  const sammySeats = [];

  for (const stand of sammyStands) {
    for (let rowNum = 1; rowNum <= stand.rows; rowNum++) {
      for (let seatNum = 1; seatNum <= stand.seatsPerRow; seatNum++) {
        // Calculate SVG coordinates
        let x = stand.baseX;
        let y = stand.baseY;

        const rowOffset = (rowNum - 1) * 3;
        const seatOffset = (seatNum - 1) * 3;

        if (stand.section === 'West') {
          x += rowOffset;
          y += seatOffset;
        } else if (stand.section === 'East') {
          x -= rowOffset;
          y += seatOffset;
        } else if (stand.section === 'North') {
          x += seatOffset;
          y += rowOffset;
        } else if (stand.section === 'South') {
          x += seatOffset;
          y -= rowOffset;
        }

        // Determine accessibility
        const isAisleSeat = seatNum === 1 || seatNum === stand.seatsPerRow;
        const isAccessible = rowNum === 1 && isAisleSeat;

        const amenities = isAccessible ? {
          wheelchair: true,
          elevator: stand.section === 'North' || stand.section === 'East',
          bathroom: true,
          food: stand.section === 'North' || stand.section === 'East',
        } : null;

        sammySeats.push({
          stadiumId: sammy.id,
          section: stand.section,
          row: rowNum.toString(),
          number: seatNum.toString(),
          x: x,
          y: y,
          priceZone: stand.priceZone,
          isAccessible: isAccessible,
          amenities: amenities,
          viewRating: stand.viewRating,
        });
      }
    }
  }

  await prisma.seat.createMany({
    data: sammySeats,
  });

  console.log(`✅ Created ${sammySeats.length} seats for Sammy Ofer Stadium`);

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
    // Pricing by gate based on Bloomfield Stadium layout
    const priceMap: Record<string, number> = {
      'Gate 1': 100,
      'Gate 2': 120,  // VIP/Silver section
      'Gate 3': 100,
      'Gate 4': 80,   // North Stand (away fans)
      'Gate 5': 80,   // North Stand (away fans)
      'Gate 6': 110,  // East Lower (premium)
      'Gate 7': 110,  // East Lower (premium)
      'Gate 8': 90,   // East Upper
      'Gate 9': 90,   // East Upper
      'Gate 10': 85,  // South Stand
      'Gate 11': 85,  // South Stand
      'Gate 12': 90,
      'Gate 13': 90,
    };

    return {
      eventId: event1.id,
      seatId: seat.id,
      price: priceMap[seat.section] || 100,
      status: SeatStatus.AVAILABLE,
      holdExpiresAt: null,
    };
  });

  await prisma.ticketInventory.createMany({
    data: ticketInventory1,
  });

  console.log(`✅ Created ${ticketInventory1.length} tickets for Event 1`);

  // Create Ticket Inventory for Event 2 (Teddy Stadium)
  const allTeddySeats = await prisma.seat.findMany({
    where: { stadiumId: teddyStadium.id },
  });

  const ticketInventory2 = allTeddySeats.map((seat) => {
    // Price based on price zone
    const priceMap = {
      VIP: 150,
      PREMIUM: 120,
      STANDARD: 90,
      ECONOMY: 70,
    };

    return {
      eventId: event2.id,
      seatId: seat.id,
      price: priceMap[seat.priceZone] || 90,
      status: SeatStatus.AVAILABLE,
      holdExpiresAt: null,
    };
  });

  await prisma.ticketInventory.createMany({
    data: ticketInventory2,
  });

  console.log(`✅ Created ${ticketInventory2.length} tickets for Event 2`);

  // Create Ticket Inventory for Event 3 (Sammy Ofer Stadium)
  const allSammySeats = await prisma.seat.findMany({
    where: { stadiumId: sammy.id },
  });

  const ticketInventory3 = allSammySeats.map((seat) => {
    // Price based on price zone
    const priceMap = {
      VIP: 140,
      PREMIUM: 115,
      STANDARD: 85,
      ECONOMY: 65,
    };

    return {
      eventId: event3.id,
      seatId: seat.id,
      price: priceMap[seat.priceZone] || 85,
      status: SeatStatus.AVAILABLE,
      holdExpiresAt: null,
    };
  });

  await prisma.ticketInventory.createMany({
    data: ticketInventory3,
  });

  console.log(`✅ Created ${ticketInventory3.length} tickets for Event 3`);

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
