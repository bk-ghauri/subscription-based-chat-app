import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseObject } from './responses/user-response';
import { UserId } from '@app/common/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  @Get('profile')
  @ApiOperation({ summary: `Used to view user's account details` })
  @ApiOkResponse({
    description: 'Profile returned',
    type: UserResponseObject,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  getProfile(@UserId() userId: string) {
    return this.userService.returnProfile(userId);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(id, updateUserDto);
  // }

  @Delete()
  @ApiOperation({ summary: 'Used to delete a user form database' })
  @ApiOkResponse({ description: 'Account deleted successfully' })
  @ApiBearerAuth()
  async remove(@UserId() userId: string) {
    return this.userService.remove(userId);
  }
}
