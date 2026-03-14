import { create } from 'zustand'
import { getWorkspaceApiWorkspaceGet } from '../../api/generated/workspace/workspace'
import { deleteUserApiUsersUserIdDelete } from '../../api/generated/users/users'
import { User } from '../../api/generated/workspace.schemas'


export interface Activity {
  id: string
  time: string
  message: string
  type: 'info' | 'success' | 'warning'
}

interface WorkspaceState {
  // --- 数据层 (State) ---
  users: User[]
  logs: Activity[]
  isLoading: boolean
  searchQuery: string

  // --- 计算层 (Getters - 用函数实现或在组件内 select) ---
  
  // --- 动作层 (Actions) ---
  setSearchQuery: (query: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  deleteUser: (id: string) => void
  updateUserStatus: (id: string, status: User['status']) => void
  addLog: (message: string, type?: Activity['type']) => void
  clearLogs: () => void
  
  // 模拟异步初始化
  initWorkspace: () => Promise<void>
}

/**
 * Zustand Store: 整个大型页面的“中央大脑”
 * 所有的状态和逻辑高度聚合，且完全脱离 React 组件生命周期
 */
export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  users: [],
  logs: [],
  isLoading: false,
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  addLog: (message, type = 'info') => {
    const newLog: Activity = {
      id: Math.random().toString(36).substring(7),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }
    set((state) => ({ logs: [newLog, ...state.logs].slice(0, 10) })) // 只保留最近10条
  },

  clearLogs: () => set({ logs: [] }),

  addUser: (userData) => {
    const newUser = { ...userData, id: Math.random().toString(36).substring(7) }
    set((state) => ({ users: [...state.users, newUser] }))
    get().addLog(`新增用户: ${newUser.name}`, 'success')
  },

  deleteUser: async (id) => {
    const user = get().users.find(u => u.id === id)
    if (!user) return

    try {
      // 对接真实 Python 后端删除接口
      await deleteUserApiUsersUserIdDelete(id)

      set((state) => ({ users: state.users.filter(u => u.id !== id) }))
      get().addLog(`[Remote] 成功从后端删除用户: ${user.name}`, 'warning')
    } catch (err: any) {
      get().addLog(`[Error] ${err.message}`, 'warning')
    }
  },

  updateUserStatus: (id, status) => {
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, status } : u)
    }))
    const user = get().users.find(u => u.id === id)
    get().addLog(`设置 ${user?.name} 状态为 ${status}`)
  },

  initWorkspace: async () => {
    set({ isLoading: true })
    get().addLog('正在从中台 (FastAPI) 获取实时数据...')
    
    try {
      // 使用 Orval 生成的函数获取数据
      const data = await getWorkspaceApiWorkspaceGet()
      
      set({ users: data.users, isLoading: false })
      get().addLog('工作区同步完成: 数据源 python-v1.0', 'success')
    } catch (err: any) {
      set({ isLoading: false })
      get().addLog(`同步失败: ${err.message}. 请检查 FastAPI 服务是否启动。`, 'warning')
    }
  }
}))
