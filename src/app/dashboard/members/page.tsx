'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import UserHeader from '@/components/UserHeader'

interface Member {
  id: string; name: string; nim: string; photo: string | null
  address?: string; phone?: string; expiredAt?: string; active: boolean
  loans: Array<{ id: string }>
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const [form, setForm] = useState({ name:'', nim:'', address:'', phone:'', expiredAt:'' })
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const url = search ? `/api/members?search=${encodeURIComponent(search)}` : '/api/members'
    const res = await fetch(url)
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchMembers, 300)
    return () => clearTimeout(t)
  }, [fetchMembers])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('nim', form.nim)
      if (form.address) fd.append('address', form.address)
      if (form.phone) fd.append('phone', form.phone)
      if (form.expiredAt) fd.append('expiredAt', form.expiredAt)
      if (photoFile) fd.append('photo', photoFile)
      const res = await fetch('/api/members', { method:'POST', body: fd })
      const data = await res.json()
      if (!res.ok) showToast(data.error, 'error')
      else {
        showToast('Anggota berhasil ditambahkan')
        setShowModal(false)
        setForm({ name:'', nim:'', address:'', phone:'', expiredAt:'' })
        setPhotoFile(null); setPreview(null)
        fetchMembers()
      }
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus anggota "${name}"?`)) return
    const res = await fetch(`/api/members/${id}`, { method:'DELETE' })
    if (res.ok) { showToast('Anggota dihapus'); fetchMembers() }
    else showToast('Gagal menghapus anggota', 'error')
  }

  async function toggleActive(member: Member) {
    const res = await fetch(`/api/members/${member.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ active: !member.active })
    })
    if (res.ok) { fetchMembers() }
  }

  function handlePrintCard(member: Member) {
    window.open(`/dashboard/members/${member.id}/card`, '_blank')
  }

  return (
    <>
      {toast && <div className={`toast ${toast.type}`}>{toast.type==='success'?'✅':'❌'} {toast.msg}</div>}

      <div className="topbar">
        <div className="topbar-title">Daftar Anggota</div>
        <div className="topbar-right">
          <button id="add-member-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Tambah Anggota
          </button>
          <UserHeader />
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="search-bar" style={{ flex:1, maxWidth:360 }}>
            <span>🔍</span>
            <input
              placeholder="Cari nama atau NIM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted">{members.length} anggota</span>
        </div>

        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div style={{textAlign:'center',padding:'60px'}}>
                <div className="loading-spinner" style={{margin:'0 auto 12px',width:32,height:32}}/>
                <p style={{color:'var(--gray-400)'}}>Memuat data...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>Belum ada anggota</h3>
                <p>Klik &quot;Tambah Anggota&quot; untuk menambahkan anggota baru</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama</th>
                    <th>NIM</th>
                    <th>Buku Dipinjam</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        {m.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photo} alt={m.name} width={40} height={40}
                            className="member-avatar" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>
                        ) : (
                          <div className="member-avatar-placeholder">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="font-semibold">{m.name}</td>
                      <td><span className="badge badge-gray">{m.nim}</span></td>
                      <td>{m.loans?.length ?? 0} buku</td>
                      <td>
                        <span className={`badge ${m.active ? 'badge-green' : 'badge-gray'}`}>
                          {m.active ? '✓ Aktif' : '○ Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-outline btn-sm" title="Cetak Kartu Anggota"
                            onClick={() => handlePrintCard(m)}>
                            🪪 Kartu
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleActive(m)}>
                            {m.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.name)}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>➕ Tambah Anggota</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Foto Anggota</label>
                  <div className="photo-upload" onClick={() => fileRef.current?.click()}>
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Preview" className="photo-preview" />
                    ) : (
                      <div style={{color:'var(--ws-dark)'}}>
                        <div style={{fontSize:32,marginBottom:8}}>📷</div>
                        <p style={{fontSize:13}}>Klik untuk unggah foto</p>
                        <p style={{fontSize:11,color:'var(--gray-400)'}}>JPG, PNG max 2MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange}/>
                </div>
                <div className="form-group">
                  <label htmlFor="member-name">Nama Lengkap</label>
                  <input id="member-name" type="text" placeholder="Masukkan nama lengkap"
                    value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
                </div>
                <div className="form-group">
                  <label htmlFor="member-nim">NIM</label>
                  <input id="member-nim" type="text" placeholder="Masukkan NIM"
                    value={form.nim} onChange={e=>setForm(f=>({...f,nim:e.target.value}))} required/>
                </div>
                <div className="form-group">
                  <label htmlFor="member-address">Alamat</label>
                  <input id="member-address" type="text" placeholder="Contoh: Jl. Kalimantan No.37, Jember"
                    value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label htmlFor="member-phone">Nomor Telepon</label>
                  <input id="member-phone" type="text" placeholder="Contoh: 08xxxxxxxxxx"
                    value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label htmlFor="member-expired">Masa Berlaku Kartu</label>
                  <input id="member-expired" type="date"
                    value={form.expiredAt} onChange={e=>setForm(f=>({...f,expiredAt:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="loading-spinner"/>Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
