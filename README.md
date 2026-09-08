# Tina 3D Tesla

An independent Chinese / English Tesla Model Y 2021 exploration studio, with a real CC-BY artist model and 397 individually selectable mesh pieces.

## Run

- `npm install`
- `npm run dev -- --port 3015`
- `npm run build`
- `npx tsc --noEmit`
- `node --experimental-strip-types scripts/validate-model.mjs`

## Interaction

Drag to orbit, scroll / pinch to zoom; camera presets also allow button-based navigation. The explosion slider first expands the structure, then packs all 397 pieces into a non-overlapping overview. Select a system to highlight it, or use the component directory to inspect any mesh on its own. Chinese and English are available through the header toggle. Auto rotation respects reduced-motion preferences.

## Model provenance and scope

Tesla Model Y 2021 by 763468712:
https://sketchfab.com/3d-models/tesla-model-y-2021-c0a86cac582d4b33aba0fb1b1912d970

Licensed CC BY 4.0. The source asset includes this license explicitly; see `public/models/LICENSE.txt` and the in-product credits. The publicly served copy was obtained from the FetchCFD model viewer for project 3029. Adaptations: connected geometry separation, normalization, polygon reduction and material changes. The prepared GLB is 18.45 MB, 727,651 triangles, 397 mesh pieces. These are artist-authored mesh regions, not verified Tesla service-part numbers or complete engineering CAD. Battery / powertrain internals are not fabricated or claimed to exist.

Reference interaction concepts: https://github.com/ashemag/model-x-studio. No Model X geometry is relabeled as Model Y. Application and explosion layout implementation are new.

## Preparation

`scripts/prepare-model.py INPUT_DIRECTORY OUTPUT_DIRECTORY` requires Python, NumPy, SciPy and fast-simplification. INPUT_DIRECTORY contains the original scene.gltf, scene.bin and license.txt. Copy the resulting model-y.glb and license.txt to public/models, and parts.json to app.

## Design

Cold porcelain #F7F8FA, aluminum #EDF0F2, graphite #242B34, slate #687481 and cobalt #365DE4. A generous automotive studio stage and compact right-side inspector keep the real 3D vehicle central.

## Validation

TypeScript and the production build pass. Model validation checks all 397 GLB meshes, catalog IDs, finite vertex coordinates, disjoint final-layout rectangles and camera coverage at three aspect ratios. Browser interaction / frame-rate testing has not been performed. Optional WebMCP methods are feature-detected; no supported browser WebMCP context was available to validate their runtime contract.
