import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Request,
  Patch,
  Param,
  Delete,
  ForbiddenException,
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
import { UserResponseDto } from './dto/user-response.dto';

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
    type: UserResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  getProfile(@Req() req) {
    return this.userService.returnProfile(req.user.id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(id, updateUserDto);
  // }

  @Delete()
  @ApiOperation({ summary: 'Used to delete a user form database' })
  @ApiOkResponse({ description: 'Account deleted successfully' })
  @ApiBearerAuth()
  async remove(@Request() req) {
    const userIdFromToken = req.user.id;
    return this.userService.remove(userIdFromToken);
  }
}
