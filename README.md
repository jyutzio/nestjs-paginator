# nestjs-paginator

![Version](https://img.shields.io/github/package-json/v/jyutzio/nestjs-paginator)
[![TravisCI](https://api.travis-ci.org/jyutzio/nestjs-paginator.svg?branch=master 'Build Status')](https://travis-ci.org/jyutzio/nestjs-paginator)
[![Coverage](https://img.shields.io/codecov/c/github/jyutzio/nestjs-paginator/master.svg)](https://codecov.io/gh/jyutzio/nestjs-paginator)
[![GitHub license](https://img.shields.io/github/license/jyutzio/nestjs-paginator.svg)](https://github.com/jyutzio/nestjs-paginator/blob/master/LICENSE)

A package to make pagination with NestJS, TypeORM, and Express as simple as possible.

The paginator function returns a class that can be serialized by class-transformer and conforms to [JSON:API](https://jsonapi.org/)

## Install

`npm install nestjs-paginator`

## Usage

### Example example

The following code exposes a route that can be utilized like so:

#### Endpoint

```url
http://localhost:3000/cat/all?sortBy=color&orderBy=DESC&limit=10&page=2
```

#### Result

```json
{
  "data": [
    {
      "id": 4,
      "name": "George",
      "color": "white"
    },
    {
      "id": 5,
      "name": "Leche",
      "color": "white"
    },
    {
      "id": 2,
      "name": "Garfield",
      "color": "ginger"
    },
    {
      "id": 1,
      "name": "Milo",
      "color": "brown"
    },
    {
      "id": 3,
      "name": "Shadow",
      "color": "black"
    }
  ],
  "meta": {
    "itemsPerPage": 2,
    "totalItems": 5,
    "currentPage": 2,
    "totalPages": 3,
    "sortBy": "color",
    "orderBy": "DESC"
  },
  "links": {
    "firstPage": "http://localhost:3000/cat/all?sortBy=color&orderBy=DESC&limit=2&page=1",
    "previousPage": "http://localhost:3000/cat/all?sortBy=color&orderBy=DESC&limit=2&page=1",
    "nextPage": "http://localhost:3000/cat/all?sortBy=color&orderBy=DESC&limit=2&page=3",
    "lastPage": "http://localhost:3000/cat/all?sortBy=color&orderBy=DESC&limit=2&page=3"
  }
}
```

#### Code

```ts
import { Controller, Injectable, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  Paginator,
  PaginatorQuery,
  paginator,
  Paginated,
} from 'nestjs-paginator';

@Entity()
export class CatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  name: string;

  @Column('text')
  color: string;
}

@Injectable()
export class CatService {
  constructor(
    @InjectRepository(CatEntity)
    private readonly catRepository: Repository<CatEntity>
  ) {}
  public getUsers(query: PaginatorQuery): Promise<Paginated<CatEntity>> {
    return paginator(query, this.catRepository, {
      sortableColumns: ['name', 'color'],
      defaultSortBy: 'name',
    });
  }
}

@Controller('cat')
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Get('all)
  public getUsers(
    @Paginator() query: PaginatorQuery
  ): Promise<Paginated<CatEntity>> {
    return this.catService.getUsers(query);
  }
}
```

### Config

```ts
const paginatorConfig: PaginatorConfig<CatEntity> {
  /**
   * Required: true (must have a minimum of one column)
   * Type: keyof CatEntity
   * Description: These are the columns that are valid to be sorted by.
   */
  sortableColumns: ['id', 'breed', 'color'],

  /**
   * Required: false
   * Type: number
   * Default: 100
   * Description: The maximum amount of entities to return per page.
   */
  maxLimit: 20,

  /**
   * Required: false
   * Type: keyof CatEntity
   * Default: sortableColumns[0]
   * Description: The column which to sort by default.
   */
  defaultSortBy: 'age',

  /**
   * Required: false
   * Type: 'ASC' | 'DESC'
   * Default: 'ASC'
   * Description: The order to display the sorted entities.
   */
  defaultOrderBy: 'ASC' | 'DESC',

  /**
   * Required: false
   * Type: number
   * Default: 20
   */
  defaultLimit: 50,

  /**
   * Required: false
   * Type: TypeORM find options
   * Default: None
   * https://typeorm.io/#/find-optionsfind-options.md
   */
  where: { color: 'ginger' }
}
```
