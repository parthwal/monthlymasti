import Head from "next/head";
import Link from "next/link";
import Dashboard from "../components/Dashboard";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Monthly Dashboard</title>
        <meta
          name="description"
          content="View monthly highlights and memories"
        />
      </Head>

      <main className="min-h-screen bg-gray-100 p-4 pb-20">
        {/* Dashboard content */}
        <Dashboard />

        {/* Floating plus button */}
        <div className="fixed bottom-8 inset-x-0 flex justify-center pointer-events-none">
          <Link href="/submit">
            <button
              className="pointer-events-auto w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg
                          flex items-center justify-center hover:bg-indigo-700 transition-transform
                          transform hover:scale-110 focus:outline-none"
              aria-label="Fill the Form"
            >
              {/* Inline Plus SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
