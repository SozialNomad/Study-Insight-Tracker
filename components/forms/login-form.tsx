"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type AuthActionState } from "@/app/login/actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    initialState
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-3xl">Hoş geldin</CardTitle>
        <CardDescription>
          Çalışma kayıtlarını görmek ve yeni veri girmek için giriş yap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input id="full_name" name="full_name" placeholder="Örn. Ahmet Yılmaz" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" required placeholder="ornek@mail.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>

          {state.error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </Button>
        </form>

        <Button
          className="mt-3 w-full"
          variant="ghost"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Kayıt Ol" : "Giriş Yap"}
        </Button>
      </CardContent>
    </Card>
  );
}
