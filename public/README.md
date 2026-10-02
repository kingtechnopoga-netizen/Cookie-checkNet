# Netflix🍪 Cookie Lab

A real, deployable cookie-validation application for **test cookies created by
this application**.

It does not send cookies to Netflix or any other third-party service.

## Local setup

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Production secret

Set this environment variable on your hosting provider:

```text
TEST_COOKIE_SECRET=<long-random-secret>
```

Generate a strong value with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Render

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Environment variable:

```text
TEST_COOKIE_SECRET=<your-random-secret>
```

## API

Create:

`POST /api/test-cookie/create`

Body:

```json
{"ttlSeconds":3600}
```

Check:

`POST /api/test-cookie/check`

Body:

```json
{"cookie":"payload.signature"}
```

Results are `VALID`, `INVALID`, or `EXPIRED`.
