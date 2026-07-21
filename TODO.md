# Production Deployment - Implementation Steps

## Step 1: Install `helmet` dependency
- [ ] Install `helmet` npm package

## Step 2: Create `.env.example`
- [ ] Create `.env.example` with all required variables

## Step 3: Update `.gitignore`
- [ ] Add `.env.production`, `dist-server/`, `Procfile`, `render.yaml`, `vercel.json`

## Step 4: Update all Models to auto-generate `_id`
- [ ] `User.ts`
- [ ] `Skill.ts`
- [ ] `LearnSkill.ts`
- [ ] `ExchangeRequest.ts`
- [ ] `Message.ts`
- [ ] `Notification.ts`
- [ ] `Review.ts`

## Step 5: Update `config/db.ts` for MongoDB Atlas + optimized connection
- [ ] Add connection pooling, retry logic, remove default localhost

## Step 6: Update `server/index.ts`
- [ ] Remove demo mode (`nid()`, `idCounter`, `seedDatabase()`)
- [ ] Add `helmet` security headers
- [ ] Configure CORS for production domains
- [ ] Add production static file serving
- [ ] Require `JWT_SECRET` in production
- [ ] Remove all `_id: nid()` calls

## Step 7: Update `package.json`
- [ ] Fix build script for server TypeScript compilation
- [ ] Add `start` script for production

## Step 8: Update `tsconfig.server.json`
- [ ] Configure proper ESNext output for production

## Step 9: Update `vite.config.ts`
- [ ] Configure production API URL handling

## Step 10: Create `render.yaml`
- [ ] Render deployment configuration

## Step 11: Create `vercel.json`
- [ ] Vercel SPA rewrites configuration

## Step 12: Create `Procfile`
- [ ] Render web process command

## Step 13: Final verification
- [ ] Verify no demo mode remnants remain
- [ ] Verify all environment variables are documented

