import { Test, TestingModule } from '@nestjs/testing';
import { NoticesService } from './notices.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { NoticeStatus } from '@campusedge/shared';

interface MockPrisma {
  notice: {
    create: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  noticeAttachment: {
    create: jest.Mock;
  };
}

describe('NoticesService', () => {
  let service: NoticesService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = {
      notice: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      noticeAttachment: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticesService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<NoticesService>(NoticesService);
  });

  it('rejects file upload when magic bytes do not match mime type', async () => {
    prisma.notice.findFirst.mockResolvedValue({ id: 'n1', collegeId: 'c1' });

    // Declared PDF but given text/executable bytes
    const invalidPdfBuffer = Buffer.from('NOT_A_REAL_PDF_HEADER');

    await expect(
      service.uploadAttachment('n1', 'c1', {
        originalname: 'report.pdf',
        mimetype: 'application/pdf',
        size: invalidPdfBuffer.length,
        buffer: invalidPdfBuffer,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts valid PDF magic bytes (%PDF)', async () => {
    prisma.notice.findFirst.mockResolvedValue({ id: 'n1', collegeId: 'c1' });
    prisma.noticeAttachment.create.mockResolvedValue({
      id: 'att-1',
      fileName: 'doc.pdf',
    });

    // %PDF header: 0x25, 0x50, 0x44, 0x46
    const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

    const result = await service.uploadAttachment('n1', 'c1', {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: validPdfBuffer.length,
      buffer: validPdfBuffer,
    });

    expect(result.id).toBe('att-1');
    expect(prisma.noticeAttachment.create).toHaveBeenCalled();
  });

  it('publishes a notice and updates rowVersion', async () => {
    prisma.notice.findFirst.mockResolvedValue({ id: 'n1', collegeId: 'c1' });
    prisma.notice.update.mockResolvedValue({
      id: 'n1',
      status: NoticeStatus.PUBLISHED,
      rowVersion: 2,
    });

    const result = await service.publish('n1', 'c1');
    expect(result.status).toBe(NoticeStatus.PUBLISHED);
    expect(prisma.notice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: NoticeStatus.PUBLISHED }),
      }),
    );
  });
});
