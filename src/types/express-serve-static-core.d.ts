// src/types/express-serve-static-core.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    userId: number;
  }
}
