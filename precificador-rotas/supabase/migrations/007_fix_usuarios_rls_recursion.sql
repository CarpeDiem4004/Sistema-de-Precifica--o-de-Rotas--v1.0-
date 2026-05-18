begin;

-- Remove policy recursiva que chamava current_empresa_id() dentro da própria tabela usuarios.
drop policy if exists "usuarios_select_company" on public.usuarios;
drop policy if exists "usuarios_select_self_or_system_admin" on public.usuarios;
create policy "usuarios_select_self_or_system_admin"
on public.usuarios
for select
to authenticated
using (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()));

-- Mantém update do próprio usuário e permite system admin.
drop policy if exists "usuarios_update_self" on public.usuarios;
create policy "usuarios_update_self"
on public.usuarios
for update
to authenticated
using (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()))
with check (auth_user_id = auth.uid() or public.is_system_admin(auth.uid()));

commit;
