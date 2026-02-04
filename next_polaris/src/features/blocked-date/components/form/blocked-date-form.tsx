"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { isAxiosError } from "@/lib/utils"
import { BlockedDateInput, BlockedDateInputSchema } from "../../utils/validation"
import { useCreateBlockedDate } from "../../client/use-blocked-date"

export default function BlockedDateForm() {
  const form = useForm<BlockedDateInput>({
    resolver: zodResolver(BlockedDateInputSchema),
    defaultValues: { date: "", reason: "" },
  })

  const mutation = useCreateBlockedDate()

  const onSubmit = async (data: BlockedDateInput) => {
    await mutation.mutateAsync(data)
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <div className="space-y-1">
              <Label className="flex text-sm font-normal text-foreground">Select date</Label>
              <Input className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg" type="date" {...field} />
              {form.formState.errors.date && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <div className="space-y-1">
              <Label className="flex text-sm font-normal text-foreground">Reason (optional)</Label>
              <Textarea className="h-20 bg-white shadow-none border-[#E2E8F0] rounded-lg" {...field} value={field.value ?? ""} />
              {form.formState.errors.reason && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.reason.message}
                </p>
              )}
            </div>
          )}
        />

        {mutation.isError && (
          <p className="text-red-500 text-sm">
            {isAxiosError(mutation.error)
              ? mutation.error.response?.data?.message
              : "Failed to block date"}
          </p>
        )}

        <Button className="w-full bg-fuchsia-700 hover:bg-fuchsia-600">
          Block date
        </Button>

      </form>
    </Form>
  )
}
