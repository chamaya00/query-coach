-- E-commerce sample database for QueryCoach

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  region TEXT,
  created_at DATE
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date DATE,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2)
);

-- Sample data: Customers
INSERT INTO customers (id, name, email, region, created_at) VALUES
  (1, 'Alice Johnson', 'alice@email.com', 'West', '2023-01-15'),
  (2, 'Bob Smith', 'bob@email.com', 'East', '2023-02-20'),
  (3, 'Carol Williams', 'carol@email.com', 'West', '2023-03-10'),
  (4, 'David Brown', 'david@email.com', 'Central', '2023-04-05'),
  (5, 'Eve Davis', 'eve@email.com', 'East', '2023-05-12');

-- Sample data: Products
INSERT INTO products (id, name, category, price, stock_quantity) VALUES
  (1, 'Laptop Pro', 'Electronics', 1299.99, 50),
  (2, 'Wireless Mouse', 'Electronics', 29.99, 200),
  (3, 'Coffee Maker', 'Appliances', 89.99, 75),
  (4, 'Running Shoes', 'Sports', 119.99, 100),
  (5, 'Desk Lamp', 'Home', 45.99, 150),
  (6, 'Bluetooth Speaker', 'Electronics', 79.99, 80),
  (7, 'Yoga Mat', 'Sports', 35.99, 120);

-- Sample data: Orders
INSERT INTO orders (id, customer_id, order_date, status, total_amount) VALUES
  (1, 1, '2024-01-10', 'completed', 1329.98),
  (2, 2, '2024-01-12', 'completed', 119.99),
  (3, 1, '2024-01-15', 'completed', 125.98),
  (4, 3, '2024-01-18', 'pending', 89.99),
  (5, 4, '2024-01-20', 'completed', 1379.98),
  (6, 2, '2024-01-22', 'shipped', 79.99),
  (7, 5, '2024-01-25', 'completed', 155.98),
  (8, 1, '2024-02-01', 'pending', 29.99);

-- Sample data: Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 1299.99),
  (2, 1, 2, 1, 29.99),
  (3, 2, 4, 1, 119.99),
  (4, 3, 5, 1, 45.99),
  (5, 3, 6, 1, 79.99),
  (6, 4, 3, 1, 89.99),
  (7, 5, 1, 1, 1299.99),
  (8, 5, 6, 1, 79.99),
  (9, 6, 6, 1, 79.99),
  (10, 7, 4, 1, 119.99),
  (11, 7, 7, 1, 35.99),
  (12, 8, 2, 1, 29.99);
