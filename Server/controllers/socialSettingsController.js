const getSocialSettingsModel = (req) => req.app.locals.models.SocialSettings;

const allowedPlatforms = ["facebook", "tiktok", "whatsapp", "instagram"];

exports.getSocialSettings = async (req, res) => {
  try {
    const SocialSettings = getSocialSettingsModel(req);
    const settings = await SocialSettings.getSettings();

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching social settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch social settings",
    });
  }
};

exports.updateSocialSettings = async (req, res) => {
  try {
    const SocialSettings = getSocialSettingsModel(req);
    const updateData = {};

    for (const platform of allowedPlatforms) {
      if (req.body[platform] !== undefined) {
        updateData[platform] = req.body[platform];
      }
    }

    const settings = await SocialSettings.updateSettings(updateData);

    res.json({
      success: true,
      message: "Social links updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating social settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update social settings",
    });
  }
};
