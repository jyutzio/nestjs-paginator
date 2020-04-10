import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface PaginatorQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  orderBy?: 'ASC' | 'DESC';
  path: string;
}

export const Paginator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginatorQuery => {
    const request: Request = ctx.switchToHttp().getRequest();
    const { query } = request;
    const path =
      request.protocol +
      '://' +
      request.get('host') +
      request.baseUrl +
      request.path;
    return {
      page: query.page ? parseInt(query.page.toString(), 10) : undefined,
      limit: query.limit ? parseInt(query.limit.toString(), 10) : undefined,
      sortBy: query.sortBy ? query.sortBy.toString() : undefined,
      orderBy:
        query.orderBy == 'ASC' || query.orderBy == 'DESC'
          ? query.orderBy
          : undefined,
      path,
    };
  }
);
