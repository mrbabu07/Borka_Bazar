export default function CheckoutProgress({ currentStep }) {
  const steps = [
    { number: 1, label: 'Address', icon: '📍' },
    { number: 2, label: 'Review', icon: '📋' },
    { number: 3, label: 'Payment', icon: '💳' },
    { number: 4, label: 'Done', icon: '✓' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition ${
                  step.number <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number < currentStep ? '✓' : step.icon}
              </div>

              {/* Step Label */}
              <div className="ml-3">
                <p className={`text-sm font-semibold ${step.number <= currentStep ? 'text-primary-600' : 'text-gray-600'}`}>
                  {step.label}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition ${
                    step.number < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
