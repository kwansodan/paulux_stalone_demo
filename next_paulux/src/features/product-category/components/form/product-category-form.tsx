"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormField } from "@/components/ui/form"
import { isAxiosError } from "@/lib/utils"
import {
  useCreateProductCategory,
  useUpdateProductCategory,
  SerializedProductCategory,
} from "../../client/use-product-category"

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

type CategoryFormInput = z.input<typeof CategorySchema>

interface Props {
  category?: SerializedProductCategory
  onCancel: () => void
  onSuccess: () => void
}

export default function ProductCategoryForm({ category, onCancel, onSuccess }: Props) {
  const isEditing = !!category

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { name: category?.name ?? "" },
  })

  const createMutation = useCreateProductCategory()
  const updateMutation = useUpdateProductCategory()
  const mutation = isEditing ? updateMutation : createMutation

  const onSubmit = async (data: CategoryFormInput) => {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: category.id, name: data.name })
    } else {
      await createMutation.mutateAsync({ name: data.name })
    }
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-4 px-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Category name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Hair Care, Skincare, Tools"
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
