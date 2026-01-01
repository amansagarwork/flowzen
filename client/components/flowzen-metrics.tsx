"use client"

import { IconHeartbeat, IconBug, IconRocket, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function FlowZenMetrics() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
            <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
                <CardHeader>
                    <CardDescription>Code Health</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                        <IconHeartbeat className="w-6 h-6 text-emerald-500" />
                        98%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                            <IconTrendingUp className="w-3 h-3" />
                            Excellent
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Codebase quality score
                    </div>
                    <div className="text-muted-foreground">
                        Based on linting & best practices
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
                <CardHeader>
                    <CardDescription>Open Issues</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                        <IconBug className="w-6 h-6 text-amber-500" />
                        3
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
                            Low Priority
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Tracked bugs & tasks
                    </div>
                    <div className="text-muted-foreground">
                        2 outdated dependencies
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
                <CardHeader>
                    <CardDescription>Velocity</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                        <IconRocket className="w-6 h-6 text-primary" />
                        High
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                            <IconTrendingUp className="w-3 h-3" />
                            +12%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Development speed
                    </div>
                    <div className="text-muted-foreground">
                        Commits per week trending up
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-sm">
                <CardHeader>
                    <CardDescription>Test Coverage</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                        <IconTrendingUp className="w-6 h-6 text-emerald-500" />
                        +5%
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                            Improved
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Coverage increased
                    </div>
                    <div className="text-muted-foreground">
                        Now at 87% overall
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
