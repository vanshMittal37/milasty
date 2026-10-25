/**
 * "Deliver to someone else": the buyer stays the customer (customer_name / customer_phone) and the
 * parcel goes to the recipient. The recipient lives in orders.recipient_name / recipient_phone
 * (migration 25/26). Orders saved before those columns existed only kept it in the notes as
 * "Deliver to: NAME (PHONE)" — read it back from there. Never invent a recipient: when neither
 * exists, the order was for the customer and both fields stay null.
 */
const NOTE_PATTERN = /Deliver to:\s*(.+?)\s*\((\d{10})\)/;

export function resolveRecipient(order) {
  if (!order) return { name: null, phone: null };
  if (order.recipient_name) {
    return { name: order.recipient_name, phone: order.recipient_phone || null };
  }
  const match = String(order.notes || '').match(NOTE_PATTERN);
  if (match) return { name: match[1].trim(), phone: match[2] };
  return { name: null, phone: null };
}

/** Fill recipient_name / recipient_phone on an order row from the notes when the columns are empty. */
export function withRecipient(order) {
  if (!order) return order;
  const { name, phone } = resolveRecipient(order);
  return { ...order, recipient_name: name, recipient_phone: phone };
}
