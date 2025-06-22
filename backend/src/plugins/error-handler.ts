import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyError } from "fastify";

export const errorHandler: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const { statusCode = 500, message } = error;

    // Log do erro para debugging
    if (statusCode >= 500) {
      fastify.log.error(
        {
          request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
          },
          error: {
            message: error.message,
            stack: error.stack,
          },
        },
        "Internal Server Error"
      );
    }

    // Resposta de erro estruturada
    reply.status(statusCode).send({
      error: {
        statusCode,
        message: statusCode >= 500 ? "Internal Server Error" : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  });

  // Handler para rotas não encontradas
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        statusCode: 404,
        message: "Route not found",
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  });
};
