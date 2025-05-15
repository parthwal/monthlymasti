import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Dashboard from "../components/Dashboard";
import NavBar from "../components/NavBar";
import { useAuth } from "../components/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  // Don't render anything if user is not authenticated and redirect is pending
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Monthly Dashboard</title>
        <meta
          name="description"
          content="View monthly highlights and memories"
        />
      </Head>

      <NavBar />

      <main className="min-h-screen bg-gray-100 p-4 pb-20">
        {/* Dashboard content */}
        <Dashboard />
      </main>
    </>
  );
}
