"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Loader2, Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

const searchInputVariants = cva(
  "group/search-input relative flex w-full items-center gap-2 rounded-md border border-input bg-background px-2.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-[input[aria-invalid=true]]:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-8 rounded-[min(var(--radius-md),10px)] px-2",
        default: "h-9",
        lg: "h-10 px-3",
      },
      disabled: {
        true: "opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      disabled: false,
    },
  }
)

export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "size" | "prefix" | "type"> {
  value?: string
  defaultValue?: string
  placeholder?: string
  loading?: boolean
  clearable?: boolean
  onValueChange?: (value: string) => void
  onSearch?: (value: string) => void
  onClear?: () => void
  size?: "sm" | "default" | "lg"
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      defaultValue = "",
      placeholder,
      loading = false,
      clearable = true,
      disabled = false,
      size = "default",
      onValueChange,
      onSearch,
      onClear,
      onChange,
      onKeyDown,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const currentValue = isControlled ? value : internalValue

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, [])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value

      if (!isControlled) {
        setInternalValue(nextValue)
      }

      onValueChange?.(nextValue)
      onChange?.(event)
    }

    const handleClear = () => {
      if (disabled) {
        return
      }

      if (!isControlled) {
        setInternalValue("")
      }

      onValueChange?.("")
      onClear?.()
      inputRef.current?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!disabled && event.key === "Enter") {
        onSearch?.(currentValue)
      }

      onKeyDown?.(event)
    }

    const showClearButton =
      !disabled && !loading && clearable && Boolean(currentValue)

    return (
      <div
        data-slot="search-input"
        data-size={size ?? "default"}
        data-disabled={disabled ? "true" : "false"}
        className={cn(searchInputVariants({ size, disabled }), className)}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={currentValue}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="h-full border-0 bg-transparent px-0 py-0 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
          {...props}
        />
        <div className="flex shrink-0 items-center">
          {loading ? (
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin text-muted-foreground"
            />
          ) : null}
          {showClearButton ? (
            <button
              type="button"
              aria-label="清空搜索"
              className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={handleClear}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

export { SearchInput, searchInputVariants }
