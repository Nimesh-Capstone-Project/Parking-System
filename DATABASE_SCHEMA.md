# Database Schema

## Auth DB (`authdb`)

### `users`
- `name`: string, required
- `email`: string, unique, required
- `password`: string, hashed, required
- `role`: enum(`user`, `admin`)
- `createdAt`, `updatedAt`

Seeded by: `services/auth-service/src/scripts/seed.js`

## Parking DB (`parkingdb`)

### `slots`
- `slotId`: string, unique, required
- `status`: enum(`available`, `reserved`, `occupied`, `blocked`)
- `location`: string, required
- `price`: number, required
- `bookingId`: string, nullable
- `createdAt`, `updatedAt`

Seeded by: `services/parking-service/src/scripts/seed.js`

## Booking DB (`bookingdb`)

### `bookings`
- `bookingId`: string, unique, required
- `userId`: string, required
- `userEmail`: string, required
- `slotId`: string, required
- `vehicleType`: enum(`2-wheeler`, `4-wheeler`), nullable
- `startTime`: date, nullable
- `endTime`: date, nullable
- `duration`: number, nullable
- `durationHours`: number, nullable
- `amount`: number, required
- `totalAmount`: number, required
- `status`: enum(`pending`, `confirmed`, `cancelled`, `expired`)
- `timestamp`: date
- `expiresAt`: date
- `paidAt`: date, nullable
- `cancelledAt`: date, nullable
- `expiredAt`: date, nullable
- `createdAt`, `updatedAt`

## Payment DB (`paymentdb`)

### `payments`
- `paymentId`: string, unique, required
- `bookingId`: string, required
- `userId`: string, required
- `vehicleType`: string, nullable
- `durationHours`: number, nullable
- `amount`: number, required
- `method`: enum(`card`, `upi`, `wallet`)
- `status`: enum(`success`, `failed`)
- `transactionRef`: string, required
- `createdAt`, `updatedAt`

## Notification DB (`notificationdb`)

### `notifications`
- `recipientUserId`: string, required
- `bookingId`: string, nullable
- `type`: string, required
- `channel`: enum(`console`, `email`)
- `message`: string, required
- `metadata`: object
- `createdAt`, `updatedAt`
