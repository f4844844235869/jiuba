import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { UserCard } from "./index"

const meta: Meta<typeof UserCard> = {
  title: "业务组件/UserCard",
  component: UserCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "elevated"],
      description: "卡片样式变体",
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "卡片尺寸",
    },
    name: {
      control: "text",
      description: "用户名称",
    },
    email: {
      control: "text",
      description: "用户邮箱",
    },
    role: {
      control: "text",
      description: "用户角色/职位",
    },
    avatar: {
      control: "text",
      description: "用户头像 URL",
    },
    showActions: {
      control: "boolean",
      description: "是否显示操作按钮",
    },
  },
  args: {
    onFollow: fn(),
    onMessage: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: "张三",
    email: "zhangsan@example.com",
    role: "产品经理",
    showActions: true,
  },
}

export const WithAvatar: Story = {
  args: {
    name: "李四",
    email: "lisi@example.com",
    role: "前端工程师",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    showActions: true,
  },
}

export const Outlined: Story = {
  args: {
    name: "王五",
    email: "wangwu@example.com",
    role: "设计师",
    variant: "outlined",
    showActions: true,
  },
}

export const Elevated: Story = {
  args: {
    name: "赵六",
    email: "zhaoliu@example.com",
    role: "后端工程师",
    variant: "elevated",
    showActions: true,
  },
}

export const SmallSize: Story = {
  args: {
    name: "小明",
    role: "实习生",
    size: "sm",
    showActions: true,
  },
}

export const LargeSize: Story = {
  args: {
    name: "大伟",
    email: "dawei@example.com",
    role: "技术总监",
    size: "lg",
    showActions: true,
  },
}

export const WithoutActions: Story = {
  args: {
    name: "无按钮用户",
    email: "noaction@example.com",
    role: "访客",
    showActions: false,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <UserCard
        name="默认样式"
        role="Default Variant"
        variant="default"
      />
      <UserCard
        name="边框样式"
        role="Outlined Variant"
        variant="outlined"
      />
      <UserCard
        name="浮起样式"
        role="Elevated Variant"
        variant="elevated"
      />
    </div>
  ),
}
