'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  phone: string;
  concept: string;
  amount: string;
  status: string;
  note: string;
}

export default function PublicBudgetPage() {
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchClient() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setClient(data);
        if (data.status === 'cerrado') setApproved(true);
      }
      setLoading(false);
    }
    fetchClient();
  }, [id]);

  const handleApprove = async () => {
    if (!client) return;

    // 1. Actualizar el estado en Supabase a 'cerrado' (esto moverá el Kanban en vivo)
    await supabase
      .from('clients')
      .update({ status: 'cerrado' })
      .eq('id', client.id);

    setApproved(true);

    // 2. Número de WhatsApp del negocio (puedes cambiarlo si es necesario)
    const businessPhone = '+5493413448235'; 
    const cleanPhone = businessPhone.replace(/[^0-9]/g, '');
    
    const message = `¡Hola! 👋 El cliente *${client.name}* acaba de **APROBAR** el presupuesto por *$${client.amount}* (${client.concept}).`;
    const encodedMessage = encodeURIComponent(message);

    // 3. Detectar si es un dispositivo móvil o computadora
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // 4. Abrir la URL correspondiente de forma directa
    const url = isMobile
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm">
        Cargando presupuesto...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm">
        Presupuesto no encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-white">
            Agilizarlo<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-xs text-slate-400">Detalle de tu presupuesto</p>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400">Cliente / Negocio</span>
            <span className="font-bold text-white text-sm">{client.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400">Concepto</span>
            <span className="font-medium text-slate-200 text-sm text-right">{client.concept}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Importe Total</span>
            <span className="font-black text-emerald-400 text-lg">${Number(client.amount).toLocaleString()}</span>
          </div>
        </div>

        {approved || client.status === 'cerrado' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center text-emerald-400 font-semibold text-sm">
            🎉 ¡Este presupuesto ha sido aprobado con éxito!
          </div>
        ) : (
          <button
            onClick={handleApprove}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <span>✅ Aprobar Presupuesto y Notificar</span>
          </button>
        )}

      </div>
    </div>
  );
}