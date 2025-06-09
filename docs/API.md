# API Reference

All endpoints (except **Register** and **Login**) require authentication via HTTP-only JWT cookie or `Authorization: Bearer <token>` header.

---

## Authentication (`/api/auth`)

### `POST /api/auth/register`

Register a new user.

* **Body**:

  * `username` (string, required)
  * `email` (string, required)
  * `password` (string, required)

* **Responses**:

  * `201 Created` → `{ message: 'User registered' }`
  * `400 Bad Request` → `{ error: '...' }`

---

### `POST /api/auth/login`

Log in an existing user.

* **Body**:

  * `email` (string, required)
  * `password` (string, required)

* **Responses**:

  * `200 OK` → `{ message: 'Login successful' }` plus JWT cookie
  * `401 Unauthorized` → `{ error: 'Invalid credentials' }`

---

## Users (`/api/users`)

### `GET /api/users/me`

Get the authenticated user’s profile.

* **Responses**:

  * `200 OK` → `User` object

---

### `GET /api/users/:id`

Get a user’s profile by ID.

* **Params**: `id` (number)
* **Responses**:

  * `200 OK` → `User` object
  * `404 Not Found` → `{ error: 'User not found' }`
  * `403 Forbidden` → `{ error: 'Private profile' }`

---

### `GET /api/users/:id/following`

Get the list of users that `:id` is following.

* **Params**: `id` (number)
* **Responses**:

  * `200 OK` → `User[]`
  * `403 Forbidden` → `{ error: 'Private profile' }`

---

### `POST /api/users/:id/block`

Block a user.

* **Params**: `id` (number)
* **Responses**:

  * `201 Created` → `{ message: 'User blocked' }`
  * `400 Bad Request` → `{ error: 'Invalid user' }`
  * `409 Conflict` → `{ error: 'Already blocked' }`

---

### `DELETE /api/users/:id/block`

Unblock a user.

* **Params**: `id` (number)
* **Responses**:

  * `200 OK` → `{ message: 'User unblocked' }`
  * `400 Bad Request` → `{ error: 'Invalid user' }`
  * `404 Not Found` → `{ error: 'Not blocked' }`

---

## Follow Requests (`/api/follow-requests`)

### `POST /api/follow-requests/:id/follow`

Send a follow request or follow directly if the target is public.

* **Params**: `id` (number)
* **Responses**:

  * `201 Created` → `{ message: 'Follow request sent' }` or `{ message: 'Followed successfully' }`
  * `400 Bad Request` → `{ error: 'Invalid user id' }`
  * `404 Not Found` → `{ error: 'User not found' }`
  * `409 Conflict` → `{ error: 'Follow request already pending' }`
  * `204 No Content` (if blocked)

---

### `POST /api/follow-requests/:requestId/accept`

Accept a pending follow request.

* **Params**: `requestId` (number)
* **Responses**:

  * `200 OK` → `{ message: 'Follow request accepted' }`
  * `404 Not Found` → `{ error: 'Request not found' }`
  * `403 Forbidden` → `{ error: 'Not authorized' }`

---

### `POST /api/follow-requests/:requestId/reject`

Reject a pending follow request.

* **Params**: `requestId` (number)
* **Responses**:

  * `200 OK` → `{ message: 'Follow request rejected' }`
  * `404 Not Found` → `{ error: 'Request not found' }`
  * `403 Forbidden` → `{ error: 'Not authorized' }`

---

## Notifications (`/api/notifications`)

### `GET /api/notifications`

Get the current user’s notifications.

* **Responses**:

  * `200 OK` → `Notification[]`

---

### `POST /api/notifications/:id/read`

Mark a notification as read.

* **Params**: `id` (number)
* **Responses**:

  * `200 OK` → `{ message: 'Notification marked read' }`
  * `404 Not Found` → `{ error: 'Notification not found' }`

---

## Posts (`/api/posts`)

### `POST /api/posts`

Create a new post (text + optional media uploads).

* **Body**: multipart/form-data

  * `text` (string)
  * `media` (file\[]) images/videos
* **Responses**:

  * `201 Created` → `{ postId: number }`

---

### `GET /api/posts/:id`

Get a single post with author and media.

* **Params**: `id` (number)
* **Responses**:

  * `200 OK` → `Post` object (includes `author`, `media[]`)
  * `400 Bad Request` → `{ error: 'Invalid post id' }`
  * `404 Not Found` → `{ error: 'Post not found' }`

---

### `POST /api/posts/:id/replies`

Reply to a post (creates a child post).

* **Params**: `id` (postId)
* **Body**: `{ text: string }`
* **Responses**:

  * `201 Created` → `{ postId: number }`
  * `400 Bad Request` → `{ error: 'Invalid post id' }`
  * `404 Not Found` → `{ error: 'Parent post not found' }`

---

### `GET /api/posts/:id/replies`

Get paged replies for a post.

* **Params**: `id` (postId)
* **Query**:

  * `page` (number, default: 1)
  * `limit` (number, default: 20)
* **Responses**:

  * `200 OK` → `{ page, limit, total, replies: Post[] }`
  * `400 Bad Request` → `{ error: 'Invalid post id' }`
