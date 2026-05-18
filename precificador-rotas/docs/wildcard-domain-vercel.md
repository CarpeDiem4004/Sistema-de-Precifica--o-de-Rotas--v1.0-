# Wildcard Domain no Vercel

## Objetivo
Permitir acesso por subdomínio, por exemplo:
- transportadora-alpha.seudominio.com.br
- cliente-beta.seudominio.com.br

## 1. Adicionar o domínio na Vercel
1. Abra o projeto na Vercel.
2. Vá em Settings > Domains.
3. Adicione o domínio raiz, por exemplo `seudominio.com.br`.
4. Adicione também o wildcard: `*.seudominio.com.br`.

## 2. Configurar DNS
No provedor DNS, crie:
- Tipo: CNAME
- Nome: *
- Valor: cname.vercel-dns.com

Se o provedor exigir, adicione também o domínio raiz conforme instrução da Vercel.

## 3. Variáveis de ambiente
Configurar na Vercel:
- VITE_APP_URL=https://seudominio.com.br
- VITE_SUPABASE_URL=...
- VITE_SUPABASE_ANON_KEY=...
- VITE_GOOGLE_MAPS_API_KEY=...

## 4. Supabase Auth
Em Authentication > URL Configuration:
- Site URL: `https://seudominio.com.br`
- Redirect URLs:
  - `https://seudominio.com.br`
  - `https://*.seudominio.com.br`
  - `http://localhost:5173`
  - `http://*.localhost:5173`

Se o painel não aceitar wildcard em localhost, mantenha apenas `http://localhost:5173` e teste o tenant pelo caminho `/slug/...` localmente.

## 5. Fluxo de produção
1. Usuário entra em `https://transportadora-alpha.seudominio.com.br`.
2. O frontend resolve o slug `transportadora-alpha` pelo host.
3. O login autentica no Supabase.
4. O RLS limita os dados à empresa do usuário.

## 6. Observações práticas
- A Vercel entrega o mesmo build para todos os subdomínios; o tenant é resolvido no runtime.
- O app atual aceita tanto subdomínio quanto rota por caminho (`/slug/dashboard`).
- Para testes locais de subdomínio, use `tenant.localhost:5173` com navegador compatível ou `lvh.me`.
