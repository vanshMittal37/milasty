import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';
import { updateOrderStatus } from '../controllers/orderController.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
  return res;
}

async function testSpecificOrder() {
  const targetId = '84bd8134-29d7-427a-88c6-f03c64fa06c5';
  console.log(`--- Inspecting order ${targetId} ---`);

  // 1. Fetch order from Supabase
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', targetId)
    .maybeSingle();

  console.log('Fetch result:', { order, fetchErr });

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
  }

  // 2. Test controller updateOrderStatus with this ID
  const req = {
    params: { id: targetId },
    body: { orderStatus: 'Confirmed' }
  };
  const res = mockRes();
  await updateOrderStatus(req, res);

  console.log('Controller updateOrderStatus output:', res.statusCode, res.data);

  process.exit(0);
}

testSpecificOrder();
