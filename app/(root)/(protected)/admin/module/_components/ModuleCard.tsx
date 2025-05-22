import { NavLinkItem } from "@/constants/navLinks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShieldCheck, EyeOff, Eye, Star, Users, Edit2Icon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const ModuleCard = ({ navLink }: { navLink: NavLinkItem }) => {
    return (
        <Card className="
                group
                relative 
                border-border      
                transition-all 
                duration-300 
                hover:shadow-lg 
                hover:scale-[1.015] 
                hover:border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    {navLink.icon && <navLink.icon className="h-5 w-5 text-primary" />}
                    {navLink.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{navLink.route}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {navLink.adminOnly && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Solo admin
                    </Badge>
                )}
                {navLink.requiresPremium && (
                    <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-4 w-4" /> Premium
                    </Badge>
                )}
                <div className="flex items-center gap-2">
                    {navLink.showInSidebar
                        ? <Badge variant="outline" className="flex items-center gap-1"><Eye className="h-4 w-4" /> Sidebar</Badge>
                        : <Badge variant="destructive" className="flex items-center gap-1"><EyeOff className="h-4 w-4" /> Oculto</Badge>}
                </div>
                {navLink.allowedPlans && navLink.allowedPlans.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {navLink.allowedPlans.map(plan => (
                            <Badge key={plan} variant="outline">{plan}</Badge>
                        ))}
                    </div>
                )}
                {navLink.items && navLink.items.length > 0 && (
                    <div className="mt-4">
                        <p className="font-medium mb-1">Submódulos:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {navLink.items.map((item, index) => (
                                <li key={index}>
                                    <span className="font-medium">{item.title}</span> – <span className="text-xs">{item.url}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon">
                        <Edit2Icon />
                    </Button>
                    <Button variant="destructive" size="icon">
                        <Trash2 />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
