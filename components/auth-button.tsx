"use client";

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const { error, data } = await supabase.auth.getUser();
        if (data.user) setUser(data.user);
        else setUser(null);

        setLoading(false);
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    getUser();
  }, []);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => await supabase.auth.signOut()}
      >
        Sign Out
      </Button>
    );
  }

  return (
    <Link className={buttonVariants({ size: "sm" })} href="/login">
      Sign In
    </Link>
  );
}
