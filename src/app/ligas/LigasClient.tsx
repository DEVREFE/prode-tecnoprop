'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Plus, Copy, Users, Trophy, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface LigasClientProps {
  myLeagues: any[]
  userId: string
}

export default function LigasClient({ myLeagues, userId }: LigasClientProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Crear liga
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Ingresá un nombre para la liga'); return }
    setCreating(true)
    const supabase = createClient()
    const { error } = await supabase.from('leagues').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      owner_id: userId,
    })
    if (error) { toast.error(error.message); setCreating(false); return }
    // También agregar al creador como miembro
    const { data: league } = await supabase
      .from('leagues').select('id').eq('owner_id', userId).order('created_at', { ascending: false }).limit(1).single()
    if (league) {
      await supabase.from('league_members').insert({ league_id: league.id, user_id: userId })
    }
    toast.success('¡Liga creada!')
    setCreating(false)
    setShowCreate(false)
    setNewName(''); setNewDesc('')
    router.refresh()
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    const res = await fetch('/api/ligas/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: joinCode.trim() }),
    })
    const data = await res.json()
    setJoining(false)
    if (!res.ok) { toast.error(data.error ?? 'Error al unirse'); return }
    toast.success(`¡Te uniste a "${data.league_name}"!`)
    setShowJoin(false)
    setJoinCode('')
    router.refresh()
  }

  const copyCode = async (code: string, id: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar'
    await navigator.clipboard.writeText(`${siteUrl}/ligas/unirse?codigo=${code}`)
    setCopiedId(id)
    toast.success('Link copiado')
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <main className="min-h-screen">
      <div className="section pt-4 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Mis Ligas</h1>
            <p className="text-sm text-white/40">Competí con amigos, familia o el trabajo</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setShowCreate(true)} className="btn-brand py-3 flex items-center justify-center gap-2 text-sm">
            <Plus size={16} /> Crear liga
          </button>
          <button onClick={() => setShowJoin(true)} className="btn-ghost py-3 flex items-center justify-center gap-2 text-sm">
            <Users size={16} /> Unirme con código
          </button>
        </div>

        {/* Lista de ligas */}
        {myLeagues.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-white/40 mb-2">Todavía no sos parte de ninguna liga</p>
            <p className="text-xs text-white/25">Creá una o pedile el código a un amigo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myLeagues.map((member: any) => {
              const league = member.leagues
              if (!league) return null
              const memberCount = league.league_members?.[0]?.count ?? 0
              const isOwner = league.owner_id === userId

              return (
                <div key={league.id} className="glass-card p-5 hover:border-celeste/25 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-celeste/10 flex items-center justify-center text-2xl flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold truncate">{league.name}</h3>
                        {isOwner && (
                          <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      {league.description && (
                        <p className="text-xs text-white/40 mb-2">{league.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <span><Users size={11} className="inline mr-1" />{memberCount}/{league.max_members} miembros</span>
                        <span>Código: <span className="font-mono text-celeste">{league.invite_code}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                    <button
                      onClick={() => copyCode(league.invite_code, league.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold flex-1 justify-center transition-all',
                        copiedId === league.id
                          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                          : 'btn-ghost'
                      )}
                    >
                      {copiedId === league.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                      {copiedId === league.id ? 'Copiado!' : 'Copiar link de invitación'}
                    </button>
                    <a
                      href={`https://wa.me/?text=Sumate a mi liga "${league.name}" en el Prode Tecnoprop 2026 🌍⚽ Usá el código: ${league.invite_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                    >
                      📱 WhatsApp
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal crear liga */}
      {showCreate && (
        <Modal title="Crear nueva liga" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Nombre de la liga *
              </label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Oficina Tecnoprop" maxLength={60} className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Descripción (opcional)
              </label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Ej: Solo para el equipo de ventas" maxLength={120} className="input-dark" />
            </div>
            <p className="text-xs text-white/30">
              Se generará un código único para que tus amigos puedan unirse.
            </p>
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-brand w-full py-3 disabled:opacity-40">
              {creating ? 'Creando...' : 'Crear liga →'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal unirse */}
      {showJoin && (
        <Modal title="Unirme a una liga" onClose={() => setShowJoin(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                Código de invitación
              </label>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123" maxLength={6} className="input-dark font-mono text-center tracking-[6px] text-lg uppercase" />
            </div>
            <button onClick={handleJoin} disabled={joining || !joinCode} className="btn-brand w-full py-3 disabled:opacity-40">
              {joining ? 'Uniéndome...' : 'Unirme →'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}

// Modal genérico
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 top-accent" style={{ position: 'relative' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
