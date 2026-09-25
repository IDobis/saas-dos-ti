# Stack

## Front-end (`apps/web`)

| Tecnologia | Uso |
| --- | --- |
| Next.js 16 (App Router) | Framework web |
| React 19 | Interface |
| TypeScript | Tipagem |
| Tailwind CSS 4 | Estilos |
| shadcn/ui (estilo `base-nova`, base-ui) | Componentes de interface |
| Tremor 3 (`@tremor/react`) | Gráficos do painel |
| Sonner | Notificações (toasts) com duração de 6 segundos |
| next-themes | Tema claro/escuro |
| Lucide | Ícones |
| Geist / Geist Mono | Fontes |

Observações:
- O Tremor 3 foi feito para Tailwind 3 e React 18. O projeto usa `legacy-peer-deps` (`apps/web/.npmrc`) e carrega o tema legado por `tailwind.config.js` via `@config` no `globals.css`.
- O Sonner substitui o Toastr (que depende de jQuery) e é o toast oficial do shadcn.

## Back-end (`apps/api`)

| Tecnologia | Uso |
| --- | --- |
| Node.js | Runtime |
| NestJS 11 | Framework da API (prefixo `/api`) |
| Prisma 6 | ORM e migrations |
| PostgreSQL 18 | Banco de dados (instalação local) |
| JWT (`@nestjs/jwt`) | Autenticação (validade de 8 horas) |
| bcryptjs | Hash de senhas |
| class-validator / class-transformer | Validação dos dados de entrada |

## Estrutura

```
saas-dos-ti/
├── apps/
│   ├── web/   Next.js (não acessa o banco; consome a API por HTTP)
│   └── api/   NestJS + Prisma (prisma/schema.prisma e prisma/migrations)
└── docs/
```

## Portas e variáveis de ambiente

| Serviço | Porta | Configuração |
| --- | --- | --- |
| Front | 3100 | `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3001/api`) |
| API | 3001 | `apps/api/.env`: `PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `JWT_SECRET` |

O modelo das variáveis está em `apps/api/.env.example`. O `.env` real não é versionado.

## Comandos

```bash
# API
cd apps/api
npm install
npx prisma migrate deploy   # aplica as migrations
npm run start:dev

# Front
cd apps/web
npm install
npm run dev -- -p 3100
```

Em desenvolvimento, use `npx prisma migrate dev` somente se o usuário do banco tiver permissão `CREATEDB` (o Prisma precisa dela para o shadow database).
