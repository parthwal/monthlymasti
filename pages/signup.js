import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../components/AuthContext";
import Link from "next/link";

export default function SignUp() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { error } = await signUp(email, password);
    if (error) setError(error.message);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden">
        {/* Left panel */}
        <div
          className="hidden md:block"
          style={{
            backgroundImage: `url(/7floor2.jpeg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Right panel (sign up form) */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Sign up with your email and password to get started
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-4 bg-red-100 p-2 rounded">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm block mb-1 text-gray-600">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm block mb-1 text-gray-600">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link href="/login/">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
