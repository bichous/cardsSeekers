# 🔒 Configuración de Seguridad para el Agente

## ✅ Acceso Mínimo Necesario

Tu agente en la VPS **NO necesita acceso directo al archivo `.env`**.

### Lo que SÍ necesita:

1. ✅ **Ejecutar comandos Bash** en el directorio del proyecto
2. ✅ **Leer código** (scripts, archivos .ts/.js)
3. ✅ **Acceso al directorio** `/ruta/a/cardsSeekers/server/`

### Lo que NO necesita:

1. ❌ Leer archivos `.env`
2. ❌ Modificar configuración del servidor
3. ❌ Acceso a secretos (JWT_SECRET, GOOGLE_CLIENT_ID)
4. ❌ Acceso a otros proyectos en la VPS

---

## 🔐 Cómo Funciona Sin .env

El script `addProduct.ts` usa **Prisma Client**, que obtiene las variables de entorno del **proceso del sistema**, no del archivo:

```bash
# Cuando ejecutas:
npm run add-product "Charizard" 1200 5

# Internamente:
# 1. npm ejecuta el script
# 2. Prisma busca DATABASE_URL en process.env
# 3. El sistema ya tiene las variables cargadas (de cuando iniciaste el servidor)
# 4. ✅ Funciona sin leer .env
```

---

## 🚀 Setup Seguro en VPS

### 1. Variables de Entorno en el Sistema

En tu VPS, asegúrate de que las variables estén en el ambiente:

```bash
# Opción A: Agregar a ~/.bashrc o ~/.zshrc
export DATABASE_URL="file:./prisma/dev.db"

# Opción B: Usar un archivo .env solo para el proyecto (no lo leas desde el agente)
# El servidor lo carga, el agente solo ejecuta comandos
```

### 2. Permisos del Agente

El agente solo necesita:

```bash
# Permisos de EJECUCIÓN en:
/ruta/a/cardsSeekers/server/scripts/addProduct.ts

# Permisos de LECTURA/ESCRITURA en:
/ruta/a/cardsSeekers/server/prisma/dev.db

# NO necesita:
/ruta/a/cardsSeekers/server/.env  ← BLOQUEADO
/ruta/a/cardsSeekers/.env          ← BLOQUEADO
```

### 3. Configurar Permisos en Linux (Opcional)

Si quieres ser MUY estricto:

```bash
# Hacer .env solo legible por tu usuario
chmod 600 /ruta/a/cardsSeekers/server/.env
chmod 600 /ruta/a/cardsSeekers/.env

# El agente corre como tu usuario pero no podrá leer .env
# (Claude Code respeta las restricciones de archivos)
```

---

## 🧪 Probar que Funciona Sin .env

### Test 1: Renombrar .env temporalmente

```bash
cd /ruta/a/cardsSeekers/server
mv .env .env.backup

# Intentar ejecutar el script
npm run add-product "Test Product" 100 1

# Debería funcionar si DATABASE_URL está en el ambiente
# Si falla, significa que necesitas cargar las variables en el sistema
```

### Test 2: Verificar variables de entorno

```bash
echo $DATABASE_URL
# Debería mostrar: file:./prisma/dev.db

# Si no muestra nada, agrégala:
export DATABASE_URL="file:./prisma/dev.db"
```

---

## 📋 Checklist de Seguridad

Antes de dar acceso al agente:

- [ ] ✅ Variables de entorno cargadas en el sistema
- [ ] ✅ Script funciona sin leer .env directamente
- [ ] ✅ Permisos de .env restringidos (chmod 600)
- [ ] ✅ Agente solo tiene acceso al directorio del proyecto
- [ ] ❌ Agente NO tiene acceso a archivos .env
- [ ] ❌ Agente NO puede modificar configuración del servidor

---

## 🎯 Comando que el Agente Ejecutará

```bash
cd /ruta/a/cardsSeekers/server && npm run add-product "<nombre>" <precio> <stock> <franquicia> <idioma>
```

**Esto es TODO lo que necesita.** No accede a ningún archivo sensible.

---

## 🔍 Archivos Sensibles a Proteger

| Archivo | Contiene | Acción |
|---------|----------|--------|
| `server/.env` | JWT_SECRET, GOOGLE_CLIENT_ID | ❌ BLOQUEAR acceso |
| `.env` | VITE_GOOGLE_CLIENT_ID, VITE_API_URL | ❌ BLOQUEAR acceso |
| `server/prisma/dev.db` | Base de datos | ✅ PERMITIR read/write |
| `server/scripts/*.ts` | Scripts de comandos | ✅ PERMITIR lectura |

---

## ⚠️ Qué Hacer Si el Agente Pide Acceso a .env

Si Claude te pregunta:

> "Necesito leer el archivo .env para..."

**Responde:**

```
No necesitas leer .env. Las variables de entorno ya están
en el sistema. Solo ejecuta:

npm run add-product "producto" precio stock
```

---

## 🎉 Beneficios de Este Enfoque

1. ✅ **Más seguro** - Secretos no expuestos al agente
2. ✅ **Más simple** - No necesita configuración extra
3. ✅ **Más rápido** - Ejecución directa sin lectura de archivos
4. ✅ **Mejor práctica** - Separación de concerns
5. ✅ **Escalable** - Fácil migrar a API endpoints después

---

¡Listo! Tu agente puede agregar productos sin acceso a información sensible. 🔒
