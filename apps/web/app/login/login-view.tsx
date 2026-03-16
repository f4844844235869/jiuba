"use client"

import {
  CircleNotch,
  LockKey,
  SignIn,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr"


import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { useLoginLogic } from "@/app/login/use-login-logic"
import { GuestOnly } from "@/components/auth-guard"



export function LoginView() {
  const logic = useLoginLogic()

  return (
    <GuestOnly>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-muted/70 blur-2xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          <Card className="border-border/70 bg-card/95 shadow-xl backdrop-blur">
            <CardHeader className="gap-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-primary/10">
                <LockKey className="size-6 text-primary" weight="duotone" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">欢迎回来</CardTitle>
                <CardDescription className="text-base">
                  请输入您的账号和密码以继续
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">账号</div>
                  <Input
                    value={logic.form.account}
                    onChange={(event) => logic.setField("account", event.target.value)}
                    placeholder="请输入账号"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">密码</div>
                  </div>
                  <Input
                    type="password"
                    value={logic.form.password}
                    onChange={(event) => logic.setField("password", event.target.value)}
                    placeholder="请输入密码"
                    aria-invalid={logic.error ? "true" : "false"}
                    className="h-10"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void logic.handleSubmit()
                      }
                    }}
                  />
                </div>

                {logic.error ? (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <WarningCircle className="size-4" />
                    {logic.error}
                  </div>
                ) : null}

                <Button
                  className="h-10 w-full text-base font-medium"
                  onClick={() => void logic.handleSubmit()}
                  disabled={logic.isSubmitting || !logic.canSubmit}
                >
                  {logic.isSubmitting ? (
                    <>
                      <CircleNotch className="mr-2 size-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <SignIn className="mr-2 size-4" weight="bold" />
                      登录
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </GuestOnly>
  )
}
