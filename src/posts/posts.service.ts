import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    private buildInclude(userId?: string) {
        const include: Prisma.postsInclude = {
            creator: {
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                },
            },
        };

        if (userId) {
            include.reactions = {
                where: { user_id: userId },
                select: { tipo: true },
            };
        }

        return include;
    }

    private mapPost(post: any) {
        const userReaction = post.reactions?.[0]?.tipo ?? null;
        const { reactions, ...rest } = post;
        return {
            ...rest,
            user_reaction: userReaction,
        };
    }

        async findAll(userId?: string) {
        const posts = await this.prisma.posts.findMany({
            orderBy: {
                created_at: 'desc',
            },
            include: this.buildInclude(userId),
        });

        return posts.map((post) => this.mapPost(post));
        }

        async findTrending(userId?: string) {
        const now = new Date();
        const posts = await this.prisma.posts.findMany({
            where: {
                deleted: false,
                status: 'active',
                OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            },
            orderBy: [
                { score: 'desc' },
                { created_at: 'desc' },
            ],
            include: this.buildInclude(userId),
        });

        return posts.map((post) => this.mapPost(post));
        }

        async findActive(userId?: string) {
        const now = new Date();
        const posts = await this.prisma.posts.findMany({
            where: {
                status: 'active',
                deleted: false,
                OR: [{ expires_at: null }, { expires_at: { gt: now } }],
            },
            orderBy: {
                expires_at: 'asc',
            },
            include: this.buildInclude(userId),
        });

        return posts.map((post) => this.mapPost(post));
        }
            
    async findOne(id: string, userId?: string) {
        const post = await this.prisma.posts.findUnique({
            where: { id },
            include: this.buildInclude(userId),
        });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return this.mapPost(post);
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

    async react(postId: string, userId: string, tipo: 'up' | 'down') {
        if (!userId) {
            throw new BadRequestException('userId is required');
        }

        if (tipo !== 'up' && tipo !== 'down') {
            throw new BadRequestException('Invalid reaction type');
        }

        await this.findOne(postId);

        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.post_reactions.findUnique({
                where: {
                    post_id_user_id: {
                        post_id: postId,
                        user_id: userId,
                    },
                },
            });

            let scoreDelta = 0;
            let upDelta = 0;
            let downDelta = 0;
            let userReaction: 'up' | 'down' | null = tipo;

            if (!existing) {
                await tx.post_reactions.create({
                    data: {
                        post_id: postId,
                        user_id: userId,
                        tipo,
                    },
                });

                if (tipo === 'up') {
                    scoreDelta = 1;
                    upDelta = 1;
                } else {
                    scoreDelta = -1;
                    downDelta = 1;
                }
            } else if (existing.tipo === tipo) {
                await tx.post_reactions.delete({
                    where: {
                        post_id_user_id: {
                            post_id: postId,
                            user_id: userId,
                        },
                    },
                });

                userReaction = null;
                if (tipo === 'up') {
                    scoreDelta = -1;
                    upDelta = -1;
                } else {
                    scoreDelta = 1;
                    downDelta = -1;
                }
            } else {
                await tx.post_reactions.update({
                    where: {
                        post_id_user_id: {
                            post_id: postId,
                            user_id: userId,
                        },
                    },
                    data: { tipo },
                });

                if (existing.tipo === 'up') {
                    scoreDelta = -2;
                    upDelta = -1;
                    downDelta = 1;
                } else {
                    scoreDelta = 2;
                    upDelta = 1;
                    downDelta = -1;
                }
            }

            await tx.posts.update({
                where: { id: postId },
                data: {
                    score: { increment: scoreDelta },
                    upvotes: { increment: upDelta },
                    downvotes: { increment: downDelta },
                },
            });

            const updated = await tx.posts.findUnique({
                where: { id: postId },
                include: this.buildInclude(userId),
            });

            if (!updated) {
                throw new NotFoundException('Post not found');
            }

            return {
                ...this.mapPost(updated),
                user_reaction: userReaction,
            };
        });
    }

    async incrementView(postId: string, userId?: string) {
        await this.findOne(postId);
        const updated = await this.prisma.posts.update({
            where: { id: postId },
            data: {
                view_count: { increment: 1 },
            },
            include: this.buildInclude(userId),
        });

        return this.mapPost(updated);
    }

	

}

