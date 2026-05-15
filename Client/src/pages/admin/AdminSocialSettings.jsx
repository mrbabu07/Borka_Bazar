import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, Music2, Save } from "lucide-react";
import Loading from "../../components/Loading";
import { getSocialSettings, updateSocialSettings } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const platforms = [
  {
    key: "facebook",
    label: "Facebook",
    helper: "Paste your Facebook page or profile link.",
    placeholder: "https://facebook.com/your-page",
    icon: Facebook,
  },
  {
    key: "tiktok",
    label: "TikTok",
    helper: "Paste your TikTok profile link.",
    placeholder: "https://www.tiktok.com/@yourshop",
    icon: Music2,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    helper: "Use a wa.me link or WhatsApp business message link.",
    placeholder: "https://wa.me/8801XXXXXXXXX",
    icon: MessageCircle,
  },
  {
    key: "instagram",
    label: "Instagram",
    helper: "Paste your Instagram profile link.",
    placeholder: "https://instagram.com/yourshop",
    icon: Instagram,
  },
];

const emptySettings = platforms.reduce((acc, platform) => {
  acc[platform.key] = { enabled: false, url: "" };
  return acc;
}, {});

export default function AdminSocialSettings() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSocialSettings();
      if (response.data?.success) {
        setSettings({
          ...emptySettings,
          ...response.data.data,
        });
      }
    } catch (err) {
      console.error("Failed to load social settings:", err);
      error("Failed to load social links");
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = (platform, field, value) => {
    setSettings((current) => ({
      ...current,
      [platform]: {
        ...(current[platform] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = platforms.reduce((acc, platform) => {
        acc[platform.key] = {
          enabled: settings[platform.key]?.enabled !== false,
          url: settings[platform.key]?.url || "",
        };
        return acc;
      }, {});

      const response = await updateSocialSettings(payload);
      if (response.data?.success) {
        setSettings({ ...emptySettings, ...response.data.data });
        success("Social links updated successfully");
      } else {
        error(response.data?.error || "Failed to update social links");
      }
    } catch (err) {
      console.error("Failed to save social settings:", err);
      error(err.response?.data?.error || "Failed to save social links");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Social Links
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Control the social links shown in the storefront header and footer.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Links"}
        </button>
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const value = settings[platform.key] || { enabled: false, url: "" };

          return (
            <section
              key={platform.key}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex flex-1 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {platform.label}
                      </h2>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={value.enabled !== false}
                          onChange={(event) =>
                            updatePlatform(
                              platform.key,
                              "enabled",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Show on frontend
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {platform.helper}
                    </p>
                    <input
                      type="url"
                      value={value.url || ""}
                      onChange={(event) =>
                        updatePlatform(platform.key, "url", event.target.value)
                      }
                      placeholder={platform.placeholder}
                      className="input-field mt-4"
                    />
                  </div>
                </div>
                {value.url && (
                  <a
                    href={value.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:border-white"
                  >
                    Preview
                  </a>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
