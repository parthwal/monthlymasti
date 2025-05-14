// pages/submit.js
import Head from "next/head";
import Link from "next/link";
import SubmissionForm from "../components/SubmissionForm";

export default function SubmitPage() {
  return (
    <>
      <Head>
        <title>Monthly Submission</title>
        <meta name="description" content="Submit your monthly highlights" />
      </Head>
      <main className="min-h-screen bg-gray-100 p-4 pb-20 flex flex-col items-center">
        {/* Form heading */}
        <div className="w-full max-w-2xl mb-6">
          <h1 className="text-3xl font-bold text-center">
            Monthly Highlights Submission
          </h1>
        </div>

        {/* Submission form */}
        <div className="w-full max-w-2xl flex-grow">
          <SubmissionForm />
        </div>

        {/* Floating “×” close button */}
        <div className="fixed bottom-8 inset-x-0 flex justify-center pointer-events-none">
          <Link href="/">
            <button
              aria-label="Close"
              className="pointer-events-auto w-12 h-12 bg-gray-200 text-gray-800 rounded-full shadow-lg
                         flex items-center justify-center hover:bg-gray-300 transition-transform
                         transform hover:scale-110 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
