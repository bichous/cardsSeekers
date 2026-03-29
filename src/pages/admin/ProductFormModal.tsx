import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  Switch,
  HStack,
  VStack,
  Text,
  IconButton,
  Box,
  Divider,
  Image,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiTrash2, FiX, FiUpload, FiLink } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import type { AdminProduct } from './ProductsPage'
import { SinglesMetadataForm, type SinglesMeta } from './SinglesMetadataForm'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function ImageSection({
  form,
  set,
  removeImage,
  token,
}: {
  form: typeof EMPTY_FORM
  set: (field: keyof typeof EMPTY_FORM, value: string | boolean) => void
  removeImage: (i: number) => void
  token: string | null
}) {
  const [uploadMode, setUploadMode] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const currentUrls = form.images.split('\n').filter(Boolean)

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of arr) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (!res.ok) throw new Error()
        const { url } = await res.json()
        newUrls.push(url)
      } catch {
        toast({ title: `Error subiendo ${file.name}`, status: 'error', duration: 2500 })
      }
    }
    if (newUrls.length) {
      const merged = [...currentUrls, ...newUrls].join('\n')
      set('images', merged)
    }
    setUploading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  return (
    <FormControl gridColumn="1 / -1" mt={4}>
      {/* Header con toggle */}
      <HStack justify="space-between" mb={2}>
        <FormLabel fontSize="12px" color="gray.500" mb={0}>Imágenes</FormLabel>
        <HStack spacing={2}>
          <Box
            as="button"
            type="button"
            display="flex"
            alignItems="center"
            gap="6px"
            px={3}
            h="28px"
            borderRadius="full"
            fontSize="11px"
            fontWeight={600}
            border="1px solid"
            transition="all 0.15s"
            bg={!uploadMode ? 'brand.400' : 'transparent'}
            borderColor={!uploadMode ? 'brand.400' : '#2a2a2a'}
            color={!uploadMode ? '#0d0d0d' : 'gray.500'}
            onClick={() => setUploadMode(false)}
          >
            <FiLink size={11} /> URL
          </Box>
          <Box
            as="button"
            type="button"
            display="flex"
            alignItems="center"
            gap="6px"
            px={3}
            h="28px"
            borderRadius="full"
            fontSize="11px"
            fontWeight={600}
            border="1px solid"
            transition="all 0.15s"
            bg={uploadMode ? 'brand.400' : 'transparent'}
            borderColor={uploadMode ? 'brand.400' : '#2a2a2a'}
            color={uploadMode ? '#0d0d0d' : 'gray.500'}
            onClick={() => setUploadMode(true)}
          >
            <FiUpload size={11} /> Subir archivo
          </Box>
        </HStack>
      </HStack>

      {/* Modo URL */}
      {!uploadMode && (
        <Textarea
          bg="#0d0d0d" borderColor="#2a2a2a" color="white" rows={2}
          fontFamily="mono" fontSize="12px" value={form.images}
          placeholder="https://ejemplo.com/imagen.jpg (una por línea)"
          onChange={(e) => set('images', e.target.value)}
        />
      )}

      {/* Modo Upload */}
      {uploadMode && (
        <Box
          border="2px dashed"
          borderColor={dragging ? 'brand.400' : '#2a2a2a'}
          borderRadius="xl"
          bg={dragging ? 'rgba(255,208,0,0.04)' : '#0d0d0d'}
          transition="all 0.15s"
          p={6}
          textAlign="center"
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          {uploading ? (
            <VStack spacing={2}>
              <Spinner size="sm" color="brand.400" />
              <Text fontSize="12px" color="gray.500">Subiendo...</Text>
            </VStack>
          ) : (
            <VStack spacing={2}>
              <FiUpload size={20} color="#444" />
              <Text fontSize="12px" color="gray.500">
                Arrastra imágenes aquí
              </Text>
              <Button
                size="xs"
                variant="outline_brand"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar archivos
              </Button>
            </VStack>
          )}
        </Box>
      )}

      {/* Previews (ambos modos) */}
      {currentUrls.length > 0 && (
        <HStack mt={3} spacing={2} flexWrap="wrap">
          {currentUrls.map((url, i) => (
            <Box key={i} position="relative">
              <Image
                src={url}
                alt={`preview ${i + 1}`}
                h="80px"
                w="auto"
                maxW="70px"
                objectFit="cover"
                borderRadius="md"
                border="1px solid #2a2a2a"
                fallback={
                  <Box h="80px" w="56px" bg="#1a1a1a" borderRadius="md"
                    border="1px solid #2a2a2a" display="flex" alignItems="center" justifyContent="center">
                    <Text fontSize="9px" color="gray.700">err</Text>
                  </Box>
                }
              />
              <IconButton
                aria-label="Quitar imagen"
                icon={<FiX size={10} />}
                size="xs"
                position="absolute"
                top="2px"
                right="2px"
                minW="18px"
                h="18px"
                bg="blackAlpha.800"
                color="white"
                _hover={{ bg: 'red.600' }}
                onClick={() => removeImage(i)}
              />
            </Box>
          ))}
        </HStack>
      )}
    </FormControl>
  )
}

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'Damaged']

