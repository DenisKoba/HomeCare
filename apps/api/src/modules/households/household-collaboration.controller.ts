import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createInvitationSchema,
  householdRoleSchema,
  type CreateInvitationInput,
} from '@homecare/contracts';
import { z } from 'zod';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { Public } from '../../common/auth/public.decorator';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { HouseholdCollaborationService } from './household-collaboration.service';

const updateMemberSchema = z.object({ role: householdRoleSchema });

@Controller()
export class HouseholdCollaborationController {
  constructor(private readonly collaboration: HouseholdCollaborationService) {}

  @Get('households/:householdId/members')
  listMembers(@CurrentUser() user: AuthenticatedUser, @Param('householdId') householdId: string) {
    return this.collaboration.listMembers(householdId, user.id);
  }

  @Patch('households/:householdId/members/:memberId')
  updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Param('memberId') memberId: string,
    @Body(new ZodValidationPipe(updateMemberSchema)) input: z.infer<typeof updateMemberSchema>,
  ) {
    return this.collaboration.updateMember(householdId, memberId, user.id, input.role);
  }

  @Delete('households/:householdId/members/:memberId')
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.collaboration.removeMember(householdId, memberId, user.id);
  }

  @Get('households/:householdId/invitations')
  listInvitations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
  ) {
    return this.collaboration.listInvitations(householdId, user.id);
  }

  @Post('households/:householdId/invitations')
  createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Body(new ZodValidationPipe(createInvitationSchema)) input: CreateInvitationInput,
  ) {
    return this.collaboration.createInvitation(householdId, user.id, input);
  }

  @Delete('households/:householdId/invitations/:invitationId')
  revokeInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.collaboration.revokeInvitation(householdId, invitationId, user.id);
  }

  @Public()
  @Get('invitations/:token')
  preview(@Param('token') token: string) {
    return this.collaboration.preview(token);
  }

  @Post('invitations/:token/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.collaboration.accept(token, user);
  }
}
