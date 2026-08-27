import User from '../models/User.js';
import Order from '../models/Order.js';

export const getCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });

    const customersWithStats = await Promise.all(
      users.map(async (u) => {
        const orderCount = await Order.countDocuments({ userId: u._id });
        const orders = await Order.find({ userId: u._id, paymentStatus: 'Paid' });
        const totalSpent = orders.reduce((acc, o) => acc + o.totalAmount, 0);

        return {
          ...u._doc,
          orderCount,
          totalSpent, // gfffhggg
        };
      })
    );

    res.json(customersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer status', error: error.message });
  }
};
