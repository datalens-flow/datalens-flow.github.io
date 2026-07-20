export const DEFAULT_SQL = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10, 2),
  order_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

export const MAX_HISTORY = 50;
