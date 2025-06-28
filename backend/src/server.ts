import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyStatic from "@fastify/static";
import * as path from "path";

import { env } from "./config/env";
import { errorHandler } from "./plugins/error-handler";
import { authPlugin } from "./plugins/auth";

// Routes
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { clientsRoutes } from "./routes/clients";
import { casesRoutes } from "./routes/cases";
import { documentsRoutes } from "./routes/documents";
import { petitionRoutes } from "./routes/petitions";
import { appointmentsRoutes } from "./routes/appointments";
import { paymentRoutes } from "./routes/payments";
import { activityRoutes } from "./routes/activities";
import { dashboardRoutes } from "./routes/dashboard";
import { profileRoutes } from "./routes/profile";
import { notificationsRoutes } from "./routes/notifications";
import { searchRoutes } from "./routes/search";

const app = Fastify({
  logger:
    env.NODE_ENV === "development"
      ? {
          level: "debug",
          transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
        }
      : {
          level: "info",
        },
}).withTypeProvider<TypeBoxTypeProvider>();

async function bootstrap() {
  try {
    // Plugins de Segurança
    await app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    });

    await app.register(cors, {
      origin:
        env.NODE_ENV === "production"
          ? ["https://your-frontend-domain.com"]
          : true,
      credentials: true,
    });

    await app.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });

    // JWT
    await app.register(jwt, {
      secret: env.JWT_SECRET,
      sign: {
        expiresIn: "15m", // Token de acesso curto
      },
    }); // Multipart para upload de arquivos
    await app.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    // Servir arquivos estáticos
    await app.register(fastifyStatic, {
      root: path.join(process.cwd(), "uploads"),
      prefix: "/uploads/",
    });

    // Swagger Documentation
    if (env.NODE_ENV === "development") {
      await app.register(swagger, {
        openapi: {
          info: {
            title: "JusCRM API",
            description: "API do CRM para Escritórios de Advocacia Trabalhista",
            version: "1.0.0",
          },
          servers: [
            {
              url: `http://localhost:${env.PORT}`,
              description: "Desenvolvimento",
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
        },
      });

      await app.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
          docExpansion: "full",
          deepLinking: false,
        },
      });
    } // Plugins customizados
    await app.register(errorHandler);
    await app.register(authPlugin);

    // Health Check
    app.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    // Rotas da API
    await app.register(authRoutes, { prefix: "/api/auth" });
    await app.register(userRoutes, { prefix: "/api/users" });
    await app.register(clientsRoutes, { prefix: "/api/clients" });
    await app.register(casesRoutes, { prefix: "/api/cases" });
    await app.register(documentsRoutes, { prefix: "/api/documents" });
    await app.register(petitionRoutes, { prefix: "/api/petitions" });
    await app.register(appointmentsRoutes, { prefix: "/api/appointments" });
    await app.register(paymentRoutes, { prefix: "/api/payments" });
    await app.register(activityRoutes, { prefix: "/api/activities" });
    await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
    await app.register(profileRoutes, { prefix: "/api" });
    await app.register(notificationsRoutes, { prefix: "/api/notifications" });
    await app.register(searchRoutes, { prefix: "/api/search" });

    // Start server
    await app.listen({
      host: "0.0.0.0",
      port: env.PORT,
    });

    console.log(`🚀 JusCRM API rodando em http://localhost:${env.PORT}`);
    if (env.NODE_ENV === "development") {
      console.log(
        `📚 Documentação disponível em http://localhost:${env.PORT}/docs`
      );
    }
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

bootstrap();
