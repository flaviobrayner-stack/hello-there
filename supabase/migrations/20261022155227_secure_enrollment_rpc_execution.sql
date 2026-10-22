-- A RPC transacional permanece desabilitada até revisão completa e testes de autorização.
REVOKE EXECUTE ON FUNCTION public.create_enrollment_transaction(jsonb, uuid, integer, boolean, text) FROM PUBLIC, anon, authenticated;
