import { Controller } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() data: Prisma.postsCreateInput) {
    return this.postsService.create(data);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.postsService.findAll(userId);
  }

  @Get('active')
  findActive(@Query('userId') userId?: string) {
    return this.postsService.findActive(userId);
  }

  @Get('trending')
  findTrending(@Query('userId') userId?: string) {
    return this.postsService.findTrending(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.postsService.findOne(String(id), userId);
  }

  @Post(':id/react')
  react(
    @Param('id') id: string,
    @Body() body: { tipo: 'up' | 'down'; userId: string }
  ) {
    return this.postsService.react(String(id), body.userId, body.tipo);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.postsService.incrementView(String(id), userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.postsUpdateInput) {
    return this.postsService.update(String(id), data);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.postsService.remove(Number(id));
  // }
}