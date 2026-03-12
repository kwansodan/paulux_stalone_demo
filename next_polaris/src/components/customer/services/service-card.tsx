import { customerBookingPath } from "@/app/paths";
import { SerializedService } from "@/features/service/types"
import { formatDurationShort } from "@/features/service/utils/helpers"
import { ArrowRight, Timer } from "lucide-react";
import Image from "next/image"
import Link from "next/link";


export const SERVICE_IMAGES: Record<string, string> = {
  'bridal package': '/images/bridalpackage.jpg',
  'classic manicure': '/images/classicmanicure.jpg',
  'deep tissue massage': '/images/deeptissuemassage.jpg',
  'express blowout': '/images/expressblowout.jpg',
  'gel polish': '/images/gelpolish.jpg',
  'hair styling': '/images/hairstyling.jpg',
  'luxury pedicure': '/images/luxurypedicure.jpg',
  'signature facial': '/images/signaturefacial.jpg',
};

export const DEFAULT_SERVICE_IMAGE = '/images/placeholderimage.png';

export default function ServiceCard({
  service,
}: {
  service: SerializedService
}) {

  const getServiceImage = (service: SerializedService): string => {
    if (service.imageUrl) return service.imageUrl;
    const normalizedName = service.name.toLowerCase().trim();
    return SERVICE_IMAGES[normalizedName] || DEFAULT_SERVICE_IMAGE;
  };

  const imageUrl = getServiceImage(service);

  return (
    <div className="relative w-full h-125 rounded-3xl overflow-hidden shadow-lg group">
      <Image
        src={imageUrl}
        alt={service.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute top-4 right-4 z-10">
        <span className="flex items-center justify-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
          <Timer className="inline-block h-4 w-4 mr-1" />
          {formatDurationShort(service.durationMinutes)}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <h3 className="font-semibold text-xl">
          {service.name}
        </h3>

        <p className="text-sm text-white/80 mt-2 line-clamp-2">
          {service.description || ''}
        </p>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="font-semibold">
            GHS {Number(service.price).toFixed(2)}
          </span>
          <Link
            href={customerBookingPath(service.id)}
            className="py-2.5 px-4 bg-fuchsia-600 flex gap-2 items-center justify-center hover:bg-fuchsia-700 rounded-full transition-colors"
          >
            <ArrowRight className="h-5 w-5 text-white" />
            <span>Book Now</span>
          </Link>
        </div>
      </div>
    </div>
  )
}