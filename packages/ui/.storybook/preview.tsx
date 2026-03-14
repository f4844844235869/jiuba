import type { Preview, ReactRenderer } from "@storybook/react"
import { withThemeByClassName } from "@storybook/addon-themes"
import "../src/styles/globals.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "主题切换",
      defaultValue: "light",
      toolbar: {
        title: "主题",
        icon: "paintbrush",
        items: [
          { value: "light", title: "浅色模式", icon: "sun" },
          { value: "dark", title: "深色模式", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    (Story) => (
      <div className="min-h-[200px] min-w-[300px] p-6 bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
}

export default preview
