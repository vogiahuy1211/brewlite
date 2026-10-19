import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProducts = [
  {
    id: 'uuid-1',
    name: 'Cà phê sữa',
    price: 35000,
    image_url: 'https://example.com/cafe-sua.jpg',
    stock: 10,
    version: 0,
  },
  {
    id: 'uuid-2',
    name: 'Americano',
    price: 40000,
    image_url: null,
    stock: 5,
    version: 0,
  },
];

const mockPrismaService = {
  products: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('should return all products as ProductDto array', async () => {
      mockPrismaService.products.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        name: 'Cà phê sữa',
        price: 35000,
        imageUrl: 'https://example.com/cafe-sua.jpg',
        stock: 10,
      });
      expect(mockPrismaService.products.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      mockPrismaService.products.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should map price from Decimal to number', async () => {
      const productWithDecimal = [{ ...mockProducts[0], price: { toNumber: () => 35000 } }];
      mockPrismaService.products.findMany.mockResolvedValue(productWithDecimal);

      const result = await service.findAll();
      expect(typeof result[0].price).toBe('number');
    });
  });

  describe('findOne()', () => {
    it('should return a product when found', async () => {
      mockPrismaService.products.findUnique.mockResolvedValue(mockProducts[0]);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual({
        id: 'uuid-1',
        name: 'Cà phê sữa',
        price: 35000,
        imageUrl: 'https://example.com/cafe-sua.jpg',
        stock: 10,
      });
      expect(mockPrismaService.products.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.products.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null imageUrl', async () => {
      mockPrismaService.products.findUnique.mockResolvedValue(mockProducts[1]);

      const result = await service.findOne('uuid-2');
      expect(result.imageUrl).toBeNull();
    });
  });
});
