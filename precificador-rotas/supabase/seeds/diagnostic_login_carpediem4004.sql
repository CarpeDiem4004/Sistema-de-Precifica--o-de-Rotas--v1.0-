-- ============================================================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA DE LOGIN
-- Executa este script NO SQL EDITOR do Supabase e manda o resultado
-- ============================================================================

-- 1️⃣ VERIFICAR SE USUÁRIO EXISTE EM auth.users
SELECT 
    '=== AUTH.USERS ===' as categoria,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    CASE WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO' ELSE '✅ EMAIL CONFIRMADO' END as status_email
FROM auth.users 
WHERE email = 'carpediem4004@outlook.com';

-- 2️⃣ VERIFICAR SE PERFIL EXISTE EM public.usuarios
SELECT 
    '=== USUARIOS (PERFIL) ===' as categoria,
    u.id,
    u.auth_user_id,
    u.email,
    u.nome,
    u.cargo,
    u.status,
    u.empresa_id,
    CASE WHEN u.auth_user_id IS NULL THEN '❌ PERFIL NÃO EXISTE' ELSE '✅ PERFIL EXISTE' END as status_perfil
FROM public.usuarios u
WHERE u.email = 'carpediem4004@outlook.com';

-- 3️⃣ VERIFICAR SE EMPRESA EXISTE E ESTÁ APROVADA
SELECT 
    '=== EMPRESAS ===' as categoria,
    e.id,
    e.slug,
    e.nome_fantasia,
    e.status,
    ea.status_aprovacao,
    CASE WHEN ea.status_aprovacao = 'aprovada' THEN '✅ APROVADA' ELSE '❌ NÃO APROVADA' END as status_aprovacao_texto
FROM public.empresas e
LEFT JOIN public.empresas_aprovacao ea ON ea.empresa_id = e.id
WHERE EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.empresa_id = e.id AND u.email = 'carpediem4004@outlook.com'
);

-- 4️⃣ VERIFICAR SE SYSTEM_ADMIN ESTÁ CONFIGURADO
SELECT 
    '=== SYSTEM_ADMINS ===' as categoria,
    sa.user_id,
    sa.email,
    sa.ativo,
    CASE WHEN sa.ativo = true THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status_admin
FROM public.system_admins sa
WHERE LOWER(sa.email) = 'carpediem4004@outlook.com';

-- 5️⃣ TESTE: SIMULAR O QUE A FUNÇÃO current_user_role FAZ
-- (sem RLS, para não dar erro)
SELECT 
    '=== TEST: current_user_role ===' as categoria,
    u.auth_user_id,
    u.cargo,
    e.slug,
    CASE WHEN u.cargo = 'admin' THEN '✅ TEM ROLE ADMIN' ELSE '⚠️ ROLE: ' || u.cargo END as status_role
FROM public.usuarios u
JOIN public.empresas e ON e.id = u.empresa_id
WHERE u.email = 'carpediem4004@outlook.com';

-- 6️⃣ LISTA DE TODAS AS QUERIES RLS HABILITADAS NA TABELA usuarios
SELECT 
    '=== RLS POLICIES ===' as categoria,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- 7️⃣ VERIFICAR STATUS RLS NA TABELA usuarios
SELECT 
    '=== RLS STATUS ===' as categoria,
    relname,
    relrowsecurity,
    CASE WHEN relrowsecurity = true THEN '⚠️ RLS ATIVO' ELSE '✅ RLS DESATIVADO' END as rls_status
FROM pg_class
WHERE relname = 'usuarios';
