-- Add payment_method column to orders table for COD support
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'prepaid' CHECK (payment_method IN ('prepaid', 'cod'));

-- Add paid_at column to track payment time
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add shiprocket tracking columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS awb_number TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Create index for payment method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
