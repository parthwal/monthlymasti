// components/Layout.js
import { useRouter } from "next/router";
import NavBar from "./NavBar";

export default function Layout({ children }) {
  const router = useRouter();
  const hideNav = ["/login", "/signup"].includes(router.pathname);

  return (
    <>
      {!hideNav && <NavBar />}
      <main>{children}</main>
    </>
  );
}
