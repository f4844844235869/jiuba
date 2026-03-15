import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SearchInput } from "./index.js"

describe("SearchInput", () => {
  it("渲染默认占位文案", () => {
    render(<SearchInput placeholder="搜索成员" />)

    expect(screen.getByPlaceholderText("搜索成员")).toBeInTheDocument()
  })

  it("受控模式输入时触发 onValueChange", () => {
    const onValueChange = vi.fn()

    render(
      <SearchInput value="" placeholder="搜索成员" onValueChange={onValueChange} />
    )

    fireEvent.change(screen.getByPlaceholderText("搜索成员"), {
      target: { value: "张三" },
    })

    expect(onValueChange).toHaveBeenCalledWith("张三")
  })

  it("按下 Enter 时触发 onSearch", () => {
    const onSearch = vi.fn()

    render(<SearchInput value="张三" placeholder="搜索成员" onSearch={onSearch} />)

    fireEvent.keyDown(screen.getByPlaceholderText("搜索成员"), { key: "Enter" })

    expect(onSearch).toHaveBeenCalledWith("张三")
  })

  it("点击清空按钮时触发 onValueChange 和 onClear", () => {
    const onValueChange = vi.fn()
    const onClear = vi.fn()

    render(
      <SearchInput
        value="张三"
        placeholder="搜索成员"
        onValueChange={onValueChange}
        onClear={onClear}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "清空搜索" }))

    expect(onValueChange).toHaveBeenCalledWith("")
    expect(onClear).toHaveBeenCalled()
  })

  it("loading 状态显示加载图标且隐藏清空按钮", () => {
    const { container } = render(
      <SearchInput value="张三" placeholder="搜索成员" loading />
    )

    expect(screen.queryByRole("button", { name: "清空搜索" })).not.toBeInTheDocument()
    expect(container.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("disabled 状态下不触发搜索和清空", () => {
    const onSearch = vi.fn()
    const onValueChange = vi.fn()

    render(
      <SearchInput
        value="张三"
        placeholder="搜索成员"
        disabled
        onSearch={onSearch}
        onValueChange={onValueChange}
      />
    )

    fireEvent.keyDown(screen.getByPlaceholderText("搜索成员"), { key: "Enter" })

    expect(screen.queryByRole("button", { name: "清空搜索" })).not.toBeInTheDocument()
    expect(onSearch).not.toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalledWith("")
  })

  it("非受控模式下清空后输入值被清除", () => {
    render(<SearchInput defaultValue="张三" placeholder="搜索成员" />)

    const input = screen.getByPlaceholderText("搜索成员") as HTMLInputElement
    fireEvent.click(screen.getByRole("button", { name: "清空搜索" }))

    expect(input.value).toBe("")
  })
})
