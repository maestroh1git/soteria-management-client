import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * One spacing for the card's padding and the gap between its parts: 16px on a
 * phone, 24px from 640px up. At 24px a card on a 360px screen spends more
 * width on padding than a figure needs. It is a variable rather than an `sm:`
 * utility so that a card that sets its own (`py-0`, `p-0` on its content)
 * still replaces it at every width.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-(--card-pad) rounded-xl border py-(--card-pad) shadow-sm [--card-pad:1rem] sm:[--card-pad:1.5rem]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-(--card-pad) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-pad)",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a real heading, not a div.
 *
 * A card title is a heading by every meaning except the markup: shipped as a
 * <div>, all 112 of them across the app were invisible to heading navigation,
 * which is how screen-reader users move around a page. h3 because cards sit
 * under a page h1 and usually a section h2; `as` is there for the cases that
 * need a different level rather than a reason to go back to a div.
 */
function CardTitle({
  className,
  as: Comp = "h3",
  ...props
}: React.ComponentProps<"h3"> & { as?: React.ElementType }) {
  return (
    <Comp
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-pad)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-(--card-pad) [.border-t]:pt-(--card-pad)", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
