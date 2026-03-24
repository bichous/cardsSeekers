# 🤖 Flujo del Agente para Agregar Productos

## 📋 Resumen

El agente usa un proceso de **2 pasos** para agregar productos:

1. **Buscar info en web** → El agente usa WebSearch para obtener TODA la información
2. **Procesar/Traducir/Guardar** → El agente traduce al español, enriquece y guarda → `npm run save-product '{...json...}'`

---

## 🔄 Flujo Completo

### Ejemplo: Usuario agrega "ETB Phantasmal Flames"

```
👤 Usuario (Telegram):
"Agrega 5 ETB Phantasmal Flames a 1200 pesos"

🤖 Agente analiza:
✅ Nombre: "ETB Phantasmal Flames"
✅ Stock: 5
✅ Precio: 1200
✅ Franquicia: pokemon (detectado)
❓ Idioma: inglés (default)

🤖 Agente confirma:
"✅ Voy a agregar:
 📦 ETB Phantasmal Flames
 💰 $1,200 MXN
 📊 5 unidades
 🎴 Pokémon
 ¿Proceder? (Sí/No)"

👤 Usuario: "Sí"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 PASO 1: Buscar Información en Internet (Agente IA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El agente (Claude) usa WebSearch:

Búsqueda: "Phantasmal Flames pokemon tcg elite trainer box"

Información encontrada en internet:
- Nombre oficial: Elite Trainer Box - Mega Evolution: Phantasmal Flames
- Tipo: Producto sellado (ETB)
- Serie: Mega Evolution
- Set ID: me2pt5
- Total de cartas: 165
- Fecha de lanzamiento: 21 de marzo de 2025
- Contenido: 8 sobres, dados, marcadores, caja
- Imágenes encontradas:
  * https://images.pokemontcg.io/me2pt5/logo.png
  * https://images.pokemontcg.io/me2pt5/symbol.png

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 PASO 2: Procesar, Traducir y Guardar (Agente IA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El agente (Claude) procesa la información:

1. Traducir descripción al español:
   "Contains 8 booster packs" →
   "Elite Trainer Box de la expansión Mega Evolution: Phantasmal Flames.
    Incluye 8 sobres booster, dados, marcadores de daño y una caja para
    guardar cartas. Set de 165 cartas lanzado el 21 de marzo de 2025."

2. Traducir metadata al español:
   {
     "setId": "me2pt5" → mantener igual (es un ID)
     "series": "Mega Evolution" → "serie": "Mega Evolution"
     "total": "165" → "totalCartas": "165"
     "releaseDate": "2025/03/21" → "fechaLanzamiento": "21/03/2025"
   }

3. Enriquecer metadata:
   Agregar:
   - "expansion": "Mega Evolution: Phantasmal Flames"
   - "contenido": "8 sobres, dados, marcadores, caja"

JSON procesado:
{
  "name": "Elite Trainer Box - Mega Evolution: Phantasmal Flames",
  "description": "Elite Trainer Box de la expansión Mega Evolution: Phantasmal Flames. Incluye 8 sobres booster, dados, marcadores de daño y una caja para guardar cartas. Set de 165 cartas lanzado el 21 de marzo de 2025.",
  "price": 1200,
  "stock": 5,
  "franchise": "pokemon",
  "type": "sealed",
  "category": "Elite Trainer Box",
  "language": "inglés",
  "images": [
    "https://images.pokemontcg.io/me2pt5/logo.png",
    "https://images.pokemontcg.io/me2pt5/symbol.png"
  ],
  "metadata": {
    "expansion": "Mega Evolution: Phantasmal Flames",
    "serie": "Mega Evolution",
    "totalCartas": "165",
    "fechaLanzamiento": "21/03/2025",
    "contenido": "8 sobres, dados, marcadores, caja"
  }
}

Luego ejecuta el comando para guardar:

Comando:
cd /ruta/a/cardsSeekers/server && npm run save-product '{
  "name": "Elite Trainer Box - Mega Evolution: Phantasmal Flames",
  "description": "Elite Trainer Box de la expansión Mega Evolution: Phantasmal Flames. Incluye 8 sobres booster, dados, marcadores de daño y una caja para guardar cartas. Set de 165 cartas lanzado el 21 de marzo de 2025.",
  "price": 1200,
  "stock": 5,
  "franchise": "pokemon",
  "type": "sealed",
  "category": "Elite Trainer Box",
  "language": "inglés",
  "images": ["https://images.pokemontcg.io/me2pt5/logo.png", "https://images.pokemontcg.io/me2pt5/symbol.png"],
  "metadata": {
    "expansion": "Mega Evolution: Phantasmal Flames",
    "serie": "Mega Evolution",
    "totalCartas": "165",
    "fechaLanzamiento": "21/03/2025",
    "contenido": "8 sobres, dados, marcadores, caja"
  }
}'

Respuesta:
{
  "success": true,
  "product": {
    "id": "cm5n8o7p0001...",
    "name": "Elite Trainer Box - Mega Evolution: Phantasmal Flames",
    "franchise": "pokemon",
    "type": "sealed",
    ...
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Respuesta al usuario:
"🎉 ¡Producto agregado exitosamente!

📋 Detalles:
   ID: cm5n8o7p0001...
   Nombre: Elite Trainer Box - Mega Evolution: Phantasmal Flames
   Descripción: Elite Trainer Box de la expansión Mega Evolution...
   Precio: $1,200 MXN
   Stock: 5 unidades
   Imágenes: 2 agregadas

✅ El producto ya está disponible en el catálogo."
```

