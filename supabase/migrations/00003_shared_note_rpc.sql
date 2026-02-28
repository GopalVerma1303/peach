-- RPC for reading a note by share token (anon can call; returns single note or null)
CREATE OR REPLACE FUNCTION public.get_shared_note(token TEXT)
RETURNS SETOF public.notes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.notes WHERE share_token = token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_note(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_note(TEXT) TO authenticated;
