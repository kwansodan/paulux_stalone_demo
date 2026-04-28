"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ServiceFormInput, ServiceInputSchema } from "@/features/service/utils/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "../toggle-switch"
import { useCreateService } from "../../client/use-service"
import { isAxiosError } from "@/lib/utils"
import ImageUpload from "@/components/ui/image-upload"
import { useGetServiceCategories } from "@/features/service-category/client/use-service-category"

export default function CreateServiceForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess: () => void
}) {
  const { data: categories = [] } = useGetServiceCategories()

  const form = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceInputSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 60,
      price: 0,
      maxBookingsPerDay: null,
      latestBookingTime: null,
      minDepositFixed: 0,
      isActive: true,
      imageUrl: null,
      categoryId: null,
    },
  })

  const mutation = useCreateService()

  const onSubmit = async (data: ServiceFormInput) => {
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
                <Label className="text-sm font-normal text-foreground">Service/product image</Label>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.imageUrl.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="flex text-sm font-normal text-foreground">Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Service name" className="h-12 bg-white shadow-none border border-[#E2E8F0] rounded-lg" {...field} />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
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
                <Textarea placeholder="Service description" className="h-20 bg-white shadow-none border border-[#E2E8F0] rounded-lg" rows={8} {...field} value={field.value ?? ""} />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Duration & Price */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-foreground">Duration (mins)</Label>
                  <Input
                    className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                    type="number"
                    {...field}
                  />
                  {form.formState.errors.durationMinutes && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.durationMinutes.message}
                    </p>
                  )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-foreground">Price (GHS)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                    {...field}
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-semibold text-[16px]">Booking Constraints</p>

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-foreground">Service category</Label>
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
                          {cat.name} <span className="text-gray-400 text-xs ml-1">(cap: {cat.capacity})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {/* Booking constraints */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="maxBookingsPerDay"
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label className="text-sm font-normal text-foreground">Max bookings per day</Label>
                    <Input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    {form.formState.errors.maxBookingsPerDay && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.maxBookingsPerDay.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="latestBookingTime"
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label className="text-sm font-normal text-foreground">Latest booking time</Label>
                    <Input
                      type="time"
                      className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
                    />
                    {form.formState.errors.latestBookingTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.latestBookingTime.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>


          <div className="flex flex-col gap-4">

            <p className="font-semibold text-[16px]">Payment Settings</p>

            {/* Payment */}
            <FormField
              control={form.control}
              name="minDepositFixed"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-foreground">Minimum deposit (GHS)</Label>
                  <Input className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg" step="0.01" type="number" min={0} {...field} />
                  {form.formState.errors.minDepositFixed && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.minDepositFixed.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>


          {/* Active Toggle */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <div className="flex gap-2">
                <ToggleSwitch
                  // label="Active (visible to clients)"
                  checked={field.value}
                  onChecked={() => field.onChange(true)}
                  onUnchecked={() => field.onChange(false)}
                />
                <Label className="text-sm font-semi-bold text-foreground">Active (visible to clients)</Label>
              </div>
            )}
          />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(mutation.error)
              ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
              : "Failed to create service"}
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
