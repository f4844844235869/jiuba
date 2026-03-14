from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
import time

app = FastAPI(title="Workspace Business API", version="1.0.0")

# 必须启用 CORS，否则前端 Next.js 无法跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义数据模型
class User(BaseModel):
    id: str
    name: str
    role: str
    status: Literal['online', 'offline', 'busy']
    avatar: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Literal['online', 'offline', 'busy']] = None

class WorkspaceResponse(BaseModel):
    users: List[User]
    message: str

class SystemStatus(BaseModel):
    status: str
    uptime: float
    version: str

# 内存中的 Mock 数据
mock_users = [
    {"id": "py-1", "name": "Python 专家", "role": "FastAPI Master", "status": "online"},
    {"id": "py-2", "name": "Data Scientist", "role": "ML Engineer", "status": "busy"},
    {"id": "py-3", "name": "DevOps Tool", "role": "Infra", "status": "offline"},
]

start_time = time.time()

@app.get("/api/workspace", response_model=WorkspaceResponse, tags=["Workspace"])
async def get_workspace():
    """获取工作区所有数据"""
    time.sleep(0.3)
    return {
        "users": mock_users,
        "message": "Data fetched from FastAPI backend"
    }

@app.post("/api/users", response_model=User, tags=["Users"])
async def create_user(user: User):
    """创建新用户 (Create)"""
    global mock_users
    # 简单的 ID 重复校验
    if any(u["id"] == user.id for u in mock_users):
        raise HTTPException(status_code=400, detail="User ID already exists")
    mock_users.append(user.dict())
    return user

@app.put("/api/users/{user_id}", response_model=User, tags=["Users"])
async def update_user(user_id: str, update: UserUpdate):
    """更新用户信息 (Update)"""
    global mock_users
    for user in mock_users:
        if user["id"] == user_id:
            update_data = update.dict(exclude_unset=True)
            user.update(update_data)
            return user
    raise HTTPException(status_code=404, detail="User not found")

@app.delete("/api/users/{user_id}", tags=["Users"])
async def delete_user(user_id: str):
    """根据 ID 删除用户 (Delete)"""
    global mock_users
    initial_len = len(mock_users)
    mock_users = [u for u in mock_users if u["id"] != user_id]
    if len(mock_users) == initial_len:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": f"User {user_id} deleted"}

@app.get("/api/system/status", response_model=SystemStatus, tags=["System"])
async def get_system_status():
    """获取系统运行状态"""
    return {
        "status": "healthy",
        "uptime": time.time() - start_time,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
