import { useState } from "react";

export default function SizeGuide({ isOpen, onClose, category = "burka" }) {
  const [activeTab, setActiveTab] = useState("chart");
  const [measurements, setMeasurements] = useState({
    bust: "",
    waist: "",
    hips: "",
    height: "",
  });
  const [recommendedSize, setRecommendedSize] = useState(null);

  const sizeCharts = {
    burka: [
      { size: "S", bust: "32-34", waist: "26-28", hips: "34-36", height: "5'0\"-5'3\"" },
      { size: "M", bust: "36-38", waist: "30-32", hips: "38-40", height: "5'3\"-5'6\"" },
      { size: "L", bust: "40-42", waist: "34-36", hips: "42-44", height: "5'6\"-5'9\"" },
      { size: "XL", bust: "44-46", waist: "38-40", hips: "46-48", height: "5'9\"-6'0\"" },
      { size: "XXL", bust: "48-50", waist: "42-44", hips: "50-52", height: "6'0\"-6'3\"" },
    ],
    abaya: [
      { size: "S", bust: "34-36", waist: "28-30", hips: "36-38", height: "5'0\"-5'3\"" },
      { size: "M", bust: "38-40", waist: "32-34", hips: "40-42", height: "5'3\"-5'6\"" },
      { size: "L", bust: "42-44", waist: "36-38", hips: "44-46", height: "5'6\"-5'9\"" },
      { size: "XL", bust: "46-48", waist: "40-42", hips: "48-50", height: "5'9\"-6'0\"" },
    ],
  };

  const chart = sizeCharts[category] || sizeCharts.burka;

  const calculateSize = () => {
    const { bust, waist, hips, height } = measurements;
    
    if (!bust || !waist || !hips || !height) {
      alert("Please fill in all measurements");
      return;
    }

    const bustNum = parseFloat(bust);
    const waistNum = parseFloat(waist);
    const hipsNum = parseFloat(hips);
    const heightNum = parseFloat(height);

    // Simple size recommendation logic
    let size = "M"; // default

    if (bustNum <= 34 && waistNum <= 28 && hipsNum <= 36) {
      size = "S";
    } else if (bustNum <= 38 && waistNum <= 32 && hipsNum <= 40) {
      size = "M";
    } else if (bustNum <= 42 && waistNum <= 36 && hipsNum <= 44) {
      size = "L";
    } else if (bustNum <= 46 && waistNum <= 40 && hipsNum <= 48) {
      size = "XL";
    } else {
      size = "XXL";
    }

    setRecommendedSize(size);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-950 dark:bg-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-display text-2xl text-black dark:text-white">Size Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab("chart")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "chart"
                  ? "border-black text-black font-medium dark:border-white dark:text-white"
                  : "border-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Size Chart
            </button>
            <button
              onClick={() => setActiveTab("finder")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "finder"
                  ? "border-black text-black font-medium dark:border-white dark:text-white"
                  : "border-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Size Finder
            </button>
            <button
              onClick={() => setActiveTab("measure")}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === "measure"
                  ? "border-black text-black font-medium dark:border-white dark:text-white"
                  : "border-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              How to Measure
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Size Chart Tab */}
          {activeTab === "chart" && (
            <div>
              <p className="text-gray-600 mb-6 dark:text-gray-300">
                All measurements are in inches. If you're between sizes, we recommend sizing up for a comfortable fit.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-black dark:border-gray-700 dark:text-white">Size</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-black dark:border-gray-700 dark:text-white">Bust</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-black dark:border-gray-700 dark:text-white">Waist</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-black dark:border-gray-700 dark:text-white">Hips</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-black dark:border-gray-700 dark:text-white">Height</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-200 px-4 py-3 font-semibold dark:border-gray-700">{row.size}</td>
                        <td className="border border-gray-200 px-4 py-3 dark:border-gray-700">{row.bust}"</td>
                        <td className="border border-gray-200 px-4 py-3 dark:border-gray-700">{row.waist}"</td>
                        <td className="border border-gray-200 px-4 py-3 dark:border-gray-700">{row.hips}"</td>
                        <td className="border border-gray-200 px-4 py-3 dark:border-gray-700">{row.height}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Size Finder Tab */}
          {activeTab === "finder" && (
            <div>
              <p className="text-gray-600 mb-6 dark:text-gray-300">
                Enter your measurements to find your perfect size.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-black mb-2 dark:text-white">
                    Bust (inches)
                  </label>
                  <input
                    type="number"
                    value={measurements.bust}
                    onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-300"
                    placeholder="e.g., 36"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2 dark:text-white">
                    Waist (inches)
                  </label>
                  <input
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-300"
                    placeholder="e.g., 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2 dark:text-white">
                    Hips (inches)
                  </label>
                  <input
                    type="number"
                    value={measurements.hips}
                    onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-300"
                    placeholder="e.g., 38"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2 dark:text-white">
                    Height (feet)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={measurements.height}
                    onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-black dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-300"
                    placeholder="e.g., 5.5"
                  />
                </div>
              </div>

              <button
                onClick={calculateSize}
                className="mt-6 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white"
              >
                Find My Size
              </button>

              {recommendedSize && (
                <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg dark:border-green-800 dark:bg-green-950/40">
                  <h3 className="font-semibold text-green-900 text-lg mb-2 dark:text-green-200">
                    Your Recommended Size: {recommendedSize}
                  </h3>
                  <p className="text-green-800 text-sm dark:text-green-300">
                    Based on your measurements, we recommend size {recommendedSize}. For a looser fit, consider sizing up.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* How to Measure Tab */}
          {activeTab === "measure" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-black mb-4 dark:text-white">Measuring Tips</h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex gap-3">
                      <span className="text-black font-semibold dark:text-white">1.</span>
                      <span>Use a soft measuring tape for accurate measurements</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-black font-semibold dark:text-white">2.</span>
                      <span>Measure over light clothing or undergarments</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-black font-semibold dark:text-white">3.</span>
                      <span>Keep the tape snug but not tight</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-black font-semibold dark:text-white">4.</span>
                      <span>Stand straight and relax while measuring</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-black mb-4 dark:text-white">Body Measurements</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-black mb-1 dark:text-white">Bust</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Measure around the fullest part of your bust, keeping the tape parallel to the floor.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-black mb-1 dark:text-white">Waist</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Measure around your natural waistline, typically the narrowest part of your torso.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-black mb-1 dark:text-white">Hips</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Measure around the fullest part of your hips, approximately 8 inches below your waist.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-black mb-1 dark:text-white">Height</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Stand against a wall and measure from the floor to the top of your head.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-black dark:text-white">Need help?</span> Contact our customer service team for personalized sizing assistance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
