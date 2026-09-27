'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  phone: string;
  concept: string;
  amount: string;
  status: 'nuevo' | 'enviado' | 'negociacion' | 'cerrado';
  note: string;
  created_at?: string;
}

const COLUMNS = [
  { id: 'nuevo', label: '📥 Nuevos / Leads', border: 'border-slate-800' },
  { id: 'enviado', label: '📤 Presupuesto Enviado', border: 'border-indigo-900/60' },
  { id: 'negociacion', label: '🤝 En Negociación', border: 'border-amber-900/60' },
  { id: 'cerrado', label: '🎉 Cerrado / Cobrado', border: 'border-emerald-900/60' },
] as const;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'cotizador'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados modal nuevo prospecto
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newConcept, setNewConcept] = useState('');

  // Estados Cotizador Rápido
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [amount, setAmount] = useState('');

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
    } else if (data) {
      setClients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();

    // Suscripción en tiempo real con Supabase Realtime
    const channel = supabase
      .channel('realtime-clients')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERT, UPDATE y DELETE
          schema: 'public',
          table: 'clients',
        },
        () => {
          // Actualiza el tablero en vivo al instante cuando cambie algo en la base de datos
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Función inteligente para abrir WhatsApp según el dispositivo
  const openWhatsApp = async (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);

    // 1. Copiamos al portapapeles como respaldo de seguridad
    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {
      console.error('No se pudo copiar al portapapeles', err);
    }

    // 2. Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // 3. Celular = App nativa (wa.me) | Computadora = WhatsApp Web directo (web.whatsapp.com)
    const url = isMobile
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const { error } = await supabase.from('clients').insert([
      {
        name: newName,
        phone: newPhone,
        concept: newConcept || 'Servicio general',
        amount: parseFloat(newAmount) || 0,
        status: 'nuevo',
        note: newNote || 'Sin notas'
      }
    ]);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setNewName('');
      setNewPhone('');
      setNewNote('');
      setNewAmount('');
      setNewConcept('');
      setIsModalOpen(false);
    }
  };

  const handleQuoteAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    const formattedPhone = clientPhone.trim() ? clientPhone : '+5493410000000';
    
    const { data, error } = await supabase.from('clients').insert([
      {
        name: clientName,
        phone: formattedPhone,
        concept: serviceDesc || 'Presupuesto general',
        amount: parseFloat(amount) || 0,
        status: 'enviado',
        note: 'Generado desde Cotizador Relámpago'
      }
    ]).select().single();

    if (error) {
      alert('Error al guardar presupuesto: ' + error.message);
      return;
    }

    if (data) {
      const baseUrl = window.location.origin;
      const budgetUrl = `${baseUrl}/p/${data.id}`;
      
      const quoteMessage = `Hola *${clientName}* 👋\n\nAquí puedes revisar el detalle de tu presupuesto:\n${budgetUrl}\n\n💰 *Total:* $${amount}\n\nQuedo a disposición. ¡Muchas gracias!`;
      
      await openWhatsApp(formattedPhone, quoteMessage);

      alert('¡Presupuesto guardado y abierto en WhatsApp!\n\n📋 El mensaje también se copió al portapapeles por seguridad (Ctrl + V).');

      setClientName('');
      setClientPhone('');
      setServiceDesc('');
      setAmount('');
      setActiveTab('kanban');
    }
  };

  const changeStatus = async (id: string, newStatus: Client['status']) => {
    await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', id);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    await supabase.from('clients').delete().eq('id', id);
  };

  // Métricas
  const totalPipeline = clients
    .filter(c => c.status !== 'cerrado')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalCerrado = clients
    .filter(c => c.status === 'cerrado')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/40 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="text-xl font-black tracking-tight text-white">
              Agilizarlo<span className="text-indigo-500">.</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Cloud SaaS</span>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('kanban')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span>📊 Tablero Kanban</span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{clients.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('cotizador')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'cotizador' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span>⚡ Cotizador Web</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400">Pipeline Activo</p>
          <p className="text-emerald-400 font-bold">${totalPipeline.toLocaleString()}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        {activeTab === 'kanban' ? (
          <div>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Tablero de Ventas</h1>
                <p className="text-sm text-slate-400 mt-0.5">Controla el estado de tus presupuestos en la nube en tiempo real.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>+ Nuevo Prospecto</span>
              </button>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Oportunidades Abiertas</p>
                <p className="text-2xl font-black text-white mt-1">{clients.filter(c => c.status !== 'cerrado').length}</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Monto en Negociación</p>
                <p className="text-2xl font-black text-amber-400 mt-1">${totalPipeline.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Cerrado / Cobrado</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">${totalCerrado.toLocaleString()}</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-500">Cargando datos desde la nube...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {COLUMNS.map(col => {
                  const colClients = clients.filter(c => c.status === col.id);
                  return (
                    <div key={col.id} className={`bg-slate-900/40 border ${col.border} rounded-2xl p-4 flex flex-col min-h-[500px]`}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <h3 className="font-bold text-sm text-white">{col.label}</h3>
                        <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          {colClients.length}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1">
                        {colClients.length === 0 ? (
                          <div className="h-32 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                            Sin registros
                          </div>
                        ) : (
                          colClients.map(client => {
                            const kanbanBudgetUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${client.id}` : `/p/${client.id}`;
                            const kanbanMsg = `Hola *${client.name}* 👋\n\nAquí puedes revisar el detalle de tu presupuesto:\n${kanbanBudgetUrl}\n\n💰 *Total:* $${client.amount}\n\nQuedo a disposición. ¡Muchas gracias!`;

                            return (
                              <div key={client.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-md space-y-3 relative group hover:border-slate-700 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-white text-sm">{client.name}</h4>
                                  <button onClick={() => deleteClient(client.id)} className="text-slate-600 hover:text-red-400 text-xs cursor-pointer">✕</button>
                                </div>

                                <p className="text-xs text-slate-300">📝 {client.concept}</p>
                                <p className="text-sm font-black text-emerald-400">${Number(client.amount).toLocaleString()}</p>

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                                  <button
                                    onClick={() => openWhatsApp(client.phone, kanbanMsg)}
                                    className="text-xs bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-400 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    💬 WA
                                  </button>

                                  <Link
                                    href={`/p/${client.id}`}
                                    target="_blank"
                                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-2 py-1 rounded-lg font-medium transition-colors"
                                  >
                                    🔗 Enlace
                                  </Link>
                                </div>

                                <select
                                  value={client.status}
                                  onChange={(e) => changeStatus(client.id, e.target.value as Client['status'])}
                                  className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="nuevo">Mover a: Nuevo</option>
                                  <option value="enviado">Mover a: Enviado</option>
                                  <option value="negociacion">Mover a: Negociación</option>
                                  <option value="cerrado">Mover a: Cerrado 🎉</option>
                                </select>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* COTIZADOR WEB */
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-white">⚡ Cotizador con Enlace Cloud</h1>
              <p className="text-sm text-slate-400 mt-1">Genera un presupuesto interactivo guardado de forma segura en la nube.</p>
            </header>

            <form onSubmit={handleQuoteAndSave} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Cliente / Negocio *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">WhatsApp del Cliente</label>
                <input 
                  type="text"
                  placeholder="Ej: +5493411234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detalle del servicio o producto</label>
                <textarea 
                  rows={3}
                  placeholder="Ej: Mano de obra y materiales..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Importe Total ($) *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: 45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-center active:scale-95 cursor-pointer"
                >
                  <span>🔗 Guardar en la Nube y Enviar por WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Modal Nuevo Prospecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Nuevo Prospecto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre *</label>
                <input type="text" required placeholder="Ej: Juan Pérez" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp *</label>
                <input type="text" required placeholder="Ej: +549341..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Concepto</label>
                <input type="text" placeholder="Ej: Reparación general" value={newConcept} onChange={(e) => setNewConcept(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Monto ($)</label>
                <input type="text" placeholder="Ej: 25000" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nota</label>
                <textarea rows={2} placeholder="Nota rápida..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}