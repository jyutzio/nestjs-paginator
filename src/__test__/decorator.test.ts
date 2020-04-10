import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import {
  HttpArgumentsHost,
  CustomParamFactory,
  ExecutionContext,
} from '@nestjs/common/interfaces';
import { Request } from 'express';
import { expect } from 'chai';
import { Paginator, PaginatorQuery } from '../';

function getParamDecoratorFactory<T>(decorator: Function): CustomParamFactory {
  class Test {
    public test(@decorator() value: T): void {
      //
    }
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}
const decoratorfactory = getParamDecoratorFactory<PaginatorQuery>(Paginator);

function contextFactory(query: Request['query']): Partial<ExecutionContext> {
  const mockContext: Partial<ExecutionContext> = {
    switchToHttp: (): HttpArgumentsHost =>
      Object({
        getRequest: (): Partial<Request> =>
          Object({
            protocol: 'http',
            get: () => 'localhost',
            baseUrl: '/items',
            path: '/all',
            query: query,
          }),
      }),
  };
  return mockContext;
}

describe('Decorator', function () {
  it('should handle undefined query fields', function () {
    const context = contextFactory({});

    const result: PaginatorQuery = decoratorfactory(null, context);

    expect(result).to.deep.equal({
      page: undefined,
      limit: undefined,
      sortBy: undefined,
      orderBy: undefined,
      path: 'http://localhost/items/all',
    });
  });

  it('should handle defined query fields', function () {
    const context = contextFactory({
      page: '1',
      limit: '20',
      sortBy: 'id',
      orderBy: 'ASC',
    });

    const result: PaginatorQuery = decoratorfactory(null, context);

    expect(result).to.deep.equal({
      page: 1,
      limit: 20,
      sortBy: 'id',
      orderBy: 'ASC',
      path: 'http://localhost/items/all',
    });
  });
});
