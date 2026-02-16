import { Controller } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Prisma,  } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() data: Prisma.postsCreateInput) {
    return this.postsService.create(data);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(String(id));
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