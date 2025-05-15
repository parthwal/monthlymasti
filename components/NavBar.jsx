import Link from "next/link";
import { useAuth } from "./AuthContext";
import { FaHome, FaPlus, FaSignOutAlt } from "react-icons/fa";

export default function NavBar() {
  const { user, signOut } = useAuth();

  if (!user) return null; // Only show for logged-in users

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto px-6 py-3 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center gap-6">
      <Link href="/">
        <FaHome
          className="w-5 h-5 text-gray-700 hover:text-indigo-600 transition"
          title="Home"
        />
      </Link>
      <Link href="/submit">
        <FaPlus
          className="w-5 h-5 text-gray-700 hover:text-indigo-600 transition"
          title="Add Entry"
        />
      </Link>
      <button onClick={signOut} title="Sign Out">
        <FaSignOutAlt className="w-5 h-5 text-red-500 hover:text-red-700 transition" />
      </button>
    </nav>
  );
}
