---
name: api-envelope
description: Use when adding or changing API errors, exception filters, DTO validation, or frontend API error handling.
---

# API Envelope

- API success responses are `{ data }`.
- API error responses are `{ error: { code, message, details, requestId, path, timestamp } }`.
- Throw domain errors with `AppException` and a registered error code.
- Do not throw raw strings or leak internal messages for 5xx responses.
- Frontend code should catch `ApiError`, translate `code`, and display the
  translated message with the original code available for support.
