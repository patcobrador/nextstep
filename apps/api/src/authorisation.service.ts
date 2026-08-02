import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { AuthenticatedIdentity } from "./identity.js";
import { PrismaService } from "./prisma.service.js";

export interface AuthorisedActor {
  actorId: string;
  userId: string;
  householdIds: string[];
}

@Injectable()
export class AuthorisationService {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
  ) {}

  async actor(identity: AuthenticatedIdentity): Promise<AuthorisedActor> {
    const user = await this.database.client.user.findUnique({
      where: { identityProviderKey: `local:${identity.actorId}` },
      include: {
        memberships: {
          where: { revokedAt: null },
          select: { householdId: true },
        },
      },
    });
    if (!user || user.status !== "ACTIVE") throw this.notFound();
    return {
      actorId: identity.actorId,
      userId: user.id,
      householdIds: user.memberships.map(({ householdId }) => householdId),
    };
  }

  async household(
    identity: AuthenticatedIdentity,
    householdId: string,
  ): Promise<AuthorisedActor> {
    const actor = await this.actor(identity);
    if (!actor.householdIds.includes(householdId)) throw this.notFound();
    this.assertContext(identity, householdId);
    return actor;
  }

  async athlete(
    identity: AuthenticatedIdentity,
    athleteId: string,
  ): Promise<{ actor: AuthorisedActor; householdId: string }> {
    const athlete = await this.database.client.athlete.findUnique({
      where: { id: athleteId },
      select: { householdId: true },
    });
    if (!athlete) throw this.notFound();
    const actor = await this.household(identity, athlete.householdId);
    return { actor, householdId: athlete.householdId };
  }

  async practicePlan(
    identity: AuthenticatedIdentity,
    planId: string,
  ): Promise<{
    actor: AuthorisedActor;
    athleteId: string;
    householdId: string;
  }> {
    const plan = await this.database.client.practicePlan.findUnique({
      where: { id: planId },
      select: { athleteId: true, athlete: { select: { householdId: true } } },
    });
    if (!plan) throw this.notFound();
    const actor = await this.household(identity, plan.athlete.householdId);
    return {
      actor,
      athleteId: plan.athleteId,
      householdId: plan.athlete.householdId,
    };
  }

  async developmentResource(
    identity: AuthenticatedIdentity,
    resourceId: string,
    type: string,
  ): Promise<{
    actor: AuthorisedActor;
    athleteId: string;
    householdId: string;
  }> {
    const resource =
      await this.database.client.developmentFlowResource.findUnique({
        where: { id: resourceId },
        include: { flow: true },
      });
    if (!resource || resource.type !== type) throw this.notFound();
    const authorised = await this.athlete(identity, resource.athleteId);
    return {
      actor: authorised.actor,
      athleteId: resource.athleteId,
      householdId: authorised.householdId,
    };
  }

  async practiceSession(
    identity: AuthenticatedIdentity,
    sessionId: string,
  ): Promise<{
    actor: AuthorisedActor;
    athleteId: string;
    householdId: string;
    planId: string;
  }> {
    const session = await this.database.client.practiceSession.findUnique({
      where: { id: sessionId },
      select: {
        athleteId: true,
        practicePlanId: true,
        athlete: { select: { householdId: true } },
      },
    });
    if (!session) throw this.notFound();
    const actor = await this.household(identity, session.athlete.householdId);
    return {
      actor,
      athleteId: session.athleteId,
      householdId: session.athlete.householdId,
      planId: session.practicePlanId,
    };
  }

  private assertContext(
    identity: AuthenticatedIdentity,
    householdId: string,
  ): void {
    if (identity.householdId && identity.householdId !== householdId) {
      throw this.notFound();
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException("The requested resource was not found.");
  }
}
