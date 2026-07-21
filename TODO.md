# MongoDB Complete CRUD Implementation

## Steps

### Step 1: Update `server/models/index.ts`
- [ ] Export `Notification` and `Review` from models

### Step 2: Update `server/index.ts` — Imports
- [ ] Import `Notification` and `Review` from `./models/index.js`

### Step 3: Add NOTIFICATION Routes
- [ ] `GET /api/notifications/:userId` — Get notifications for a user
- [ ] `POST /api/notifications` — Create notification
- [ ] `PUT /api/notifications/:id` — Mark notification read
- [ ] `DELETE /api/notifications/:id` — Delete notification

### Step 4: Add REVIEW Routes
- [ ] `GET /api/reviews/skill/:skillId` — Reviews for a skill
- [ ] `GET /api/reviews/user/:userId` — Reviews about a user
- [ ] `POST /api/reviews` — Create review (auth required)
- [ ] `PUT /api/reviews/:id` — Update review (owner only)
- [ ] `DELETE /api/reviews/:id` — Delete review (owner only)

### Step 5: Add Auto-Notification Triggers
- [ ] Notify responder when exchange request is created
- [ ] Notify requester when request is accepted/rejected
- [ ] Notify recipient when message is sent

### Step 6: Verify & Test
- [ ] Run TypeScript compiler to check for errors
- [ ] Start server and verify routes

