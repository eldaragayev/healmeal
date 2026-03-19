# HealMeal

HealMeal is an Expo + React Native app for finding healthier restaurant meals, guiding users through onboarding, and personalizing recommendations by goals, macros, and location.

## Development

```bash
npm install
npm start
```

Useful commands:

- `npm run ios`
- `npm run android`
- `npm run web`

## Project Structure

- `src/app`: Expo Router screens and layouts
- `src/components`: shared UI and onboarding flows
- `src/hooks`: app state, location, onboarding, subscriptions, and API hooks
- `src/api`: API client and typed models
- `assets`: icons, onboarding images, and animation assets used by the app

## Repo Notes

- Local research dumps, screenshots, and assistant/tooling folders are intentionally gitignored.
- Native `ios/` and `android/` folders are generated for local builds and are already excluded from new commits.
