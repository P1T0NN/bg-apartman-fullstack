# Production TODO

- [ ] Create a **JavaScript Map ID** in the project's Google Cloud Console under **Google Maps Platform → Map Management → Create map ID**. The existing Maps API key is separate from the Map ID. [Google's instructions](https://developers.google.com/maps/documentation/javascript/map-ids/get-map-id)
- [ ] Set `PUBLIC_GOOGLE_MAPS_MAP_ID` to that ID in the production environment. The app currently falls back to `DEMO_MAP_ID`, which Google provides for testing and should be replaced for production. Keep `PUBLIC_GOOGLE_MAPS_API_KEY` configured as the API key.
