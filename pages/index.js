import Head from "next/head";
import Dashboard from "../components/Dashboard";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Monthly Dashboard</title>
      </Head>
      <Dashboard />
    </>
  );
}
