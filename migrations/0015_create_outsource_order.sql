-- Migration: Create outsource_order table
CREATE TABLE IF NOT EXISTS outsource_order (
    id SERIAL PRIMARY KEY,
    orderCode TEXT NOT NULL UNIQUE,
    orderTitle TEXT,
    orderDate DATE NOT NULL,
    expectedCompletionDate DATE,
    actualCompletionDate DATE,
    status TEXT NOT NULL,
    priority INTEGER NOT NULL,
    totalAmount DECIMAL,
    currency TEXT,
    notes TEXT,
    attachment TEXT,
    createdByUserId INTEGER NOT NULL,
    assignedToUserId INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_created_by_user FOREIGN KEY (createdByUserId) REFERENCES user_sync(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assigned_to_user FOREIGN KEY (assignedToUserId) REFERENCES user_sync(id) ON DELETE RESTRICT
);

-- Indexes for performance (if needed)
CREATE INDEX IF NOT EXISTS idx_outsource_order_status ON outsource_order(status);
CREATE INDEX IF NOT EXISTS idx_outsource_order_priority ON outsource_order(priority); 