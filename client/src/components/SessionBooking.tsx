"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // <-- Important!
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // <-- Important!
import { Label } from "@/components/ui/label"; // Label might not be needed anymore
interface SessionBookingProps {
  mentorId: number;
  mentorName: string;
}

const SessionBooking: React.FC<SessionBookingProps> = ({
  mentorId,
  mentorName,
}) => {
  // State to hold the selected date and time from the user
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const handleBooking = async () => {
    if (!date) {
      alert("Please select a date and time.");
      return;
    }

    setIsSubmitting(true);
    setBookingStatus("idle");
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          scheduled_time: date.toISOString(), // Convert date to standard format
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      setBookingStatus("success");
    } catch (error) {
      setBookingStatus("error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a Session with {mentorName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {bookingStatus === "success" && (
          <p className="text-green-600 font-semibold text-center pt-4">
            Success! Your request has been sent to the mentor for confirmation.
          </p>
        )}
        {bookingStatus === "error" && (
          <p className="text-red-600 font-semibold text-center pt-4">
            Error: Could not book the session. Please try again.
          </p>
        )}

        <p className="text-xs text-muted-foreground pt-1 ">
          Please use a 24-hour format (e.g., 14:30 for 2:30 PM).
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleBooking}
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Requesting..." : "Request Session"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SessionBooking;
