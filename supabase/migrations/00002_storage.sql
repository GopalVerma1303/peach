-- Storage buckets: files (user uploads), attachments (note images/media)
-- RLS: users can read/write only under their own path prefix {user_id}/*

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('files', 'files', false),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects: allow user to access only their prefix
CREATE POLICY "Users can manage own files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can manage own attachments"
  ON storage.objects FOR ALL
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
