import { randomUUID } from "node:crypto";

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Injectable,
  Logger,
  type NestMiddleware,
} from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const supplied = request.header("x-correlation-id");
    request.correlationId = supplied?.trim() || randomUUID();
    response.setHeader("x-correlation-id", request.correlationId);
    const startedAt = performance.now();
    response.once("finish", () => {
      this.logger.log({
        correlationId: request.correlationId,
        durationMs: Math.round(performance.now() - startedAt),
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
      });
    });
    next();
  }
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ProblemDetails");

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const detail =
      typeof raw === "string"
        ? raw
        : raw && typeof raw === "object" && "message" in raw
          ? Array.isArray(raw.message)
            ? raw.message.join(" ")
            : String(raw.message)
          : status === 500
            ? "An unexpected error occurred."
            : "The request could not be completed.";
    if (status >= 500) {
      this.logger.error({
        correlationId: request.correlationId,
        error:
          exception instanceof Error ? exception.message : String(exception),
        path: request.originalUrl,
      });
    }
    response
      .status(status)
      .type("application/problem+json")
      .send({
        type: `https://nextstep.local/problems/http-${status}`,
        title: statusTitle(status),
        status,
        detail,
        instance: request.originalUrl,
        correlationId: request.correlationId,
      });
  }
}

const statusTitle = (status: number): string =>
  ({
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
    503: "Service Unavailable",
  })[status] ?? "Request Failed";
