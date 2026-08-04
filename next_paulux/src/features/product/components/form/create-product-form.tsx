"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductFormInput, ProductInputSchema } from "@/features/product/utils/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/features/service/components/toggle-switch"
import { useCreateProduct } from "../../client/use-product"
import { isAxiosError } from "@/lib/utils"
import ImageUpload from "@/components/ui/image-upload"
import { useGetProductCategories } from "@/features/product-category/client/use-product-category"

export default function CreateProductForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess: () => void
}) {
  const { data: categories = [] } = useGetProductCategories()

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(ProductInputSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      isActive: true,
      imageUrl: null,
      categoryId: null,
      trackStock: false,
      lowStockThreshold: 5,
    },
  })

  const mutation = useCreateProduct()

  const onSubmit = async (data: ProductFormInput) => {
    await mutation.mutateAsync(data)
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-4 overflow-y-auto px-1">

          {/* Image */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">Product image</Label>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </div>
            )}
          />

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="flex text-sm font-normal text-foreground">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Product name"
                  className="h-12 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">Description</Label>
                <Textarea
                  placeholder="Product description"
                  className="h-20 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
                  rows={4}
                  {...field}
                  value={field.value ?? ""}
                />
              </div>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Price (GHS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.price && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
                )}
              </div>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">Category</Label>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Active Toggle */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <ToggleSwitch
                  checked={field.value}
                  onChecked={() => field.onChange(true)}
                  onUnchecked={() => field.onChange(false)}
                />
                <Label className="text-sm font-normal text-foreground">Active</Label>
              </div>
            )}
          />

          {/* Stock tracking */}
          <FormField
            control={form.control}
            name="trackStock"
            render={({ field }) => (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <div className="flex gap-2.5 items-center">
                  <ToggleSwitch
                    checked={field.value ?? false}
                    onChecked={() => field.onChange(true)}
                    onUnchecked={() => field.onChange(false)}
                  />
                  <div>
                    <Label className="text-sm font-medium text-foreground">Track inventory</Label>
                    <p className="text-xs text-gray-400">Enable stock quantity tracking and low-stock alerts</p>
                  </div>
                </div>

                {field.value && (
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field: tf }) => (
                      <div className="space-y-1 pt-1">
                        <Label className="text-xs font-normal text-gray-600">Low stock alert threshold</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-9 bg-white shadow-none border-[#E2E8F0] rounded-lg text-sm"
                          {...tf}
                        />
                        <p className="text-xs text-gray-400">Alert when stock falls to or below this number</p>
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center mt-2">
            {isAxiosError(mutation.error)
              ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
              : "Failed to create product"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button className="shadow-none" variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-fuchsia-700 hover:bg-fuchsia-600">
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
