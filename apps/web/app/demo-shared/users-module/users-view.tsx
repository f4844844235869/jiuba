"use client"

import { UserCard } from "@workspace/ui/components/business"
import { useUsersLogic } from "./use-users-logic"

export function UsersView({ logic }: { logic: ReturnType<typeof useUsersLogic> }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {logic.users.map(user => (
        <UserCard 
          key={user.id}
          name={user.name}
          role={user.role}
          email={user.status === "active" ? "在线" : "离线"}
          onFollow={() => logic.toggleStatus(user.id)}
          onMessage={() => logic.deleteUser(user.id)}
        />
      ))}
    </div>
  )
}
