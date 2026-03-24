import 'dotenv/config';
import { prisma } from "@/lib/prisma";
import { generateBookingReference, hashPassword } from "@/utils/helpers";
import { BookingStatus, PaymentProvider, PaymentStatus, UserRole } from "@generated/prisma/enums";



const admins = [
  {
    username: "Test Admin",
    email: "abuishmaelyusif204@gmail.com",
    password: "AdminPass123!",
    role: UserRole.ADMIN,
  },
  {
    username: "Text Admin 01",
    email: "jojoyawson573@gmail.com",
    password: "SecureAdmin456!",
    role: UserRole.ADMIN,
  },
];

const services = [
  {
    name: "Deep Tissue Massage",
    description: "Intense massage targeting deep muscle layers",
    durationMinutes: 60,
    minDepositPercent: 30,
    price: 80,
  },
  {
    name: "Hair Styling",
    description: "Professional wash, blow-dry and styling",
    durationMinutes: 45,
    minDepositPercent: 20,
    price: 40,
  },
  {
    name: "Classic Manicure",
    description: "Nail shaping, cuticle care and polish",
    durationMinutes: 30,
    minDepositPercent: 100,
    price: 25,
  },
]

const bookings = [
  {
    bookingReference: generateBookingReference(),
    clientName: "Emma Wilson",
    clientEmail: "emma@gmail.com",
    clientPhone: "555-1111",
    serviceName: "Deep Tissue Massage",
    bookingDate: "2026-02-01",
    bookingTime: "09:00",
  },
  {
    bookingReference: generateBookingReference(),
    clientName: "David Lee",
    clientEmail: "david@gmail.com",
    clientPhone: "555-2222",
    serviceName: "Hair Styling",
    bookingDate: "2026-02-01",
    bookingTime: "10:30",
  },
  {
    bookingReference: generateBookingReference(),
    clientName: "Sophia Adams",
    clientEmail: "sophia@gmail.com",
    clientPhone: "555-3333",
    serviceName: "Classic Manicure",
    bookingDate: "2026-02-01",
    bookingTime: "11:30",
  }
]

const businessHours = [
  { dayOfWeek: 0, startTime: "", endTime: "", isOpen: false }, // Sunday
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Monday
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tuesday
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wednesday
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Friday
  { dayOfWeek: 6, startTime: "10:00", endTime: "14:00" }, // Saturday
]

async function seed() {
  const t0 = performance.now()
  try {

    // delete all existing resources
    console.log("Deleting sessions...");
    await prisma.session.deleteMany()
    await prisma.passwordResetToken.deleteMany()
    console.log("Deleting users...");
    await prisma.user.deleteMany()
    console.log("Deleting payments...");
    await prisma.payment.deleteMany()
    console.log("Deleting bookings...");
    // Workaround for deleteMany hanging: delete individually
    const existingBookings = await prisma.booking.findMany({ select: { id: true } });
    console.log(`Found ${existingBookings.length} bookings to delete.`);
    for (const b of existingBookings) {
      await prisma.booking.delete({ where: { id: b.id } });
    }
    // await prisma.booking.deleteMany() //delete booking before services
    console.log("Deleting services...");
    await prisma.service.deleteMany()
    console.log("Deleting business hours...");
    await prisma.businessHour.deleteMany()
    console.log("Deleting blocked dates...");
    await prisma.blockedDate.deleteMany()


    // create admin users
    console.log("Creating admins...");
    const adminsWithHashedPassword = await Promise.all(admins.map(async (admin) => {
      const hashedPassword = await hashPassword(admin.password);
      return ({
        username: admin.username,
        email: admin.email,
        passwordHash: hashedPassword,
        role: admin.role,
      })
    }))
    await prisma.user.createMany({
      data: adminsWithHashedPassword
    })

    // create services 
    console.log("Creating services...");
    const dbServices = await Promise.all(services.map(s => prisma.service.create({ data: s })));

    // create business hours
    console.log("Creating business hours...");
    await prisma.businessHour.createMany({
      data: businessHours
    })

    // create one blocked date
    console.log("Creating blocked dates...");
    await prisma.blockedDate.create({
      data: {
        date: new Date("2026-02-10"), // some holiday
        reason: "Maintenance",
      },
    })

    // create bookings for each service
    console.log("Creating bookings...");
    const dbBookings = (await Promise.all(bookings.map(async (b) => {
      const serviceBooked = dbServices.find((service) => service.name === b.serviceName);

      // create bookings for services that exist
      if (!serviceBooked) {
        console.log(`Invalid Service booking for ${b.bookingReference}`)
        return null
      }

      return prisma.booking.create({
        data: {
          bookingReference: b.bookingReference,
          clientName: b.clientName,
          clientEmail: b.clientEmail,
          clientPhone: b.clientPhone,

          services: {
            create: [
              {
                serviceId: serviceBooked.id,
                priceAtBooking: serviceBooked.price,
                durationAtBooking: serviceBooked.durationMinutes
              }
            ]
          },

          bookingDate: b.bookingDate,
          bookingTime: b.bookingTime,

          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: { services: true }
      })
    }))).filter((item): item is NonNullable<typeof item> => item !== null)

    // create payments for each booking
    console.log("Creating payments...");
    await prisma.payment.createMany({
      data: dbBookings.map((b, i) => ({
        bookingId: b.id,
        provider: PaymentProvider.MANUAL,
        providerRef: `MANUAL-00${i + 1}`,
        amount: b.services?.[0]?.priceAtBooking || 0,
        currency: "GHS",
        status: PaymentStatus.PAID,
        rawPayload: { note: "Seed payment" },
      }))
    })

    const t1 = performance.now()
    console.log(`Seed data inserted successfully🔥🥂. Finished in (${t1 - t0} ms)`);
  } catch (error) {
    console.error("Error seeding polaris db: ", error)
  } finally {
    await prisma.$disconnect()
  }
}


seed()