interface VariantForm {
  id?: string
  language: string
  condition: string
  rarity: string
  price: string
  originalPrice: string
  stock: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  product: AdminProduct | null
  onSaved: () => void
}

const EMPTY_FORM = {
  name: '',
  franchise: 'pokemon',
  type: 'sealed',
  category: '',
  description: '',
  images: '',
  featured: false,
  isNew: false,
}

const EMPTY_VARIANT: VariantForm = {
  language: 'español',
  condition: 'NM',
  rarity: '',
  price: '',
  originalPrice: '',
  stock: '0',
}

const LANGUAGES = ['español', 'inglés', 'japonés', 'portugués']

export function ProductFormModal({ isOpen, onClose, product, onSaved }: Props) {
  const { token } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [variants, setVariants] = useState<VariantForm[]>([{ ...EMPTY_VARIANT }])
  const [meta, setMeta] = useState<SinglesMeta>({})
  const [saving, setSaving] = useState(false)
  const [availableRarities, setAvailableRarities] = useState<string[]>([])
  const [availableFinishes, setAvailableFinishes] = useState<string[]>([])

  useEffect(() => {
    if (product) {
      let imagesStr = ''
      try {
        const parsed = JSON.parse(product.images)
        imagesStr = Array.isArray(parsed) ? parsed.join('\n') : product.images
      } catch {
        imagesStr = product.images
      }
      setForm({
        name: product.name,
        franchise: product.franchise,
        type: product.type,
        category: product.category,
        description: product.description,
        images: imagesStr,
        featured: product.featured,
        isNew: product.isNew,
      })
      try {
        setMeta(product.metadata ? JSON.parse(product.metadata as unknown as string) : {})
      } catch { setMeta({}) }
      setVariants(
        (product.variants ?? []).map((v) => ({
          id: v.id,
          language: v.language,
          condition: v.condition ?? 'NM',
          rarity: v.rarity ?? '',
          price: String(v.price),
          originalPrice: v.originalPrice ? String(v.originalPrice) : '',
          stock: String(v.stock),
        }))
      )
    } else {
      setForm(EMPTY_FORM)
      setVariants([{ ...EMPTY_VARIANT }])
      setMeta({})
    }
  }, [product, isOpen])

  const set = (field: keyof typeof EMPTY_FORM, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleCardSelect = (name: string, category: string, imageUrls: string[]) => {
    set('name', name)
    if (category) set('category', category)
    if (imageUrls.length > 0) set('images', imageUrls.join('\n'))
  }

  const handleRaritiesDetected = (rarities: string[]) => {
    setAvailableRarities(rarities)
  }

  const handleFinishesDetected = (finishes: string[]) => {
    setAvailableFinishes(finishes)
  }

  const removeImage = (index: number) => {
    const lines = form.images.split('\n').filter(Boolean)
    lines.splice(index, 1)
    set('images', lines.join('\n'))
  }

  const setVariant = (i: number, field: keyof VariantForm, value: string) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)))

  const addVariant = () => {
    if (form.type === 'singles') {
      if (form.franchise === 'pokemon') {
        // For Pokémon singles: uniqueness is (language, condition, rarity)
        const usedCombos = new Set(variants.map((v) => `${v.language}__${v.condition}__${v.rarity}`))
        for (const lang of LANGUAGES) {
          for (const cond of CONDITIONS) {
            for (const rar of (availableRarities.length > 0 ? availableRarities : [''])) {
              if (!usedCombos.has(`${lang}__${cond}__${rar}`)) {
                setVariants((prev) => [...prev, { ...EMPTY_VARIANT, language: lang, condition: cond, rarity: rar }])
                return
              }
            }
          }
        }
      } else {
        // Non-Pokémon singles: uniqueness is (language, condition)
        const usedCombos = new Set(variants.map((v) => `${v.language}__${v.condition}`))
        for (const lang of LANGUAGES) {
          for (const cond of CONDITIONS) {
            if (!usedCombos.has(`${lang}__${cond}`)) {
              setVariants((prev) => [...prev, { ...EMPTY_VARIANT, language: lang, condition: cond }])
              return
            }
          }
        }
      }
    } else {
      const usedLangs = variants.map((v) => v.language)
      const next = LANGUAGES.find((l) => !usedLangs.includes(l)) ?? 'español'
      setVariants((prev) => [...prev, { ...EMPTY_VARIANT, language: next }])
    }
  }

  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!form.name || !form.category) {
      toast({ title: 'Completa nombre y categoría', status: 'warning', duration: 2000 })
      return
    }
    if (variants.length === 0 || variants.some((v) => !v.price)) {
      toast({ title: 'Cada variante necesita precio', status: 'warning', duration: 2000 })
      return
    }
    setSaving(true)
    const imagesArr = form.images.split('\n').map((s) => s.trim()).filter(Boolean)
    const variantsPayload = variants.map((v) => ({
      id: v.id,
      language: v.language,
      condition: v.condition,
      rarity: v.rarity,
      price: parseFloat(v.price),
      originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
      stock: parseInt(v.stock),
    }))
    const body = {
      name: form.name,
      franchise: form.franchise,
      type: form.type,
      category: form.category,
      description: form.description,
      images: imagesArr,
      featured: form.featured,
      isNew: form.isNew,
      metadata: form.type === 'singles' ? meta : {},
      variants: variantsPayload,
    }
    try {
      if (product) {
        // Update base product
        await fetch(`${API_URL}/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        // Upsert variants: update existing, create new
        for (const v of variantsPayload) {
          if (v.id) {
            await fetch(`${API_URL}/api/admin/products/${product.id}/variants/${v.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(v),
            })
          } else {
            await fetch(`${API_URL}/api/admin/products/${product.id}/variants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(v),
            })
          }
        }
        // Delete removed variants
        const keptIds = variantsPayload.filter((v) => v.id).map((v) => v.id)
        for (const v of product.variants ?? []) {
          if (!keptIds.includes(v.id)) {
            await fetch(`${API_URL}/api/admin/products/${product.id}/variants/${v.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        }
      } else {
        const res = await fetch(`${API_URL}/api/admin/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
      }
      toast({ title: product ? 'Producto actualizado' : 'Producto creado', status: 'success', duration: 2000 })
      onSaved()
      onClose()
    } catch {
      toast({ title: 'Error al guardar', status: 'error', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="#111111" border="1px solid #1e1e1e" borderRadius="xl">
        <ModalHeader fontFamily="heading" fontSize="20px" color="white" letterSpacing="0.05em">
          {product ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
        </ModalHeader>
        <ModalCloseButton color="gray.500" />

        <ModalBody pb={4}>
          <SimpleGrid columns={2} spacing={4}>
            {/* Franquicia + Tipo — primero */}
            <FormControl>
              <FormLabel fontSize="12px" color="gray.500">Franquicia *</FormLabel>
              <Select bg="#0d0d0d" borderColor="#2a2a2a" color="white"
                value={form.franchise} onChange={(e) => set('franchise', e.target.value)}
              >
                <option value="pokemon">Pokémon</option>
                <option value="yugioh">Yu-Gi-Oh!</option>
                <option value="onepiece">One Piece</option>
                <option value="digimon">Digimon</option>
                <option value="gundam">Gundam</option>
                <option value="magicthegathering">Magic: The Gathering</option>
                <option value="dragonballsuper">Dragon Ball Super</option>
                <option value="finalfantasy">Final Fantasy</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="12px" color="gray.500">Tipo *</FormLabel>
              <Select bg="#0d0d0d" borderColor="#2a2a2a" color="white"
                value={form.type} onChange={(e) => set('type', e.target.value)}
              >
                <option value="sealed">Sellado</option>
                <option value="singles">Singles</option>
              </Select>
            </FormControl>

            {/* Nombre */}
            <FormControl gridColumn="1 / -1">
              <FormLabel fontSize="12px" color="gray.500">Nombre *</FormLabel>
              <Input bg="#0d0d0d" borderColor="#2a2a2a" color="white"
                value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder={form.type === 'singles' ? 'Se autocompleta al buscar la carta' : 'Ej: Booster Box Scarlet & Violet'}
              />
            </FormControl>

            {/* Categoría */}
            <FormControl gridColumn="1 / -1">
              <FormLabel fontSize="12px" color="gray.500">Categoría *</FormLabel>
              <Input bg="#0d0d0d" borderColor="#2a2a2a" color="white"
                value={form.category} onChange={(e) => set('category', e.target.value)}
                placeholder={form.type === 'singles' ? 'Se autocompleta al buscar la carta' : 'Ej: Booster Box, Starter Deck...'}
              />
            </FormControl>

            {/* Descripción — solo sealed */}
            {form.type !== 'singles' && (
              <FormControl gridColumn="1 / -1">
                <FormLabel fontSize="12px" color="gray.500">Descripción</FormLabel>
                <Textarea bg="#0d0d0d" borderColor="#2a2a2a" color="white" rows={3}
                  value={form.description} onChange={(e) => set('description', e.target.value)}
                />
              </FormControl>
            )}

            {/* Imágenes — solo sealed (para singles va abajo de Datos de carta) */}
            {form.type !== 'singles' && <ImageSection form={form} set={set} removeImage={removeImage} token={token} />}

            {/* Destacado / Nuevo */}
            <HStack spacing={6} gridColumn="1 / -1">
              <FormControl display="flex" alignItems="center" gap={3} w="auto">
                <Switch colorScheme="yellow" isChecked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)} />
                <FormLabel mb={0} fontSize="13px" color="gray.400">Destacado</FormLabel>
              </FormControl>
              <FormControl display="flex" alignItems="center" gap={3} w="auto">
                <Switch colorScheme="orange" isChecked={form.isNew}
                  onChange={(e) => set('isNew', e.target.checked)} />
                <FormLabel mb={0} fontSize="13px" color="gray.400">Nuevo</FormLabel>
              </FormControl>
            </HStack>
          </SimpleGrid>

          {/* Singles: metadata + imágenes debajo */}
          {form.type === 'singles' && (
            <>
              <SinglesMetadataForm
                franchise={form.franchise}
                meta={meta}
                onChange={setMeta}
                onCardSelect={handleCardSelect}
                onRaritiesDetected={handleRaritiesDetected}
                onFinishesDetected={handleFinishesDetected}
              />
              <ImageSection form={form} set={set} removeImage={removeImage} token={token} />
            </>
          )}

          {/* Variants */}
          <Divider borderColor="#1e1e1e" my={5} />
          <HStack justify="space-between" mb={3}>
            <Text fontSize="12px" color="gray.500" fontWeight={600} textTransform="uppercase" letterSpacing="0.1em">
              {form.franchise === 'pokemon' && form.type === 'singles' ? 'Variantes por idioma / foil' : 'Variantes por idioma'}
            </Text>
            <Button
              size="xs" leftIcon={<FiPlus size={11} />} variant="ghost"
              color="brand.400" _hover={{ bg: 'rgba(255,208,0,0.06)' }}
              onClick={addVariant}
              isDisabled={
                form.type === 'singles'
                  ? form.franchise === 'pokemon'
                    ? variants.length >= LANGUAGES.length * CONDITIONS.length * Math.max(1, availableRarities.length)
                    : variants.length >= LANGUAGES.length * CONDITIONS.length
                  : variants.length >= LANGUAGES.length
              }
            >
              Añadir variante
            </Button>
          </HStack>

          <VStack spacing={3} align="stretch">
            {variants.map((v, i) => (
              <Box key={i} bg="#0d0d0d" border="1px solid #2a2a2a" borderRadius="lg" p={4}>
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <Select
                      size="sm" maxW="140px" bg="#111111" borderColor="#2a2a2a" color="white"
                      value={v.language} onChange={(e) => setVariant(i, 'language', e.target.value)}
                      textTransform="capitalize"
                    >
                      {LANGUAGES.map((l) => (
                        <option
                          key={l}
                          value={l}
                          disabled={
                            form.type === 'singles'
                              ? form.franchise === 'pokemon'
                                // Pokémon singles: bloquear solo si el combo (idioma+condición+foil) ya existe
                                ? variants.some((vv, ii) => ii !== i && vv.language === l && vv.condition === v.condition && vv.rarity === v.rarity)
                                // Otros singles: bloquear solo si el combo (idioma+condición) ya existe
                                : variants.some((vv, ii) => ii !== i && vv.language === l && vv.condition === v.condition)
                              // Sealed: bloquear si el idioma ya está usado
                              : variants.some((vv, ii) => ii !== i && vv.language === l)
                          }
                        >
                          {l.charAt(0).toUpperCase() + l.slice(1)}
                        </option>
                      ))}
                    </Select>
                    {form.type === 'singles' && (
                      <Select
                        size="sm" maxW="120px" bg="#111111" borderColor="#2a2a2a" color="white"
                        value={v.condition} onChange={(e) => setVariant(i, 'condition', e.target.value)}
                      >
                        {CONDITIONS.map((c) => (
                          <option
                            key={c}
                            value={c}
                            disabled={
                              form.franchise === 'pokemon'
                                ? variants.some((vv, ii) => ii !== i && vv.language === v.language && vv.condition === c && vv.rarity === v.rarity)
                                : variants.some((vv, ii) => ii !== i && vv.language === v.language && vv.condition === c)
                            }
                          >
                            {c}
                          </option>
                        ))}
                      </Select>
                    )}
                    {form.type === 'singles' && form.franchise === 'pokemon' && (() => {
                      const options = availableRarities.length > 0 ? availableRarities : availableFinishes
                      return options.length > 0 ? (
                        <Select
                          size="sm" maxW="200px" bg="#111111" borderColor="#2a2a2a" color="white"
                          value={v.rarity} onChange={(e) => setVariant(i, 'rarity', e.target.value)}
                        >
                          {options.map((r) => (
                            <option key={r} value={r}
                              disabled={variants.some((vv, ii) => ii !== i && vv.language === v.language && vv.condition === v.condition && vv.rarity === r)}
                            >
                              {r}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          size="sm" maxW="160px" bg="#111111" borderColor="#2a2a2a" color="white"
                          placeholder="Foil" value={v.rarity}
                          onChange={(e) => setVariant(i, 'rarity', e.target.value)}
                        />
                      )
                    })()}
                  </HStack>
                  {variants.length > 1 && (
                    <IconButton
                      aria-label="Eliminar variante"
                      icon={<FiTrash2 size={13} />}
                      size="xs" variant="ghost" colorScheme="red"
                      onClick={() => removeVariant(i)}
                    />
                  )}
                </HStack>
                <SimpleGrid columns={3} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="11px" color="gray.600">Precio *</FormLabel>
                    <NumberInput min={0} precision={2} value={v.price}
                      onChange={(val) => setVariant(i, 'price', val)}>
                      <NumberInputField bg="#161616" borderColor="#2a2a2a" color="white" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="11px" color="gray.600">Precio original</FormLabel>
                    <NumberInput min={0} precision={2} value={v.originalPrice}
                      onChange={(val) => setVariant(i, 'originalPrice', val)}>
                      <NumberInputField bg="#161616" borderColor="#2a2a2a" color="white" placeholder="—" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="11px" color="gray.600">Stock</FormLabel>
                    <NumberInput min={0} value={v.stock}
                      onChange={(val) => setVariant(i, 'stock', val)}>
                      <NumberInputField bg="#161616" borderColor="#2a2a2a" color="white" />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid #1e1e1e" gap={3}>
          <Button variant="ghost" onClick={onClose} size="sm" color="gray.500">Cancelar</Button>
          <Button variant="primary" size="sm" isLoading={saving} onClick={handleSubmit}>
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
