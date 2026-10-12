# DriveMate

DriveMate is a full-stack driver booking application. The frontend and API are maintained as separate packages in this repository.

## Project structure

- `web/` — Next.js App Router frontend (TypeScript, Tailwind CSS).
- `api/` — Express API (TypeScript, Mongoose, MongoDB).

## Run locally

Start the API in one terminal:

```sh
cd api
npm install
npm run dev
```

Configure the API's local environment file with your MongoDB connection URI and a private JWT secret before starting it. Do not commit that file.

Start the frontend in another terminal:

```sh
cd web
npm install
npm run dev
```

The current frontend API requests target `http://localhost:4000`.
