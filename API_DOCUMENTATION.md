# Smart Parking System API

## Auth Service (`http://localhost:4001`)

### `POST /register`
Request:
```json
{
  "name": "Jane User",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "user"
}
```
Response:
```json
{
  "message": "Registration successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Jane User",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

### `POST /login`
Request:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

## Parking Service (`http://localhost:4002`)

### `GET /slots`
Returns all slots.

### `GET /slots/available`
Returns slots with `status=available`.

### `POST /slots` (Admin)
Request:
```json
{
  "slotId": "A-101",
  "location": "North Deck - L1",
  "price": 80
}
```

### `PATCH /slots/:slotId/status` (Admin)
Request:
```json
{
  "status": "blocked"
}
```

## Booking Service (`http://localhost:4003`)

### `POST /bookings`
Request:
```json
{
  "slotId": "A-101",
  "vehicleType": "4-wheeler",
  "startTime": "2026-04-24T10:00:00.000Z",
  "duration": 2
}
```
Response:
```json
{
  "message": "Booking created",
  "bookingId": "BKG-123456",
  "totalAmount": 80,
  "status": "pending",
  "booking": {
    "bookingId": "BKG-123456",
    "slotId": "A-101",
    "vehicleType": "4-wheeler",
    "startTime": "2026-04-24T10:00:00.000Z",
    "endTime": "2026-04-24T12:00:00.000Z",
    "duration": 2,
    "durationHours": 2,
    "amount": 80,
    "totalAmount": 80,
    "status": "pending"
  }
}
```

### `POST /book-slot`
Alias of `POST /bookings` for the enhanced booking flow.

### `GET /bookings`
User sees own bookings. Admin sees all.

### `GET /bookings/:bookingId`
Returns a single booking for the owner or admin.

### `POST /bookings/:bookingId/cancel`
Cancels a pending or confirmed booking and releases the slot.

## Payment Service (`http://localhost:4004`)

### `POST /payments/process`
Request:
```json
{
  "bookingId": "BKG-123456",
  "method": "card",
  "simulateSuccess": true
}
```
Response:
```json
{
  "message": "Payment successful",
  "summary": {
    "bookingId": "BKG-123456",
    "slotId": "A-101",
    "vehicleType": "4-wheeler",
    "startTime": "2026-04-24T10:00:00.000Z",
    "endTime": "2026-04-24T12:00:00.000Z",
    "duration": 2,
    "durationHours": 2,
    "totalAmount": 80
  },
  "payment": {
    "paymentId": "PAY-123456",
    "status": "success"
  },
  "booking": {
    "bookingId": "BKG-123456",
    "status": "confirmed"
  }
}
```

Pricing rules:

- `2-wheeler`: `Rs 20/hour`
- `4-wheeler`: `Rs 40/hour`

## Notification Service (`http://localhost:4006`)

### `GET /notifications`
User sees their notifications. Admin sees all notifications.

## Seed Users

- Admin: `admin@parking.com` / `Admin@123`
- User: `user@parking.com` / `User@123`

