import { ClientHome } from "@/components/ClientHome";
import { HomeBetaNotice } from "@/components/HomeBetaNotice";

export default function Page() {
  return (
    <>
      <ClientHome />
      <main className="main betaHomeNotice">
        <HomeBetaNotice />
      </main>
    </>
  );
}
