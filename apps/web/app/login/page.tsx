import { Suspense } from "react"
import { LoginView } from "@/app/login/login-view"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  )
}
