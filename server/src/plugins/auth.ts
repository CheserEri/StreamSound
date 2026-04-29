import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import type { JWTPayload } from '../types/index.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_ACCESS_EXPIRES,
    },
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        request.userId = request.user.id;
        request.userRole = request.user.role;
      } catch {
        return reply.code(401).send({
          error: {
            code: 'AUTH_003',
            message: 'Access Token 已过期',
            detail: 'Please refresh your token',
          },
        });
      }
    },
  );

  fastify.decorate(
    'requireAdmin',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        request.userId = request.user.id;
        request.userRole = request.user.role;
        if (request.user.role !== 'admin') {
          return reply.code(403).send({
            error: {
              code: 'ADMIN_001',
              message: '需要管理员权限',
              detail: 'Current user is not an admin',
            },
          });
        }
      } catch {
        return reply.code(401).send({
          error: {
            code: 'AUTH_003',
            message: 'Access Token 已过期',
            detail: 'Please refresh your token',
          },
        });
      }
    },
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
