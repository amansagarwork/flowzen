"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", codeHealth: 85, insights: 120, performance: 95 },
  { date: "2024-04-02", codeHealth: 88, insights: 110, performance: 92 },
  { date: "2024-04-03", codeHealth: 82, insights: 135, performance: 98 },
  { date: "2024-04-04", codeHealth: 90, insights: 125, performance: 94 },
  { date: "2024-04-05", codeHealth: 87, insights: 140, performance: 96 },
  { date: "2024-04-06", codeHealth: 91, insights: 130, performance: 93 },
  { date: "2024-04-07", codeHealth: 86, insights: 145, performance: 97 },
  { date: "2024-04-08", codeHealth: 89, insights: 120, performance: 95 },
  { date: "2024-04-09", codeHealth: 84, insights: 155, performance: 91 },
  { date: "2024-04-10", codeHealth: 88, insights: 135, performance: 94 },
  { date: "2024-04-11", codeHealth: 92, insights: 125, performance: 96 },
  { date: "2024-04-12", codeHealth: 87, insights: 140, performance: 92 },
  { date: "2024-04-13", codeHealth: 90, insights: 130, performance: 98 },
  { date: "2024-04-14", codeHealth: 85, insights: 150, performance: 93 },
  { date: "2024-04-15", codeHealth: 83, insights: 145, performance: 95 },
  { date: "2024-04-16", codeHealth: 88, insights: 135, performance: 94 },
  { date: "2024-04-17", codeHealth: 93, insights: 125, performance: 97 },
  { date: "2024-04-18", codeHealth: 89, insights: 140, performance: 91 },
  { date: "2024-04-19", codeHealth: 86, insights: 130, performance: 96 },
  { date: "2024-04-20", codeHealth: 82, insights: 155, performance: 92 },
  { date: "2024-04-21", codeHealth: 87, insights: 145, performance: 94 },

]

const chartConfig = {
  visitors: {
    label: "Metrics",
  },
  codeHealth: {
    label: "Code Health",
    color: "var(--primary)",
  },
  insights: {
    label: "Insights",
    color: "var(--primary)",
  },
  performance: {
    label: "Performance",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card border-border/50 bg-card/50 backdrop-blur-xl shadow-lg shadow-border/10 h-full flex flex-col">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold tracking-tight">Project Overview</CardTitle>
        <CardDescription className="text-base">
          <span className="hidden @[540px]/card:block">
            Comprehensive metrics for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months overview</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 flex-1 min-h-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCodeHealth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-codeHealth)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-codeHealth)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInsights" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-insights)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-insights)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPerformance" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-performance)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-performance)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value, name) => {
                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: `hsl(var(--color-${name}))`,
                          }}
                        />
                        <div>
                          {name === "insights" ? (
                            <>
                              {value} insights: <span className="font-medium">AI Insights</span>
                            </>
                          ) : (
                            <>
                              {value}%: <span className="font-medium">{name === "codeHealth" ? "Code Health" : "Performance"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  }}
                  className="rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
                />
              }
            />
            <Area
              dataKey="insights"
              type="natural"
              fill="url(#fillInsights)"
              stroke="var(--color-insights)"
              stackId="a"
            />
            <Area
              dataKey="codeHealth"
              type="natural"
              fill="url(#fillCodeHealth)"
              stroke="var(--color-codeHealth)"
              stackId="a"
            />
            <Area
              dataKey="performance"
              type="natural"
              fill="url(#fillPerformance)"
              stroke="var(--color-performance)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
