const DEFAULT_SOCIAL_SETTINGS = {
  facebook: {
    enabled: true,
    url: "https://www.facebook.com/anamulhaque.joy.188?rdid=GvkM4bROFIYCRxEl&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1FBQeH3fwk%2F",
  },
  tiktok: {
    enabled: true,
    url: "https://www.tiktok.com/@anamulhaquejoy359?_r=1&_t=ZS-95KcW5yHJPZfb",
  },
  whatsapp: {
    enabled: true,
    url: "https://api.whatsapp.com/message/OSBDQIJSDBKUP1?autoload=1&app_absent=0",
  },
  instagram: {
    enabled: false,
    url: "",
  },
};

class SocialSettings {
  constructor(db) {
    this.collection = db.collection("socialsettings");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ singleton: 1 }, { unique: true });
    } catch (error) {
      console.error("Error creating SocialSettings indexes:", error);
    }
  }

  normalizePlatform(value = {}) {
    return {
      enabled: value.enabled !== false,
      url: String(value.url || "").trim(),
    };
  }

  normalize(settings = {}) {
    return {
      ...settings,
      facebook: this.normalizePlatform({
        ...DEFAULT_SOCIAL_SETTINGS.facebook,
        ...(settings.facebook || {}),
      }),
      tiktok: this.normalizePlatform({
        ...DEFAULT_SOCIAL_SETTINGS.tiktok,
        ...(settings.tiktok || {}),
      }),
      whatsapp: this.normalizePlatform({
        ...DEFAULT_SOCIAL_SETTINGS.whatsapp,
        ...(settings.whatsapp || {}),
      }),
      instagram: this.normalizePlatform({
        ...DEFAULT_SOCIAL_SETTINGS.instagram,
        ...(settings.instagram || {}),
      }),
    };
  }

  async getSettings() {
    let settings = await this.collection.findOne({ singleton: "social-settings" });

    if (!settings) {
      const now = new Date();
      settings = {
        ...DEFAULT_SOCIAL_SETTINGS,
        singleton: "social-settings",
        createdAt: now,
        updatedAt: now,
      };
      const result = await this.collection.insertOne(settings);
      return { ...settings, _id: result.insertedId };
    }

    return this.normalize(settings);
  }

  async updateSettings(data = {}) {
    const current = await this.getSettings();
    const now = new Date();
    const updated = this.normalize({
      ...current,
      ...data,
      singleton: "social-settings",
      createdAt: current.createdAt || now,
      updatedAt: now,
    });
    const { _id, ...updateData } = updated;

    await this.collection.updateOne(
      { singleton: "social-settings" },
      { $set: updateData },
    );

    return this.getSettings();
  }
}

module.exports = SocialSettings;
