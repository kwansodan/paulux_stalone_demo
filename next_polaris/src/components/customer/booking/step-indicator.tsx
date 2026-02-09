export type Step = {
  number: number
  label: string
}

export default function StepIndicator({ currentStep, steps }: { currentStep: number, steps: Step[] }) {

  return (
    <div className="w-full">
      {/* Step circles and connectors */}
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Left connector line */}
            {index > 0 ? (
              <div
                className={`
                  flex-1 h-0.5
                  ${step.number <= currentStep ? "bg-fuchsia-600" : "bg-gray-300"}
                `}
              />
            ): (
              <div className="flex-1" >
                {/* Empty space for alignment */}
              </div>
            )}

            {/* Circle */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                ${step.number <= currentStep
                  ? "bg-fuchsia-600 text-white"
                  : "bg-gray-300 text-gray-600"
                }
              `}
            >
              {step.number}
            </div>

            {/* Right connector line */}
            {index < steps.length - 1 ? (
              <div
                className={`
                  flex-1 h-0.5
                  ${step.number < currentStep ? "bg-fuchsia-600" : "bg-gray-300"}
                `}
              />
            ): (
              <div className="flex-1" >
                {/* Empty space for alignment */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`
              text-xs font-medium flex-1 text-center
              ${step.number === currentStep ? "text-fuchsia-600" : "text-gray-500"}
            `}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  )
}