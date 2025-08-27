"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      console.log("Clerk not loaded yet");
      return;
    }

    try {
      console.log("Creating user with:", { email, password, role });
      
      const result = await signUp.create({
        emailAddress: email,
        password: password,
        unsafeMetadata: {
            role: role 
          },
      });
      
      console.log("Sign up result:", result);
      await setActive({ session: result.createdSessionId });
// Needed in production when i have emabled email verification
    //   // Add this: Handle email verification
    //   if (result.status === "missing_requirements") {
    //     await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    //     setPendingVerification(true);
    //   } else if (result.status === "complete") {
    //     // Sign-up complete, redirect to home
    //     router.push("/");
    //   }

    if (result.status === "complete") {
        // Sign-up complete, redirect to home
        router.push("/");}
      
    } catch (error) {
      console.error("Sign up error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl text-amber-300 font-bold text-center mb-6">Create your account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
            </label>
            <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
                <option value="">Select a role</option>
                <option value="guard">Guard</option>
                <option value="supervisor">Supervisor</option>
                <option value="aso">ASO</option>
                <option value="so">SO</option>
                <option value="field_officer">Field Officer</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
            </select>
            </div>

          {/* Add this div for CAPTCHA */}
          <div id="clerk-captcha"></div>

          <button
            type="submit"
            disabled={!isLoaded}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoaded ? "Sign Up" : "Loading..."}
          </button>
        </form>

        
      </div>
    </div>
  );
}