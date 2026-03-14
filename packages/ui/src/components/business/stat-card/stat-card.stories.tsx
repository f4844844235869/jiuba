import type { Meta, StoryObj } from "@storybook/react"
import { Users, ShoppingCart, DollarSign, Activity } from "@phosphor-icons/react"
import { StatCard } from "./index"

const meta: Meta<typeof StatCard> = {
  title: "业务组件/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "filled"],
      description: "卡片样式变体",
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "卡片尺寸",
    },
    title: {
      control: "text",
      description: "统计标题",
    },
    value: {
      control: "text",
      description: "统计数值",
    },
    description: {
      control: "text",
      description: "描述文字",
    },
    trend: {
      control: "select",
      options: ["up", "down", "neutral"],
      description: "趋势方向",
    },
    trendValue: {
      control: "text",
      description: "趋势百分比",
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "总用户数",
    value: "12,345",
    description: "较上月增长",
    trend: "up",
    trendValue: "+12.5%",
  },
}

export const WithIcon: Story = {
  args: {
    title: "总用户数",
    value: "12,345",
    description: "较上月增长",
    trend: "up",
    trendValue: "+12.5%",
    icon: <Users className="size-5" />,
  },
}

export const TrendDown: Story = {
  args: {
    title: "跳出率",
    value: "45.2%",
    description: "较上周下降",
    trend: "down",
    trendValue: "-3.1%",
    icon: <Activity className="size-5" />,
  },
}

export const Neutral: Story = {
  args: {
    title: "平均访问时长",
    value: "5:32",
    description: "保持稳定",
    trend: "neutral",
    trendValue: "0%",
  },
}

export const Outlined: Story = {
  args: {
    title: "订单数量",
    value: "1,234",
    variant: "outlined",
    trend: "up",
    trendValue: "+8.2%",
    icon: <ShoppingCart className="size-5" />,
  },
}

export const Filled: Story = {
  args: {
    title: "总收入",
    value: "¥89,012",
    variant: "filled",
    trend: "up",
    trendValue: "+23.1%",
    icon: <DollarSign className="size-5" />,
  },
}

export const SmallSize: Story = {
  args: {
    title: "在线用户",
    value: "234",
    size: "sm",
    trend: "up",
    trendValue: "+5%",
  },
}

export const LargeSize: Story = {
  args: {
    title: "月度收入",
    value: "¥1,234,567",
    size: "lg",
    description: "本月累计收入",
    trend: "up",
    trendValue: "+18.9%",
    icon: <DollarSign className="size-6" />,
  },
}

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        title="总用户数"
        value="12,345"
        trend="up"
        trendValue="+12.5%"
        icon={<Users className="size-5" />}
      />
      <StatCard
        title="订单数量"
        value="1,234"
        trend="up"
        trendValue="+8.2%"
        icon={<ShoppingCart className="size-5" />}
      />
      <StatCard
        title="总收入"
        value="¥89,012"
        trend="up"
        trendValue="+23.1%"
        icon={<DollarSign className="size-5" />}
      />
      <StatCard
        title="活跃度"
        value="78.5%"
        trend="down"
        trendValue="-2.3%"
        icon={<Activity className="size-5" />}
      />
    </div>
  ),
}
