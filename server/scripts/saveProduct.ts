#!/usr/bin/env tsx
/**
 * Script para guardar productos con información pre-procesada
 * Usado por el agente después de traducir/enriquecer la data
 *
 * Uso:
 *   npm run save-product '<json-data>'
 *
 * JSON Format:
 * {
 *   "name": "Charizard VMAX",
 *   "description": "Descripción en español...",
 *   "price": 1200,
 *   "stock": 3,
 *   "franchise": "pokemon",
 *   "type": "singles",
 *   "category": "Single Card",
 *   "language": "inglés",
 *   "images": ["url1", "url2"],
 *   "metadata": {
 *     "expansion": "Darkness Ablaze",
 *     "tipo": "Fuego",
 *     "hp": "330"
 *   }
 * }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SaveProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  franchise: 'pokemon' | 'yugioh' | 'onepiece';
  type: 'singles' | 'sealed';
  category: string;
  language: 'español' | 'inglés' | 'japonés' | 'portugués';
  images: string[];
  metadata: Record<string, string>;
}

async function saveProduct(input: SaveProductInput) {
  console.log(`💾 Guardando producto: "${input.name}"`);
  console.log(`📝 Descripción: ${input.description.substring(0, 80)}...`);
  console.log(`💰 Precio: $${input.price} MXN`);
  console.log(`📦 Stock: ${input.stock}`);

  try {
    // Verificar si el producto ya existe
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: input.name,
        franchise: input.franchise,
        type: input.type
      },
      include: {
        variants: true
      }
    });

    let product;

    if (existingProduct) {
      console.log(`\n⚠️  Producto existente encontrado (ID: ${existingProduct.id})`);

      // Verificar si existe una variante con el mismo idioma
      const existingVariant = existingProduct.variants.find(
        v => v.language === input.language
      );

      if (existingVariant) {
        // Sumar al stock existente
        console.log(`   📦 Variante existente encontrada, sumando stock...`);
        const updatedVariant = await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            stock: existingVariant.stock + input.stock,
            price: input.price // actualizar precio
          }
        });

        // Actualizar también la descripción y metadata del producto si cambió
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            description: input.description,
            metadata: JSON.stringify(input.metadata),
            images: JSON.stringify(input.images)
          }
        });

        product = await prisma.product.findUnique({
          where: { id: existingProduct.id },
          include: { variants: true }
        });

        console.log(`\n✅ Stock actualizado!`);
        console.log(`   Stock anterior: ${existingVariant.stock}`);
        console.log(`   Stock agregado: ${input.stock}`);
        console.log(`   Stock nuevo: ${updatedVariant.stock}`);
      } else {
        // Crear nueva variante
        console.log(`   ➕ Creando nueva variante (${input.language})...`);
        await prisma.productVariant.create({
          data: {
            productId: existingProduct.id,
            language: input.language,
            price: input.price,
            stock: input.stock
          }
        });

        product = await prisma.product.findUnique({
          where: { id: existingProduct.id },
          include: { variants: true }
        });

        console.log(`\n✅ Nueva variante creada!`);
      }
    } else {
      // Crear producto nuevo
      console.log(`\n➕ Creando producto nuevo...`);
      product = await prisma.product.create({
        data: {
          name: input.name,
          franchise: input.franchise,
          type: input.type,
          category: input.category,
          description: input.description,
          currency: 'MXN',
          images: JSON.stringify(input.images),
          metadata: JSON.stringify(input.metadata),
          featured: false,
          isNew: true,
          variants: {
            create: [
              {
                language: input.language,
                price: input.price,
                stock: input.stock
              }
            ]
          }
        },
        include: {
          variants: true
        }
      });

      console.log(`\n🎉 ¡Producto creado exitosamente!`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Variante ID: ${product.variants[0].id}`);
    }

    console.log(`\n📝 Resumen final:`);
    console.log(JSON.stringify(product, null, 2));

    return { success: true, product };
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📖 Uso: npm run save-product '<json-data>'

Ejemplo:
  npm run save-product '{
    "name": "Charizard VMAX",
    "description": "Carta Pokémon de tipo Fuego de la expansión Darkness Ablaze...",
    "price": 1200,
    "stock": 3,
    "franchise": "pokemon",
    "type": "singles",
    "category": "Single Card",
    "language": "inglés",
    "images": ["https://...", "https://..."],
    "metadata": {
      "expansion": "Darkness Ablaze",
      "tipo": "Fuego",
      "hp": "330"
    }
  }'

Este script es usado por el agente después de procesar/traducir la información.
    `);
    process.exit(1);
  }

  try {
    const input: SaveProductInput = JSON.parse(args[0]);
    const result = await saveProduct(input);

    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error parseando JSON:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
