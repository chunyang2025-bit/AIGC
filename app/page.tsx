import { ClientHome } from "@/components/ClientHome";
import { BetaNotice } from "@/components/BetaNotice";

export default function Page() {
  return (
    <>
      <ClientHome />
      <main className="main betaHomeNotice">
        <BetaNotice />
      </main>
    </>
  );
}
