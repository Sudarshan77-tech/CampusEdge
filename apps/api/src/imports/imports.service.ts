import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { PrismaService } from '../prisma.service';
import {
  normalizeCompanyName,
  ImportJobType,
  ImportJobStatus,
  DriveCategory,
  JobType,
  DriveStatus,
  CompanyStatus,
  CommitImportDto,
  CompanyMappingItem,
  ImportJobQueryDto,
  QuestionStatus,
  QuestionType,
} from '@campusedge/shared';
import { Prisma } from '@campusedge/database';

const MAX_ROWS = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface HistoricalDriveRow {
  company_name: string;
  season_label: string;
  title: string;
  drive_date?: string;
  category?: DriveCategory;
  role_title: string;
  job_type?: JobType;
  ctc_min_lpa: number;
  ctc_max_lpa: number;
  registered_count?: number;
  shortlisted_count?: number;
  selected_count?: number;
}

interface ParsedRowResult {
  rowNumber: number;
  isValid: boolean;
  data?: HistoricalDriveRow;
  errors: { column: string; message: string }[];
}

interface ImportJobOptions {
  parsedValidRows?: (HistoricalDriveRow & {
    rowNumber: number;
    matchedCompanyId?: string;
  })[];
  unmappedCompanies?: string[];
  companyMappings?: Record<string, { resolvedCompanyId: string | null; createNew: boolean }>;
  [key: string]: unknown;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  topicId: string;
  subtopicId?: string | null;
  type: QuestionType;
  difficulty: number;
  stem: string;
  explanation: string;
  numericAnswer?: number | null;
  numericTolerance?: number;
  expectedTimeSeconds: number;
  tags: string[];
  groupTitle?: string;
  scope: 'GLOBAL' | 'COLLEGE';
  options: { key: string; text: string; isCorrect: boolean }[];
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sanitizes string against CSV/Formula Injection (CWE-1236).
   */
  private sanitizeFormula(val: unknown): string {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      str = `'${str}`;
    }
    return str;
  }

  /**
   * Normalize table header string.
   */
  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_');
  }

  /**
   * Parse CSV or XLSX using ExcelJS.
   */
  private async readSpreadsheetRows(
    buffer: Buffer,
    filename: string,
  ): Promise<Record<string, unknown>[]> {
    const isCsv = filename.toLowerCase().endsWith('.csv');
    const workbook = new ExcelJS.Workbook();

    if (isCsv) {
      const stream = Readable.from(buffer);
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('No sheets found in spreadsheet');
    }

    const rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as unknown[];
      // ExcelJS row.values is 1-indexed, values[0] is undefined
      const rowArr = Array.isArray(values) ? values.slice(1) : [];

      if (rowNumber === 1) {
        headers = rowArr.map((h) => this.normalizeHeader(String(h ?? '')));
      } else {
        const rowObj: Record<string, unknown> = {};
        headers.forEach((hdr, idx) => {
          let cellVal = rowArr[idx];
          if (cellVal && typeof cellVal === 'object' && 'text' in cellVal) {
            cellVal = (cellVal as { text: string }).text;
          }
          rowObj[hdr] = cellVal !== undefined ? cellVal : null;
        });
        rows.push(rowObj);
      }
    });

    return rows;
  }

  /**
   * Upload and validate historical import file.
   */
  async uploadAndParse(
    collegeId: string,
    userId: string,
    file: { originalname: string; size: number; buffer: Buffer },
    type: ImportJobType.QUESTIONS,
  ): Promise<{
    jobId: string;
    status: ImportJobStatus;
    totalRows: number;
    validRows: number;
    errorCount: number;
    preview: ParsedQuestionRow[];
    sampleValidRows: ParsedQuestionRow[];
  }>;
  async uploadAndParse(
    collegeId: string,
    userId: string,
    file: { originalname: string; size: number; buffer: Buffer },
    type: ImportJobType.HISTORICAL_DRIVES,
  ): Promise<{
    jobId: string;
    status: ImportJobStatus;
    totalRows: number;
    validRows: number;
    errorCount: number;
    unmappedCompanies: string[];
    sampleValidRows: (HistoricalDriveRow & { rowNumber: number; matchedCompanyId?: string })[];
    preview: (HistoricalDriveRow & { rowNumber: number; matchedCompanyId?: string })[];
  }>;
  async uploadAndParse(
    collegeId: string,
    userId: string,
    file: { originalname: string; size: number; buffer: Buffer },
    type?: ImportJobType,
  ): Promise<{
    jobId: string;
    status: ImportJobStatus;
    totalRows: number;
    validRows: number;
    errorCount: number;
    unmappedCompanies?: string[];
    sampleValidRows?: unknown[];
    preview: unknown[];
  }>;
  async uploadAndParse(
    collegeId: string,
    userId: string,
    file: { originalname: string; size: number; buffer: Buffer },
    type: ImportJobType = ImportJobType.HISTORICAL_DRIVES,
  ): Promise<unknown> {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum size of 5 MB');
    }

    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const rawRows = await this.readSpreadsheetRows(file.buffer, file.originalname);
    if (rawRows.length === 0) {
      throw new BadRequestException('The spreadsheet is empty');
    }
    if (rawRows.length > MAX_ROWS) {
      throw new BadRequestException(`Spreadsheet exceeds maximum limit of ${MAX_ROWS} rows`);
    }

    if (type === ImportJobType.QUESTIONS) {
      return this.uploadAndParseQuestions(collegeId, userId, file, rawRows, fileHash);
    }

    // Process & validate rows
    const validationResults: ParsedRowResult[] = [];
    const unmappedCompanies = new Set<string>();

    // Pre-fetch all catalog companies for matching
    const catalogCompanies = await this.prisma.company.findMany({
      select: { id: true, name: true, normalizedName: true },
    });
    const catalogMap = new Map<string, { id: string; name: string }>();
    catalogCompanies.forEach((c) => {
      catalogMap.set(c.normalizedName, { id: c.id, name: c.name });
    });

    const parsedValidData: (HistoricalDriveRow & {
      rowNumber: number;
      matchedCompanyId?: string;
    })[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row) continue;
      const rowNum = i + 2; // Row 1 is header
      const errors: { column: string; message: string }[] = [];

      const companyName = String(row['company_name'] ?? '').trim();
      const seasonLabel = String(row['season_label'] ?? '').trim();
      const title = String(row['title'] ?? '').trim();
      const roleTitle = String(row['role_title'] ?? '').trim();
      const driveDate = row['drive_date'] ? String(row['drive_date']).trim() : undefined;
      const category = String(row['category'] ?? 'REGULAR')
        .toUpperCase()
        .trim() as DriveCategory;
      const jobType = String(row['job_type'] ?? 'FULL_TIME')
        .toUpperCase()
        .trim() as JobType;

      const ctcMin = Number(row['ctc_min_lpa'] ?? 0);
      const ctcMax = Number(row['ctc_max_lpa'] ?? 0);
      const regCount =
        row['registered_count'] !== null ? Number(row['registered_count']) : undefined;
      const shortCount =
        row['shortlisted_count'] !== null ? Number(row['shortlisted_count']) : undefined;
      const selCount = row['selected_count'] !== null ? Number(row['selected_count']) : undefined;

      if (!companyName)
        errors.push({ column: 'company_name', message: 'Company name is required' });
      if (!seasonLabel)
        errors.push({ column: 'season_label', message: 'Season label is required' });
      if (!title) errors.push({ column: 'title', message: 'Drive title is required' });
      if (!roleTitle) errors.push({ column: 'role_title', message: 'Role title is required' });

      if (isNaN(ctcMin) || ctcMin < 0)
        errors.push({ column: 'ctc_min_lpa', message: 'Must be numeric >= 0' });
      if (isNaN(ctcMax) || ctcMax < 0)
        errors.push({ column: 'ctc_max_lpa', message: 'Must be numeric >= 0' });
      if (ctcMin > ctcMax)
        errors.push({
          column: 'ctc_min_lpa',
          message: `ctc_min_lpa (${ctcMin}) cannot exceed ctc_max_lpa (${ctcMax})`,
        });

      if (selCount !== undefined && regCount !== undefined && selCount > regCount) {
        errors.push({
          column: 'selected_count',
          message: `selected_count (${selCount}) cannot exceed registered_count (${regCount})`,
        });
      }

      const norm = normalizeCompanyName(companyName);
      const matched = catalogMap.get(norm);
      if (!matched && companyName) {
        unmappedCompanies.add(companyName);
      }

      if (errors.length > 0) {
        validationResults.push({ rowNumber: rowNum, isValid: false, errors });
      } else {
        const item: HistoricalDriveRow & { rowNumber: number; matchedCompanyId?: string } = {
          rowNumber: rowNum,
          company_name: this.sanitizeFormula(companyName),
          season_label: this.sanitizeFormula(seasonLabel),
          title: this.sanitizeFormula(title),
          role_title: this.sanitizeFormula(roleTitle),
          drive_date: driveDate,
          category: Object.values(DriveCategory).includes(category)
            ? category
            : DriveCategory.REGULAR,
          job_type: Object.values(JobType).includes(jobType) ? jobType : JobType.FULL_TIME,
          ctc_min_lpa: ctcMin,
          ctc_max_lpa: ctcMax,
          registered_count: regCount,
          shortlisted_count: shortCount,
          selected_count: selCount,
          matchedCompanyId: matched?.id,
        };
        validationResults.push({ rowNumber: rowNum, isValid: true, data: item, errors: [] });
        parsedValidData.push(item);
      }
    }

    const validRowsCount = parsedValidData.length;
    const errorCount = validationResults.filter((r) => !r.isValid).length;

    // Save job and row errors to database
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.importJob.create({
        data: {
          collegeId,
          type,
          status: errorCount === 0 ? ImportJobStatus.VALIDATED : ImportJobStatus.UPLOADED,
          fileHash,
          totalRows: rawRows.length,
          validRows: validRowsCount,
          errorCount,
          createdBy: userId,
          options: {
            unmappedCompanies: Array.from(unmappedCompanies),
            parsedValidRows: parsedValidData,
            companyMappings: {},
          } as unknown as Prisma.InputJsonValue,
          summary: {
            total: rawRows.length,
            valid: validRowsCount,
            errors: errorCount,
            unmappedCompaniesCount: unmappedCompanies.size,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      // Insert errors in bulk
      const dbErrors: {
        jobId: string;
        collegeId: string;
        rowNumber: number;
        column: string;
        message: string;
      }[] = [];

      for (const res of validationResults) {
        if (!res.isValid) {
          for (const err of res.errors) {
            dbErrors.push({
              jobId: job.id,
              collegeId,
              rowNumber: res.rowNumber,
              column: err.column,
              message: err.message,
            });
          }
        }
      }

      if (dbErrors.length > 0) {
        await tx.importRowError.createMany({
          data: dbErrors,
        });
      }

      return {
        jobId: job.id,
        status: job.status,
        totalRows: rawRows.length,
        validRows: validRowsCount,
        errorCount,
        unmappedCompanies: Array.from(unmappedCompanies),
        sampleValidRows: parsedValidData.slice(0, 5),
        preview: parsedValidData.slice(0, 10),
      };
    });
  }

  /**
   * Get preview for an import job.
   */
  async getPreview(jobId: string, collegeId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, collegeId },
    });
    if (!job) throw new NotFoundException('Import job not found');

    const options = (job.options as unknown as ImportJobOptions) || {};
    const validRows = options.parsedValidRows || [];
    const unmappedCompanies = options.unmappedCompanies || [];
    const mappings =
      (options.companyMappings as Record<
        string,
        { resolvedCompanyId: string | null; createNew: boolean }
      >) || {};

    return {
      id: job.id,
      status: job.status,
      type: job.type,
      totalRows: job.totalRows,
      validRows: job.validRows,
      errorCount: job.errorCount,
      unmappedCompanies,
      companyMappings: mappings,
      sampleRows: validRows.slice(0, 10),
    };
  }

  /**
   * Resolve an unmapped company name.
   */
  async resolveCompany(jobId: string, collegeId: string, mapping: CompanyMappingItem) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, collegeId },
    });
    if (!job) throw new NotFoundException('Import job not found');

    const options = (job.options as unknown as ImportJobOptions) || {};
    const mappings = options.companyMappings || {};
    mappings[mapping.rawName] = {
      resolvedCompanyId: mapping.resolvedCompanyId || null,
      createNew: mapping.createNew ?? false,
    };
    options.companyMappings = mappings;

    await this.prisma.importJob.update({
      where: { id_collegeId: { id: jobId, collegeId } },
      data: { options: options as Prisma.InputJsonValue },
    });

    return { success: true, mappings };
  }

  /**
   * Commit verified rows transactionally.
   */
  async commit(jobId: string, collegeId: string, userId: string, dto: CommitImportDto) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, collegeId },
    });
    if (!job) throw new NotFoundException('Import job not found');

    if (job.status === ImportJobStatus.COMPLETED) {
      throw new BadRequestException('Import job has already been committed');
    }

    const options = (job.options as unknown as ImportJobOptions) || {};
    const parsedRows = options.parsedValidRows || [];

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid rows found to commit');
    }

    if (job.type === ImportJobType.QUESTIONS) {
      return this.commitQuestions(job, collegeId, userId);
    }

    // Merge manual mappings from DTO if provided
    const mappings = options.companyMappings || {};
    if (dto.companyMappings) {
      for (const m of dto.companyMappings) {
        mappings[m.rawName] = {
          resolvedCompanyId: m.resolvedCompanyId || null,
          createNew: m.createNew ?? false,
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve company IDs for every row
      const resolvedCompanyMap = new Map<string, string>();

      for (const row of parsedRows) {
        if (row.matchedCompanyId) {
          resolvedCompanyMap.set(row.company_name, row.matchedCompanyId);
          continue;
        }

        const mapConfig = mappings[row.company_name];
        if (mapConfig?.resolvedCompanyId) {
          resolvedCompanyMap.set(row.company_name, mapConfig.resolvedCompanyId);
        } else if (mapConfig?.createNew) {
          // Check if already created in this tx
          const norm = normalizeCompanyName(row.company_name);
          let comp = await tx.company.findUnique({ where: { normalizedName: norm } });
          if (!comp) {
            const baseSlug = row.company_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .slice(0, 80);
            comp = await tx.company.create({
              data: {
                name: row.company_name,
                normalizedName: norm,
                slug: `${baseSlug}-${Date.now()}`,
                status: CompanyStatus.PENDING_REVIEW,
                createdByCollegeId: collegeId,
              },
            });
          }
          resolvedCompanyMap.set(row.company_name, comp.id);
        } else {
          // Unresolved company encountered
          throw new BadRequestException(
            `Company "${row.company_name}" has not been mapped or marked for creation`,
          );
        }
      }

      // 2. Resolve / Create PlacementSeasons for unique season labels
      const seasonLabels = Array.from(new Set(parsedRows.map((r) => r.season_label)));
      const seasonMap = new Map<string, string>();

      for (const label of seasonLabels) {
        let season = await tx.placementSeason.findFirst({
          where: { label, collegeId },
        });

        if (!season) {
          const firstPart = label.split('-')[0] || '';
          const startYear = parseInt(firstPart) || new Date().getFullYear();
          season = await tx.placementSeason.create({
            data: {
              collegeId,
              label,
              batchYear: startYear + 1,
              startDate: new Date(`${startYear}-08-01T00:00:00.000Z`),
              endDate: new Date(`${startYear + 1}-06-30T00:00:00.000Z`),
              isCurrent: false,
            },
          });
        }
        seasonMap.set(label, season.id);
      }

      // 3. Create historical Drives & Roles
      let createdDrivesCount = 0;
      let createdRolesCount = 0;

      for (const row of parsedRows) {
        const companyId = resolvedCompanyMap.get(row.company_name)!;
        const seasonId = seasonMap.get(row.season_label)!;

        const drive = await tx.drive.create({
          data: {
            collegeId,
            companyId,
            seasonId,
            title: row.title,
            driveType: 'ON_CAMPUS',
            category: row.category || DriveCategory.REGULAR,
            status: DriveStatus.COMPLETED,
            isHistorical: true,
            visitDate: row.drive_date ? new Date(row.drive_date) : null,
            registeredCount: row.registered_count ?? null,
            shortlistedCount: row.shortlisted_count ?? null,
            selectedCount: row.selected_count ?? null,
            createdBy: userId,
          },
        });
        createdDrivesCount++;

        await tx.driveRole.create({
          data: {
            driveId: drive.id,
            collegeId,
            title: row.role_title,
            jobType: row.job_type || JobType.FULL_TIME,
            ctcLpaMin: new Prisma.Decimal(row.ctc_min_lpa),
            ctcLpaMax: new Prisma.Decimal(row.ctc_max_lpa),
          },
        });
        createdRolesCount++;
      }

      // 4. Update import job status
      const updatedJob = await tx.importJob.update({
        where: { id_collegeId: { id: jobId, collegeId } },
        data: {
          status: ImportJobStatus.COMPLETED,
          committedAt: new Date(),
          summary: {
            createdDrivesCount,
            createdRolesCount,
            totalRows: job.totalRows,
            validRows: job.validRows,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        jobId: updatedJob.id,
        createdDrivesCount,
        createdRolesCount,
      };
    });
  }

  /**
   * Export validation errors as a CSV file with formula injection protection.
   */
  async getErrorsCsv(jobId: string, collegeId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, collegeId },
    });
    if (!job) throw new NotFoundException('Import job not found');

    const errors = await this.prisma.importRowError.findMany({
      where: { jobId, collegeId },
      orderBy: { rowNumber: 'asc' },
    });

    const header = 'Row,Column,Error Message\n';
    const lines = errors.map((e) => {
      const sanitizedCol = this.sanitizeFormula(e.column || 'Unknown');
      const sanitizedMsg = this.sanitizeFormula(e.message).replace(/"/g, '""');
      return `${e.rowNumber},"${sanitizedCol}","${sanitizedMsg}"`;
    });

    const csvContent = header + lines.join('\n');
    return {
      fileName: `import-errors-${jobId.slice(0, 8)}.csv`,
      csvContent,
    };
  }

  /**
   * List import jobs for college.
   */
  async listJobs(collegeId: string, query: ImportJobQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { collegeId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.importJob.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper to fetch default college ID for Super Admin operations.
   */
  async getDefaultCollegeId(): Promise<string> {
    const col = await this.prisma.college.findFirst();
    return col?.id || '00000000-0000-0000-0000-000000000001';
  }

  /**
   * Parse and validate questions spreadsheet (CSV/XLSX).
   */
  private async uploadAndParseQuestions(
    collegeId: string,
    userId: string,
    _file: { originalname: string; size: number; buffer: Buffer },
    rawRows: Record<string, unknown>[],
    fileHash: string,
  ) {
    const validationResults: {
      rowNumber: number;
      isValid: boolean;
      data?: unknown;
      errors: { column: string; message: string }[];
    }[] = [];

    const parsedValidData: {
      rowNumber: number;
      topicId: string;
      subtopicId?: string | null;
      type: QuestionType;
      difficulty: number;
      stem: string;
      explanation: string;
      numericAnswer?: number | null;
      numericTolerance?: number;
      expectedTimeSeconds: number;
      tags: string[];
      groupTitle?: string;
      scope: 'GLOBAL' | 'COLLEGE';
      options: { key: string; text: string; isCorrect: boolean }[];
    }[] = [];

    // Pre-fetch topics map
    const topics = await this.prisma.topic.findMany();
    const topicMap = new Map<string, string>();
    topics.forEach((t) => topicMap.set(t.slug.toLowerCase(), t.id));

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row) continue;
      const rowNum = i + 2;
      const errors: { column: string; message: string }[] = [];

      const topicSlug = String(row['topic_slug'] ?? '')
        .trim()
        .toLowerCase();
      const subtopicSlug = row['subtopic_slug']
        ? String(row['subtopic_slug']).trim().toLowerCase()
        : undefined;
      const stem = String(row['stem'] ?? '').trim();
      const typeStr = String(row['type'] ?? 'MCQ_SINGLE')
        .trim()
        .toUpperCase();
      const difficulty = parseInt(String(row['difficulty'] ?? '3'), 10);
      const explanation = String(row['explanation'] ?? '').trim();
      const correctAnswer = String(row['correct_answer'] ?? '').trim();
      const expectedTime = parseInt(String(row['expected_time_seconds'] ?? '60'), 10);
      const tagsStr = row['tags'] ? String(row['tags']).trim() : '';
      const tags = tagsStr
        ? tagsStr
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const groupTitle = row['group_title'] ? String(row['group_title']).trim() : undefined;
      const scopeStr = row['scope'] ? String(row['scope']).trim().toUpperCase() : 'COLLEGE';

      if (!topicSlug) {
        errors.push({ column: 'topic_slug', message: 'Topic slug is required' });
      } else if (!topicMap.has(topicSlug)) {
        errors.push({
          column: 'topic_slug',
          message: `Topic slug "${topicSlug}" does not exist in taxonomy`,
        });
      }

      if (!stem || stem.length < 5) {
        errors.push({ column: 'stem', message: 'Question stem must be at least 5 characters' });
      }
      if (!explanation || explanation.length < 5) {
        errors.push({
          column: 'explanation',
          message: 'Explanation must be at least 5 characters',
        });
      }
      if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
        errors.push({ column: 'difficulty', message: 'Difficulty must be between 1 and 5' });
      }
      if (!['MCQ_SINGLE', 'MCQ_MULTI', 'NUMERIC'].includes(typeStr)) {
        errors.push({
          column: 'type',
          message: 'Type must be MCQ_SINGLE, MCQ_MULTI, or NUMERIC',
        });
      }

      let parsedNumericAnswer: number | null = null;
      const options: { key: string; text: string; isCorrect: boolean }[] = [];

      if (typeStr === 'NUMERIC') {
        parsedNumericAnswer = parseFloat(correctAnswer);
        if (isNaN(parsedNumericAnswer)) {
          errors.push({
            column: 'correct_answer',
            message: 'Numeric question requires a valid numeric correct_answer',
          });
        }
      } else {
        const correctKeys = correctAnswer
          .toUpperCase()
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);

        if (correctKeys.length === 0) {
          errors.push({
            column: 'correct_answer',
            message: 'Correct answer option key is required (e.g. A, B, or A,C)',
          });
        } else if (typeStr === 'MCQ_SINGLE' && correctKeys.length > 1) {
          errors.push({
            column: 'correct_answer',
            message: 'MCQ_SINGLE accepts exactly one correct answer',
          });
        }

        const optKeys = ['a', 'b', 'c', 'd', 'e'];
        for (const k of optKeys) {
          const val = row[`option_${k}`];
          if (val !== null && val !== undefined && String(val).trim().length > 0) {
            const keyUpper = k.toUpperCase();
            options.push({
              key: keyUpper,
              text: String(val).trim(),
              isCorrect: correctKeys.includes(keyUpper),
            });
          }
        }

        if (options.length < 2) {
          errors.push({
            column: 'options',
            message: 'At least 2 options (option_a, option_b) are required',
          });
        }

        const correctCount = options.filter((o) => o.isCorrect).length;
        if (correctCount === 0) {
          errors.push({
            column: 'correct_answer',
            message: `Specified correct_answer "${correctAnswer}" does not match any provided options`,
          });
        }
      }

      if (errors.length > 0) {
        validationResults.push({ rowNumber: rowNum, isValid: false, errors });
      } else {
        const topicId = topicMap.get(topicSlug)!;
        const subtopicId =
          subtopicSlug && topicMap.has(subtopicSlug) ? topicMap.get(subtopicSlug) : null;
        const item = {
          rowNumber: rowNum,
          topicId,
          subtopicId,
          type: typeStr as QuestionType,
          difficulty,
          stem,
          explanation,
          numericAnswer: parsedNumericAnswer,
          numericTolerance: row['numeric_tolerance']
            ? parseFloat(String(row['numeric_tolerance']))
            : 0,
          expectedTimeSeconds: isNaN(expectedTime) ? 60 : expectedTime,
          tags,
          groupTitle,
          scope: scopeStr === 'GLOBAL' ? ('GLOBAL' as const) : ('COLLEGE' as const),
          options,
        };
        validationResults.push({ rowNumber: rowNum, isValid: true, data: item, errors: [] });
        parsedValidData.push(item);
      }
    }

    const validRowsCount = parsedValidData.length;
    const errorCount = validationResults.filter((r) => !r.isValid).length;

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.importJob.create({
        data: {
          collegeId,
          type: ImportJobType.QUESTIONS,
          status: errorCount === 0 ? ImportJobStatus.VALIDATED : ImportJobStatus.UPLOADED,
          fileHash,
          totalRows: rawRows.length,
          validRows: validRowsCount,
          errorCount,
          createdBy: userId,
          options: {
            parsedValidRows: parsedValidData,
          } as unknown as Prisma.InputJsonValue,
          summary: {
            total: rawRows.length,
            valid: validRowsCount,
            errors: errorCount,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      const dbErrors: {
        jobId: string;
        collegeId: string;
        rowNumber: number;
        column: string;
        message: string;
      }[] = [];

      for (const res of validationResults) {
        if (!res.isValid) {
          for (const err of res.errors) {
            dbErrors.push({
              jobId: job.id,
              collegeId,
              rowNumber: res.rowNumber,
              column: err.column,
              message: err.message,
            });
          }
        }
      }

      if (dbErrors.length > 0) {
        await tx.importRowError.createMany({ data: dbErrors });
      }

      return {
        jobId: job.id,
        status: job.status,
        totalRows: rawRows.length,
        validRows: validRowsCount,
        errorCount,
        preview: parsedValidData.slice(0, 10),
        sampleValidRows: parsedValidData.slice(0, 5),
      };
    });
  }

  /**
   * Commit questions import job atomically into database.
   */
  private async commitQuestions(
    job: { id: string; options: unknown; summary: unknown },
    collegeId: string,
    userId: string,
  ) {
    const options = (job.options as Record<string, unknown>) || {};
    const parsedRows = (options.parsedValidRows as ParsedQuestionRow[]) || [];

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid questions found to commit');
    }

    return this.prisma.$transaction(async (tx) => {
      let createdQuestionsCount = 0;
      let skippedDuplicatesCount = 0;

      const groupMap = new Map<string, string>();

      for (const row of parsedRows) {
        const textHash = crypto
          .createHash('sha256')
          .update(row.stem.trim().toLowerCase().replace(/\s+/g, ' '))
          .digest('hex');

        // Deduplication against existing questions
        const existing = await tx.question.findFirst({
          where: { textHash },
        });

        if (existing) {
          skippedDuplicatesCount++;
          continue;
        }

        let groupId: string | null = null;
        if (row.groupTitle) {
          if (groupMap.has(row.groupTitle)) {
            groupId = groupMap.get(row.groupTitle)!;
          } else {
            const grp = await tx.questionGroup.create({
              data: {
                title: row.groupTitle,
                body: `Passage group for ${row.groupTitle}`,
                scope: row.scope,
                collegeId: row.scope === 'GLOBAL' ? null : collegeId,
              },
            });
            groupId = grp.id;
            groupMap.set(row.groupTitle, grp.id);
          }
        }

        const question = await tx.question.create({
          data: {
            scope: row.scope,
            collegeId: row.scope === 'GLOBAL' ? null : collegeId,
            topicId: row.topicId,
            subtopicId: row.subtopicId,
            type: row.type,
            difficulty: row.difficulty,
            groupId,
            status: QuestionStatus.APPROVED,
            source: 'IMPORTED',
            textHash,
            needsHumanReview: false,
            reviewedBy: userId,
            reviewedAt: new Date(),
            expectedTimeSeconds: row.expectedTimeSeconds,
            tags: row.tags,
          },
        });

        const version = await tx.questionVersion.create({
          data: {
            questionId: question.id,
            version: 1,
            stem: row.stem,
            explanation: row.explanation,
            numericAnswer: row.numericAnswer,
            numericTolerance: row.numericTolerance,
            createdBy: userId,
          },
        });

        if (row.options && row.options.length > 0) {
          await tx.questionOption.createMany({
            data: row.options.map((opt, idx: number) => ({
              versionId: version.id,
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
              sort: idx,
            })),
          });
        }

        await tx.question.update({
          where: { id: question.id },
          data: { currentVersionId: version.id },
        });

        await tx.questionStat.create({
          data: { questionId: question.id },
        });

        createdQuestionsCount++;
      }

      await tx.importJob.update({
        where: { id_collegeId: { id: job.id, collegeId } },
        data: {
          status: ImportJobStatus.COMPLETED,
          committedAt: new Date(),
          summary: {
            ...((job.summary as Record<string, unknown>) || {}),
            createdQuestionsCount,
            skippedDuplicatesCount,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        jobId: job.id,
        createdQuestionsCount,
        skippedDuplicatesCount,
      };
    });
  }
}
