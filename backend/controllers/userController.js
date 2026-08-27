import { supabase } from '../config/supabase.js';

export const getCustomers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, addresses, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error || !users) {
      return res.json([]);
    }

    const { data: orders } = await supabase.from('orders').select('*');

    const customersWithStats = users.map((u) => {
      const userOrders = orders ? orders.filter((o) => o.user_id === u.id) : [];
      const orderCount = userOrders.length;
      const totalSpent = userOrders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0);

      return {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        addresses: u.addresses || [],
        createdAt: u.created_at,
        orderCount,
        totalSpent,
      };
    });

    res.json(customersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ role: status || 'customer', updated_at: new Date() })
      .eq('id', id)
      .select('id, name, email, phone, role')
      .single();

    if (error || !user) return res.status(404).json({ message: 'Customer not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer status', error: error.message });
  }
};
