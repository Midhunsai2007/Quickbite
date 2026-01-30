-- =============================================
-- QUICK BITE - SUPABASE DATABASE SCHEMA
-- =============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com → SQL Editor → New Query

-- =============================================
-- FOODS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS foods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image TEXT DEFAULT 'https://via.placeholder.com/400x300?text=Food+Image',
  price DECIMAL(10,2) NOT NULL,
  quantity VARCHAR(50) DEFAULT '100g',
  stock INTEGER DEFAULT 25,
  ingredients TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default food items
INSERT INTO foods (name, image, price, quantity, stock, ingredients) VALUES
('Classic Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 199, '250g', 25, 'Beef patty, Lettuce, Tomato, Cheese, Pickles, Onions'),
('Margherita Pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', 299, '300g', 20, 'Tomato sauce, Mozzarella, Fresh basil, Olive oil'),
('Chicken Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', 249, '400g', 30, 'Basmati rice, Chicken, Spices, Saffron, Fried onions'),
('Caesar Salad', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500', 149, '200g', 15, 'Romaine lettuce, Croutons, Parmesan, Caesar dressing'),
('Chocolate Brownie', 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500', 99, '100g', 40, 'Dark chocolate, Butter, Sugar, Eggs, Walnuts'),
('Masala Dosa', 'https://images.unsplash.com/photo-1668236543090-82eb5eace0f7?w=500', 89, '200g', 35, 'Rice batter, Potato masala, Sambar, Chutney');

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_username VARCHAR(255),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Enable RLS on all tables
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to foods
CREATE POLICY "Allow public read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Allow public insert foods" ON foods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update foods" ON foods FOR UPDATE USING (true);
CREATE POLICY "Allow public delete foods" ON foods FOR DELETE USING (true);

-- Allow public access to users (for demo purposes)
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);

-- Allow public access to orders
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);

-- Allow public access to reviews
CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete reviews" ON reviews FOR DELETE USING (true);
