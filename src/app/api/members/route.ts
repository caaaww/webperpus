import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const members = await prisma.member.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nim: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    include: {
      loans: {
        where: { status: 'borrowed' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const nim = formData.get('nim') as string
    const photoFile = formData.get('photo') as File | null
    const address = formData.get('address') as string | null
    const phone = formData.get('phone') as string | null
    const expiredAtStr = formData.get('expiredAt') as string | null

    if (!name || !nim) {
      return NextResponse.json({ error: 'Nama dan NIM diperlukan' }, { status: 400 })
    }

    // Check NIM uniqueness
    const existing = await prisma.member.findUnique({ where: { nim } })
    if (existing) {
      return NextResponse.json({ error: 'NIM sudah terdaftar' }, { status: 400 })
    }

    let photoPath: string | undefined

    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const mimeType = photoFile.type || 'image/jpeg'
      photoPath = `data:${mimeType};base64,${base64}`
    }

    const member = await prisma.member.create({
      data: {
        name, nim,
        photo: photoPath,
        address: address || null,
        phone: phone || null,
        expiredAt: expiredAtStr ? new Date(expiredAtStr) : null,
        active: true,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
