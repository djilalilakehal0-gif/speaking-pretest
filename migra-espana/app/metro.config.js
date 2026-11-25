// Shared code (translations, eligibility engine, legal data) is imported from the website: ../web/src via the "@/..." alias.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../web/src')];
module.exports = config;
