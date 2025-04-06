// backend/controllers/productController.js
import { AppDataSource } from '../config/db.js';
import Product from '../config/models/Product.js';

const productRepository = AppDataSource.getRepository(Product);

// @desc    Create a new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const { name, description, price, stock_quantity, category, image_url } = req.body;
  try {
    // TODO: Validation
    const product = new Product();
    product.name = name;
    product.description = description;
    product.price = price;
    product.stock_quantity = stock_quantity;
    product.category = category;
    product.image_url = image_url;

    const savedProduct = await productRepository.save(product);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating product' });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    // Add filtering/pagination if needed
    const products = await productRepository.find({ order: { category: 'ASC', name: 'ASC'} });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching products' });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await productRepository.findOneBy({ product_id: req.params.id });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching product' });
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { name, description, price, stock_quantity, category, image_url } = req.body;
  try {
    // TODO: Validation
    const product = await productRepository.findOneBy({ product_id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock_quantity !== undefined) product.stock_quantity = stock_quantity;
    if (category !== undefined) product.category = category;
    if (image_url !== undefined) product.image_url = image_url;

    const updatedProduct = await productRepository.save(product);
    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating product' });
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    // Check if product is part of any bookings?
    const result = await productRepository.delete(req.params.id);
    if (result.affected === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting product' });
  }
};