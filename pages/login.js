import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../components/AuthContext";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const { user, loading, signIn, signInWithProvider } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
  };

  const handleOAuth = async (provider) => {
    await signInWithProvider(provider);
  };

  if (loading || user)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 animate-pulse">
        <div className="w-96 p-6 bg-white rounded-xl shadow-md space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden">
        {/* Left side */}
        <div
          className="hidden md:block"
          style={{
            backgroundImage: `url(/7floor1.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "right",
          }}
        />

        {/* Right side */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Log in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your credentials or use Google to continue
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
              Log In
            </button>
            <button
              onClick={() => handleOAuth("google")}
              className="w-full mb-6 py-2 border border-gray-300 rounded flex items-center justify-center gap-4 hover:bg-gray-50 transition"
            >
              <FaGoogle className="text-red-500 h-5 w-5" />
              <span>Continue with Google</span>
            </button>
          </form>

          <p className=" text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <a
              href="/signup"
              className="text-indigo-600 hover:underline font-medium"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
