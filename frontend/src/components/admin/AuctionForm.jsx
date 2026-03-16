"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  VStack,
  SimpleGrid,
  Text,
  HStack,
  Tooltip,
  Image,
  Center,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import {
  AttachmentIcon,
  CloseIcon,
  CheckIcon,
  StarIcon,
} from "@chakra-ui/icons";
import { useForm, Controller } from "react-hook-form";
import { format, addDays } from "date-fns";
import { auctionsApi, uploadApi } from "@/lib/api";

const CATEGORIES = [
  "Electronics",
  "Art",
  "Collectibles",
  "Clothing",
  "Sports",
  "Jewellery",
  "Vehicles",
  "Other",
];

const toDatetimeLocal = (date) => {
  const d = date ? new Date(date) : new Date();
  return format(d, "yyyy-MM-dd'T'HH:mm");
};

export default function AuctionForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Create Auction",
  restrictedEdit = false,
}) {
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState(defaultValues?.image || "");
  const [isUploading, setIsUploading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      title: "",
      description: "",
      image: "",
      category: "Electronics",
      startTime: toDatetimeLocal(new Date()),
      endTime: toDatetimeLocal(addDays(new Date(), 1)),
      minBid: 10,
      bidIncrement: 5,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        startTime: defaultValues.startTime
          ? toDatetimeLocal(defaultValues.startTime)
          : "",
        endTime: defaultValues.endTime
          ? toDatetimeLocal(defaultValues.endTime)
          : "",
      });
      setImagePreview(defaultValues.image || "");
    }
  }, [defaultValues]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    // Upload to server
    setIsUploading(true);
    try {
      const { data } = await uploadApi.uploadImage(file);
      setValue("image", data.url, { shouldValidate: true });
      toast({ title: "Image uploaded", status: "success", duration: 2000 });
    } catch (err) {
      setImagePreview("");
      setValue("image", "");
      toast({
        title: "Upload failed",
        description:
          err.response?.data?.message || "Max 5 MB. JPEG/PNG/WebP only.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setValue("image", "");
  };

  const handleGenerateDescription = async () => {
    const title = watch("title");
    const category = watch("category");
    if (!title?.trim()) {
      toast({
        title: "Enter a title first",
        description: "The AI uses your title to write the description.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await auctionsApi.generateDescription({
        title,
        category,
      });
      setValue("description", data.description, { shouldValidate: true });
      toast({
        title:
          data.source === "ai"
            ? "AI description generated"
            : "Description generated",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err.response?.data?.message || "Please try again",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const inputProps = {
    bg: "dark.600",
    border: "1px solid",
    borderColor: "whiteAlpha.200",
    _focus: {
      borderColor: "brand.400",
      boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)",
    },
    _hover: { borderColor: "whiteAlpha.400" },
  };

  return (
    <Box as='form' onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={5} align='stretch'>
        <FormControl isInvalid={!!errors.title}>
          <FormLabel fontSize='sm'>Auction Title *</FormLabel>
          <Input
            placeholder='e.g. Vintage Rolex Submariner 1967'
            {...inputProps}
            isDisabled={restrictedEdit}
            {...register("title", {
              required: "Title is required",
              minLength: { value: 5, message: "Minimum 5 characters" },
              maxLength: { value: 100, message: "Maximum 100 characters" },
            })}
          />
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.description}>
          <HStack justify='space-between' mb={1}>
            <FormLabel fontSize='sm' mb={0}>
              Description *
            </FormLabel>
            <Tooltip
              label='Generate a description using AI based on the title and category'
              hasArrow
            >
              <Button
                size='xs'
                colorScheme='purple'
                variant='ghost'
                onClick={handleGenerateDescription}
                isLoading={isGenerating}
                loadingText='Generating...'
                leftIcon={<StarIcon />}
              >
                AI Generate
              </Button>
            </Tooltip>
          </HStack>
          <Textarea
            placeholder='Describe the item condition, specifications, and any notable details...'
            rows={4}
            resize='vertical'
            {...inputProps}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 20, message: "Minimum 20 characters" },
            })}
          />
          <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
        </FormControl>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.category}>
            <FormLabel fontSize='sm'>Category *</FormLabel>
            <Select
              {...inputProps}
              {...register("category", { required: "Category is required" })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: "#1a1a2e" }}>
                  {c}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel fontSize='sm'>Image</FormLabel>
            {/* Hidden real file input */}
            <input
              type='file'
              accept='image/jpeg,image/png,image/webp,image/gif'
              style={{ display: "none" }}
              id='auction-image-input'
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <Box position='relative' w='full'>
                <Image
                  src={imagePreview}
                  alt='Preview'
                  h='140px'
                  w='full'
                  objectFit='cover'
                  borderRadius='lg'
                  border='1px solid'
                  borderColor='whiteAlpha.200'
                />
                {isUploading && (
                  <Center
                    position='absolute'
                    inset={0}
                    bg='blackAlpha.600'
                    borderRadius='lg'
                  >
                    <Spinner color='brand.400' />
                  </Center>
                )}
                {!isUploading && (
                  <HStack position='absolute' bottom={2} right={2} spacing={2}>
                    <Button
                      as='label'
                      htmlFor='auction-image-input'
                      size='xs'
                      colorScheme='brand'
                      cursor='pointer'
                      leftIcon={<AttachmentIcon />}
                    >
                      Change
                    </Button>
                    <Button
                      size='xs'
                      colorScheme='red'
                      onClick={handleRemoveImage}
                      leftIcon={<CloseIcon boxSize={2} />}
                    >
                      Remove
                    </Button>
                  </HStack>
                )}
              </Box>
            ) : (
              <Box
                as='label'
                htmlFor='auction-image-input'
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                h='120px'
                border='2px dashed'
                borderColor='whiteAlpha.300'
                borderRadius='lg'
                cursor='pointer'
                _hover={{ borderColor: "brand.400", bg: "whiteAlpha.50" }}
                transition='all 0.2s'
              >
                <AttachmentIcon boxSize={6} color='whiteAlpha.400' mb={2} />
                <Text fontSize='sm' color='whiteAlpha.500'>
                  Click to upload image
                </Text>
                <Text fontSize='xs' color='whiteAlpha.300' mt={1}>
                  JPEG, PNG, WebP — max 5 MB
                </Text>
              </Box>
            )}
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.startTime}>
            <FormLabel fontSize='sm'>Start Time *</FormLabel>
            <Input
              type='datetime-local'
              {...inputProps}
              isDisabled={restrictedEdit}
              {...register("startTime", { required: "Start time is required" })}
            />
            <FormErrorMessage>{errors.startTime?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.endTime}>
            <FormLabel fontSize='sm'>End Time *</FormLabel>
            <Input
              type='datetime-local'
              {...inputProps}
              isDisabled={restrictedEdit}
              {...register("endTime", { required: "End time is required" })}
            />
            <FormErrorMessage>{errors.endTime?.message}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Controller
            name='minBid'
            control={control}
            rules={{
              required: "Minimum bid is required",
              min: { value: 1, message: "Minimum 1 credit" },
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <FormControl isInvalid={!!fieldState.error}>
                <FormLabel fontSize='sm'>Minimum Bid (credits) *</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(str, num) => onChange(isNaN(num) ? 0 : num)}
                  min={1}
                  max={1000000}
                  isDisabled={restrictedEdit}
                >
                  <NumberInputField {...inputProps} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />

          <Controller
            name='bidIncrement'
            control={control}
            rules={{
              required: "Bid increment is required",
              min: { value: 1, message: "Minimum 1 credit" },
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <FormControl isInvalid={!!fieldState.error}>
                <FormLabel fontSize='sm'>Bid Increment (credits) *</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(str, num) => onChange(isNaN(num) ? 0 : num)}
                  min={1}
                  max={100000}
                  isDisabled={restrictedEdit}
                >
                  <NumberInputField {...inputProps} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />
        </SimpleGrid>

        <Box pt={2}>
          <Button
            type='submit'
            colorScheme='brand'
            size='md'
            isLoading={isLoading}
            loadingText='Saving...'
            w='full'
          >
            {submitLabel}
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
