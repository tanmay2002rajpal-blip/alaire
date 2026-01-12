-- Migration: Add return_requests table for managing product returns
-- This table stores return/refund requests from customers

-- Create return_requests table
CREATE TABLE IF NOT EXISTS return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
    admin_notes TEXT,
    refund_amount NUMERIC(10, 2),
    refund_method TEXT, -- 'original_payment', 'wallet', 'bank_transfer'
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created_at ON return_requests(created_at DESC);

-- Enable RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own return requests
CREATE POLICY "Users can view own return requests"
    ON return_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create return requests for their own orders
CREATE POLICY "Users can create return requests"
    ON return_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_return_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_requests_updated_at
    BEFORE UPDATE ON return_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_return_request_updated_at();

-- Add return_requested status to order status history if not exists
-- This allows tracking when a return was requested in the order timeline
ALTER TABLE order_status_history
    DROP CONSTRAINT IF EXISTS order_status_history_status_check;

-- Optional: Add comments for documentation
COMMENT ON TABLE return_requests IS 'Stores customer return/refund requests';
COMMENT ON COLUMN return_requests.reason IS 'Reason for return: damaged, wrong_item, not_as_described, size_issue, quality_issue, changed_mind, other';
COMMENT ON COLUMN return_requests.status IS 'Request status: pending, approved, rejected, processing, completed, cancelled';
COMMENT ON COLUMN return_requests.refund_method IS 'How refund will be processed: original_payment, wallet, bank_transfer';
