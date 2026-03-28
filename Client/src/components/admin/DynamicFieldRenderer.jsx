import { useState, useEffect } from "react";

/**
 * DynamicFieldRenderer - Renders dynamic form fields based on category customFields
 * @param {Object} category - Category object with customFields array
 * @param {Object} attributes - Current attribute values
 * @param {Function} onChange - Callback when field value changes (fieldName, value)
 */
const DynamicFieldRenderer = ({ category, attributes = {}, onChange }) => {
  const [fieldValues, setFieldValues] = useState(attributes);

  useEffect(() => {
    setFieldValues(attributes);
  }, [attributes]);

  // Handle field value change
  const handleFieldChange = (fieldName, value) => {
    const newValues = { ...fieldValues, [fieldName]: value };
    setFieldValues(newValues);
    onChange(fieldName, value);
  };

  // If no category or no custom fields, render nothing
  if (!category || !category.customFields || category.customFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Category-Specific Fields
      </h3>
      <p className="text-sm text-gray-600">
        Additional fields for {category.name} category
      </p>

      {category.customFields.map((field) => {
        const fieldId = field._id || field.fieldName;
        const value = fieldValues[field.fieldName] || "";

        return (
          <div key={fieldId} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Text Input */}
            {field.fieldType === "text" && (
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder={`Enter ${field.fieldName.toLowerCase()}`}
              />
            )}

            {/* Number Input */}
            {field.fieldType === "number" && (
              <input
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder={`Enter ${field.fieldName.toLowerCase()}`}
              />
            )}

            {/* Dropdown Select */}
            {field.fieldType === "dropdown" && (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select {field.fieldName}</option>
                {field.options &&
                  field.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            )}

            {/* Textarea for long text */}
            {field.fieldType === "textarea" && (
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder={`Enter ${field.fieldName.toLowerCase()}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFieldRenderer;
