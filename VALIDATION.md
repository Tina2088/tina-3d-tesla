# Verified behavior

- 397 GLB meshes match 397 catalog IDs.
- All position values and bounds are finite; 727,651 triangles retained.
- Final exploded layout has no overlapping projected bounding rectangles.
- Every final-layout bounding corner fits the camera at aspect ratios 2, 1.2 and 0.65.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Initial route responded HTTP 200. Dev watcher was subsequently corrected to polling on Windows after EBUSY during large model copy.

The mesh count is not a verified OEM parts count. No browser visual QA, interaction automation, performance measurement or supported WebMCP runtime validation was performed.
