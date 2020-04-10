import { Repository, FindConditions } from 'typeorm';
import { PaginatorQuery } from './decorator';
import { ServiceUnavailableException } from '@nestjs/common';

type SortBy<T> = Extract<keyof T, string>;
type OrderBy = 'ASC' | 'DESC';

export class Paginated<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy: SortBy<T>;
    orderBy: OrderBy;
  };

  links: {
    firstPage?: string;
    previousPage?: string;
    nextPage?: string;
    lastPage?: string;
  };
}

export interface PaginatorConfig<T> {
  sortableColumns: SortBy<T>[];
  maxLimit?: number; // if not set, will default to 100
  defaultSortBy?: SortBy<T>; // if not set will default to first sortable column
  defaultOrderBy?: OrderBy;
  defaultLimit?: number; // if doesn't exist will default to 20
  where?: FindConditions<T>;
}
export async function paginator<Entity>(
  query: PaginatorQuery,
  repo: Repository<Entity>,
  config: PaginatorConfig<Entity>
): Promise<Paginated<Entity>> {
  let page = query.page || 1;
  const limit = query.limit || config.defaultLimit || 20;
  const orderBy = query.orderBy || config.defaultOrderBy || 'ASC';
  const path = query.path;

  function isEntityKey(
    sortableColumns: SortBy<Entity>[],
    column: string
  ): column is SortBy<Entity> {
    return !!sortableColumns.find((c) => c === column);
  }

  const { sortableColumns, defaultSortBy } = config;
  if (config.sortableColumns.length < 1)
    throw new ServiceUnavailableException();
  let sortBy: SortBy<Entity>;
  if (query.sortBy && isEntityKey(sortableColumns, query.sortBy)) {
    sortBy = query.sortBy;
  } else if (defaultSortBy && isEntityKey(sortableColumns, defaultSortBy)) {
    sortBy = defaultSortBy;
  } else {
    sortBy = sortableColumns[0];
  }

  const [items, totalItems] = await repo
    .createQueryBuilder()
    .take(limit)
    .skip((page - 1) * limit)
    .orderBy(sortBy, orderBy)
    .where(config.where || {})
    .getManyAndCount();
  let totalPages = totalItems / limit;
  if (totalItems % limit) totalPages = Math.ceil(totalPages);

  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const options = `&limit=${limit}&sortBy=${sortBy}&orderBy=${orderBy}`;

  const buildLink = (p: number): string => path + '?page=' + p + options;

  const results: Paginated<Entity> = {
    data: items,
    meta: {
      itemsPerPage: limit,
      totalItems,
      currentPage: page,
      totalPages: totalPages,
      sortBy,
      orderBy,
    },
    links: {
      firstPage: page == 1 ? undefined : buildLink(1),
      previousPage: page - 1 < 1 ? undefined : buildLink(page - 1),
      nextPage: page + 1 > totalPages ? undefined : buildLink(page + 1),
      lastPage: page == totalPages ? undefined : buildLink(totalPages),
    },
  };

  return Object.assign(new Paginated<Entity>(), results);
}
