import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SerializedService } from "@/features/service/types"

type Props = {
  services: SerializedService[]
  selectedServiceId: string | null
  onSelectService: (service: SerializedService) => void
  onNext: () => void
  canProceed: boolean
}

export default function SelectServiceStep({
  services,
  selectedServiceId,
  onSelectService,
  onNext,
  canProceed,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Choose your service</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Select data</label>
        <Select
          value={selectedServiceId || ""}
          onValueChange={(value) => {
            const service = services.find((s) => s.id === value)
            if (service) onSelectService(service)
          }}
        >
          <SelectTrigger className="w-full min-h-12 bg-gray-50 border-gray-200 rounded-lg">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent className="mt-12 ">
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id} className="uppercase">
                <div className="flex items-center justify-between w-full gap-4">
                  <span className="truncate">{service.name}</span>
                  <span className="bg-gray-300 rounded-full w-1 h-1"/>
                  <span className=" text-fuchsia-500">
                    GHS {Number(service.price).toFixed(2)}
                  </span>
                </div>
              </SelectItem>

            ))}
          </SelectContent>

        </Select>
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
      >
        Continue
      </Button>
    </div>
  )
}