import { NextRequest, NextResponse } from 'next/server';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || '';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || '';
const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function getShiprocketToken(): Promise<string> {
  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  });
  if (!res.ok) throw new Error('Shiprocket auth failed');
  const data = await res.json();
  return data.token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      return NextResponse.json(
        { error: 'Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env.local' },
        { status: 503 }
      );
    }

    const token = await getShiprocketToken();

    if (action === 'create_order') {
      // Create shipment order + generate AWB
      const { order } = body;

      const shipRes = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: order.orderId,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: 'Primary',
          channel_id: '',
          comment: 'Pehnava by Neha Boutique Order',
          billing_customer_name: order.customerName,
          billing_last_name: '',
          billing_address: order.address.line1,
          billing_city: order.address.city,
          billing_pincode: order.address.pincode,
          billing_state: order.address.state,
          billing_country: 'India',
          billing_email: order.email || 'customer@pehnava.com',
          billing_phone: order.phone,
          shipping_is_billing: true,
          order_items: order.items.map((item: any) => ({
            name: item.name,
            sku: item.sku || item.id,
            units: item.quantity,
            selling_price: item.price,
            discount: 0,
            tax: 0,
          })),
          payment_method: 'Prepaid',
          shipping_charges: order.deliveryCharge || 0,
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: order.discount || 0,
          sub_total: order.subtotal,
          length: 30,
          breadth: 20,
          height: 10,
          weight: 0.5,
        }),
      });

      const shipData = await shipRes.json();
      if (!shipRes.ok) {
        return NextResponse.json({ error: shipData.message || 'Failed to create shipment' }, { status: 400 });
      }

      // Generate AWB
      const shipmentId = shipData.shipment_id;
      const awbRes = await fetch(`${SHIPROCKET_BASE}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: shipmentId }),
      });

      const awbData = await awbRes.json();

      return NextResponse.json({
        success: true,
        orderId: shipData.order_id,
        shipmentId,
        awb: awbData.response?.data?.awb_code || null,
        courierName: awbData.response?.data?.courier_name || 'Shiprocket',
        trackingUrl: awbData.response?.data?.routing_code
          ? `https://shiprocket.co/tracking/${awbData.response.data.awb_code}`
          : null,
      });
    }

    if (action === 'track') {
      const { awb } = body;
      const trackRes = await fetch(`${SHIPROCKET_BASE}/courier/track/awb/${awb}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trackData = await trackRes.json();
      return NextResponse.json(trackData);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Shiprocket API error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
