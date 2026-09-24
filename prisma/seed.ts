import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create or update single admin user
  const hashedPassword = await bcrypt.hash('bidang1himafi', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log('✅ Single Admin user ready:', admin.username)

  // Create sample books
  const books = await Promise.all([
    prisma.book.upsert({
      where: { id: 'book-1' },
      update: {},
      create: {
        id: 'book-1',
        title: 'Pemrograman Web Modern',
        category: 'Teknologi',
        totalCopies: 5,
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-2' },
      update: {},
      create: {
        id: 'book-2',
        title: 'Matematika Diskrit',
        category: 'Matematika',
        totalCopies: 3,
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-3' },
      update: {},
      create: {
        id: 'book-3',
        title: 'Algoritma dan Struktur Data',
        category: 'Teknologi',
        totalCopies: 4,
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-4' },
      update: {},
      create: {
        id: 'book-4',
        title: 'Basis Data Relasional',
        category: 'Teknologi',
        totalCopies: 2,
      },
    }),
    prisma.book.upsert({
      where: { id: 'book-5' },
      update: {},
      create: {
        id: 'book-5',
        title: 'Pengantar Kecerdasan Buatan',
        category: 'Teknologi',
        totalCopies: 3,
      },
    }),
  ])
  console.log('✅ Sample books created:', books.length)

  // Create sample members
  const members = await Promise.all([
    prisma.member.upsert({
      where: { nim: '2021001' },
      update: {},
      create: {
        id: 'member-1',
        name: 'Budi Santoso',
        nim: '2021001',
        active: true,
      },
    }),
    prisma.member.upsert({
      where: { nim: '2021002' },
      update: {},
      create: {
        id: 'member-2',
        name: 'Siti Rahayu',
        nim: '2021002',
        active: true,
      },
    }),
    prisma.member.upsert({
      where: { nim: '2021003' },
      update: {},
      create: {
        id: 'member-3',
        name: 'Ahmad Fauzi',
        nim: '2021003',
        active: true,
      },
    }),
    prisma.member.upsert({
      where: { nim: '2021004' },
      update: {},
      create: {
        id: 'member-4',
        name: 'Dewi Putri',
        nim: '2021004',
        active: true,
      },
    }),
  ])
  console.log('✅ Sample members created:', members.length)

  // Create sample loans (some overdue)
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

  const loans = await Promise.all([
    prisma.bookLoan.upsert({
      where: { id: 'loan-1' },
      update: {},
      create: {
        id: 'loan-1',
        memberId: 'member-1',
        bookId: 'book-1',
        borrowedAt: fiveDaysAgo,
        dueDate: twoDaysAgo, // overdue
        status: 'borrowed',
      },
    }),
    prisma.bookLoan.upsert({
      where: { id: 'loan-2' },
      update: {},
      create: {
        id: 'loan-2',
        memberId: 'member-2',
        bookId: 'book-2',
        borrowedAt: tenDaysAgo,
        dueDate: fiveDaysAgo, // overdue
        status: 'borrowed',
      },
    }),
    prisma.bookLoan.upsert({
      where: { id: 'loan-3' },
      update: {},
      create: {
        id: 'loan-3',
        memberId: 'member-3',
        bookId: 'book-3',
        borrowedAt: now,
        dueDate: inFiveDays,
        status: 'borrowed',
      },
    }),
  ])
  console.log('✅ Sample loans created:', loans.length)

  console.log('🎉 Seeding complete!')
  console.log('📋 Login credentials: admin / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
