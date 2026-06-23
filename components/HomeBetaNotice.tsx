"use client";

import { useEffect, useState } from "react";
import { readAuthSession, AUTH_SESSION_EVENT } from "@/lib/auth";
import { BetaNotice } from "./BetaNotice";

export function HomeBetaNotice() {
  const [isMember, setIsMember] = useState(() => Boolean(readAuthSession()));

  useEffect(() => {
    const syncSession = () => setIsMember(Boolean(readAuthSession()));
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);
    syncSession();
    return () => window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
  }, []);

  return <BetaNotice variant={isMember ? "member" : "guest"} />;
}
