import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabase } from '@/lib/supabase';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, unit_price, client_id } = body;

    console.log('🛠️ Creando preferencia para el cliente ID:', client_id);

    if (!client_id) {
      console.error('❌ Error: client_id no fue proporcionado en el cuerpo de la petición.');
      return NextResponse.json({ error: 'El client_id es obligatorio' }, { status: 400 });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'budget-item',
            title: title || 'Presupuesto Agilizarlo',
            quantity: 1,
            unit_price: Number(unit_price),
            currency_id: 'ARS',
          },
        ],
        // 🔗 Sin auto_return ni back_urls para evitar conflictos en entorno local
        external_reference: client_id,
      },
    });

    const paymentLink = result.init_point;
    const preferenceId = result.id;

    console.log('✨ Preferencia creada en MP. ID:', preferenceId);

    const { data, error } = await supabase
      .from('clients')
      .update({ 
        payment_link: paymentLink,
        preference_id: preferenceId 
      })
      .eq('id', client_id)
      .select();

    if (error) {
      console.error('❌ Error al guardar preference_id en Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } 
    
    if (!data || data.length === 0) {
      console.warn('⚠️ ADVERTENCIA: No se encontró ningún cliente en Supabase con el ID:', client_id);
      return NextResponse.json({ error: 'Cliente no encontrado en la base de datos' }, { status: 404 });
    }

    console.log('✅ ¡preference_id guardado con éxito en el cliente:', data);

    return NextResponse.json({ init_point: paymentLink });

  } catch (error: any) {
    console.error('Error en Mercado Pago:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}