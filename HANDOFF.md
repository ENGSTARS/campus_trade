# CampusTrade Handoff

## What Was Tightened

- Orders now update inventory atomically and notify sellers.
- Messaging now uses the Django API as the real source of truth for conversations and messages.
- Notification polling and toast behavior are tied to authenticated user state.
- Listing deletion uses soft delete on the backend and safer ID comparison on the frontend.
- Registration and other UI forms now surface backend validation messages instead of hiding them behind mock fallback behavior.

## Environment Notes

- Backend env can come from repo root `.env` or `server/.env`.
- Frontend env lives in `client/.env`.
- Examples are available in `.env.example`, `server/.env.example`, and `client/.env.example`.

## Important Endpoints

- Auth: `POST /api/register/`, `POST /api/auth/login/`, `POST /api/auth/refresh/`, `GET /api/me/`
- Transactions: `GET /api/me/transactions/`
- Notifications: `GET /api/notifications`, `PATCH /api/notifications/<id>/read`, `PATCH /api/notifications/read-all`
- Messaging: `GET/POST /api/messaging/conversations`, `GET/POST/DELETE /api/messaging/conversations/<id>`
- Listings: `GET/POST /api/listings/`, `GET/PATCH/DELETE /api/listings/<id>/`, `POST /api/listings/<id>/order/`

## Tests Added

- Registration with approved university email
- Registration rejection for unapproved email
- Seller notification creation on order
- Notification list and mark-read flow
- Conversation creation
- Message sending
- Seller unread reset when reading messages
- Per-user conversation deletion
- Soft-delete listing behavior
- Sold-out order edge cases
- Multiple orders by the same buyer while stock remains

## Verification Commands

```powershell
cd server
python manage.py migrate
python manage.py check
python manage.py test

cd ..\client
npm run build
```

## Current Verification Status

Verified successfully on March 25, 2026:

- `python manage.py migrate`
- `python manage.py check`
- `python manage.py test`
- `npm run build`
