"use client"

import { customerBookingPath, customerServicesPath } from "@/app/paths"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export interface HeroSlideImage {
  id: string
  url: string
  caption: string | null
}

interface LandingHeroProps {
  slideImages?: HeroSlideImage[]
}

export default function LandingHero({ slideImages = [] }: LandingHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasSlides = slideImages.length > 0

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!hasSlides || slideImages.length < 2) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slideImages.length, hasSlides])

  return (
    <section className="px-1">
      <div className="relative rounded-3xl min-h-112 p-6 text-white overflow-hidden">

        {/* ── Background layer ─────────────────────────────────────── */}
        {hasSlides ? (
          <>
            {slideImages.map((img, i) => (
              <div
                key={img.id}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{ opacity: i === activeIndex ? 1 : 0, zIndex: 0 }}
              >
                <Image
                  src={img.url}
                  alt={img.caption ?? "Hero background"}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={i === 0}
                />
              </div>
            ))}
            {/* Dark gradient overlay — always on top of images */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.85))",
                zIndex: 1,
              }}
            />
          </>
        ) : (
          /* Fallback: original static background */
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url('/images/heroimg.jpg') center / cover",
              zIndex: 0,
            }}
          />
        )}

        {/* ── Foreground content (static) ─────────────────────────── */}
        <div className="relative flex flex-col gap-3 justify-center h-full min-h-100" style={{ zIndex: 2 }}>
          <div className="w-full flex items-center justify-center">
            <span className="h-6 w-47.5 inline-flex items-center gap-1 text-fuchsia-700 bg-fuchsia-50 px-2 py-1 rounded-full text-xs">
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.84507 11.3552L5.81107 11.4112C5.7923 11.4335 5.76888 11.4515 5.74245 11.4638C5.71602 11.4761 5.68722 11.4824 5.65807 11.4824C5.62892 11.4824 5.60012 11.4761 5.57369 11.4638C5.54727 11.4515 5.52384 11.4335 5.50507 11.4112L5.47107 11.3552L5.40207 11.1802L5.65807 11.2812L5.91307 11.1812L5.84507 11.3552ZM5.47107 0.299244C5.48546 0.261298 5.51106 0.228628 5.54446 0.205574C5.57786 0.18252 5.61749 0.170174 5.65807 0.170174C5.69866 0.170174 5.73828 0.18252 5.77168 0.205574C5.80508 0.228628 5.83068 0.261298 5.84507 0.299244L6.87707 2.91724C7.02793 3.29971 7.25579 3.64709 7.54651 3.93781C7.83723 4.22853 8.18461 4.45639 8.56707 4.60724L11.0111 5.57024L11.1121 5.82624L11.0121 6.08124L8.56707 7.04524L8.42407 7.10524C7.71669 7.42762 7.16207 8.012 6.87707 8.73524L5.91307 11.1792L5.65807 11.2802L5.40207 11.1802L4.43907 8.73524C4.15407 8.012 3.59945 7.42762 2.89207 7.10524L2.74907 7.04524L0.12907 6.01324C0.091124 5.99885 0.0584544 5.97325 0.0354006 5.93985C0.0123469 5.90645 0 5.86683 0 5.82624C0 5.78566 0.0123469 5.74604 0.0354006 5.71264C0.0584544 5.67923 0.091124 5.65364 0.12907 5.63924L0.30407 5.57024L2.74907 4.60724C3.47232 4.32224 4.05669 3.76762 4.37907 3.06024L4.43907 2.91724L5.47107 0.299244ZM5.36907 3.28524C4.9887 4.24913 4.24911 5.02779 3.30607 5.45724L3.11607 5.53724L2.38307 5.82724L3.11607 6.11624C3.62593 6.31739 4.08901 6.62117 4.47658 7.00873C4.86415 7.3963 5.16793 7.85938 5.36907 8.36924L5.65807 9.10124L5.94807 8.36924C6.1491 7.85948 6.45273 7.39645 6.84012 7.00889C7.22751 6.62133 7.69039 6.3175 8.20007 6.11624L8.93207 5.82724L8.20007 5.53724C7.23655 5.15735 6.45794 4.41853 6.02807 3.47624L5.94807 3.28624L5.65807 2.55224L5.36907 3.28524ZM11.1861 5.64024C11.224 5.65464 11.2567 5.68023 11.2797 5.71363C11.3028 5.74704 11.3151 5.78666 11.3151 5.82724C11.3151 5.86783 11.3028 5.90745 11.2797 5.94085C11.2567 5.97425 11.224 5.99985 11.1861 6.01424L11.0111 6.08224L11.1121 5.82624L11.0121 5.57124L11.1861 5.64024ZM11.0211 0.693244C11.2451 1.09424 11.6001 1.40924 12.0321 1.58024L12.4221 1.73424C12.4407 1.74162 12.4567 1.75443 12.468 1.77101C12.4793 1.7876 12.4853 1.80719 12.4853 1.82724C12.4853 1.8473 12.4793 1.86689 12.468 1.88348C12.4567 1.90006 12.4407 1.91287 12.4221 1.92024L12.3351 1.95424L12.0321 2.07424L11.8441 2.16024C11.4157 2.38258 11.0822 2.75232 10.9051 3.20124L10.7851 3.50424L10.7511 3.59124L10.7351 3.61924C10.7257 3.63057 10.7139 3.63968 10.7006 3.64594C10.6873 3.6522 10.6728 3.65544 10.6581 3.65544C10.6434 3.65544 10.6288 3.6522 10.6155 3.64594C10.6022 3.63968 10.5905 3.63057 10.5811 3.61924L10.5651 3.59124L10.5301 3.50424L10.4101 3.20124C10.2334 2.75265 9.90067 2.38296 9.47307 2.16024L9.28407 2.07024L8.89407 1.92024C8.87542 1.91287 8.85941 1.90006 8.84814 1.88348C8.83686 1.86689 8.83083 1.8473 8.83083 1.82724C8.83083 1.80719 8.83686 1.7876 8.84814 1.77101C8.85941 1.75443 8.87542 1.74162 8.89407 1.73424L8.98007 1.69924L9.28407 1.57924C9.71607 1.40924 10.0701 1.09424 10.2941 0.693244L10.6581 0.550244L11.0211 0.693244ZM10.5651 0.0632441C10.5724 0.0445919 10.5853 0.0285872 10.6018 0.017309C10.6184 0.0060307 10.638 0 10.6581 0C10.6781 0 10.6977 0.0060307 10.7143 0.017309C10.7309 0.0285872 10.7437 0.0445919 10.7511 0.0632441L10.9051 0.453244C10.9384 0.535911 10.9771 0.615911 11.0211 0.693244L10.6581 0.550244L10.2941 0.693244L10.3251 0.641244L10.4111 0.453244L10.5651 0.0632441ZM11.0841 7.01424C11.0901 6.99957 11.1004 6.98702 11.1135 6.97819C11.1267 6.96936 11.1422 6.96464 11.1581 6.96464C11.1739 6.96464 11.1894 6.96936 11.2026 6.97819C11.2158 6.98702 11.226 6.99957 11.2321 7.01424C11.4317 7.52109 11.7335 7.98144 12.1187 8.36663C12.5039 8.75182 12.9642 9.05362 13.4711 9.25324C13.4857 9.25927 13.4983 9.26952 13.5071 9.2827C13.516 9.29588 13.5207 9.31138 13.5207 9.32724C13.5207 9.34311 13.516 9.35861 13.5071 9.37179C13.4983 9.38496 13.4857 9.39522 13.4711 9.40124L13.4011 9.43124C12.91 9.6354 12.465 9.93614 12.0924 10.3156C11.7198 10.6951 11.4272 11.1455 11.2321 11.6402L11.2201 11.6622C11.2126 11.6713 11.2032 11.6785 11.1925 11.6835C11.1819 11.6885 11.1703 11.6911 11.1586 11.6911C11.1468 11.6911 11.1352 11.6885 11.1246 11.6835C11.114 11.6785 11.1046 11.6713 11.0971 11.6622L11.0841 11.6392C10.7067 10.6815 9.97203 9.90771 9.03507 9.48124L8.84507 9.40124C8.8304 9.39522 8.81785 9.38496 8.80902 9.37179C8.80018 9.35861 8.79547 9.34311 8.79547 9.32724C8.79547 9.31138 8.80018 9.29588 8.80902 9.2827C8.81785 9.26952 8.8304 9.25927 8.84507 9.25324C9.35192 9.05362 9.81226 8.75182 10.1975 8.36663C10.5826 7.98144 10.8844 7.52109 11.0841 7.01424ZM11.1581 8.79824C10.9947 8.98824 10.8181 9.16458 10.6281 9.32724C10.8181 9.49058 10.9947 9.66658 11.1581 9.85524C11.3214 9.66591 11.4974 9.48991 11.6861 9.32724C11.4971 9.16401 11.3206 8.98785 11.1581 8.79824Z" fill="#A800B7" />
              </svg>
              Premium Beauty Experience
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="font-family-seasons text-5xl mt-4">
              PolarisBooking
            </h1>
            <p className="text-sm mt-2 text-white/90">
              Where Beauty Meets Serenity
            </p>
            <p className="text-sm mt-2 max-w-xs">
              Indulge in luxurious treatments designed to rejuvenate your body and soul.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs">
              ⭐⭐⭐⭐⭐
              <span className="ml-2">4.9 · 100+ happy clients</span>
            </div>
          </div>
          <div className="flex gap-6 mt-6">
            <Link
              href={customerBookingPath()}
              className="py-2.5 px-4 rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white flex flex-row gap-2 items-center w-fit"
            >
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M11 1H9V0H8V1H4V0H3V1H1C0.734885 1.00033 0.480723 1.10579 0.293259 1.29326C0.105794 1.48072 0.000330774 1.73488 0 2V12C0.000330774 12.2651 0.105794 12.5193 0.293259 12.7067C0.480723 12.8942 0.734885 12.9997 1 13H11C11.2651 12.9997 11.5193 12.8942 11.7067 12.7067C11.8942 12.5193 11.9997 12.2651 12 12V2C11.9997 1.73488 11.8942 1.48072 11.7067 1.29326C11.5193 1.10579 11.2651 1.00033 11 1ZM1 2H3V3H4V2H8V3H9V2H11V4H1V2ZM1 5H3.5V8H1V5ZM7.5 12H4.5V9H7.5V12ZM7.5 8H4.5V5H7.5V8ZM8.5 12V9H11L11.0006 12H8.5Z" fill="white" />
              </svg>
              <span className="whitespace-nowrap text-sm">Book an appointment</span>
            </Link>

            <Link href={customerServicesPath()} className="py-2.5 px-4 justify-center text-center h-fit rounded-full bg-gray-50 text-gray-900 hover:bg-gray-100 flex items-center">
              <span className="text-sm">View our services</span>
            </Link>
          </div>

          {/* Slide indicator dots — only shown when multiple images */}
          {slideImages.length > 1 && (
            <div className="flex items-center gap-2 mt-4">
              {slideImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-5 h-2 bg-white"
                      : "w-2 h-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
