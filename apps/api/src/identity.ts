import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { IS_PUBLIC_ROUTE } from "./public.decorator.js";

export interface AuthenticatedIdentity {
  actorId: string;
  householdId?: string;
  source: "local-header";
}

export interface IdentityAdapter {
  authenticate(request: Request): Promise<AuthenticatedIdentity>;
}

export const IDENTITY_ADAPTER = Symbol("IDENTITY_ADAPTER");

@Injectable()
export class LocalHeaderIdentityAdapter implements IdentityAdapter {
  async authenticate(request: Request): Promise<AuthenticatedIdentity> {
    const actorId = request.header("x-actor-id");
    if (!actorId) {
      throw new UnauthorizedException("Authentication is required.");
    }
    const householdId = request.header("x-household-id");
    return {
      actorId,
      source: "local-header",
      ...(householdId ? { householdId } : {}),
    };
  }
}

@Injectable()
export class CognitoIdentityAdapter implements IdentityAdapter {
  async authenticate(): Promise<AuthenticatedIdentity> {
    throw new ServiceUnavailableException(
      "The Cognito identity adapter is not configured in this foundation build.",
    );
  }
}

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IDENTITY_ADAPTER) private readonly adapter: IdentityAdapter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<Request>();
    request.identity = await this.adapter.authenticate(request);
    return true;
  }
}

declare module "express" {
  interface Request {
    identity?: AuthenticatedIdentity;
    correlationId?: string;
  }
}
