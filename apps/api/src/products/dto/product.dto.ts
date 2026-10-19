import { IsString, IsNumber, IsOptional, IsUrl, Min } from 'class-validator';

export class ProductDto {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  stock: number;
}
