import { CatEntity } from './cat.entity';
import { createConnection, Repository } from 'typeorm';
import { paginator, PaginatorConfig } from '../';
import { expect } from 'chai';
import { Paginated } from '../paginator';
import { PaginatorQuery } from '../decorator';

describe('paginator', function () {
  let repo: Repository<CatEntity>;

  before(async function () {
    const connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [CatEntity],
    });
    repo = connection.getRepository(CatEntity);
    await repo.save([
      repo.create(),
      repo.create(),
      repo.create(),
      repo.create(),
      repo.create(),
    ]);
  });

  it('should return an instance of Paginated', async function () {
    const config: PaginatorConfig<CatEntity> = {
      sortableColumns: ['id'],
      defaultSortBy: 'dateCreated', // Should fall back to id
      defaultLimit: 1,
    };
    const query: PaginatorQuery = {
      path: '',
      page: 30, // will fallback to last available page
      limit: 2,
      sortBy: 'id',
    };

    const results = await paginator<CatEntity>(query, repo, config);

    expect(results).to.be.instanceOf(Paginated);
  });

  it('should default to index 0 of sortableColumns, when no other are given', async function () {
    const config: PaginatorConfig<CatEntity> = {
      sortableColumns: ['id'],
    };
    const query: PaginatorQuery = {
      path: '',
      page: 0,
    };

    const results = await paginator<CatEntity>(query, repo, config);

    expect(results).to.be.instanceOf(Paginated);
  });

  it('should return correct links', async function () {
    const config: PaginatorConfig<CatEntity> = {
      sortableColumns: ['id'],
    };
    const query: PaginatorQuery = {
      path: '',
      page: 2,
      limit: 2,
    };

    const { links } = await paginator<CatEntity>(query, repo, config);

    expect(links.firstPage).to.equal('?page=1&limit=2&sortBy=id&orderBy=ASC');
    expect(links.previousPage).to.equal(
      '?page=1&limit=2&sortBy=id&orderBy=ASC'
    );
    expect(links.nextPage).to.equal('?page=3&limit=2&sortBy=id&orderBy=ASC');
    expect(links.lastPage).to.equal('?page=3&limit=2&sortBy=id&orderBy=ASC');
  });

  it('should default to defaultSortby if query sortBy does not exist', async function () {
    const config: PaginatorConfig<CatEntity> = {
      sortableColumns: ['id', 'dateCreated'],
      defaultSortBy: 'dateCreated',
    };
    const query: PaginatorQuery = {
      path: '',
    };

    const results = await paginator<CatEntity>(query, repo, config);

    expect(results).to.be.instanceOf(Paginated);
  });

  it('should throw an error when no sortableColumns', async function () {
    const config: PaginatorConfig<CatEntity> = {
      sortableColumns: [],
    };
    const query: PaginatorQuery = {
      path: '',
    };

    try {
      await paginator<CatEntity>(query, repo, config);
    } catch (err) {
      expect(err).to.be.an('error');
    }
  });
});
