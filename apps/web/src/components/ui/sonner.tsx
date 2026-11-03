"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon } from "@/components/animate-ui/icons/circle-check"
import { CircleXIcon } from "@/components/animate-ui/icons/circle-x"
import { InfoIcon } from "@/components/animate-ui/icons/info"
import { LoaderCircleIcon } from "@/components/animate-ui/icons/loader-circle"
import { TriangleAlertIcon } from "@/components/animate-ui/icons/triangle-alert"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" animateOnView />
        ),
        info: (
          <InfoIcon className="size-4" animateOnView />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" animateOnView />
        ),
        error: (
          <CircleXIcon className="size-4" animateOnView />
        ),
        loading: (
          <LoaderCircleIcon className="size-4" animate />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "6px",
          "--width": "22.5rem",
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "8px",
          "--toast-close-button-transform": "none",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
