import { cn } from "@/lib/utils";

export const CalendarSkeleton = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 12 }, (_, i) => `${i + 7}:00`);

    return (
        <div className="w-full border rounded-md shadow bg-background">
            <div className="flex text-sm border-b border-border">
                <div className="w-16 p-2 text-muted-foreground">Hora</div>
                {days.map((day) => (
                    <div
                        key={day}
                        className="flex-1 p-2 text-center font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {hours.map((hour, i) => (
                <div key={i} className="flex border-b border-border h-16">
                    <div className="w-16 px-2 py-1 text-xs text-muted-foreground">
                        {hour}
                    </div>
                    {days.map((_, j) => (
                        <div
                            key={j}
                            className={cn(
                                "flex-1 border-l border-border relative",
                                i === 2 && j === 2 && "animate-pulse bg-muted rounded-md mx-2 my-1 h-10", // Simula un evento en Martes 9am
                                i === 4 && j === 4 && "animate-pulse bg-muted rounded-md mx-2 my-1 h-10", // Simula un evento en Jueves 11am
                            )}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};