---

## 🎯 Reglas Importantes para el Agente

### 1. Descripción

- ✅ **SIEMPRE en español**
- ✅ Enriquecer con información útil
- ✅ Incluir contenido específico (para sealed)
- ✅ Mencionar rareza, HP, ataques (para singles)
- ❌ NO copiar literalmente de la API si está en inglés

### 2. Metadata

- ✅ **SIEMPRE traducir claves al español**
- ✅ Agregar información útil adicional
- ✅ Formatear fechas a DD/MM/YYYY
- ❌ NO dejar claves en inglés (excepto IDs técnicos)

### 3. Nombre del Producto

- ✅ Mantener en **inglés** (nombre original)
- ✅ Puede incluir traducción como parte de la metadata si es útil

### 4. Idioma (language field)

- ✅ Por defecto: `"inglés"` para TODO
- ✅ Cambiar solo si el usuario especifica otro idioma

---

## 📝 Plantillas de Descripción

### Elite Trainer Box (ETB)

```
Elite Trainer Box de la expansión [Nombre Expansión]. Incluye 8 sobres booster, dados, marcadores de daño y una caja para guardar cartas. Set de [X] cartas lanzado el [fecha].
```

### Booster Box

```
Caja de sobres de la expansión [Nombre]. Contiene 36 sobres sellados de fábrica. Set de [X] cartas lanzado el [fecha].
```

### Single Card (Pokémon)

```
Carta Pokémon de tipo [Tipo] de la expansión [Set]. [Nombre] es un [tipo de carta] con [HP] HP y el ataque [ataque] que hace [daño] de daño. Rareza: [rareza]. Ilustrada por [artista].
```

### Single Card (Yu-Gi-Oh)

```
Carta [tipo] de Yu-Gi-Oh! [Nombre] es un monstruo [raza] de nivel [nivel] con [ATK] de ATK y [DEF] de DEF. Arquetipo: [arquetipo]. Rareza: [rareza].
```

---

## 🔍 Traducción de Términos Comunes

| Inglés | Español |
|--------|---------|
| Elite Trainer Box | Elite Trainer Box (mantener) |
| Booster Box | Caja de Sobres |
| Booster Pack | Sobre Booster |
| Single Card | Carta Individual |
| Release Date | Fecha de Lanzamiento |
| Set | Expansión/Set |
| Series | Serie |
| Rarity | Rareza |
| Ultra Rare | Ultra Rara |
| Secret Rare | Secreta Rara |
| Common | Común |
| Uncommon | Poco Común |
| Rare | Rara |
| Holo | Holográfica |
| Attack | Ataque |
| Defense | Defensa |
| HP | HP o Puntos de Salud |
| Type | Tipo |
| Artist | Artista |

---

## 🚨 Manejo de Errores

### Si la búsqueda web no encuentra información:

```
❌ No encontré información del producto.

🔍 Intentando búsqueda inteligente... (hasta 5 intentos con diferentes estrategias)
```

Sigue el proceso de búsqueda inteligente del archivo AGENTE_INTELIGENTE_PROMPT.md

### Si `save-product` falla:

```
❌ Error al guardar en la base de datos:
[mensaje de error]

¿Quieres que lo intente de nuevo?
```

---

## ✅ Checklist para el Agente

Antes de ejecutar `save-product`:

- [ ] Información del producto buscada en internet (WebSearch)
- [ ] Nombre oficial obtenido (en inglés)
- [ ] Descripción traducida al español
- [ ] Descripción enriquecida con información útil
- [ ] Metadata con claves en español
- [ ] Fechas en formato DD/MM/YYYY
- [ ] Precio y stock incluidos (del usuario)
- [ ] Franchise correcta (pokemon/yugioh/onepiece)
- [ ] Type correcto (singles/sealed)
- [ ] Language correcta (inglés por default)
- [ ] Images array incluido (URLs encontradas en web)
- [ ] JSON bien formado y escapado

---

¡Listo! El agente está configurado para agregar productos con información completa en español. 🎉
