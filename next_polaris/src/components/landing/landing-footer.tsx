import { customerBookingPath, customerServicesPath, signInPath } from "@/app/paths"
import { Mail, MapPin, Phone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PolicyBottomSheet } from "@/components/policy-bottom-sheet"


export const SOCIAL_ICONS = {
  facebook: (fillColor?: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 12.3038C22 6.74719 17.5229 2.24268 12 2.24268C6.47715 2.24268 2 6.74719 2 12.3038C2 17.3255 5.65684 21.4879 10.4375 22.2427V15.2121H7.89844V12.3038H10.4375V10.0872C10.4375 7.56564 11.9305 6.1728 14.2146 6.1728C15.3088 6.1728 16.4531 6.36931 16.4531 6.36931V8.84529H15.1922C13.95 8.84529 13.5625 9.6209 13.5625 10.4166V12.3038H16.3359L15.8926 15.2121H13.5625V22.2427C18.3432 21.4879 22 17.3257 22 12.3038Z" fill={fillColor || "white"} />
    </svg>
  ),
  instagram: (fillColor?: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M16 3.24268H8C5.23858 3.24268 3 5.48126 3 8.24268V16.2427C3 19.0041 5.23858 21.2427 8 21.2427H16C18.7614 21.2427 21 19.0041 21 16.2427V8.24268C21 5.48126 18.7614 3.24268 16 3.24268ZM19.25 16.2427C19.2445 18.0353 17.7926 19.4872 16 19.4927H8C6.20735 19.4872 4.75549 18.0353 4.75 16.2427V8.24268C4.75549 6.45003 6.20735 4.99817 8 4.99268H16C17.7926 4.99817 19.2445 6.45003 19.25 8.24268V16.2427ZM16.75 8.49268C17.3023 8.49268 17.75 8.04496 17.75 7.49268C17.75 6.9404 17.3023 6.49268 16.75 6.49268C16.1977 6.49268 15.75 6.9404 15.75 7.49268C15.75 8.04496 16.1977 8.49268 16.75 8.49268ZM12 7.74268C9.51472 7.74268 7.5 9.7574 7.5 12.2427C7.5 14.728 9.51472 16.7427 12 16.7427C14.4853 16.7427 16.5 14.728 16.5 12.2427C16.5027 11.0484 16.0294 9.90225 15.1849 9.05776C14.3404 8.21327 13.1943 7.74002 12 7.74268ZM9.25 12.2427C9.25 13.7615 10.4812 14.9927 12 14.9927C13.5188 14.9927 14.75 13.7615 14.75 12.2427C14.75 10.7239 13.5188 9.49268 12 9.49268C10.4812 9.49268 9.25 10.7239 9.25 12.2427Z" fill={fillColor || "white"} />
    </svg>
  ),
  linkedin: (fillColor?: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3.24268C3.67157 3.24268 3 3.91425 3 4.74268V19.7427C3 20.5711 3.67157 21.2427 4.5 21.2427H19.5C20.3284 21.2427 21 20.5711 21 19.7427V4.74268C21 3.91425 20.3284 3.24268 19.5 3.24268H4.5ZM8.52076 7.2454C8.52639 8.20165 7.81061 8.79087 6.96123 8.78665C6.16107 8.78243 5.46357 8.1454 5.46779 7.24681C5.47201 6.40165 6.13998 5.72243 7.00764 5.74212C7.88795 5.76181 8.52639 6.40728 8.52076 7.2454ZM12.2797 10.0044H9.75971H9.7583V18.5643H12.4217V18.3646C12.4217 17.9847 12.4214 17.6047 12.4211 17.2246C12.4203 16.2108 12.4194 15.1959 12.4246 14.1824C12.426 13.9363 12.4372 13.6804 12.5005 13.4455C12.7381 12.568 13.5271 12.0013 14.4074 12.1406C14.9727 12.2291 15.3467 12.5568 15.5042 13.0898C15.6013 13.423 15.6449 13.7816 15.6491 14.129C15.6605 15.1766 15.6589 16.2242 15.6573 17.2719C15.6567 17.6417 15.6561 18.0117 15.6561 18.3815V18.5629H18.328V18.3576C18.328 17.9056 18.3278 17.4537 18.3275 17.0018C18.327 15.8723 18.3264 14.7428 18.3294 13.6129C18.3308 13.1024 18.276 12.599 18.1508 12.1054C17.9638 11.3713 17.5771 10.7638 16.9485 10.3251C16.5027 10.0129 16.0133 9.81178 15.4663 9.78928C15.404 9.78669 15.3412 9.7833 15.2781 9.77989C14.9984 9.76477 14.7141 9.74941 14.4467 9.80334C13.6817 9.95662 13.0096 10.3068 12.5019 10.9241C12.4429 10.9949 12.3852 11.0668 12.2991 11.1741L12.2797 11.1984V10.0044ZM5.68164 18.5671H8.33242V10.01H5.68164V18.5671Z" fill={fillColor || "white"} />
    </svg>
  ),
  youtube: (fillColor?: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.593 7.20301C21.4791 6.78041 21.2565 6.39501 20.9474 6.08518C20.6383 5.77534 20.2534 5.55187 19.831 5.43701C18.265 5.00701 12 5.00001 12 5.00001C12 5.00001 5.73602 4.99301 4.16902 5.40401C3.74695 5.52415 3.36285 5.75078 3.05359 6.06214C2.74433 6.3735 2.52031 6.75913 2.40302 7.18201C1.99002 8.74801 1.98602 11.996 1.98602 11.996C1.98602 11.996 1.98202 15.26 2.39202 16.81C2.62202 17.667 3.29702 18.344 4.15502 18.575C5.73702 19.005 11.985 19.012 11.985 19.012C11.985 19.012 18.25 19.019 19.816 18.609C20.2385 18.4943 20.6238 18.2714 20.9337 17.9622C21.2436 17.653 21.4674 17.2682 21.583 16.846C21.997 15.281 22 12.034 22 12.034C22 12.034 22.02 8.76901 21.593 7.20301ZM9.99603 15.005L10.001 9.00501L15.208 12.01L9.99603 15.005Z" fill={fillColor || "white"} />
    </svg>
  ),
  tiktok: (fillColor?: string) => fillColor === 'black' ?
    (
      <Image
        src="/tiktokIcon.svg"
        alt="Tiktok Logo"
        width={20}
        height={20}
        priority
      />
    ) : (
      <Image
        src="/tiktokIcon.svg"
        alt="Tiktok Logo"
        className="bg-white rounded-sm"
        width={20}
        height={20}
        priority
      />
    ),
  x: (fillColor?: string) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.1761 4.24268H19.9362L13.9061 11.0201L21 20.2427H15.4456L11.0951 14.6493L6.11723 20.2427H3.35544L9.80517 12.9935L3 4.24268H8.69545L12.6279 9.3553L17.1761 4.24268ZM16.2073 18.6181H17.7368L7.86441 5.78196H6.2232L16.2073 18.6181Z" fill={fillColor || "black"} />
    </svg>
  ),
  whatsapp: (fillColor?: string) => fillColor === 'black' ? (null) : (
    <Image
      src="/whatsapp.svg"
      alt="Whatsapp Logo"
      className="text-white/70"
      width={15}
      height={15}
      priority
    />
  ),
}

