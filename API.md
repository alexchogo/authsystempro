# API Reference

## Authentication Endpoints

### Sign Up

**POST** `/api/auth/signup`

Creates a new user account and sends verification email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "fullName": "John Doe",
  "username": "johndoe",
  "phone": "+1234567890"
}
```

**Note:** All fields are required. `phone` must be unique across all users.

**Response:**

```json
{
  "ok": true,
  "userId": "user-id-uuid"
}
```

---

### Sign In

**POST** `/api/auth/signin`

Verifies credentials and sends OTP code via email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**

```json
{
  "ok": true,
  "userId": "user-id-uuid"
}
```

---

### Verify OTP

**POST** `/api/auth/verify-otp`

Verifies OTP code and creates session.

**Request Body:**

```json
{
  "userId": "user-id-uuid",
  "code": "123456"
}
```

**Response:**

```json
{
  "ok": true,
  "token": "session-jwt-token"
}
```

---

### Verify Email

**POST** `/api/auth/verify-email`

Verifies email address using token from email.

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response:**

```json
{
  "ok": true
}
```

---

### Forgot Password

**POST** `/api/auth/forgot-password`

Sends password reset email with token.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "ok": true
}
```

---

### Validate Reset Token

**POST** `/api/auth/validate-reset-token`

Checks if password reset token is valid.

**Request Body:**

```json
{
  "token": "reset-token-from-email"
}
```

**Response:**

```json
{
  "ok": true,
  "userId": "user-id-uuid"
}
```

---

### Reset Password

**POST** `/api/auth/reset-password`

Resets password using valid reset token.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePass123"
}
```

**Response:**

```json
{
  "ok": true
}
```

---

### Resend Verification Email

**POST** `/api/auth/resend-verification`

Resends email verification link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "ok": true
}
```

---

### Resend OTP

**POST** `/api/auth/resend-otp`

Resends OTP code to user's email.

**Request Body:**

```json
{
  "userId": "user-id-uuid"
}
```

**Response:**

```json
{
  "ok": true
}
```

---

### Logout

**POST** `/api/logout`

Invalidates user session.

**Request Body:**

```json
{
  "token": "session-jwt-token" // optional
}
```

**Response:**

```json
{
  "ok": true
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials, expired token)
- `404` - Not Found (user/resource not found)
- `409` - Conflict (user already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limits

All authentication endpoints are rate-limited to prevent abuse:

- **signup**: 10 requests per 60 seconds per IP
- **signin**: 10 requests per 60 seconds per IP
- **forgot_password**: 10 requests per 60 seconds per IP
- **resend_otp**: 10 requests per 60 seconds per IP
- **resend_verification**: 10 requests per 60 seconds per IP

---

## Security Notes

1. **Passwords**: Minimum 8 characters, hashed with bcrypt (12 rounds)
2. **OTP Codes**: 6 digits, expire after 10 minutes, max 5 attempts
3. **Verification Tokens**: Expire after 24 hours
4. **Reset Tokens**: Expire after 1 hour, single-use only
5. **Session Tokens**: Expire after 7 days, include IP address and user agent tracking
6. **Email Verification**: Required before account is fully active
7. **Login Tracking**: All login attempts (successful and failed) are logged with IP and user agent
8. **Required Fields**: All user fields (fullName, username, phone, email) are required and must be unique

---

## Client-Side Usage

Example using the authService module:

```typescript
import * as authService from "@/lib/authService";

// Sign up
await authService.signup({
  email: "user@example.com",
  password: "password123",
  fullName: "John Doe",
  username: "johndoe",
  phone: "+1234567890",
});

// Sign in
const { userId } = await authService.signin({
  email: "user@example.com",
  password: "password123",
});

// Verify OTP
const { token } = await authService.verifyOtp({
  userId: userId,
  code: "123456",
});

// Store token
localStorage.setItem("authToken", token);

// Logout
await authService.logout({ token });
localStorage.removeItem("authToken");
```
