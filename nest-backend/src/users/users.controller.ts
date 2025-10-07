import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  Controller,
  Get,
  UseGuards,
  Delete,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserResponse } from './responses/user-response';
import { UserId } from '@app/common/decorators/user-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { AVATARS_DIR } from '@app/common/constants';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: `Used to view user's account details` })
  @ApiOkResponse({
    description: 'Profile returned',
    type: UserResponse,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  getProfile(@UserId() userId: string) {
    return this.userService.returnProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile' })
  @ApiOkResponse({ description: 'Profile deleted' })
  @ApiBearerAuth()
  update(@UserId() userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(userId, updateUserDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Used to delete a user form database' })
  @ApiOkResponse({ description: 'Account deleted successfully' })
  @ApiBearerAuth()
  async remove(@UserId() userId: string) {
    return this.userService.remove(userId);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiOkResponse({ description: 'Avatar uploaded successfully' })
  @ApiBadRequestResponse({ description: 'No file attached' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException(ErrorMessages.NO_FILE_ATTACHED);

    const avatarUrl = `${AVATARS_DIR}\\${file.filename}`;
    return await this.userService.update(userId, { avatarUrl });
  }
}
