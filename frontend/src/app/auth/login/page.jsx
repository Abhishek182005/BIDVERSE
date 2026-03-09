"use client";

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

const MotionBox = motion(Box);

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH='100vh'
      bg='dark.900'
      display='flex'
      alignItems='center'
      justifyContent='center'
      position='relative'
      overflow='hidden'
      p={4}
    >
      {/* Background orbs */}
      <Box
        position='absolute'
        top='-100px'
        left='-100px'
        w='500px'
        h='500px'
        bg='brand.500'
        opacity={0.04}
        borderRadius='full'
        filter='blur(100px)'
      />
      <Box
        position='absolute'
        bottom='-100px'
        right='-100px'
        w='400px'
        h='400px'
        bg='cyber.500'
        opacity={0.04}
        borderRadius='full'
        filter='blur(100px)'
      />

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        w='100%'
        maxW='440px'
      >
        {/* Logo */}
        <VStack mb={8} spacing={2}>
          <Link href='/' style={{ textDecoration: "none" }}>
            <HStack>
              <Text fontSize='3xl'>🔨</Text>
              <Heading size='lg' className='gradient-text'>
                BidVerse
              </Heading>
            </HStack>
          </Link>
          <Text color='whiteAlpha.500' fontSize='sm'>
            Sign in to your account
          </Text>
        </VStack>

        {/* Card */}
        <Box className='glass-card' p={8}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Email Address
                </FormLabel>
                <Input
                  placeholder='you@example.com'
                  type='email'
                  size='lg'
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email",
                    },
                  })}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Password
                </FormLabel>
                <InputGroup size='lg'>
                  <Input
                    placeholder='••••••••'
                    type={showPass ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  <InputRightElement>
                    <IconButton
                      variant='ghost'
                      size='sm'
                      icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPass(!showPass)}
                      aria-label='Toggle password'
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type='submit'
                colorScheme='brand'
                variant='solid'
                size='lg'
                w='100%'
                isLoading={loading}
                loadingText='Signing in...'
                mt={2}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Divider my={6} borderColor='whiteAlpha.100' />

          <Text textAlign='center' color='whiteAlpha.600' fontSize='sm'>
            Don't have an account?{" "}
            <Link
              href='/auth/register'
              style={{ color: "#6C63FF", fontWeight: 600 }}
            >
              Register here
            </Link>
          </Text>
        </Box>

        {/* Demo credentials */}
        <Box
          mt={4}
          p={4}
          bg='whiteAlpha.50'
          borderRadius='xl'
          border='1px dashed'
          borderColor='whiteAlpha.200'
        >
          <Text
            fontSize='xs'
            color='whiteAlpha.500'
            mb={2}
            fontWeight={600}
            letterSpacing='wider'
          >
            DEMO CREDENTIALS
          </Text>
          <VStack align='start' spacing={1}>
            <Text fontSize='xs' color='whiteAlpha.600'>
              Admin:{" "}
              <Text as='span' color='brand.300'>
                admin@bidverse.com
              </Text>{" "}
              /{" "}
              <Text as='span' color='brand.300'>
                Admin@123
              </Text>
            </Text>
          </VStack>
        </Box>
      </MotionBox>
    </Box>
  );
}
