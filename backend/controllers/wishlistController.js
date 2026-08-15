import Wishlist from '../models/Wishlist.js';

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    }
    res.json(wishlist.products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [productId] });
      return res.json({ added: true, wishlist: wishlist.products });
    }

    const index = wishlist.products.indexOf(productId);
    let added = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
      added = true;
    }

    await wishlist.save();
    res.json({ added, wishlist: wishlist.products });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling wishlist item', error: error.message });
  }
};
