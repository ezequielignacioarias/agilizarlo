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
  payment_link?: string;
  preference_id?: string;
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

  // Estados modal nuevo prospecto (Solo Leads)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');

  // Estados Cotizador Web (Con selector de prospecto existente)
  const [selectedClientId, setSelectedClientId] = useState('');
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

    const channel = supabase
      .channel('realtime-clients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        () => {
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const url = isMobile
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  // 📥 CREAR SOLO LEAD EN EL KANBAN
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const { error } = await supabase.from('clients').insert([
      {
        name: newName,
        phone: newPhone,
        concept: 'Pendiente de cotización',
        amount: 0,
        status: 'nuevo',
        note: newNote || 'Sin notas',
        payment_link: null
      }
    ]);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setNewName('');
      setNewPhone('');
      setNewNote('');
      setIsModalOpen(false);
      fetchClients();
    }
  };

  // ⚡ GENERAR LINK DE MERCADO PAGO PARA UN CLIENTE YA EXISTENTE EN EL KANBAN
  const handleGenerateLinkForExisting = async (client: Client) => {
    try {
      const res = await fetch('/api/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: client.concept || 'Servicio general',
          unit_price: parseFloat(client.amount) || 0,
          client_name: client.name,
          client_id: client.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('¡Link de Mercado Pago generado y asociado con éxito!');
        fetchClients();
      } else {
        alert('Error al generar el link: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error('Error al conectar con la API de preferencias:', err);
      alert('No se pudo conectar con el servidor.');
    }
  };

  // Manejar selección de prospecto existente en el Cotizador
  const handleSelectProspectChange = (id: string) => {
    setSelectedClientId(id);
    if (!id) {
      setClientName('');
      setClientPhone('');
      return;
    }
    const found = clients.find(c => c.id === id);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
    }
  };

  // COTIZAR: ACTUALIZA EL PROSPECTO EXISTENTE O CREA UNO NUEVO SI NO SE SELECCIONÓ NINGUNO
  const handleQuoteAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    const formattedPhone = clientPhone.trim() ? clientPhone : '+5493410000000';
    let targetClientId = selectedClientId;

    if (targetClientId) {
      // 1. Actualizar el cliente existente que ya estaba en el Kanban
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          concept: serviceDesc || 'Presupuesto general',
          amount: parseFloat(amount) || 0,
          status: 'enviado',
        })
        .eq('id', targetClientId);

      if (updateError) {
        alert('Error al actualizar el presupuesto: ' + updateError.message);
        return;
      }
    } else {
      // 2. Si no seleccionó ninguno, crear uno nuevo directamente en 'enviado'
      const { data: newClient, error: insertError } = await supabase.from('clients').insert([
        {
          name: clientName,
          phone: formattedPhone,
          concept: serviceDesc || 'Presupuesto general',
          amount: parseFloat(amount) || 0,
          status: 'enviado',
          note: 'Generado desde Cotizador Web',
        }
      ]).select().single();

      if (insertError || !newClient) {
        alert('Error al guardar presupuesto: ' + (insertError?.message || 'Desconocido'));
        return;
      }
      targetClientId = newClient.id;
    }

    // Generar link de Mercado Pago asociado a ese ID
    try {
      const res = await fetch('/api/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: serviceDesc || 'Presupuesto general',
          unit_price: parseFloat(amount),
          client_name: clientName,
          client_id: targetClientId,
        }),
      });

      const mpData = await res.json();
      if (!res.ok) {
        console.error('Error al generar link de Mercado Pago:', mpData.error);
      }
    } catch (err) {
      console.error('No se pudo conectar con la API de preferencias:', err);
    }

    const baseUrl = window.location.origin;
    const budgetUrl = `${baseUrl}/p/${targetClientId}`;
    
    const quoteMessage = `Hola *${clientName}* 👋\n\nAquí puedes revisar el detalle de tu presupuesto y abonar:\n${budgetUrl}\n\n💰 *Total:* $${amount}\n\nQuedo a disposición. ¡Muchas gracias!`;
    
    await openWhatsApp(formattedPhone, quoteMessage);

    alert('¡Presupuesto aplicado y link de Mercado Pago creado con éxito!');

    // Limpiar formulario
    setSelectedClientId('');
    setClientName('');
    setClientPhone('');
    setServiceDesc('');
    setAmount('');
    setActiveTab('kanban');
    fetchClients();
  };

  // 🛡️ REGLAS DE VALIDACIÓN INTELIGENTE PARA EL CAMBIO DE ESTADO
  const changeStatus = async (id: string, newStatus: Client['status']) => {
    const targetClient = clients.find(c => c.id === id);
    if (!targetClient) return;

    // Si se suelta en la misma columna, no hacemos nada
    if (targetClient.status === newStatus) return;

    // Regla 1: No permitir mover a "Presupuesto Enviado" o superior si el monto es 0 o está vacío
    if ((newStatus === 'enviado' || newStatus === 'negociacion') && (!targetClient.amount || Number(targetClient.amount) === 0)) {
      alert('❌ No puedes avanzar este lead: el importe es $0 o no tiene una cotización cargada.');
      return;
    }

    // Regla 2: Advertencia al mover a "Cerrado / Cobrado" si no tiene link de pago generado
    if (newStatus === 'cerrado' && !targetClient.payment_link) {
      const confirmClose = window.confirm(
        '⚠️ Este cliente no tiene un link de pago de Mercado Pago registrado. ¿Deseas marcarlo como Cerrado de todas formas?'
      );
      if (!confirmClose) return;
    }

    // Regla 3: Advertencia si se saca de la columna de cobrados
    if (targetClient.status === 'cerrado' && newStatus !== 'cerrado') {
      const confirmed = window.confirm(
        '⚠️ ¡Atención! Este cliente ya está Cerrado / Cobrado. Si lo mueves de columna, los números de cobranzas del dashboard se verán afectados. ¿Deseas continuar?'
      );
      if (!confirmed) return;
    }

    // Si pasa todas las validaciones, actualizamos en la base de datos
    await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', id);
    fetchClients();
  };

  const deleteClient = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
  };

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
                <p className="text-sm text-slate-400 mt-0.5">Arrastra las tarjetas de forma inteligente entre columnas.</p>
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
                    <div 
                      key={col.id} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const clientId = e.dataTransfer.getData('text/plain');
                        if (clientId) {
                          changeStatus(clientId, col.id as Client['status']);
                        }
                      }}
                      className={`bg-slate-900/40 border ${col.border} rounded-2xl p-4 flex flex-col min-h-[500px] transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <h3 className="font-bold text-sm text-white">{col.label}</h3>
                        <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          {colClients.length}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1">
                        {colClients.length === 0 ? (
                          <div className="h-32 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                            Arrastra tarjetas aquí
                          </div>
                        ) : (
                          colClients.map(client => {
                            const kanbanBudgetUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${client.id}` : `/p/${client.id}`;
                            const kanbanMsg = `Hola *${client.name}* 👋\n\nAquí puedes revisar el detalle de tu presupuesto y abonar:\n${kanbanBudgetUrl}\n\n💰 *Total:* $${client.amount}\n\nQuedo a disposición. ¡Muchas gracias!`;

                            return (
                              <div 
                                key={client.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', client.id);
                                }}
                                className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-md space-y-3 relative group hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-white text-sm">{client.name}</h4>
                                  <button onClick={() => deleteClient(client.id)} className="text-slate-600 hover:text-red-400 text-xs cursor-pointer">✕</button>
                                </div>

                                <p className="text-xs text-slate-300">📝 {client.concept}</p>
                                <p className="text-sm font-black text-emerald-400">${Number(client.amount).toLocaleString()}</p>

                                {client.payment_link ? (
                                  <div className="flex items-center justify-between bg-sky-950/40 border border-sky-900/50 rounded-lg p-2 text-xs">
                                    <span className="text-sky-400 truncate max-w-[140px]">💳 Link activo</span>
                                    <a 
                                      href={client.payment_link} 
                                      target="_blank" 
                                      className="text-sky-300 hover:underline font-semibold"
                                    >
                                      Abrir ↗
                                    </a>
                                  </div>
                                ) : (!client.amount || Number(client.amount) === 0) ? (
                                  <button
                                    onClick={() => {
                                      setSelectedClientId(client.id);
                                      setClientName(client.name);
                                      setClientPhone(client.phone);
                                      setActiveTab('cotizador');
                                    }}
                                    className="w-full text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    📝 Cotizar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateLinkForExisting(client)}
                                    className="w-full text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                                  >
                                    ⚡ Generar Link MP
                                  </button>
                                )}

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
          /* COTIZADOR WEB CON SELECCIÓN DE PROSPECTO EXISTENTE */
          <div className="max-w-2xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-white">⚡ Cotizador con Link Automático de MP</h1>
              <p className="text-sm text-slate-400 mt-1">Selecciona un prospecto existente de tu Kanban o escribe uno nuevo para generar su presupuesto.</p>
            </header>

            <form onSubmit={handleQuoteAndSave} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
              
              {/* Selector de Prospecto del Kanban */}
              <div>
                <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">📌 Seleccionar Prospecto Existente (Opcional)</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectProspectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-900/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Crear nuevo o ingresar datos manuales --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.concept}) - Estado: {c.status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Si eliges uno de aquí, se actualizará su presupuesto en lugar de duplicarlo.</p>
              </div>

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
                  <span>⚡ Cotizar, Generar Link MP y Enviar por WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Modal Nuevo Prospecto (Solo Leads) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Nuevo Prospecto (Lead)</h2>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nota inicial</label>
                <textarea rows={2} placeholder="Nota rápida sobre el cliente..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer">Guardar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}