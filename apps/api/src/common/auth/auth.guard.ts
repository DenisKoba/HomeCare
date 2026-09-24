import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedUser } from './auth.types';

function metadataString(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  private readonly jwks = this.supabaseUrl
    ? createRemoteJWKSet(new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`))
    : null;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
    }>();

    if (process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
      const id = String(request.headers['x-user-id'] ?? process.env.DEV_USER_ID ?? '');
      if (!id) throw new UnauthorizedException('DEV_USER_ID is required when auth is disabled');
      request.user = {
        id,
        email: 'developer@local.test',
        displayName: 'Developer',
        avatarUrl: null,
      };
      return true;
    }

    if (!this.jwks || !this.supabaseUrl) {
      throw new UnauthorizedException('Supabase authentication is not configured');
    }

    const authorization = request.headers.authorization;
    const bearer = Array.isArray(authorization) ? authorization[0] : authorization;
    const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;
    if (!token) throw new UnauthorizedException('Bearer token is required');

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `${this.supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      });
      if (!payload.sub) throw new Error('Token has no subject');
      const metadata =
        typeof payload.user_metadata === 'object' && payload.user_metadata !== null
          ? (payload.user_metadata as Record<string, unknown>)
          : {};
      request.user = {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        displayName: metadataString(metadata, 'full_name', 'name', 'display_name'),
        avatarUrl: metadataString(metadata, 'avatar_url', 'picture'),
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
