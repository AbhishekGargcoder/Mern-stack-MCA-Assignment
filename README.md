# Student Management Backend

A role-based REST API built with **Node.js, Express, MySQL (`mysql2`) and plain JavaScript**. It does not use Prisma or another ORM.

## Features

- Student registration and login
- bcrypt password hashing
- JWT authentication
- Database-backed role checks on every protected request
- Admin-only student CRUD
- Students can view/update only their own profile
- Students cannot set their own role, change their email through the profile endpoint, or modify another student's record
- Parameterized SQL queries
- Login rate limiting, Helmet, basic input validation and centralized error handling

## Requirements

- Node.js 18+
- MySQL 8+ (or a compatible MySQL server)

## Setup

1. Create the database and table by running `sql/schema.sql` in MySQL Workbench or the MySQL CLI.
2. Install packages:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the database credentials and JWT secret.
4. Create the first admin:

   ```bash
   npm run admin:create
   ```

   The script reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env`. Run it once. Do not expose admin creation as a public API.

5. Start the API:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:5000` by default.

## API endpoints

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public; always creates a student |
| POST | `/api/auth/login` | Public, rate-limited |
| GET | `/api/auth/me` | Authenticated |

### Student self-service

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/students/me` | Student |
| PATCH | `/api/students/me` | Student |
| PATCH | `/api/students/me/password` | Student |

Students may update `name`, `phone`, and `course` only. The password endpoint requires `currentPassword` and `newPassword`.

### Admin student management

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/students` | Admin |
| GET | `/api/students` | Admin |
| GET | `/api/students/:id` | Admin |
| PUT | `/api/students/:id` | Admin |
| DELETE | `/api/students/:id` | Admin |

Admin create body:

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "StrongPassword123!",
  "phone": "9876543210",
  "course": "MCA"
}
```

Admin update body (all four fields are required):

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "course": "MCA"
}
```

Student registration body:

```json
{
  "name": "Aman Kumar",
  "email": "aman@example.com",
  "password": "StrongPassword123!",
  "phone": "9876543210",
  "course": "BCA"
}
```

Student profile update body (send one or more allowed fields):

```json
{
  "name": "Aman Kumar",
  "phone": "9876543210"
}
```

## Authentication header

For protected routes, send:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Login returns a token and a safe user object. Never store plaintext passwords or commit `.env`.

## Example response

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJ...",
  "user": {
    "id": 2,
    "name": "Aman Kumar",
    "email": "aman@example.com",
    "role": "student"
  }
}
```

## Status codes

- `400` invalid/missing input
- `401` missing, invalid, or expired token / invalid credentials
- `403` authenticated but role not allowed
- `404` record not found
- `409` duplicate email
- `429` too many login attempts
- `500` unexpected server error

## Security notes

- Public registration hardcodes the role to `student`; it ignores any client-supplied role.
- The authentication middleware loads the current user and role from MySQL on each protected request. A changed/deleted account therefore cannot continue using an old JWT.
- SQL values are parameterized.
- Admin endpoints operate only on rows whose role is `student`, preventing accidental admin CRUD.
- For production, use HTTPS, a strong secret manager, stricter CORS origins, request logging, backups, schema migrations and a robust validation library. Consider refresh-token/session revocation if your application needs long-lived sessions.
