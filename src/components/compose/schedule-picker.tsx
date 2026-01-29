"use client";

import { useMemo, useEffect } from "react";
import { CalendarIcon, X, Clock, Zap } from "lucide-react";
import { format, addMinutes, addHours, addDays, isBefore, setHours, setMinutes, nextMonday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MIN_SCHEDULE_MINUTES_AHEAD } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SchedulePickerProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
  onValidChange?: (valid: boolean) => void;
}

const QUICK_PRESETS = [
  {
    label: "In 1 hour",
    icon: Clock,
    getDate: () => addHours(new Date(), 1),
  },
  {
    label: "Tomorrow 9 AM",
    icon: Zap,
    getDate: () => {
      const d = addDays(new Date(), 1);
      return setMinutes(setHours(d, 9), 0);
    },
  },
  {
    label: "Tomorrow 6 PM",
    icon: Zap,
    getDate: () => {
      const d = addDays(new Date(), 1);
      return setMinutes(setHours(d, 18), 0);
    },
  },
  {
    label: "Next Mon 9 AM",
    icon: CalendarIcon,
    getDate: () => {
      const d = nextMonday(new Date());
      return setMinutes(setHours(d, 9), 0);
    },
  },
];

export function SchedulePicker({ date, onChange, onValidChange }: SchedulePickerProps) {
  const minDate = useMemo(
    () => addMinutes(new Date(), MIN_SCHEDULE_MINUTES_AHEAD),
    []
  );

  const minuteOptions = useMemo(() => {
    const options: string[] = [];
    for (let m = 0; m < 60; m += 5) {
      options.push(m.toString().padStart(2, "0"));
    }
    return options;
  }, []);

  const hour12 = date
    ? date.getHours() % 12 === 0
      ? 12
      : date.getHours() % 12
    : 12;
  const minute = date
    ? (Math.floor(date.getMinutes() / 5) * 5).toString().padStart(2, "0")
    : "00";
  const ampm = date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM";

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  function handleDateSelect(selectedDay: Date | undefined) {
    if (!selectedDay) return;
    const hours = date ? date.getHours() : 0;
    const mins = date ? date.getMinutes() : 0;
    const newDate = new Date(selectedDay);
    newDate.setHours(hours, mins, 0, 0);
    onChange(newDate);
  }

  function updateTime(
    newHour12?: number,
    newMinute?: string,
    newAmpm?: string
  ) {
    const base = date || new Date();
    const updated = new Date(base);

    const h = newHour12 ?? hour12;
    const m = parseInt(newMinute ?? minute, 10);
    const ap = newAmpm ?? ampm;

    let hour24 = h;
    if (ap === "AM" && h === 12) hour24 = 0;
    else if (ap === "PM" && h !== 12) hour24 = h + 12;

    updated.setHours(hour24, m, 0, 0);

    if (!date) {
      const today = new Date();
      updated.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    }

    onChange(updated);
  }

  function handleClear() {
    onChange(null);
  }

  const isValidSchedule =
    date && !isBefore(date, addMinutes(new Date(), MIN_SCHEDULE_MINUTES_AHEAD));

  useEffect(() => {
    onValidChange?.(!date || !!isValidSchedule);
  }, [date, isValidSchedule, onValidChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Schedule</span>
        {date && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClear}
            type="button"
            className="gap-1 text-muted-foreground"
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick presets */}
      {!date && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              type="button"
              className="gap-1.5 text-xs"
              onClick={() => onChange(preset.getDate())}
            >
              <preset.icon className="size-3" />
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="size-4" />
            {date
              ? format(date, "MMM d, yyyy 'at' h:mm a")
              : "Pick a date & time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={handleDateSelect}
            disabled={(day) => isBefore(day, addMinutes(new Date(), -1440))}
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              {/* Hour selector */}
              <Select
                value={hour12.toString()}
                onValueChange={(v) => updateTime(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground">:</span>

              {/* Minute selector */}
              <Select
                value={minute}
                onValueChange={(v) => updateTime(undefined, v)}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM selector */}
              <Select
                value={ampm}
                onValueChange={(v) => updateTime(undefined, undefined, v)}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timezone && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Timezone: {timezone}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {date && !isValidSchedule && (
        <p className="text-xs text-destructive">
          Schedule must be at least {MIN_SCHEDULE_MINUTES_AHEAD} minutes from
          now.
        </p>
      )}
    </div>
  );
}
