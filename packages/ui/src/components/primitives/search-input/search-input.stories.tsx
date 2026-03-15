import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { SearchInput } from "./index.js"

const meta: Meta<typeof SearchInput> = {
  title: "增强原子/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    placeholder: "搜索成员、角色或资源",
    onValueChange: fn(),
    onSearch: fn(),
    onClear: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    value: "张三",
  },
}

export const Loading: Story = {
  args: {
    value: "同步中",
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    value: "不可编辑",
    disabled: true,
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-[360px] flex-col gap-4">
      <SearchInput {...args} size="sm" placeholder="紧凑尺寸搜索" />
      <SearchInput {...args} size="default" placeholder="默认尺寸搜索" />
      <SearchInput {...args} size="lg" placeholder="大尺寸搜索" />
    </div>
  ),
}

export const Controlled: Story = {
  render: (args) => {
    function ControlledSearchInput() {
      const [value, setValue] = React.useState("")

      return (
        <div className="w-[360px] space-y-3">
          <SearchInput
            {...args}
            value={value}
            onValueChange={setValue}
            placeholder="输入后按 Enter 触发搜索"
          />
          <div className="text-sm text-muted-foreground">
            当前值：{value || "空"}
          </div>
        </div>
      )
    }

    return <ControlledSearchInput />
  },
}
