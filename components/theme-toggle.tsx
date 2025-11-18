"use client"

import * as React from "react"
import { IconMoonStars, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === "dark"

  const handleChange = React.useCallback(
    (checked: boolean) => {
      setTheme(checked ? "dark" : "light")
    },
    [setTheme]
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
      <IconSun className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={handleChange}
        aria-label="Toggle theme"
        className="h-5 w-9"
      />
      <IconMoonStars className="size-3.5 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}
