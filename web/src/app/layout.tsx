"use client";

import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

function Header() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </header>
    );
  }

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      {user ? (
        <UserButton />
      ) : (
        <>
          <SignInButton />
          <a 
          href="/sign-up" 
          className="bg-[#6c47ff] text-ceramic-white rounded-full flex items-center justify-center font-medium text-sm sm:text-base h-8 sm:h-12 px-3 sm:px-5 cursor-pointer py-1"
        >
          Sign Up
        </a>
        </>
      )}
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}