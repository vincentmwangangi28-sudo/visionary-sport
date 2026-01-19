-- Create storage buckets for new features
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('match-thumbnails', 'match-thumbnails', true),
  ('user-exports', 'user-exports', false),
  ('prediction-cards', 'prediction-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for match-thumbnails (public read)
CREATE POLICY "Public read access for match thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'match-thumbnails');

CREATE POLICY "Service role can manage match thumbnails"
ON storage.objects FOR ALL
USING (bucket_id = 'match-thumbnails' AND auth.role() = 'service_role');

-- Storage policies for user-exports (user owns their exports)
CREATE POLICY "Users can view own exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for prediction-cards (public read, user create)
CREATE POLICY "Public read access for prediction cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'prediction-cards');

CREATE POLICY "Users can upload prediction cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prediction-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage prediction cards"
ON storage.objects FOR ALL
USING (bucket_id = 'prediction-cards' AND auth.role() = 'service_role');