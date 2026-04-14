"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormField } from "@/components/ui/form"
import { isAxiosError } from "@/lib/utils"
import { useCreateServiceCategory, useUpdateServiceCategory } from "../../client/use-service-category"
import { SerializedServiceCategory } from "@/features/service/types"

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  capacity: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v >= 1, "Capacity must be a whole number ≥ 1"),
})

type CategoryFormInput = z.input<typeof CategorySchema>

interface Props {
  category?: SerializedServiceCategory
  onCancel: () => void
  onSuccess: () => void
}

export default function CategoryForm({ category, onCancel, onSuccess }: Props) {
  const isEditing = !!category

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      capacity: category?.capacity ?? 1,
    },
  })

  const createMutation = useCreateServiceCategory()
  const updateMutation = useUpdateServiceCategory()
  const mutation = isEditing ? updateMutation : createMutation

  const onSubmit = async (data: CategoryFormInput) => {
    const parsed = CategorySchema.parse(data)
    if (isEditing) {
      await updateMutation.mutateAsync({ id: category.id, ...parsed })
    } else {
      await createMutation.mutateAsync(parsed)
    }
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-4 px-1">

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Category name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Hair, Nails, Skin"
                  className="h-12 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Capacity */}
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Concurrent booking capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  className="h-12 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of bookings that can overlap at the same time for services in this category.
                </p>
                {form.formState.errors.capacity && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.capacity.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center mt-2">
            {isAxiosError(mutation.error)
              ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
              : `Failed to ${isEditing ? "update" : "create"} category`}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button className="shadow-none" variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-fuchsia-700 hover:bg-fuchsia-600"
          >
            {mutation.isPending
              ? isEditing ? "Saving..." : "Creating..."
              : isEditing ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
