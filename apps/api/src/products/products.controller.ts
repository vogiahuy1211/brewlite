import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/products
   * Lấy danh sách toàn bộ sản phẩm trong menu
   */
  @Get()
  findAll(): Promise<ProductDto[]> {
    return this.productsService.findAll();
  }

  /**
   * GET /api/products/:id
   * Lấy chi tiết một sản phẩm theo UUID
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDto> {
    return this.productsService.findOne(id);
  }
}
