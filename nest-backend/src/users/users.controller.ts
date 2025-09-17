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
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }
  // // @SetMetadata('role', [Role.ADMIN])
  // @Roles(Role.EDITOR)
  // // @UseGuards(RolesGuard)
  // // @UseGuards(JwtAuthGuard)

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const userIdFromToken = req.user.id; // comes from JWT payload
    //const isAdmin = req.user.role === 'ADMIN'; // optional if you support roles

    // only allow deleting own account (unless admin)
    if (userIdFromToken !== id) {
      //&& !isAdmin)
      throw new ForbiddenException('You can only delete your own account');
    }
    return this.userService.remove(userIdFromToken);
  }
}
