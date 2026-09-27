import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook recibido de Mercado Pago:', JSON.stringify(body));

    let paymentId: string | null = null;
    let externalReference: string | null = null;
    let preferenceId: string | null = null;

    const notificationType = body.type || body.topic || body.data?.type;
    const notificationId = body.data?.id || body.id;
    const accessToken = process.env.MP_ACCESS_TOKEN || '';

    // 1. Si es una orden comercial (Merchant Order)
    if (
      notificationType === 'merchant_order' || 
      notificationType === 'topic_merchant_order_wh' || 
      body.resource?.includes('merchant_orders') ||
      body.action?.includes('merchant_order')
    ) {
      if (notificationId && notificationId !== '123456') {
        try {
          const res = await fetch(`https://api.mercadopago.com/merchant_orders/${notificationId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const orderInfo = await res.json();
          
          if (orderInfo.external_reference) {
            externalReference = orderInfo.external_reference;
          }
          if (orderInfo.preference_id) {
            preferenceId = orderInfo.preference_id;
          }

          if (orderInfo.payments && orderInfo.payments.length > 0) {
            const approvedPayment = orderInfo.payments.find((p: any) => p.status === 'approved');
            if (approvedPayment) {
              paymentId = String(approvedPayment.id);
            }
          }
        } catch (orderErr) {
          console.error('Error al consultar la orden comercial:', orderErr);
        }
      }
    } 
    // 2. Si es una notificación directa de pago
    else if (notificationType === 'payment' || notificationType === 'topic_payment' || body.resource?.includes('payments')) {
      paymentId = notificationId;
      if (body.resource) {
        const parts = body.resource.split('/');
        paymentId = parts[parts.length - 1];
      }
    }

    // Si tenemos un pago, consultamos sus detalles para extraer referencias adicionales
    if (paymentId && paymentId !== '123456') {
      try {
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const paymentInfo = await res.json();

        if (paymentInfo.status === 'approved') {
          externalReference = paymentInfo.external_reference || externalReference;
        }
      } catch (payErr) {
        console.error('Error consultando el pago:', payErr);
      }
    }

    console.log('🔍 DATOS CAPTURADOS -> externalReference:', externalReference, '| preferenceId:', preferenceId);

    let updateSuccess = false;

    // A. Intentar actualizar por external_reference (ID del cliente)
    if (externalReference) {
      const { data, error } = await supabase
        .from('clients')
        .update({ status: 'cerrado' })
        .eq('id', externalReference)
        .select();

      console.log('Respuesta Supabase por ID:', { data, error });
      if (data && data.length > 0) {
        updateSuccess = true;
      }
    }

    // B. Si falló o no había external_reference, intentar buscar por preference_id
    if (!updateSuccess && preferenceId) {
      const { data, error } = await supabase
        .from('clients')
        .update({ status: 'cerrado' })
        .eq('preference_id', preferenceId)
        .select();

      console.log('Respuesta Supabase por preference_id:', { data, error });
      
      if (data && data.length > 0) {
        console.log('✅ ¡Éxito vía preference_id! Cliente actualizado:', data);
        updateSuccess = true;
      } else {
        console.warn('⚠️ ADVERTENCIA: Ningún cliente en Supabase tiene guardado el preference_id:', preferenceId);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error general procesando webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}