export default function LandingFooter() {
  return (
    <footer className="bg-black space-y-12 text-white px-6 py-12">
      <Image
        src="/images/polarisicon.png"
        alt="Company Logo"
        width={100}
        height={50}
        priority
      />

      <div className="space-y-6 text-sm">
        <div className="space-y-3">
          <p className="font-medium mb-2">Quick links</p>
          <ul className="space-y-2 text-white/70">
            <li>
              <Link href={customerServicesPath()}>Our services</Link>
            </li>
            <li>
              <Link href={customerBookingPath()}>Book appointment</Link>
            </li>
            <li>
              <Link href={signInPath()}>Staff login</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-medium mb-2">Contact us</p>
          <div className="space-y-2 text-white/70">
            <p className="text-white/70 flex gap-2 items-center">
              <Phone size={16} className="text-white" />
              <span>+233 24 070 2107</span> <span>|</span> <span>+233 50 485 1482</span>
            </p>
            <p className="text-white/70 flex gap-2 items-center">
              <Mail size={16} className="text-white" />
              <span>polarisbeautylounge@gmail.com</span>
            </p>
            <p className="text-white/70 flex gap-2 items-center">
              <MapPin size={16} className="text-white" />
              <Link href="https://maps.app.goo.gl/polaris" target="_blank" rel="noopener noreferrer">
                Click Here To View Location
              </Link>
            </p>
            <p className="text-white/70 flex gap-2 items-center">
              {SOCIAL_ICONS.whatsapp()}
              <Link href="https://wa.me/+233504851482" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </Link>
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Follow Us</p>
          <div className="flex flex-wrap gap-4">
            <Link href="https://www.facebook.com/share/17zoSqtEfT/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.facebook()}
              <span>Facebook</span>
            </Link>
            <Link href="https://www.instagram.com/polarisbeautylounge?igsh=MWJ4dzk2bDY5YmFrcQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.instagram()}
              <span>Instagram</span>
            </Link>
            <Link href="https://www.tiktok.com/@polarisbeautylounge?_r=1&_t=ZS-93mfvZstJqL" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.tiktok()}
              <span>TikTok</span>
            </Link>
            {/* <p className="text-white/70 flex gap-2 items-center">
              {SOCIAL_ICONS.linkedin()}
              <span>LinkedIn</span>
            </p>
            <p className="text-white/70 flex gap-2 items-center">
              {SOCIAL_ICONS.youtube()}
              <span>Youtube</span>
            </p>
            <p className="text-white/70 flex gap-2 items-center">
              {SOCIAL_ICONS.x()}
              <span>X</span>
            </p> */}
          </div>
        </div>
      </div>

      <div className="mt-10 text-xs text-white/70 flex flex-col gap-3">
        <PolicyBottomSheet triggerLabel="Privacy Policy" title="Privacy Policy">
          <p className="mb-4 text-sm">
            Polaris, we respect your privacy and committed to protecting your personal information.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-sm mb-2">When you book an appointment, we collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Selected service and appointment details</li>
                <li>Payment confirmation reference (via Paystack)</li>
              </ul>
              <p className="text-sm mt-2">
                We do not store your card details. Payments are securely processed by Paystack.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-sm mb-2">We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Process and manage your bookings</li>
                <li>Send booking confirmations and updates</li>
                <li>Communicate appointment reminders or changes</li>
                <li>Improve our services and customer experience</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Payment Security</h3>
              <p className="text-sm">
                All payments are securely processed by Paystack. We do not store debit/credit card details on our servers.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Data Storage & Protection</h3>
              <p className="text-sm">
                Your booking information is stored securely using encrypted database systems. Access is restricted to authorized staff only.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Data Sharing</h3>
              <p className="text-sm mb-2">We do not sell, rent, or trade your personal information.</p>
              <p className="text-sm mb-2">We may share limited information with:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Payment processors (Paystack)</li>
                <li>Email delivery providers (for booking confirmations)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Your Rights</h3>
              <p className="text-sm mb-2">You may request to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>View your stored information</li>
                <li>Correct inaccurate details</li>
                <li>Request deletion of your booking data (where legally permitted)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Contact Us</h3>
              <p className="text-sm">
                If you have any privacy-related concerns, please contact us at:<br />
                <strong>help@polaris.com</strong><br />
                <strong>+233 55 623 3900</strong>
              </p>
            </div>
          </div>
        </PolicyBottomSheet>
        <PolicyBottomSheet triggerLabel="Terms of Service" title="Terms of Service">
          <p className="mb-4 text-sm">
            By using our booking system, you agree to the following terms:
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Booking Policy</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>All appointments must be booked at least 24 hours in advance.</li>
                <li>A valid name, email, and phone number are required.</li>
                <li>Payment is required before admin approval.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Appointment Confirmation</h3>
              <p className="text-sm">
                After payment, your booking will be marked as pending until approved by salon staff. You will receive a confirmation email once approved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Cancellations</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Cancellations are allowed up to 24 hours before your appointment.</li>
                <li>Late cancellations (within 24 hours) may not be eligible for refunds.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. No-Show Policy</h3>
              <p className="text-sm">
                Failure to attend your appointment without prior cancellation may result in forfeiture of payment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Pricing</h3>
              <p className="text-sm">
                All prices are displayed in Ghana Cedis (GHS) and are subject to change without prior notice. Price changes do not affect confirmed bookings.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Service Refusal</h3>
              <p className="text-sm">
                We reserve the right to refuse service in cases of inappropriate behavior, safety concerns, or violation of salon policies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Modifications</h3>
              <p className="text-sm">
                We may update these terms at any time. Continued use of the booking system indicates acceptance of any updates.
              </p>
            </div>
          </div>
        </PolicyBottomSheet>
      </div>

      <p className="text-left text-xs text-white/50 mt-4">
        &copy; {new Date().getFullYear()} PolarisBooking. All rights reserved.
      </p>
    </footer>
  )
}