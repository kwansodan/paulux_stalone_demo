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
    email: "testadmin01@gmail.com",
    password: "SecureAdmin456!",
    role: UserRole.ADMIN,
  },
];

const services = [
  {
    name: "Deep Tissue Massage",
    description: "Intense massage targeting deep muscle layers",
    durationMinutes: 60,
    price: 80,
  },
  {
    name: "Hair Styling",
    description: "Professional wash, blow-dry and styling",
    durationMinutes: 45,
    price: 40,
  },
  {
    name: "Classic Manicure",
    description: "Nail shaping, cuticle care and polish",
    durationMinutes: 30,
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
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.booking.deleteMany() //delete booking before services
    await prisma.service.deleteMany()
    await prisma.businessHour.deleteMany()
    await prisma.blockedDate.deleteMany()


    // create admin users
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
    const dbServices = await prisma.service.createManyAndReturn({
      data: services
    })

    // create business hours
    await prisma.businessHour.createMany({
      data: businessHours
    })

    // create one blocked date
    await prisma.blockedDate.create({
      data: {
        date: new Date("2026-02-10"), // some holiday
        reason: "Maintenance",
      },
    })

    // create bookings for each service
    const dbBookings = await prisma.booking.createManyAndReturn({
      data: bookings.map((b) => {
        const serviceBooked = dbServices.find((service) => service.name === b.serviceName);

        // create bookings for services that exist
        if (!serviceBooked) {
          console.log(`Invalid Service booking for ${b.bookingReference}`)
          return null
        }

        return ({
          bookingReference: b.bookingReference,
          clientName: b.clientName,
          clientEmail: b.clientEmail,
          clientPhone: b.clientPhone,

          serviceId: serviceBooked.id,

          bookingDate: b.bookingDate,
          bookingTime: b.bookingTime,

          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        })
      }).filter(item => item !== null)
    })

    // create payments for each booking
    await prisma.payment.createMany({
      data: dbBookings.map((b, i) => ({
        bookingId: b.id,
        provider: PaymentProvider.MANUAL,
        providerRef: `MANUAL-00${i + 1}`,
        amount: b.serviceId ? (dbServices.find(s => s.id === b.serviceId)?.price || 0) : 0,
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
