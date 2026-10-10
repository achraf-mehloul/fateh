-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload payment receipts (for checkout)
CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

-- Allow anyone to view payment receipts (public bucket)
CREATE POLICY "Anyone can view payment receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Allow admins to delete payment receipts
CREATE POLICY "Admins can delete payment receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));