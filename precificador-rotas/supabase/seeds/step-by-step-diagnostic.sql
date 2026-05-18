-- ============================================================================
-- PASSO 1: VERIFICAR SE USUÁRIO EXISTE EM auth.users E ESTÁ CONFIRMADO
-- Execute este bloco primeiro
-- ============================================================================
SELECT 
    'PASSO 1: AUTH.USERS' as test,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO' 
         ELSE '✅ EMAIL CONFIRMADO' END as status
FROM auth.users 
WHERE email = 'carpediem4004@outlook.com';

-- Se não retornar nada, o usuário não existe
-- Se retornar com email_confirmed_at = NULL, execute isto:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'carpediem4004@outlook.com';


-- ============================================================================
-- PASSO 2: VERIFICAR SE PERFIL EXISTE EM public.usuarios
-- Execute após confirmar resultado do PASSO 1
-- ============================================================================
SELECT 
    'PASSO 2: USUARIOS (PERFIL)' as test,
    id,
    auth_user_id,
    email,
    nome,
    cargo,
    status,
    empresa_id,
    CASE WHEN id IS NOT NULL THEN '✅ PERFIL EXISTE' 
         ELSE '❌ PERFIL NÃO EXISTE' END as status_perfil
FROM public.usuarios
WHERE email = 'carpediem4004@outlook.com';

-- Se não retornar nada, precisa criar o perfil (próximo passo)


-- ============================================================================
-- PASSO 3: VERIFICAR EMPRESAS DO USUÁRIO
-- Execute após confirmar resultado do PASSO 2
-- ============================================================================
SELECT 
    'PASSO 3: EMPRESAS' as test,
    e.id,
    e.slug,
    e.nome_fantasia,
    e.status,
    ea.status_aprovacao,
    CASE WHEN ea.status_aprovacao = 'aprovada' THEN '✅ APROVADA' 
         ELSE COALESCE('❌ ' || ea.status_aprovacao, '❌ SEM APROVAÇÃO') END as status_aprovacao
FROM public.empresas e
LEFT JOIN public.empresas_aprovacao ea ON ea.empresa_id = e.id
WHERE e.id = (
    SELECT empresa_id FROM public.usuarios WHERE email = 'carpediem4004@outlook.com' LIMIT 1
);

-- Se não retornar nada, a empresa não existe ou não tem perfil


-- ============================================================================
-- PASSO 4: VERIFICAR SYSTEM_ADMIN
-- Execute após confirmar resultado do PASSO 3
-- ============================================================================
SELECT 
    'PASSO 4: SYSTEM_ADMIN' as test,
    sa.user_id,
    sa.email,
    sa.ativo,
    CASE WHEN sa.ativo = true THEN '✅ ADMIN ATIVO' 
         ELSE '❌ ADMIN INATIVO' END as status_admin
FROM public.system_admins sa
WHERE LOWER(sa.email) = 'carpediem4004@outlook.com';

-- Se não retornar nada ou estiver inativo, execute isto:
-- UPDATE public.system_admins SET ativo = true WHERE LOWER(email) = 'carpediem4004@outlook.com';


-- ============================================================================
-- PASSO 5: VERIFICAR RLS POLICIES NA TABELA usuarios
-- Execute para ver quais policies estão ativas
-- ============================================================================
SELECT 
    'PASSO 5: RLS POLICIES' as test,
    policyname,
    permissive,
    roles::text,
    CASE WHEN permissive = true THEN '✅ PERMITE ACESSO' 
         ELSE '❌ NEGA ACESSO' END as tipo_policy
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;


-- ============================================================================
-- PASSO 6: VERIFICAR STATUS RLS NA TABELA
-- Execute para confirmar que RLS está desativado
-- ============================================================================
SELECT 
    'PASSO 6: RLS STATUS' as test,
    relname,
    relrowsecurity,
    CASE WHEN relrowsecurity = true THEN '⚠️ RLS ATIVO (problema!)' 
         ELSE '✅ RLS DESATIVADO (bom!)' END as status_rls
FROM pg_class
WHERE relname = 'usuarios';
