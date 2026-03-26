import { useState, useCallback } from 'react'
import { Box, Image, HStack, IconButton, Flex, Text } from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

interface ProductGalleryProps {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)

  const prev = useCallback(() => {
    setSelected((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const next = useCallback(() => {
    setSelected((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }

  return (
    <Box>
      {/* Main image */}
      <Box
        position='relative'
        sx={{ aspectRatio: '3/4' }}
        borderRadius='xl'
        overflow='hidden'
        bg='#111111'
        mb={3}
        onKeyDown={onKeyDown}
        tabIndex={0}
        _focus={{ outline: '2px solid', outlineColor: 'brand.400' }}
        aria-label={`Imagen ${selected + 1} de ${images.length} de ${name}`}
        aria-roledescription='galería de imágenes'
      >
        <Image
          src={images[selected]}
          alt={`${name} – imagen ${selected + 1}`}
          w='full'
          h='full'
          objectFit='cover'
          transition='opacity 0.2s ease'
          key={selected}
          fallback={
            <Flex
              w='full'
              h='full'
              align='center'
              justify='center'
              bg='#111111'
              color='gray.700'
              fontSize='48px'
              fontFamily='heading'
              letterSpacing='widest'
            >
              CS
            </Flex>
          }
        />

        {/* Counter */}
        <Text
          position='absolute'
          bottom={3}
          right={3}
          bg='rgba(0,0,0,0.7)'
          color='gray.400'
          fontSize='11px'
          px={2}
          py={1}
          borderRadius='md'
          backdropFilter='blur(4px)'
        >
          {selected + 1} / {images.length}
        </Text>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              aria-label='Imagen anterior'
              icon={<ChevronLeftIcon boxSize={5} />}
              position='absolute'
              left={2}
              top='50%'
              transform='translateY(-50%)'
              size='sm'
              bg='rgba(0,0,0,0.6)'
              color='white'
              borderRadius='full'
              backdropFilter='blur(4px)'
              border='1px solid rgba(255,255,255,0.1)'
              _hover={{ bg: 'rgba(255,208,0,0.2)', borderColor: 'brand.400' }}
              onClick={prev}
            />
            <IconButton
              aria-label='Imagen siguiente'
              icon={<ChevronRightIcon boxSize={5} />}
              position='absolute'
              right={2}
              top='50%'
              transform='translateY(-50%)'
              size='sm'
              bg='rgba(0,0,0,0.6)'
              color='white'
              borderRadius='full'
              backdropFilter='blur(4px)'
              border='1px solid rgba(255,255,255,0.1)'
              _hover={{ bg: 'rgba(255,208,0,0.2)', borderColor: 'brand.400' }}
              onClick={next}
            />
          </>
        )}
      </Box>

      {/* Thumbnails */}
      <HStack spacing={2} overflowX='auto' pb={1}>
        {images.map((src, i) => (
          <Box
            key={i}
            as='button'
            flexShrink={0}
            w='70px'
            h='80px'
            borderRadius='md'
            overflow='hidden'
            border='2px solid'
            borderColor={selected === i ? 'brand.400' : 'transparent'}
            bg='#111111'
            cursor='pointer'
            transition='border-color 0.15s, transform 0.15s'
            transform={selected === i ? 'scale(1.05)' : 'scale(1)'}
            _hover={{ borderColor: selected === i ? 'brand.400' : '#3a3a3a' }}
            onClick={() => setSelected(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={selected === i}
          >
            <Image
              src={src}
              alt={`${name} miniatura ${i + 1}`}
              w='full'
              h='full'
              objectFit='cover'
              loading='lazy'
            />
          </Box>
        ))}
      </HStack>
    </Box>
  )
}
