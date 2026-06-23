import { Body, Controller, Delete, HttpCode, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateLocaleDto, UpdatePasswordDto, UpdateProfileDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authed-request';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Patch('profile')
  @HttpCode(204)
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.settings.updateProfile(user.id, dto);
  }

  @Patch('password')
  @HttpCode(204)
  updatePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePasswordDto) {
    return this.settings.updatePassword(user.id, dto);
  }

  @Patch('locale')
  @HttpCode(204)
  updateLocale(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateLocaleDto) {
    return this.settings.updateLocale(user.id, dto);
  }

  @Delete('account')
  @HttpCode(204)
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.deleteAccount(user.id);
  }
}
