#!/usr/bin/env tsx
/**
 * Script CLI para agregar productos automáticamente
 * Uso: npm run add-product "Pokemon megaevoluciones ETB" 1200 3
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface CardSearchResult {
  name: string;
  images: {
    large: string;
    small: string;
  };
  set: {
    name: string;
    series: string;
  };
  rarity?: string;
  artist?: string;
}

// APIs de búsqueda de cartas
const POKEMON_API = 'https://api.pokemontcg.io/v2/cards';
const YUGIOH_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

async function searchPokemonProduct(query: string): Promise<any> {
  try {
    const response = await axios.get(POKEMON_API, {
      params: {
        q: `name:"${query}"`,
        pageSize: 1
      }
    });

    if (response.data.data.length === 0) {
      // Si no encuentra carta específica, buscar por set
      const setResponse = await axios.get('https://api.pokemontcg.io/v2/sets', {
        params: {
          q: `name:"${query}"`,
          pageSize: 1
        }
      });

      if (setResponse.data.data.length > 0) {
        const set = setResponse.data.data[0];
        return {
          name: set.name,
          description: `${set.series} - ${set.name}. Contiene ${set.total} cartas. Fecha de lanzamiento: ${set.releaseDate}`,
          images: [set.images.logo, set.images.symbol].filter(Boolean),
          metadata: {
            setId: set.id,
            series: set.series,
            total: set.total.toString(),
            releaseDate: set.releaseDate
          },
          type: 'sealed' as const,
          category: query.toLowerCase().includes('etb') ? 'Elite Trainer Box' :
                    query.toLowerCase().includes('booster') ? 'Booster Box' : 'Sealed Product'
        };
      }

      throw new Error('No se encontró el producto en la API de Pokémon');
    }

    const card: CardSearchResult = response.data.data[0];
    return {
      name: card.name,
      description: `${card.set.series} - ${card.set.name}. ${card.rarity ? `Rareza: ${card.rarity}.` : ''} ${card.artist ? `Arte por ${card.artist}.` : ''}`,
      images: [card.images.large, card.images.small],
      metadata: {
        setName: card.set.name,
        series: card.set.series,
        rarity: card.rarity || '',
        artist: card.artist || ''
      },
      type: 'singles' as const,
      category: 'Single Card'
    };
  } catch (error) {
    throw new Error(`Error buscando en Pokémon API: ${error.message}`);
  }
}

async function searchYugiohProduct(query: string): Promise<any> {
  try {
    const response = await axios.get(YUGIOH_API, {
      params: {
        fname: query,
        num: 1,
        offset: 0
      }
    });

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error('No se encontró el producto en la API de Yu-Gi-Oh!');
    }

    const card = response.data.data[0];
    return {
      name: card.name,
      description: card.desc,
      images: [card.card_images[0].image_url, card.card_images[0].image_url_small],
      metadata: {
        type: card.type,
        race: card.race,
        archetype: card.archetype || '',
        atk: card.atk?.toString() || '',
        def: card.def?.toString() || ''
      },
      type: 'singles' as const,
      category: 'Single Card'
    };
  } catch (error) {
    throw new Error(`Error buscando en Yu-Gi-Oh! API: ${error.message}`);
  }
}

async function addProduct(
  productName: string,
  price: number,
  stock: number,
  franchise: 'pokemon' | 'yugioh' | 'onepiece' = 'pokemon',
  language: 'español' | 'inglés' | 'japonés' | 'portugués' = 'español'
) {
  console.log(`🔍 Buscando información para: "${productName}"`);
  console.log(`💰 Precio: $${price} MXN`);
  console.log(`📦 Stock: ${stock}`);
  console.log(`🎴 Franquicia: ${franchise}`);

  try {
    // Buscar información del producto
    let productData;
    if (franchise === 'pokemon') {
      productData = await searchPokemonProduct(productName);
    } else if (franchise === 'yugioh') {
      productData = await searchYugiohProduct(productName);
    } else {
      // One Piece: crear producto manual por ahora
      productData = {
        name: productName,
        description: `Producto de One Piece TCG`,
        images: [],
        metadata: {},
        type: 'singles' as const,
        category: 'Single Card'
      };
    }

    console.log(`\n✅ Información encontrada:`);
    console.log(`   Nombre: ${productData.name}`);
    console.log(`   Tipo: ${productData.type}`);
    console.log(`   Categoría: ${productData.category}`);
    console.log(`   Descripción: ${productData.description.substring(0, 100)}...`);

    // Crear producto en la DB
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        franchise: franchise,
        type: productData.type,
        category: productData.category,
        description: productData.description,
        currency: 'MXN',
        images: JSON.stringify(productData.images),
        metadata: JSON.stringify(productData.metadata),
        featured: false,
        isNew: true,
        variants: {
          create: [
            {
              language: language,
              price: price,
              stock: stock
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
    console.log(`\n📝 Resumen final:`);
    console.log(JSON.stringify(product, null, 2));

    return product;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parsear argumentos de línea de comando
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
📖 Uso: npm run add-product <nombre> <precio> <stock> [franquicia] [idioma]

Ejemplos:
  npm run add-product "Charizard VMAX" 1200 3
  npm run add-product "Megaevoluciones ETB" 1200 5 pokemon español
  npm run add-product "Dark Magician" 800 10 yugioh inglés

Franquicias: pokemon (default), yugioh, onepiece
Idiomas: español (default), inglés, japonés, portugués
    `);
    process.exit(1);
  }

  const [productName, priceStr, stockStr, franchise = 'pokemon', language = 'español'] = args;

  await addProduct(
    productName,
    parseInt(priceStr),
    parseInt(stockStr),
    franchise as any,
    language as any
  );
}

main().catch(console.error);
