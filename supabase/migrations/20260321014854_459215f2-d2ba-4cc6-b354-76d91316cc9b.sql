-- Create screen-mockups storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screen-mockups', 'screen-mockups', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: public read access
CREATE POLICY "Screen mockups are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'screen-mockups');

-- Policy: authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload screen mockups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'screen-mockups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: users can delete their own mockups
CREATE POLICY "Users can delete their own screen mockups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'screen-mockups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);