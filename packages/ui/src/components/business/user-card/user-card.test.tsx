import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UserCard } from "./index"

describe("UserCard", () => {
  it("应该正确渲染用户名称", () => {
    render(<UserCard name="张三" />)
    expect(screen.getByText("张三")).toBeInTheDocument()
  })

  it("应该正确渲染用户角色", () => {
    render(<UserCard name="张三" role="产品经理" />)
    expect(screen.getByText("产品经理")).toBeInTheDocument()
  })

  it("应该正确渲染用户邮箱", () => {
    render(<UserCard name="张三" email="zhangsan@example.com" />)
    expect(screen.getByText("zhangsan@example.com")).toBeInTheDocument()
  })

  it("当没有头像时应该显示名称首字母", () => {
    render(<UserCard name="张三" />)
    expect(screen.getByText("张")).toBeInTheDocument()
  })

  it("当有头像时应该显示头像图片", () => {
    render(<UserCard name="张三" avatar="https://example.com/avatar.jpg" />)
    const img = screen.getByAltText("张三 的头像")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("当 showActions 为 true 时应该显示操作按钮", () => {
    render(<UserCard name="张三" showActions={true} />)
    expect(screen.getByText("关注")).toBeInTheDocument()
    expect(screen.getByText("消息")).toBeInTheDocument()
  })

  it("当 showActions 为 false 时不应该显示操作按钮", () => {
    render(<UserCard name="张三" showActions={false} />)
    expect(screen.queryByText("关注")).not.toBeInTheDocument()
    expect(screen.queryByText("消息")).not.toBeInTheDocument()
  })

  it("点击关注按钮应该触发 onFollow 回调", () => {
    const onFollow = vi.fn()
    render(<UserCard name="张三" onFollow={onFollow} />)
    fireEvent.click(screen.getByText("关注"))
    expect(onFollow).toHaveBeenCalledTimes(1)
  })

  it("点击消息按钮应该触发 onMessage 回调", () => {
    const onMessage = vi.fn()
    render(<UserCard name="张三" onMessage={onMessage} />)
    fireEvent.click(screen.getByText("消息"))
    expect(onMessage).toHaveBeenCalledTimes(1)
  })

  it("应该正确应用 variant 样式", () => {
    const { container } = render(<UserCard name="张三" variant="elevated" />)
    const card = container.firstChild
    expect(card).toHaveClass("shadow-lg")
  })

  it("应该正确应用 size 样式", () => {
    const { container } = render(<UserCard name="张三" size="lg" />)
    const card = container.firstChild
    expect(card).toHaveClass("p-6")
  })

  it("应该正确应用自定义 className", () => {
    const { container } = render(<UserCard name="张三" className="custom-class" />)
    const card = container.firstChild
    expect(card).toHaveClass("custom-class")
  })
})
