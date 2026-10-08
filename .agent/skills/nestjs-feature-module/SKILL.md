---
name: nestjs-feature-module
description: Scaffold a production-grade NestJS feature module with DTO validation, tenant scoping, RBAC guards, Swagger documentation, and unit tests.
---

# NestJS Feature Module Scaffolding

## When to Use

Use when implementing a new domain feature in `apps/api/src/` (e.g. `colleges`, `companies`, `drives`, `questions`, `assessments`).

## Directory Layout

```
apps/api/src/<feature>/
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── <feature>.controller.ts
├── <feature>.controller.spec.ts
├── <feature>.service.ts
├── <feature>.service.spec.ts
└── <feature>.module.ts
```

## Implementation Templates

### 1. DTO (`dto/create-<feature>.dto.ts`)

```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ description: 'Name of the resource' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
```

### 2. Service (`<feature>.service.ts`)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CurrentUser } from '@campusedge/shared';
import { CreateFeatureDto } from './dto/create-<feature>.dto';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTenant(user: CurrentUser) {
    return this.prisma.featureTable.findMany({
      where: user.collegeId ? { collegeId: user.collegeId } : {},
    });
  }

  async create(user: CurrentUser, dto: CreateFeatureDto) {
    return this.prisma.featureTable.create({
      data: {
        ...dto,
        collegeId: user.collegeId!, // Bound authoritatively to user's college
      },
    });
  }
}
```

### 3. Controller (`<feature>.controller.ts`)

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUser as CurrentUserType, Role } from '@campusedge/shared';
import { FeatureService } from './<feature>.service';
import { CreateFeatureDto } from './dto/create-<feature>.dto';

@ApiTags('Feature')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @Roles(Role.STUDENT, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List tenant resources' })
  findAll(@CurrentUser() user: CurrentUserType) {
    return this.featureService.findAllForTenant(user);
  }

  @Post()
  @Roles(Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Create resource for tenant' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateFeatureDto) {
    return this.featureService.create(user, dto);
  }
}
```
