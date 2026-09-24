import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createHouseholdSchema,
  updateHouseholdSchema,
  type CreateHouseholdInput,
  type UpdateHouseholdInput,
} from '@homecare/contracts';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { HouseholdsService } from './households.service';

@Controller('households')
export class HouseholdsController {
  constructor(private readonly households: HouseholdsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.households.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createHouseholdSchema)) input: CreateHouseholdInput,
  ) {
    return this.households.create(user, input);
  }

  @Get(':householdId')
  get(@CurrentUser() user: AuthenticatedUser, @Param('householdId') householdId: string) {
    return this.households.get(householdId, user.id);
  }

  @Patch(':householdId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Body(new ZodValidationPipe(updateHouseholdSchema)) input: UpdateHouseholdInput,
  ) {
    return this.households.update(householdId, user.id, input);
  }

  @Delete(':householdId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('householdId') householdId: string) {
    return this.households.remove(householdId, user.id);
  }
}
