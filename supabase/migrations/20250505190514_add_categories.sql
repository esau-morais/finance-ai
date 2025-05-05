CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(50),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (name, type, color, icon) VALUES
('Salary', 'income', 'green', 'dollar-sign'),
('Freelance', 'income', 'emerald', 'briefcase'),
('Investments', 'income', 'teal', 'trending-up'),
('Gifts', 'income', 'purple', 'gift'),
('Other Income', 'income', 'indigo', 'plus-circle');

INSERT INTO categories (name, type, color, icon) VALUES
('Food', 'expense', 'blue', 'utensils'),
('Housing', 'expense', 'slate', 'home'),
('Transportation', 'expense', 'orange', 'car'),
('Utilities', 'expense', 'purple', 'zap'),
('Entertainment', 'expense', 'pink', 'film'),
('Shopping', 'expense', 'rose', 'shopping-bag'),
('Healthcare', 'expense', 'red', 'activity'),
('Education', 'expense', 'amber', 'book'),
('Travel', 'expense', 'cyan', 'map'),
('Other Expenses', 'expense', 'gray', 'more-horizontal');
