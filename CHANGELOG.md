## [0.7.2](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.7.1...v0.7.2) (2026-02-02)


### Bug Fixes

* use onConflictDoUpdate for user creation during onboarding ([595403c](https://github.com/curiousanthony/supabase-sveltekit/commit/595403cb442ca20d5af8e4e2bdecafe66d427787))

## [0.7.1](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.7.0...v0.7.1) (2026-02-02)


### Bug Fixes

* handle email conflict on user insert during onboarding ([71ca9dc](https://github.com/curiousanthony/supabase-sveltekit/commit/71ca9dce5c7f0bb3a9f8ec23aabdc989426de037))

# [0.7.0](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.6.1...v0.7.0) (2026-02-02)


### Features

* add multi-step onboarding form for workspace creation ([852f7bf](https://github.com/curiousanthony/supabase-sveltekit/commit/852f7bf0d4d8c178d09415f86081d3527ba1238a))

## [0.6.1](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.6.0...v0.6.1) (2026-02-02)


### Bug Fixes

* enhance error handling and redirect logic for workspace retrieval ([4dbc2fd](https://github.com/curiousanthony/supabase-sveltekit/commit/4dbc2fdab3a4e2b4b07d3c65986673a7e32bf852))

# [0.6.0](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.5.0...v0.6.0) (2026-02-02)


### Bug Fixes

* improve error handling in workspace creation and redirect logic ([4ce075c](https://github.com/curiousanthony/supabase-sveltekit/commit/4ce075c8d36b20504927d383b4e83f7332e4eb3d))


### Features

* add web-design-guidelines skill from vercel-labs/agent-skills ([086bf20](https://github.com/curiousanthony/supabase-sveltekit/commit/086bf209beb64450f716be149cef6caae05a6738))
* ensure signed-in users always have a workspace ([78fdc97](https://github.com/curiousanthony/supabase-sveltekit/commit/78fdc97e8b2109f22d9ff7cbf94a3a433b82b2ca))

# [0.5.0](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.4.0...v0.5.0) (2026-02-02)


### Features

* sidebar Nouveau dropdown and vertical dropdowns for Nouveau and user menu ([b53f80d](https://github.com/curiousanthony/supabase-sveltekit/commit/b53f80d71f28e70909812e0c2d47433c668dc48e))

# [0.4.0](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.3.0...v0.4.0) (2026-02-02)


### Bug Fixes

* ensure clients.workspace_id exists in seed migration for remote DB compatibility ([7679923](https://github.com/curiousanthony/supabase-sveltekit/commit/7679923965077551327c3e0d30b53646f6415f89))


### Features

* enhance sidebar with shortcuts and command palette integration ([597b272](https://github.com/curiousanthony/supabase-sveltekit/commit/597b272b895bd2d23094ba8342c47fefb10b9248))
* workspace switcher and RBAC (roles, permissions, team page) ([9afc727](https://github.com/curiousanthony/supabase-sveltekit/commit/9afc7276924c026353befd622bfec1039b8ba862))

# [0.3.0](https://github.com/curiousanthony/supabase-sveltekit/compare/v0.2.0...v0.3.0) (2026-01-30)


### Bug Fixes

* add Deals Kanban UI and fix page load pass-through ([0f20a14](https://github.com/curiousanthony/supabase-sveltekit/commit/0f20a142765e8040c6b38133d014ca3abc48077d))
* auto-assign workspace for users without one, add sample deals, fix ??/|| precedence ([78c4298](https://github.com/curiousanthony/supabase-sveltekit/commit/78c4298de6bb31f70a3feac969a685e50d7c822b))
* correct docs paths in git rule and skill ([c453d2c](https://github.com/curiousanthony/supabase-sveltekit/commit/c453d2caf51f2304cd859208c8d2e188e02b72d4))
* handle session retrieval errors in authentication flow ([cffbcce](https://github.com/curiousanthony/supabase-sveltekit/commit/cffbccea8eb2cbc9bd731cbd27be594b1a067ab6))
* improve error handling for user validation in authentication flow ([844fd78](https://github.com/curiousanthony/supabase-sveltekit/commit/844fd784e9a55341c401f98b56be1d21a12bb37a))


### Features

* add Deals schema, migration, list, create, and detail pages ([0b2e693](https://github.com/curiousanthony/supabase-sveltekit/commit/0b2e69339de509cc95772f559956d994295f3699))
* add Qualiopi quality management page and conformity guide ([ebdc65b](https://github.com/curiousanthony/supabase-sveltekit/commit/ebdc65bb81746a52a366703bdbbb0bcf204a2ea8))
* formation workflow and migrations ([4333237](https://github.com/curiousanthony/supabase-sveltekit/commit/4333237263dd27b63501cc044adbd293838d082a))
* formations page sort/filter, Kanban/Grid/List views, improved card ([7ef1e83](https://github.com/curiousanthony/supabase-sveltekit/commit/7ef1e832c613f4a36326484d18a136db2ba8cfe6))
* implement deals management with CRUD operations and UI components ([220add2](https://github.com/curiousanthony/supabase-sveltekit/commit/220add2fbcc74675d47ec03f265ac25048ca488a))
* implement row-level security (RLS) and scoped database access ([34e4028](https://github.com/curiousanthony/supabase-sveltekit/commit/34e4028fd8ceea408d0c251b2ec7a601e78ca280))
* implement workspace and role-based access control system ([8ab4671](https://github.com/curiousanthony/supabase-sveltekit/commit/8ab4671ed1d47b586f4708c756d33c657037243d))
* theme switcher (System/Light/Dark) in account dropdown ([941e510](https://github.com/curiousanthony/supabase-sveltekit/commit/941e5100c7acc4c547c45cf31f8c24f55b9d47a9))

# [0.2.0](https://github.com/curiousanthony/supabase-sveltekit/releases/tag/v0.2.0) (2026-01-28)

### Chore

- Reset version to 0.2.0 for MVP; previous 1.x releases removed.
