import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatCard } from "./index"

describe("StatCard", () => {
  it("应该正确渲染标题", () => {
    render(<StatCard title="总用户数" value="12,345" />)
    expect(screen.getByText("总用户数")).toBeInTheDocument()
  })

  it("应该正确渲染数值", () => {
    render(<StatCard title="总用户数" value="12,345" />)
    expect(screen.getByText("12,345")).toBeInTheDocument()
  })

  it("应该正确渲染描述", () => {
    render(<StatCard title="总用户数" value="12,345" description="较上月增长" />)
    expect(screen.getByText("较上月增长")).toBeInTheDocument()
  })

  it("应该正确渲染数字类型的值", () => {
    render(<StatCard title="总用户数" value={12345} />)
    expect(screen.getByText("12345")).toBeInTheDocument()
  })

  it("当有趋势时应该显示趋势值", () => {
    render(<StatCard title="总用户数" value="12,345" trend="up" trendValue="+12.5%" />)
    expect(screen.getByText("+12.5%")).toBeInTheDocument()
  })

  it("当趋势为 up 时应该应用正确的颜色", () => {
    const { container } = render(
      <StatCard title="总用户数" value="12,345" trend="up" trendValue="+12.5%" />
    )
    const trendElement = container.querySelector(".text-green-600")
    expect(trendElement).toBeInTheDocument()
  })

  it("当趋势为 down 时应该应用正确的颜色", () => {
    const { container } = render(
      <StatCard title="跳出率" value="45%" trend="down" trendValue="-3.1%" />
    )
    const trendElement = container.querySelector(".text-red-600")
    expect(trendElement).toBeInTheDocument()
  })

  it("应该正确渲染自定义图标", () => {
    render(
      <StatCard
        title="总用户数"
        value="12,345"
        icon={<span data-testid="custom-icon">icon</span>}
      />
    )
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("应该正确应用 variant 样式", () => {
    const { container } = render(
      <StatCard title="总用户数" value="12,345" variant="filled" />
    )
    const card = container.firstChild
    expect(card).toHaveClass("bg-primary/5")
  })

  it("应该正确应用 size 样式", () => {
    const { container } = render(
      <StatCard title="总用户数" value="12,345" size="lg" />
    )
    const card = container.firstChild
    expect(card).toHaveClass("p-6")
  })

  it("应该正确应用自定义 className", () => {
    const { container } = render(
      <StatCard title="总用户数" value="12,345" className="custom-class" />
    )
    const card = container.firstChild
    expect(card).toHaveClass("custom-class")
  })

  it("当没有趋势时不应该显示趋势图标", () => {
    const { container } = render(<StatCard title="总用户数" value="12,345" />)
    // 检查没有趋势相关的颜色类
    expect(container.querySelector(".text-green-600")).not.toBeInTheDocument()
    expect(container.querySelector(".text-red-600")).not.toBeInTheDocument()
  })
})
