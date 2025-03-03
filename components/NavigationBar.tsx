"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";

import Image from "next/image";

export default function NavigationBar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center max-w-full">
        <div className="text-left flex items-center gap-2">
          <Image src="/JobConnect.svg" alt="Logo" width={50} height={50} />
          <h1 className="text-3xl font-bold text-cyan-400 tracking-tight">
            JobConnect
          </h1>
          {/* <h3 className="text-lg text-gray-400">Easy Cold Email</h3> */}
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:bg-cyan-700 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              showName
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10", // Adjusted avatar size for balance
                  userButtonText: "text-base font-semibold text-cyan-300", // Modern text styling
                  userButtonBox:
                    "hover:bg-gray-800 p-1 rounded-md transition-all duration-200",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
