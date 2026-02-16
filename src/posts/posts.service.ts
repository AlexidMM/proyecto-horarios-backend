import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma,  } from '@prisma/client';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

        async findAll() {
        return this.prisma.posts.findMany({
            orderBy: {
            created_at: 'desc',
            },
        });
        }

        async findTrending() {
        return this.prisma.posts.findMany({
            orderBy: [
            { score: 'desc' },
            { created_at: 'desc' },
            ],
        });
        }

        async findActive() {
        return this.prisma.posts.findMany({
            where: {
            status: 'active',
            deleted: false,
            },
            orderBy: {
            expires_at: 'asc',
            },
        });
        }
            
    async findOne(id: string) {
        const post = await this.prisma.posts.findUnique({
            where: { id },
        });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    async create(data: Prisma.postsCreateInput ) {
        return this.prisma.posts.create({
            data,
        });
    }

    async update(id: string, data: Prisma.postsUpdateInput) {
        await this.findOne(id); // Ensure the post exists before updating
        return this.prisma.posts.update({
            where: { id },
            data,
        });
    }

	

}
