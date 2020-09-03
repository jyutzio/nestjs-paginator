import { Repository, FindConditions, SelectQueryBuilder } from 'typeorm';
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
    currentPage: string;
    nextPage?: string;
    lastPage?: string;
  };
}

export interface PaginatorConfig<T> {
  sortableColumns: SortBy<T>[];
  columnAliases?: { [key: string]: string };
  maxLimit?: number;
  defaultSortBy?: SortBy<T>;
  defaultOrderBy?: OrderBy;
  defaultLimit?: number;
  where?: FindConditions<T>;
  queryBuilder?: SelectQueryBuilder<T>;
}

export async function paginator<Entity>(
  query: PaginatorQuery,
  repo: Repository<Entity> | SelectQueryBuilder<Entity>,
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

  const { sortableColumns, defaultSortBy, columnAliases } = config;
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

  let [items, totalItems]: [Entity[], number] = [[], 0];

  if (repo instanceof Repository) {
    [items, totalItems] = await repo
      .createQueryBuilder('e')
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy('e.' + sortBy, orderBy)
      .where(config.where || {})
      .getManyAndCount();
  } else {
    let sortColumn = repo.alias + '.' + sortBy;
    if (columnAliases && columnAliases[sortBy]) {
      sortColumn = columnAliases[sortBy];
    }

    [items, totalItems] = await repo
      .take(limit)
      .skip((page - 1) * limit)
      .orderBy(sortColumn, orderBy)
      .getManyAndCount();
  }

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
      currentPage: buildLink(page),
      nextPage: page + 1 > totalPages ? undefined : buildLink(page + 1),
      lastPage: page == totalPages ? undefined : buildLink(totalPages),
    },
  };

  return Object.assign(new Paginated<Entity>(), results);
}
